const Users = require("../models/UsersModel.js");
const Companies = require("../models/CompaniesModel.js");
const UsersDetail = require("../models/UsersDetailModel.js");
const { Sequelize, where } = require('sequelize');
const handlebars = require('handlebars')
const fs = require("fs");
const { join, normalize } = require("path");
const { sendEmail } = require("../utils/email.js")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Roles = require("../models/RolesModel.js");
const LegalDocuments = require("../models/LegalDocumentsModel.js");
const dotenv = require("dotenv");
const ShopDecoration = require("../models/ShopDecorationsModel.js");

dotenv.config();

const Register = async (req, res) => {
    try {
        const email = await Users.findOne({
            where: {
                email: req.body.email,
            }
        });
        const username = await Users.findOne({
            where: {
                username: req.body.username,
            }
        });

        if (email) {
            return res.status(404).json({ msg: "Email already exist" });
        } else if (username) {
            return res.status(404).json({ msg: "Username already exist" });
        } else {
            try {
                const newCompanies = new Companies({
                    name: req.body.name,
                    description: req.body.description,
                    email: req.body.email,
                    phone: req.body.phone,
                    type: req.body.type,
                    type_business: JSON.stringify(req.body.type_business),
                    type_siup: req.body.type_siup,
                    city: req.body.city,
                    province: req.body.province,
                    postal_code: req.body.postal_code,
                    address: req.body.address,
                    company_logo: req.body.company_logo,
                    company_file: req.body.company_file,
                    pic_name: req.body.pic_name,
                    pic_position: req.body.pic_position,
                    pic_phone: req.body.pic_phone,
                    pic_email: req.body.pic_email,
                    website_url: req.body.website_url,
                    website_type: req.body.website_type,
                    marketplace_url: req.body.marketplace_url,
                    marketplace_type: req.body.marketplace_type,
                });
                const saveCompanies = await newCompanies.save();

                const newLegalDocument = new LegalDocuments({
                    path: req.body.path,
                    type: req.body.type_document,
                    document_identities: req.body.document_identities,
                    companyId: saveCompanies.id
                });

                const saveLegalDocument = await newLegalDocument.save();

                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(req.body.password, salt);
                const { fullname, username, email, image, verified_at, roleId } = req.body
                const number = req.body.phone;
                const phone = number.replace(/^0/, '62')
                const password = hash;
                const randomString = (length) => {
                    let result = '';
                    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                    const charactersLength = characters.length;
                    let counter = 0;
                    while (counter < length) {
                        result += characters.charAt(Math.floor(Math.random() * charactersLength));
                        counter += 1;
                    }
                    return result
                }
                const newUser = new Users({
                    fullname: fullname,
                    username: username,
                    email: email,
                    phone: phone,
                    password: password,
                    image: image,
                    companyId: saveCompanies.id,
                    roleId: roleId,
                    verified_at: verified_at,
                    verification_code: randomString(6),
                });
                const saveUser = await newUser.save()

                const newUserDetail = new UsersDetail({
                    city: req.body.city,
                    province: req.body.province,
                    postal_code: req.body.postal_code,
                    address: req.body.address,
                    position: req.body.position,
                    userId: saveUser.id
                });
                const saveUserDetail = await newUserDetail.save();

                const newShopDecoration = new ShopDecoration({
                    partnerId: saveUser.id
                })
                const saveShopDecoration = await newShopDecoration.save()

                const user = await Users.findOne({ where: { email } })
                if (!user) return res.status(404).json({ msg: "No Data Found" });
                const hb = handlebars.create()
                const templateDir = normalize(join(process.cwd(), './template'))
                const template = hb.compile(await fs.readFileSync(join(templateDir, 'VerificationSendCode.hbs'), 'utf8'))
                const html = template({ verificationCode: saveUser.verification_code, user_name: user.fullName })
                await sendEmail(user.email, 'Verification Code', html)

                const response = await Users.findOne({
                    where: {
                        id: newUser.id
                    },
                    include: [
                        { model: Roles, attributes: ['id', 'name'] },
                        { model: UsersDetail },
                        { model: Companies },
                    ]
                });
                res.status(201).json({ response, msg: `New verification link has been sent.`, email: user.email });
            } catch (error) {
                res.status(400).json({ msg: error.message })
            }
        }
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
}

const ResendVerifiCode = async (req, res) => {
    try {
        const users = await Users.findOne({
            where: {
                id: req.params.id
            }
        });

        if (!users) return res.status(400).json({ msg: "No Data Found" });

        const randomString = (length) => {
            let result = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const charactersLength = characters.length;
            let counter = 0;
            while (counter < length) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
                counter += 1;
            }
            return result
        }


        await Users.update({
            verification_code: randomString(6)
        }, {
            where: {
                id: req.params.id
            }
        });

        const newCode = await Users.findOne({
            where: {
                id: req.params.id
            }
        })

        const hb = handlebars.create()
        const templateDir = normalize(join(process.cwd(), './template'))
        const template = hb.compile(await fs.readFileSync(join(templateDir, 'VerificationSendCode.hbs'), 'utf8'))
        const html = template({ verificationCode: newCode.verification_code, user_name: users.fullName })
        await sendEmail(users.email, 'Verification Code', html)

        res.status(201).json({ msg: 'success updated verification code' })

    } catch (error) {
        console.log(error)
    }
}

