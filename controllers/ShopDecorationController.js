const db = require("../config/Database")

const ShopDecoration = require("../models/ShopDecorationsModel")
const Banners = require("../models/BannersModel")
const BannerImages = require("../models/BannerImagesModel")
const Transaction = require('../models/TransactionsModel');
const PackagePricings = require("../models/PackagePricingsModel");
const EOServices = require("../models/EOServicesModel");
const VenueServices = require("../models/VenueServicesModel");
const TalentServices = require("../models/TalentServicesModel");
const ProductSupplies = require("../models/ProductSuppliesModel");
const Users = require("../models/UsersModel");

const { ImageHandler } = require("./ImageController")

const sequelize = require('sequelize')
const { Op } = require("sequelize")
const jwt = require("jsonwebtoken")
const fs = require('fs');
const UsersDetail = require("../models/UsersDetailModel");
const EOImages = require("../models/EOImagesModel");
const ProductImages = require("../models/ProductImagesModel");
const TalentImages = require("../models/TalentImagesModel");
const VenueImages = require("../models/VenueImagesModel");
const { Result } = require("express-validator");


const bannerImagesPath = "/assets/images/banner-images/"


class ShopDecorationController {
    static async CreateBanner(req, res) {
        let transaction, imagePath, linkObject, linkString, bannerImageOrder
        const bannerImages = req.body.banner_images

        try {
            transaction = await db.transaction()

            const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
                if (error) return res.sendStatus(403)
                return decoded
            })

            const shopDecoration = await ShopDecoration.findOne({
                where: {
                    partnerId: tokenDecode.userId,
                },
            }, { transaction })

            const newBanner = await Banners.create({
                name: req.body.name,
                banner_type: req.body.banner_type,
                order: req.body.banner_order,
                shopDecorationId: shopDecoration.id,
            }, { transaction })

            if (typeof bannerImages == 'object') {
                for (let i = 0; i < bannerImages.length; i++) {
                    imagePath = await ImageHandler.storeImageBase64Handler(bannerImages[i].image_base64, bannerImagesPath)
                    linkObject = {
                        service_id: typeof bannerImages[i].service_id == 'undefined' || bannerImages[i].service_id == '' ? null : bannerImages[i].service_id,
                        service_type: typeof bannerImages[i].service_type == 'undefined' || bannerImages[i].service_type == '' ? null : bannerImages[i].service_type,
                    }
                    linkString = JSON.stringify(linkObject)
                    bannerImageOrder = bannerImages[i].banner_image_order

                    await BannerImages.create({
                        image: imagePath,
                        link: linkString,
                        order: bannerImages[i].banner_image_order,
                        bannerId: newBanner.id,
                    }, { transaction })
                }
            }

            await transaction.commit()

            const banner = await Banners.findOne({
                where: {
                    id: newBanner.id,
                },
                include: {
                    model: BannerImages,
                },
            })

