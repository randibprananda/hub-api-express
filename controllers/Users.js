const Users = require("../models/UsersModel.js");
const UsersDetail = require("../models/UsersDetailModel.js");
const Roles = require("../models/RolesModel.js");
const Companies = require("../models/CompaniesModel.js");

const { deleteImageFromDirectory } = require("../controllers/ImageController");

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sharp = require('sharp');


const fetch = async (req, res) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })
        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId,
            },
            include: [
                { model: Roles, attributes: ['id', 'name'] },
                { model: UsersDetail },
                { model: Companies }
            ],
            attributes: {
                exclude: [
                    'password',
                    'verification_code',
                ],
            },
        })
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getUser = async (req, res) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })
        const user = await Users.findOne({ where: { id: tokenDecode.userId } });
        const responses = await Users.findOne({
            where: {
                adminId: user.id,
            },
            include: [
                { model: Roles, attributes: ['id', 'name'] },
                { model: UsersDetail },
                { model: Companies },
            ]
        });

        const response = await Users.findOne({
            where: {
                id: user.id,
            },
            include: [
                { model: Roles, attributes: ['id', 'name'] },
                { model: UsersDetail },
                { model: Companies },
            ]
        });
        res.status(200).json({ admin: response, notadmin: responses });
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getDataService = async (req, res) => {
    try {

        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })
        const user = await Users.findOne({ where: { id: tokenDecode.userId } })
        const response = await Users.findAll({
            where: {
                adminId: user.id
            },
            include: [
                { model: Roles, attributes: ['id', 'name'] },
                { model: UsersDetail },
                { model: Companies },
                // {model: Items}
            ]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getDataServiceByCategory = async (req, res) => {
    try {

        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })
        const user = await Users.findOne({ where: { id: tokenDecode.userId } })
        const category = req.params.rolename
        const response = await Users.findAll({
            where: {
                adminId: user.id
            },
            include: [
                {
                    model: Roles, attributes: ['id', 'name'],
                    where: { name: category }
                },
                { model: UsersDetail },
                { model: Companies },
            ]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getUserRole = async (req, res) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({ where: { id: tokenDecode.userId } })
        const response = await Users.findOne({
            where: {
                id: user.id
            },
            attributes: ['id', 'fullname', 'image'],
            include: [
                { model: Roles, attributes: ['name'] },
            ]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getUserById = async (req, res) => {
    try {
        const response = await Users.findOne({
            where: {
                id: req.params.id
            },
            include: [
                { model: Roles, attributes: ['id', 'name'] },
                { model: UsersDetail },
                { model: Companies }
            ]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const updateUser = async (req, res) => {
    const users = await Users.findOne({
        where: {
            id: req.params.id
        }
    });

    if (!users) return res.status(404).json({ msg: "No Data Found" });

    const { fullname, username, email, phone, password, roleId, image, city, province, postal_code, address, position } = req.body;
    const salt = bcrypt.genSaltSync(10);

    try {
        let hashPassword;

        if (typeof password === 'undefined') {
            hashPassword = users.password
        } else {
            hashPassword = bcrypt.hashSync(password, salt);
        }

        let readImage

        if (!/^data:image\//.test(image)) {
            if (users.image == null) {
                readImage = users.image
            } else {
                readImage = null

                if (fs.existsSync(`.${users.image}`)) {
                    fs.unlink(`.${users.image}`, (err) => {
                        if (err) return res.status(500).json({ msg: `Can't deleting user's image from directory: ${err}` })
                    })
                }
            }

            await Users.update({
                fullname: fullname,
                username: username,
                email: email,
                phone: phone,
                password: hashPassword,
                image: readImage,
                roleId: roleId
            }, {
                where: {
                    id: req.params.id
                }
            });

            await UsersDetail.update({
                city: city,
                province: province,
                postal_code: postal_code,
                address: address,
                position: position,
            }, {
                where: {
                    userId: req.params.id
                }
            });

            const response = await Users.findOne({
                where: {
                    id: req.params.id
                },
                include: [
                    { model: Roles, attributes: ['id', 'name'] },
                    { model: UsersDetail },
                    { model: Companies }
                ]
            })

            res.status(201).json({ response, msg: 'Users Updated Successfuly' });
        } else if (/^data:image\//.test(image)) {
            readImage = image

            deleteImageFromDirectory(users.image)

            const imageName = `konect-image-${Date.now() * Math.floor(Math.random() * 101)}.jpeg`
            const imagePath = `/assets/images/profile/${imageName}`

            try {
                let parts = readImage.split(';')
                let imageData = parts[1].split(',')[1]

                const img = new Buffer.from(imageData, 'base64')
                
                // Memeriksa ukuran buffer
                if (img.length > 2 * 1024 * 1024) {
                    return res.status(400).json({ msg: 'Ukuran file base64 melebihi batas (2 MB).' });
                }

                await sharp(img)
                    .resize(280, 175)
                    .toFormat("jpeg", { mozjpeg: true })
                    .jpeg({ quality: 100 })
                    .toFile(`.${imagePath}`)
            } catch (error) {
                return res.status(500).json({ msg: error.message })
            }
            return
            await Users.update({
                fullname: fullname,
                username: username,
                email: email,
                phone: phone,
                password: hashPassword,
                image: imagePath,
                roleId: roleId
            }, {
                where: {
                    id: req.params.id
                }
            });

            await UsersDetail.update({
                city: city,
                province: province,
                postal_code: postal_code,
                address: address,
                position: position,
            }, {
                where: {
                    userId: req.params.id
                }
            })

            const response = await Users.findOne({
                where: {
                    id: req.params.id
                },
                include: [
                    { model: Roles, attributes: ['id', 'name'] },
                    { model: UsersDetail },
                    { model: Companies }
                ]
            });

            res.status(201).json({ response, msg: 'Users Updated Successfuly' });
        }
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
}

const deleteUser = async (req, res) => {
    const users = await Users.findOne({
        where: {
            id: req.params.id
        }
    });


    if (!users) return res.status(404).json({ msg: "No Data Found" });
    try {
        if (users.image === null) {
            await Users.destroy({
                where: {
                    id: req.params.id
                }
            });
            res.status(200).json({ msg: "Users Deleted Successfuly" });
        } else {
            const getFile = path.basename(users.image);
            const filepath = `./assets/images/profile/${getFile}`;
            fs.unlinkSync(filepath);
            await Users.destroy({
                where: {
                    id: req.params.id
                }
            });
            res.status(200).json({ msg: "Users Deleted Successfuly" });
        }
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
}

module.exports = { fetch, getUserRole, getUser, getDataService, getDataServiceByCategory, getUserById, updateUser, deleteUser }