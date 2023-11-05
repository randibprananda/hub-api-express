const Users = require("../models/UsersModel.js");
const UsersDetail = require("../models/UsersDetailModel.js");
const Roles = require("../models/RolesModel.js");
const Companies = require("../models/CompaniesModel.js");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const base64Img = require('base64-img');



const updateProfile = async (req, res) => {

    const users = await Users.findOne({
        where:{
            id : req.params.id
        }
    });

    if(!users) return res.status(404).json({msg: "No Data Found"});

    const { fullname, username, email, phone, password, roleId, image, city, province, postal_code, address, position } = req.body;
    const salt = bcrypt.genSaltSync(10);
    
    
    try {
        let hashPassword;
        
        if(typeof password === 'undefined') {
            hashPassword = users.password
        } else {
            hashPassword = bcrypt.hashSync(password, salt);
        }
        
        let readImage;
        if(typeof image === 'undefined') {
            readImage = users.image
        } 
        
        if(readImage === null || readImage === users.image) {
            await Users.update({
                fullname: fullname, 
                username: username, 
                email:email, 
                phone: phone,
                password: hashPassword,
                image: readImage,
                roleId: roleId
            },{
                where:{
                    id: req.params.id
                }
            });

            await UsersDetail.update({
                city: city,
                province: province,
                postal_code: postal_code,
                address: address,
                position: position,
            },{
                where:{
                    userId: req.params.id
                }
            });

            const response = await Users.findOne({
                where: {
                    id : req.params.id
                },
                include: [
                    {model: Roles, attributes: ['id', 'name']},
                    {model: UsersDetail},
                    {model: Companies}
                ]
            });
            res.status(201).json({response , msg: 'Users Updated Successfuly'});
        }else {
            let currentImage;

            if(users.image === null) {
                currentImage === image
            }else{
                currentImage = `.${users.image}`
                fs.unlinkSync(currentImage)
            }

            base64Img.img(image, `./assets/images/profile/`, `konect-image-${Date.now()}`, async function(err, filepath) {
                await Users.update({
                    fullname: fullname, 
                    username: username,     
                    email:email, 
                    phone: phone,
                    password: hashPassword,
                    image: `/${filepath}`,
                    roleId: roleId
                },{
                    where:{
                        id: req.params.id
                    }
                });
    
                await UsersDetail.update({
                    city: city,
                    province: province,
                    postal_code: postal_code,
                    address: address,
                    position: position,
                },{
                    where:{
                        userId: req.params.id
                    }
                });
    
                const response = await Users.findOne({
                    where: {
                        id : req.params.id
                    },
                    include: [
                        {model: Roles, attributes: ['id', 'name']},
                        {model: UsersDetail},
                        {model: Companies}
                    ]
                });
                res.status(201).json({response , msg: 'Users Updated Successfuly'});
            })
        }
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
}


module.exports = {updateProfile}