const ConfirmVerifiCode = async (req, res) => {
    try {
        const cekUserame = await Users.findOne({where: {username: req.body.username}});
        const verifiCode = await Users.findOne({where: {verification_code: req.body.verification_code}});

        if (!cekUserame) return res.status(400).json({ msg: 'Please chek username!' })
        if (!verifiCode) return res.status(400).json({ msg: 'Please chek verif code!'})
        const verified_at = new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
        await Users.update({
            verified_at: verified_at
        }, {
            where: {
                username: req.body.username
            }
        });

        res.status(200).json({ msg: 'Success verification email.', email: verifiCode.email, username: verifiCode.username, verified_at: verified_at })
    } catch (error) {
        res.status(400).json(error.message)
    }
}

const Login = async (req, res) => {
    try {

        const user = await Users.findOne({
            where: {
                username: req.body.username
            }
        });

        if (user.verified_at === null) return res.status(400).json({ msg: 'Not Verified', id: user.id })
        if (user.is_active === false) return res.status(400).json({ msg: `User with username [${user.username}] is not active` })

        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) return res.status(400).json({ msg: "Wrong Password" });
        const userId = user.id;
        const username = user.username;
        const accessToken = jwt.sign({ userId, username }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '20s'
        });
        const refreshToken = jwt.sign({ userId, username }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '1d'
        });
        await Users.update({ refresh_token: refreshToken }, {
            where: {
                id: userId
            }
        })
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax'
        })
        res.json({ refreshToken });
    } catch (error) {
        res.status(404).json({ msg: "User not found" });
    }
}

const LoginWithFirebase = async (req, res) => {
    try {

        const user = await Users.findOne({
            where: {
                email: req.body.email
            }
        });

        if (user.verified_at === null) return res.status(400).json({ msg: 'Not Verified' });
        const userId = user.id;
        const email = user.email;

        const accessToken = jwt.sign({ userId, email }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '20s'
        });
        const refreshToken = jwt.sign({ userId, email }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '1d'
        });
        await Users.update({ refresh_token: refreshToken }, {
            where: {
                id: userId
            }
        })
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax'
        })
        res.json({ refreshToken });
    } catch (error) {
        res.status(404).json({ msg: "User not found" });
    }
}

const ResetPassword = async (req, res) => {
    const {password, confirmPassword}= req.body

    if( password != confirmPassword){
        return res.status(400).json({
            msg: "Please cek confirm password!"
        })
    }

    const users = await Users.findOne({
        where: {
            id: req.params.id
        }
    });

    if (!users) return res.status(400).json({ msg: "No Data Found" });
    
    const hash = bcrypt.hashSync(password, 10);
    // const confirmHash = bcrypt.hashSync(req.body.confirmPassword, 10);
    // const password = hash;
    // const confirmPassword = confirmHash

    try {
        await Users.update({
            password: hash,
            // confirmPassword: confirmPassword
        }, {
            where: {
                id: req.params.id
            }
        });
        res.status(200).json({ msg: "Password Updated Successfuly" });
    } catch (error) {
        console.log(error.message);
    }

}

const VerificationResetPassword = async (req, res) => {

    try {
        const email = req.body.email
        const user = await Users.findOne({ where: { email } })
        if (!user) return res.status(400).json({ msg: "No Data Found" });
        const link = `${process.env.URL_FE}/forget-password/${user.id}`
        const hb = handlebars.create()
        const templateDir = normalize(join(process.cwd(), './template'))
        const template = hb.compile(await fs.readFileSync(join(templateDir, 'VerificationResetPassword.hbs'), 'utf8'))
        const html = template({ verificationLink: link, user_name: user.fullName })
        await sendEmail(user.email, 'Reset Passoword', html)
        res.status(200).json({ msg: `New verification link has been sent.`, email: user.email })
    } catch (error) {
        console.log(error)
        res.status(400).json({ msg: "failed to send" });
    }

}

module.exports = { Register, Login, ResetPassword, VerificationResetPassword, ResendVerifiCode, ConfirmVerifiCode, LoginWithFirebase }