const { Op } = require("sequelize")
const Users = require("../models/UsersModel")
const Roles = require("../models/RolesModel")
const ShopDecoration = require("../models/ShopDecorationsModel")

const ShopDecorationChecker = async () => {
    try {
        console.log("Shop Decoration Checker for Partners is running.")

        const partnerWithoutShopDecoration = await Users.findAll({
            include: [
                {
                    model: Roles,
                    where: {
                        name: 'Partner',
                    },
                    attributes: [],
                },
            ],
            attributes: [
                'id',
            ],
        })
        
        const partnerWithShopDecoration = await ShopDecoration.findAll({
            attributes: [
                'partnerId',
            ],
        })
        
        const partnerIdWithoutShopDecoration = partnerWithoutShopDecoration.map(user => user.id)
        const partnerIdWithShopDecoration = partnerWithShopDecoration.map(user => user.id)

        // const shopDecorationId = []

        // for (let i = 0; i < partnerIdWithoutShopDecoration.length; i++) {
        //     const shopDecoration = await ShopDecoration.create({
        //         partnerId: partnerIdWithoutShopDecoration[i]
        //     })

        //     shopDecorationId.push(shopDecoration.id)
            
        // }

        console.log("\n")
        console.log("partnerIdWithoutShopDecoration: ", partnerIdWithoutShopDecoration)
        console.log("partnerIdWithShopDecoration: ", partnerIdWithShopDecoration)
        // console.log("shopDecorationId: ", shopDecorationId)
        console.log("\n")
    } catch (error) {
        console.log("Shop Decoration Checker for Partners is failed to run.")
        console.log(error)
    }
}

module.exports = { ShopDecorationChecker }