            return res.status(201).json({
                message: `Creating banner success`,
                new_banner: banner,
            })
        } catch (error) {
            if (transaction) await transaction.rollback()

            return res.status(500).json({
                error: `Failed to create new banner`,
                message: error.message,
            })
        }
    }

    static async GetBanners(req, res) {
        try {
            const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
                if (error) return res.sendStatus(403)
                return decoded
            })

            const banners = await Banners.findAll({
                include: [
                    {
                        model: ShopDecoration,
                        where: {
                            partnerId: tokenDecode.userId,
                        },
                        attributes: [],
                    },
                    {
                        model: BannerImages,
                    },
                ],
            })

            if (banners.length == 0) {
                return res.status(404).json({
                    message: `Banners data from accessing partners is not found`,
                })
            }

            let base64String
            let promises = []

            for (let j = 0; j < banners.length; j++) {
                for (let i = 0; i < banners[j].dataValues.banner_images.length; i++) {
                    const filePath = `.${banners[j].dataValues.banner_images[i].dataValues.image}`
    
                    let promise = new Promise((resolve, reject) => {
                        fs.readFile(filePath, (err, data) => {
                            if (err) {
                                console.error('Error:', err)
                                reject(err)
                            }
    
                            base64String = data.toString('base64')
                            banners[j].dataValues.banner_images[i].dataValues.imageBase64 = `data:image/jpeg;base64,${base64String}`
    
                            resolve()
                        })
                    })
    
                    promises.push(promise)
                }
            }
            
            Promise.all(promises).then(() => {
                return res.status(200).json({
                    message: `Success to get all banners from accessing partners`,
                    banners: banners,
                })
            })
        } catch (error) {
            return res.status(500).json({
                error: `Failed to get all banners from accessing partners`,
                message: error.message,
            })
        }
    }

    static async EditBanner(req, res) {
        let transaction, imagePath, linkObject, linkString, bannerImageOrder
        const bannerId = req.params.bannerId
        const bannerImages = req.body.banner_images

        try {
            transaction = await db.transaction()

            const banner = await Banners.findOne({
                where: {
                    id: bannerId,
                },
                include: {
                    model: BannerImages,
                },
            }, { transaction })

            if (!banner) {
                await transaction.rollback()
                return res.status(404).json({
                    message: `Banner data with id [${bannerId}] is not found`,
                })
            }

            await Banners.update({
                name: req.body.name,
                banner_type: req.body.banner_type,
                order: req.body.banner_order,
            }, {
                where: {
                    id: bannerId,
                },
            }, { transaction })

            if (typeof bannerImages == 'object') {
                const {count, rows} = await BannerImages.findAndCountAll({
                    where: {
                        bannerId: bannerId,
                    },
                }, { transaction })

                await BannerImages.destroy({
                    where: {
                        bannerId: bannerId,
                    },
                }, { transaction })

                for (let i = 0; i < count; i++) {
                    await ImageHandler.deleteImageHandler(rows[i].image)
                }

                for (let i = 0; i < bannerImages.length; i++) {
                    imagePath = await ImageHandler.storeImageBase64Handler(bannerImages[i].image_base64, bannerImagesPath)
                    linkObject = {
                        service_id: typeof bannerImages[i].service_id == 'undefined' || bannerImages[i].service_id == '' ? null : bannerImages[i].service_id,
                        service_type: typeof bannerImages[i].service_type == 'undefined' || bannerImages[i].service_type == '' ? null : bannerImages[i].service_type,
                    }
                    linkString = JSON.stringify(linkObject)
                    bannerImageOrder = bannerImages[i].banner_image_order

                    await BannerImages.create({
                        image: imagePath,
                        link: linkString,
                        order: bannerImages[i].banner_image_order,
                        bannerId: bannerId,
                    }, { transaction })   
                }
            }

            await transaction.commit()

            const updatedBanner = await Banners.findOne({
                where: {
                    id: bannerId,
                },
                include: {
                    model: BannerImages,
                },
            })

            return res.status(200).json({
                message: `Updating banner success`,
                updated_banner: updatedBanner,
            })
        } catch (error) {
            if (transaction) await transaction.rollback()

            return res.status(500).json({
                error: `Failed to updating new banner`,
                message: error.message,
            })
        }
    }

    static async DeleteBanner(req, res) {
        let transaction
        const bannerId = req.params.bannerId

        try {
            transaction = await db.transaction()

            const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
                if (error) return res.sendStatus(403)
                return decoded
            })

            const shopDecoration = await ShopDecoration.findOne({
                where: {
                    partnerId: tokenDecode.userId,
                },
                attributes: [
                    'id',
                ],
            }, { transaction: transaction })

            const deletedBannerImages = await BannerImages.findAll({
                where: {
                    bannerId: bannerId,
                },
            }, { transaction: transaction })

            for (let i = 0; i < deletedBannerImages.length; i++) {
                await ImageHandler.deleteImageHandler(deletedBannerImages[i].image)
            }

            const deletedBanner = await Banners.destroy({
                where: {
                    id: bannerId,
                    shopDecorationId: shopDecoration.id,
                },
                include: {
                    model: BannerImages,
                },
            }, { transaction: transaction })



            await BannerImages.destroy({
                where: {
                    bannerId: null,
                },
            }, { transaction: transaction })

            if (deletedBanner === 0) {
                await transaction.rollback()
                return res.status(404).json({ message: `Banner's data with id [${bannerId}] is not found` })
            }

            await transaction.commit()
            return res.status(200).json({
                message: `Success to deleting banner with id [${bannerId}]`,
            })
        } catch (error) {
            if (transaction) await transaction.rollback()

            return res.status(500).json({
                error: `Failed to deleting banner with id [${bannerId}]`,
                message: error.message,
            })
        }
    }

    // Get service highlight from accessing partner
    static async GetServiceHighlights(req, res) {
        try {
            const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
                if (error) return res.sendStatus(403)
                return decoded
            })

            const shopDecoration = await ShopDecoration.findOne({
                where: {
                    partnerId: tokenDecode.userId,
                },
            })

            return res.status(200).json({
                message: `Getings service highlight success`,
                updated_shop_decoration: shopDecoration,
            })
        } catch (error) {
            return res.status(500).json({
                error: `Failed to getings service highlight`,
                message: error.message,
            })
        }
    }

    // Edit service highlight from accessing partner
    static async EditServiceHighlights(req, res) {
        const serviceHighlight = req.body.highlight

        try {
            const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
                if (error) return res.sendStatus(403)
                return decoded
            })

            await ShopDecoration.update(
                {
                    highlight: serviceHighlight,
                },
                {
                    where: {
                        partnerId: tokenDecode.userId,
                    },
                },
            )

            const shopDecoration = await ShopDecoration.findOne({
                where: {
                    partnerId: tokenDecode.userId,
                },
            })

            return res.status(200).json({
                message: `Editing service highlight success`,
                updated_shop_decoration: shopDecoration,
            })
        } catch (error) {
            return res.status(500).json({
                error: `Failed to editing service highlight`,
                message: error.message,
            })
        }
    }

    // Edit about us from accessing partner
    static async EditAboutUs(req, res) {
        const {
            service_name,
            location,
            address,
            description,
        } = req.body

        try {
            const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
                if (error) return res.sendStatus(403)
                return decoded
            })

            await ShopDecoration.update(
                {
                    service_name,
                    location,
                    address,
                    description
                },
                {
                    where: {
                        partnerId: tokenDecode.userId,
                    },
                },
            )

            const shopDecoration = await ShopDecoration.findOne({
                where: {
                    partnerId: tokenDecode.userId,
                },
            })

            return res.status(200).json({
                message: `Editing about us success`,
                updated_shop_decoration: shopDecoration,
            })
        } catch (error) {
            return res.status(500).json({
                error: `Failed to editing about us`,
                message: error.message,
            })
        }
    }

    static async gethighlights (req, res){
        try {
            const highlight = await ShopDecoration.findOne({
                where: {partnerId : req.params.partnerId},
                attributes: ['highlight'],
                raw: true
            })
            if(highlight == null){
                return res.status(400).json({
                    message: "Partner Don't Have Shop Decoration! or Check this id Partner !"
                })
            }

            //Terlaris
            if ( highlight.highlight == 'TERLARIS' ){
                const eo = await EOServices.findAll({
                    where: {userId: req.params.partnerId},
                    attributes: ['id','name'],
                    include: [ 
                        {model: Users, attributes: ['id', 'fullname']},
                        {
                            model: PackagePricings, 
                            attributes: ['id', 'price', 'name'],
                            include: [{
                                model: Transaction,
                                where: {service_status : "COMPLETE"},
                                attributes: ['id','service_status']
                            }]
                        }
                    ]
                })
                const venue = await VenueServices.findAll({
                    where: {userId: req.params.partnerId},
                    attributes: ['id','name'],
                    include: [ 
                        {model: Users, attributes: ['id', 'fullname']},
                        {
                            model: PackagePricings, 
                            attributes: ['id', 'price', 'name'],
                            include: [{
                                model: Transaction,
                                where: {service_status : "COMPLETE"},
                                attributes: ['id','service_status']
                            }]
                        }
                    ]
                })
                const product = await ProductSupplies.findAll({
                    where: {userId: req.params.partnerId},
                    attributes: ['id','namaLayanan'],
                    include: [ 
                        {model: Users, attributes: ['id', 'fullname']},
                        {
                            model: PackagePricings, 
                            attributes: ['id', 'price', 'name'],
                            include: [{
                                model: Transaction,
                                where: {service_status : "COMPLETE"},
                                attributes: ['id','service_status']
                            }]
                        }
                    ]
                })
                const talent = await TalentServices.findAll({
                    where: {userId: req.params.partnerId},
                    attributes: ['id','name'],
                    include: [ 
                        {model: Users, attributes: ['id', 'fullname']},
                        {
                            model: PackagePricings, 
                            attributes: ['id', 'price', 'name'],
                            include: [{
                                model: Transaction,
                                where: {service_status : "COMPLETE"},
                                attributes: ['id','service_status']
                            }]
                        }
                    ]
                })
                
                const terlaris = eo.concat(venue, product, talent);
                // console.log(terlaris)
                if(terlaris.length == 0){
                    return res.status(400).json({
                        message: "No Transaction!"
                    })
                }

                const popularity = {};
                for (const item of terlaris) {
                    let transactions = 0;
                    for (const pricing of item.package_pricings) {
                        transactions += pricing.transactions.length;
                    }
                    popularity[item.id] = transactions;
                }

                const sortedData = Object.entries(popularity).sort((a, b) => b[1] - a[1]);
                
                const fixData = []
                if( sortedData.length > 5){
                    for( let x = 0; x<5; x++){
                        const targetId = sortedData[x][0]
                        fixData[x] = terlaris.find(item => item.id === targetId)
                    }
                }else if (sortedData.length <= 5){
                    for( let x = 0; x<sortedData.length; x++){
                        const targetId = sortedData[x][0]
                        fixData[x] = terlaris.find(item => item.id === targetId)
                    }
                }
                res.status(200).json({data: fixData})
                return
            }
            
            //terbaru
            if ( highlight.highlight == 'TERBARU' ){
                const eo = await EOServices.findAll({
                    where: {userId: req.params.partnerId},
                    attributes: ['id','name','createdAt'],
                    include: [ 
                        {model: Users, attributes: ['id', 'fullname']},
                        {
                            model: PackagePricings, 
                            attributes: ['id', 'price', 'name'],
                        }
                    ]
                })
                const venue = await VenueServices.findAll({
                    where: {userId: req.params.partnerId},
                    attributes: ['id','name','createdAt'],
                    include: [ 
                        {model: Users, attributes: ['id', 'fullname']},
                        {
                            model: PackagePricings, 
                            attributes: ['id', 'price', 'name'],
                        }
                    ]
                })
                const product = await ProductSupplies.findAll({
                    where: {userId: req.params.partnerId},
                    attributes: ['id','namaLayanan','createdAt'],
                    include: [ 
                        {model: Users, attributes: ['id', 'fullname']},
                        {
                            model: PackagePricings, 
                            attributes: ['id', 'price', 'name'],
                        }
                    ]
                })
                const talent = await TalentServices.findAll({
                    where: {userId: req.params.partnerId},
                    attributes: ['id','name','createdAt'],
                    include: [ 
                        {model: Users, attributes: ['id', 'fullname']},
                        {
                            model: PackagePricings, 
                            attributes: ['id', 'price', 'name'],
                        }
                    ]
                })
                
                const terlaris = eo.concat(venue, product, talent);
                
                if(terlaris.length == 0){
                    return res.status(400).json({
                        message: "No New Product !"
                    })
                }

                // Mengurutkan data berdasarkan createdAt yang terbaru
                terlaris.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                // Mengambil 5 data terbaru
                const latestData = terlaris.slice(0, 5);

                res.status(200).json({data: latestData})
                return
            }

        } catch (error) {
            res.status(400).json({
                message: error.message
            })
        }
    }

    static async getAllProductServiceByPartnerId(req,res){
        try {
            const search = req.query.search || "" //SEARCH
            const category = req.query.category || "" // Service => EO<VENUE<TALNET<PRODUCT
            const filter = req.query.filter || "" //Terlaris / Terpopuler
            
            let service
            if (category == "EO") {
                service = "eo_services"
            } else if (category == "PRODUCT") {
                service = "product_supplies"
            } else if (category == "TALENT") {
                service = "talent_services"
            } else if (category == "VENUE") {
                service = "venue_services"
            }else if (category == "") {
                service = ""
            } else {
                return res.status(500).json({msg: "Check Category"})
            }

            let whereClause

            if (category == "PRODUCT") {
                whereClause = {
                    // is_active: isActive,
                    [Op.and]: [{
                        [Op.or]: [
                            sequelize.where(sequelize.fn('lower', sequelize.col(`${service}.namaLayanan`)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            sequelize.where(sequelize.fn('lower', sequelize.col('package_pricings.name')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ]
                    }]
                }
            } else {
                whereClause = {
                    // is_active: isActive,
                    [Op.and]: [{
                        [Op.or]: [
                            sequelize.where(sequelize.fn('lower', sequelize.col(`${service}.name`)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            sequelize.where(sequelize.fn('lower', sequelize.col('package_pricings.name')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ]
                    }]
                }
            }
            // console.log(category == "PRODUCT")
            
            //pagination array
            const page = req.query.page
            const limit = req.query.limit
            function Paginator(items, page, limit) {
                // eslint-disable-next-line no-var
                const pages = page || 1
                // eslint-disable-next-line no-var
                const limits = limit || 10
                const offset = (pages - 1) * limits
                const paginatedItems = items.slice(offset).slice(0, limits)
                const total_pages = Math.ceil(items.length / limits)
                return {
                    data: paginatedItems,
                    totalPages: total_pages,
                    total: items.length,
                }
            }

            if (category == "EO") {
                if(filter === 'terbaru'){
                    const eoServices = await EOServices.findAll({
                        // limit: limit,
                        // offset: skip,
                        attributes: ["id", "name", "active", "createdAt"],
                        where: {
                            userId: req.params.partnerId,
                            // active: isActive
                        },
                        include: [
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: EOImages, attributes: ['id', 'image']},
                            {model: PackagePricings,
                            attributes: ["id", "name", "price", "disc_percentage"],
                            where: whereClause
                        }],
                        order: [['createdAt', "DESC"]],
                    })

                    eoServices.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });
                    
                    return res.status(200).json({
                        search,
                        category,
                        filter,
                        services: Paginator(eoServices, page, limit)
                    })
                }else if(filter == "terlaris"){
                    const eoServices = await EOServices.findAll({
                        where: {userId: req.params.partnerId},
                        attributes: ['id','name'],
                        include: [ 
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: EOImages, attributes: ['id', 'image']},
                            {
                                model: PackagePricings, 
                                attributes: ['id', 'price', 'name', "disc_percentage"],
                                // where: whereClause,
                                include: [{
                                    model: Transaction,
                                    where: {service_status : "COMPLETE"},
                                    attributes: ['id','service_status']
                                }]
                            }
                        ]
                    })

                    const popularity = {};
                    for (const item of eoServices) {
                        let transactions = 0;
                        for (const pricing of item.package_pricings) {
                            transactions += pricing.transactions.length;
                        }
                        popularity[item.id] = transactions;
                    }

                    const sortedData = Object.entries(popularity).sort((a, b) => b[1] - a[1]);
                    // console.log(eoServices)

                    const fixData = []
                    for( let x = 0; x<sortedData.length; x++){
                        const targetId = sortedData[x][0]
                        fixData[x] = eoServices.find(item => item.id === targetId)
                    }

                    // Mencari berdasarkan 'name' atau 'name' pada 'package_pricings'
                    const searchResults = fixData.filter(item => {
                        const itemName = item.name.toLowerCase();
                        const packageNames = item.package_pricings.map(pkg => pkg.name.toLowerCase());
                    
                        return itemName.includes(search.toLowerCase()) || packageNames.includes(search.toLowerCase());
                    });

                    searchResults.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });

                    return res.status(200).json({
                        search,
                        filter,
                        category,
                        services: Paginator(searchResults, page, limit)
                    })
                }else{
                    const eoServices = await EOServices.findAll({
                        // limit: limit,
                        // offset: skip,
                        attributes: ["id", "name", "active", "createdAt"],
                        where: {
                            userId: req.params.partnerId,
                            // active: isActive
                        },
                        include:[
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: EOImages, attributes: ['id', 'image']},
                            {
                            model: PackagePricings,
                            attributes: ["id", "name", "price", "disc_percentage"],
                            where: whereClause
                        }],
                        // order: [['createdAt', "DESC"]],
                    })
                    
                    eoServices.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });

                    return res.status(200).json({
                        search,
                        filter,
                        category,
                        services: Paginator(eoServices, page, limit)
                    })
                }
            } else if (category == "PRODUCT") {
                if(filter === 'terbaru'){
                    const eoServices = await ProductSupplies.findAll({
                        // limit: limit,
                        // offset: skip,
                        attributes: ["id", ["namaLayanan", "name"], "active", "createdAt"],
                        where: {
                            userId: req.params.partnerId,
                            // active: isActive
                        },
                        include: [
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: ProductImages, attributes: ['id', 'image']},
                            {
                            model: PackagePricings,
                            attributes: ["id", "name", "price", "disc_percentage"],
                            where: whereClause
                        }],
                        order: [['createdAt', "DESC"]],
                    })

                    eoServices.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });
                    
                    return res.status(200).json({
                        search,
                        category,
                        filter,
                        services: Paginator(eoServices, page, limit)
                    })
                }else if(filter == "terlaris"){
                    const eoServices = await ProductSupplies.findAll({
                        where: {userId: req.params.partnerId},
                        attributes: ['id',["namaLayanan", "name"]],
                        include: [ 
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: ProductImages, attributes: ['id', 'image']},
                            {
                                model: PackagePricings, 
                                attributes: ['id', 'price', 'name', "disc_percentage"],
                                // where: whereClause,
                                include: [{
                                    model: Transaction,
                                    where: {service_status : "COMPLETE"},
                                    attributes: ['id','service_status']
                                }]
                            }
                        ]
                    })

                    eoServices.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });

                    const popularity = {};
                    for (const item of eoServices) {
                        let transactions = 0;
                        for (const pricing of item.package_pricings) {
                            transactions += pricing.transactions.length;
                        }
                        popularity[item.id] = transactions;
                    }

                    const sortedData = Object.entries(popularity).sort((a, b) => b[1] - a[1]);
                    // console.log(eoServices)

                    const fixData = []
                    for( let x = 0; x<sortedData.length; x++){
                        const targetId = sortedData[x][0]
                        fixData[x] = eoServices.find(item => item.id === targetId)
                    }

                    // Mencari berdasarkan 'name' atau 'name' pada 'package_pricings'
                    const searchResults = fixData.filter(item => {
                        const itemName = item.dataValues.name.toLowerCase();
                        const packageNames = item.package_pricings.map(pkg => pkg.name.toLowerCase());
                    
                        return itemName.includes(search.toLowerCase()) || packageNames.includes(search.toLowerCase());
                    });

                    return res.status(200).json({
                        search,
                        filter,
                        category,
                        services: Paginator(searchResults, page, limit)
                    })
                }else{
                    const eoServices = await ProductSupplies.findAll({
                        // limit: limit,
                        // offset: skip,
                        attributes: ["id", ["namaLayanan", "name"], "active", "createdAt"],
                        where: {
                            userId: req.params.partnerId,
                            // active: isActive
                        },
                        include: [
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: ProductImages, attributes: ['id', 'image']},
                            {
                            model: PackagePricings,
                            attributes: ["id", "name", "price", "disc_percentage"],
                            where: whereClause
                        }],
                        // order: [['createdAt', "DESC"]],
                    })

                    eoServices.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });
                    
                    return res.status(200).json({
                        search,
                        filter,
                        category,
                        services: Paginator(eoServices, page, limit)
                    })
                }
            } else if (category == "TALENT") {
                if(filter === 'terbaru'){
                    const eoServices = await TalentServices.findAll({
                        // limit: limit,
                        // offset: skip,
                        attributes: ["id", "name", "active", "createdAt"],
                        where: {
                            userId: req.params.partnerId,
                            // active: isActive
                        },
                        include: [
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: TalentImages, attributes: ['id', 'image']},
                            {
                            model: PackagePricings,
                            attributes: ["id", "name", "price",  "disc_percentage"],
                            where: whereClause
                        }],
                        order: [['createdAt', "DESC"]],
                    })

                    eoServices.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });
                    
                    return res.status(200).json({
                        search,
                        category,
                        filter,
                        services: Paginator(eoServices, page, limit)
                    })
                }else if(filter == "terlaris"){
                    const eoServices = await TalentServices.findAll({
                        where: {userId: req.params.partnerId},
                        attributes: ['id','name'],
                        include: [ 
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: TalentImages, attributes: ['id', 'image']},
                            {
                                model: PackagePricings, 
                                attributes: ['id', 'price', 'name',  "disc_percentage"],
                                // where: whereClause,
                                include: [{
                                    model: Transaction,
                                    where: {service_status : "COMPLETE"},
                                    attributes: ['id','service_status']
                                }]
                            }
                        ]
                    })

                    const popularity = {};
                    for (const item of eoServices) {
                        let transactions = 0;
                        for (const pricing of item.package_pricings) {
                            transactions += pricing.transactions.length;
                        }
                        popularity[item.id] = transactions;
                    }

                    const sortedData = Object.entries(popularity).sort((a, b) => b[1] - a[1]);
                    // console.log(eoServices)

                    const fixData = []
                    for( let x = 0; x<sortedData.length; x++){
                        const targetId = sortedData[x][0]
                        fixData[x] = eoServices.find(item => item.id === targetId)
                    }

                    // Mencari berdasarkan 'name' atau 'name' pada 'package_pricings'
                    const searchResults = fixData.filter(item => {
                        const itemName = item.name.toLowerCase();
                        const packageNames = item.package_pricings.map(pkg => pkg.name.toLowerCase());
                    
                        return itemName.includes(search.toLowerCase()) || packageNames.includes(search.toLowerCase());
                    });

                    searchResults.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });

                    return res.status(200).json({
                        search,
                        filter,
                        category,
                        services: Paginator(searchResults, page, limit)
                    })
                }else{
                    const eoServices = await TalentServices.findAll({
                        // limit: limit,
                        // offset: skip,
                        attributes: ["id", "name", "active", "createdAt"],
                        where: {
                            userId: req.params.partnerId,
                            // active: isActive
                        },
                        include: [
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: TalentImages, attributes: ['id', 'image']},
                            {
                            model: PackagePricings,
                            attributes: ["id", "name", "price",  "disc_percentage"],
                            where: whereClause
                        }],
                        // order: [['createdAt', "DESC"]],
                    })

                    eoServices.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });

                    return res.status(200).json({
                        search,
                        filter,
                        category,
                        services: Paginator(eoServices, page, limit)
                    })
                }
            } else if (category == "VENUE") {
                if(filter === 'terbaru'){
                    const eoServices = await VenueServices.findAll({
                        // limit: limit,
                        // offset: skip,
                        attributes: ["id", "name", "active", "createdAt"],
                        where: {
                            userId: req.params.partnerId,
                            // active: isActive
                        },
                        include: [
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: VenueImages, attributes: ['id', 'image']},
                            {
                            model: PackagePricings,
                            attributes: ["id", "name", "price", "disc_percentage"],
                            where: whereClause
                        }],
                        order: [['createdAt', "DESC"]],
                    })

                    eoServices.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });
                    
                    return res.status(200).json({
                        search,
                        category,
                        filter,
                        services: Paginator(eoServices, page, limit)
                    })
                }else if(filter == "terlaris"){
                    const eoServices = await VenueServices.findAll({
                        where: {userId: req.params.partnerId},
                        attributes: ['id','name'],
                        include: [ 
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: VenueImages, attributes: ['id', 'image']},
                            {
                                model: PackagePricings, 
                                attributes: ['id', 'price', 'name',  "disc_percentage"],
                                // where: whereClause,
                                include: [{
                                    model: Transaction,
                                    where: {service_status : "COMPLETE"},
                                    attributes: ['id','service_status']
                                }]
                            }
                        ]
                    })

                    const popularity = {};
                    for (const item of eoServices) {
                        let transactions = 0;
                        for (const pricing of item.package_pricings) {
                            transactions += pricing.transactions.length;
                        }
                        popularity[item.id] = transactions;
                    }

                    const sortedData = Object.entries(popularity).sort((a, b) => b[1] - a[1]);
                    // console.log(eoServices)

                    const fixData = []
                    for( let x = 0; x<sortedData.length; x++){
                        const targetId = sortedData[x][0]
                        fixData[x] = eoServices.find(item => item.id === targetId)
                    }

                    // Mencari berdasarkan 'name' atau 'name' pada 'package_pricings'
                    const searchResults = fixData.filter(item => {
                        const itemName = item.name.toLowerCase();
                        const packageNames = item.package_pricings.map(pkg => pkg.name.toLowerCase());
                    
                        return itemName.includes(search.toLowerCase()) || packageNames.includes(search.toLowerCase());
                    });

                    searchResults.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });

                    return res.status(200).json({
                        search,
                        filter,
                        category,
                        services: Paginator(searchResults, page, limit)
                    })
                }else{
                    const eoServices = await VenueServices.findAll({
                        // limit: limit,
                        // offset: skip,
                        attributes: ["id", "name", "active", "createdAt"],
                        where: {
                            userId: req.params.partnerId,
                            // active: isActive
                        },
                        include: [
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: VenueImages, attributes: ['id', 'image']},
                            {
                            model: PackagePricings,
                            attributes: ["id", "name", "price", "disc_percentage"],
                            where: whereClause
                        }],
                        // order: [['createdAt', "DESC"]],
                    })

                    eoServices.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });
                    
                    return res.status(200).json({
                        search,
                        filter,
                        category,
                        services: Paginator(eoServices, page, limit)
                    })
                }
            } else {
                //ALL PRODUCT 

                const eo = await EOServices.findAll({
                    where: {userId: req.params.partnerId},
                    attributes: ['id','name','createdAt'],
                    include: [ 
                        {model: Users, attributes: ['id', 'fullname']},
                        {model: EOImages, attributes: ['id', 'image']},
                        {
                            model: PackagePricings, 
                            attributes: ['id', 'price', 'name', "disc_percentage"],
                            where: {
                                // is_active: isActive,
                                [Op.and]: [{
                                    [Op.or]: [
                                        sequelize.where(sequelize.fn('lower', sequelize.col(`eo_services.name`)), {
                                            [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                                        }),
                                        sequelize.where(sequelize.fn('lower', sequelize.col('package_pricings.name')), {
                                            [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                                        }),
                                    ]
                                }]
                            }
                        }
                    ]
                })
                const venue = await VenueServices.findAll({
                    where: {userId: req.params.partnerId},
                    attributes: ['id','name','createdAt'],
                    include: [ 
                        {model: Users, attributes: ['id', 'fullname']},
                        {model: VenueImages, attributes: ['id', 'image']},
                        {
                            model: PackagePricings, 
                            attributes: ['id', 'price', 'name', "disc_percentage"],
                            where: {
                                // is_active: isActive,
                                [Op.and]: [{
                                    [Op.or]: [
                                        sequelize.where(sequelize.fn('lower', sequelize.col(`venue_services.name`)), {
                                            [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                                        }),
                                        sequelize.where(sequelize.fn('lower', sequelize.col('package_pricings.name')), {
                                            [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                                        }),
                                    ]
                                }]
                            }
                        }
                    ]
                })
                const product = await ProductSupplies.findAll({
                    where: {userId: req.params.partnerId},
                    attributes: ['id',["namaLayanan", "name"],'createdAt'],
                    include: [ 
                        {model: Users, attributes: ['id', 'fullname']},
                        {model: ProductImages, attributes: ['id', 'image']},
                        {
                            model: PackagePricings, 
                            attributes: ['id', 'price', 'name', "disc_percentage"],
                            where: {
                                // is_active: isActive,
                                [Op.and]: [{
                                    [Op.or]: [
                                        sequelize.where(sequelize.fn('lower', sequelize.col('product_supplies.namaLayanan')), {
                                            [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                                        }),
                                        sequelize.where(sequelize.fn('lower', sequelize.col('package_pricings.name')), {
                                            [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                                        }),
                                    ]
                                }]
                            }
                        }
                    ]
                })
                const talent = await TalentServices.findAll({
                    where: {userId: req.params.partnerId},
                    attributes: ['id','name','createdAt'],
                    include: [ 
                        {model: Users, attributes: ['id', 'fullname']},
                        {model: TalentImages, attributes: ['id', 'image']},
                        {
                            model: PackagePricings, 
                            attributes: ['id', 'price', 'name', "disc_percentage"],
                            where: {
                                // is_active: isActive,
                                [Op.and]: [{
                                    [Op.or]: [
                                        sequelize.where(sequelize.fn('lower', sequelize.col(`talent_services.name`)), {
                                            [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                                        }),
                                        sequelize.where(sequelize.fn('lower', sequelize.col('package_pricings.name')), {
                                            [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                                        }),
                                    ]
                                }]
                            }
                        }
                    ]
                })
    
                
                if(filter == "terbaru"){
                    const terbaru = eo.concat(venue, product, talent);
                    
                    if(terbaru.length == 0){
                        return res.status(400).json({
                            message: "No New Product !"
                        })
                    }

                    terbaru.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });
    
                    // Mengurutkan data berdasarkan createdAt yang terbaru
                    terbaru.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
                    return res.status(200).json({
                        search,
                        filter,
                        category,
                        services: Paginator(terbaru, page, limit)
                    })
                }else if(filter == "terlaris"){
                    const eo = await EOServices.findAll({
                        where: {userId: req.params.partnerId},
                        attributes: ['id','name'],
                        include: [ 
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: EOImages, attributes: ['id', 'image']},
                            {
                                model: PackagePricings, 
                                attributes: ['id', 'price', 'name', "disc_percentage"],
                                include: [{
                                    model: Transaction,
                                    where: {service_status : "COMPLETE"},
                                    attributes: ['id','service_status']
                                }]
                            }
                        ]
                    })
                    const venue = await VenueServices.findAll({
                        where: {userId: req.params.partnerId},
                        attributes: ['id','name'],
                        include: [ 
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: VenueImages, attributes: ['id', 'image']},
                            {
                                model: PackagePricings, 
                                attributes: ['id', 'price', 'name', "disc_percentage"],
                                include: [{
                                    model: Transaction,
                                    where: {service_status : "COMPLETE"},
                                    attributes: ['id','service_status']
                                }]
                            }
                        ]
                    })
                    const product = await ProductSupplies.findAll({
                        where: {userId: req.params.partnerId},
                        attributes: ['id',[sequelize.col('namaLayanan'), 'name']],
                        include: [ 
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: ProductImages, attributes: ['id', 'image']},
                            {
                                model: PackagePricings, 
                                attributes: ['id', 'price', 'name',  "disc_percentage"],
                                include: [{
                                    model: Transaction,
                                    where: {service_status : "COMPLETE"},
                                    attributes: ['id','service_status']
                                }]
                            }
                        ]
                    })
                    const talent = await TalentServices.findAll({
                        where: {userId: req.params.partnerId},
                        attributes: ['id','name'],
                        include: [ 
                            {model: Users, attributes: ['id', 'fullname']},
                            {model: TalentImages, attributes: ['id', 'image']},
                            {
                                model: PackagePricings, 
                                attributes: ['id', 'price', 'name', "disc_percentage"],
                                include: [{
                                    model: Transaction,
                                    where: {service_status : "COMPLETE"},
                                    attributes: ['id','service_status']
                                }]
                            }
                        ]
                    })
                    
                    const terlaris = eo.concat(venue, product, talent);

                    terlaris.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });

                    // console.log(terlaris)
                    if(terlaris.length == 0){
                        return res.status(400).json({
                            message: "No Transaction!"
                        })
                    }

                    const popularity = {};
                    for (const item of terlaris) {
                        let transactions = 0;
                        for (const pricing of item.package_pricings) {
                            transactions += pricing.transactions.length;
                        }
                        popularity[item.id] = transactions;
                    }

                    const sortedData = Object.entries(popularity).sort((a, b) => b[1] - a[1]);
                    
                    const fixData = []
                    for( let x = 0; x<sortedData.length; x++){
                        const targetId = sortedData[x][0]
                        fixData[x] = terlaris.find(item => item.id === targetId)
                    }
                    
                    // Mencari berdasarkan 'name' atau 'name' pada 'package_pricings'
                    const searchResults = fixData.filter(item => {
                        const itemName = item.dataValues.name.toLowerCase();
                        const packageNames = item.package_pricings.map(pkg => pkg.name.toLowerCase());
                    
                        return itemName.includes(search.toLowerCase()) || packageNames.includes(search.toLowerCase());
                    });
                    
                    // return res.send(searchResults)
                    return res.status(200).json({
                        search,
                        filter,
                        category,
                        services: Paginator(searchResults, page, limit)
                    })

                }else{
                    const fixData = eo.concat(venue,product,talent)
                    fixData.map(item => {
                        if (item.dataValues.eo_images) {
                            item.dataValues.images = item.dataValues.eo_images;
                            delete item.dataValues.eo_images;
                        }else if (item.dataValues.venue_images) {
                            item.dataValues.images = item.dataValues.venue_images;
                            delete item.dataValues.venue_images;
                        }else if (item.dataValues.product_images) {
                            item.dataValues.images = item.dataValues.product_images;
                            delete item.dataValues.product_images;
                        }else if (item.dataValues.talent_images) {
                            item.dataValues.images = item.dataValues.talent_images;
                            delete item.dataValues.talent_images;
                        }
                        return item;
                    });
                    return res.status(200).json({
                        search,
                        filter,
                        category,
                        services: Paginator(fixData, page, limit)
                    })
                }
            }
        } catch (error) {
            res.status(400).json({
                message: error.message
            })
        }
    }

    static async cardInfo (req,res){
        try {
            const partner = await Users.findOne({
                where:{id: req.params.partnerId},
                attributes: ['fullname', 'createdAt'],
                include: {model: UsersDetail, attributes: ['city','province']}
            })
            
            //convert date to DD-MM-YYYY
            const createdAtDate = new Date(partner.createdAt);
            const day = createdAtDate.getDate();
            const monthIndex = createdAtDate.getMonth();
            const year = createdAtDate.getFullYear();
            const monthNames = [
            "January", "February", "March", "April", "May", "June", 
            "July", "August", "September", "October", "November", "December"
            ];
            const month = monthNames[monthIndex];

            res.status(200).json({
                data: {
                    fullname: partner.fullname,
                    createdAt: `${day} ${month} ${year}`,
                    city: partner.users_detail.city,
                    province: partner.users_detail.province,
                    satisfied: "puas",
                    feddbeck: '6,364',
                    lastOnline: 'baru saja',
                    rating: '4.5'
                }
            })
        } catch (error) {
            res.status(400).json({
                message: error.message
            })
        }
    }

    static async bannerImage(req, res) {
        try {
            const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
                if (error) return res.sendStatus(403)
                return decoded
            })

            const data = await Banners.findAll({
                include: [
                    {
                        model: ShopDecoration,
                        where: {
                            partnerId: tokenDecode.userId,
                        },
                        attributes: [],
                    },
                    {
                        model: BannerImages,
                    },
                ],
            })
            
            const bannerImagesData = data.map(banner => {
                return banner.banner_images.map(image => {
                    return {
                        id: image.id,
                        image: `http://localhost:${process.env.APP_PORT}${image.image}`,
                        bannerId: image.bannerId
                    };
                });
            }).flat();

            res.status(200).json(bannerImagesData)
            
        } catch (error) {
            return res.status(500).json({
                error: `Failed to get all banners from accessing partners`,
                message: error.message,
            })
        }
    }
}

module.exports = ShopDecorationController