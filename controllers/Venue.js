const jwt = require("jsonwebtoken");
const VenueServices = require("../models/VenueServicesModel");
const sharp = require("sharp");
const VenueImages = require("../models/VenueImagesModel");
const PackagePricings = require("../models/PackagePricingsModel");
const buildPaginator = require('pagination-apis');
const Users = require("../models/UsersModel");
const Companies = require("../models/CompaniesModel");
const Roles = require("../models/RolesModel");
const Transactions = require("../models/TransactionsModel");
const { Op } = require("sequelize");
const mime = require('mime-types');
const fs = require('fs');
const { getAndCountImageFromDb, deleteImageFromDb, deleteImageFromDirectory, generateBase64ImageNameAndPath, storeImageToDb, convertBase64ToJPEG } = require("../controllers/ImageController");
const { storePDFToDirectory, generatePDFNameAndPath } = require("../controllers/PDFController");

const category = "Venue"

const createVenue = async (req, res, next) => {
    const {
        venue_name,
        venue_description,
        venue_spesification,
        images,
        package_name,
        package_description,
        package_price_type,
        package_price,
        package_disc_percentage,
        package_disc_price,
        package_total_price,
        package_start_date,
        package_end_date,
        package_qty,
    } = req.body
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const venue = await VenueServices.create({
            name: venue_name,
            description: venue_description,
            spesification: venue_spesification,
            userId: tokenDecode.userId,
        })

        // images
        if (typeof images !== "undefined") {
            if (typeof images === "object") {
                for (let i = 0; i < images.length; i++) {
                    const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                    await VenueImages.create({
                        image: imagePath,
                        venueServiceId: venue.id,
                    })

                    try {
                        let parts = images[i].split(';')
                        let imageData = parts[1].split(',')[1]

                        const img = new Buffer.from(imageData, 'base64')

                        await sharp(img)
                            .resize(280, 175)
                            .toFormat("jpeg", { mozjpeg: true })
                            .jpeg({ quality: 100 })
                            .toFile(`./assets/images/venue/${imageName}`)
                    } catch (error) {
                        return res.status(500).json({ msg: `Can't convert base64 to jpeg of ${category}'s image and save it into directory. ${err.message}` })
                    }
                }
            } else if (typeof images === "string") {
                const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                storeImageToDb(imagePath, category, venue.id)

                try {
                    let parts = images.split(';')
                    let imageData = parts[1].split(',')[1]

                    const img = new Buffer.from(imageData, 'base64')

                    await sharp(img)
                        .resize(280, 175)
                        .toFormat("jpeg", { mozjpeg: true })
                        .jpeg({ quality: 100 })
                        .toFile(`./assets/images/venue/${imageName}`)
                } catch (error) {
                    return res.status(500).json({ msg: `Can't convert base64 to jpeg of ${category}'s image and save it into directory. ${err.message}` })
                }
            }
        }

        let pdfFile

        // Package Pricings
        if (typeof package_name !== "undefined") {
            portofolio = []

            if (typeof package_name === "object") {
                for (let i = 0; i < package_name.length; i++) {
                    // let pdfFile = null

                    if (req.files != null) {
                        if (req.files.package_portofolio != null) {
                            pdfFile = req.files["package_portofolio"][i]

                            if (Array.isArray(req.files.package_portofolio)) {
                                if (typeof pdfFile !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)
                                    storePDFToDirectory(pdfFile, filePath, res)

                                    portofolio[i] = `/assets/portofolio/venue/${fileName}`
                                } else {
                                    portofolio[i] = null
                                }
                            } else {
                                if (typeof pdfFile !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)
                                    storePDFToDirectory(pdfFile, filePath, res)

                                    portofolio[0] = `/assets/portofolio/venue/${fileName}`
                                } else if (typeof req.files.package_portofolio !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio, category)
                                    storePDFToDirectory(req.files.package_portofolio, filePath, res)

                                    portofolio[0] = `/assets/portofolio/venue/${fileName}`
                                } else {
                                    portofolio[i] = null
                                }
                            }
                        }
                    }

                    const price = []

                    if (package_price_type[i] === 'FIXED') {
                        price[i] = [Number(package_price[i])]
                    } else {
                        if (package_price[i].includes(" - ")) {
                            price[i] = package_price[i].split(" - ").map(num => parseInt(num))
                        } else if (package_price[i].includes("-")) {
                            price[i] = package_price[i].split("-").map(num => parseInt(num))
                        }
                    }

                    await PackagePricings.create({
                        name: package_name[i],
                        description: package_description[i],
                        price_type: package_price_type[i],
                        price: JSON.stringify(price[i]),
                        disc_percentage: typeof package_disc_percentage === 'undefined' ? 0 : package_disc_percentage[i],
                        disc_price: typeof package_disc_price === 'undefined' ? 0 : package_disc_price[i],
                        total_price: typeof package_total_price === 'undefined' ? 0 : package_total_price[i],
                        service_type: "VENUE",
                        venueServiceId: venue.id,
                        duration: package_qty[i],
                        start_date: package_start_date[i],
                        end_date: package_end_date[i],
                        portofolio: portofolio[i],
                    })
                }
            } else if (typeof package_name === "string") {
                if (req.files != null) {
                    if (req.files.package_portofolio != null) {
                        if (typeof req.files.package_portofolio !== 'undefined') {
                            pdfFile = req.files["package_portofolio"]

                            const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)
                            storePDFToDirectory(pdfFile, filePath, res)
                            portofolio[0] = `/assets/portofolio/venue/${fileName}`
                        } else {
                            portofolio[0] = null
                        }
                    }
                }

                let price

                if (package_price_type === 'FIXED') {
                    price = [Number(package_price)]
                } else {
                    if (package_price.includes(" - ")) {
                        price = package_price.split(" - ").map(num => parseInt(num))
                    } else if (package_price.includes("-")) {
                        price = package_price.split("-").map(num => parseInt(num))
                    }
                }

                await PackagePricings.create({
                    name: package_name,
                    description: package_description,
                    price_type: package_price_type,
                    price: JSON.stringify(price),
                    disc_percentage: package_disc_percentage,
                    disc_price: package_disc_price,
                    total_price: package_total_price,
                    service_type: "VENUE",
                    venueServiceId: venue.id,
                    duration: package_qty,
                    start_date: package_start_date,
                    end_date: package_end_date,
                    portofolio: portofolio[0],
                })
            }
        }

        const createdVenue = await VenueServices.findOne({
            where: {
                id: venue.id,
            },
            include: [
                {
                    model: VenueImages,
                },
                {
                    model: PackagePricings,
                },
            ],
        })

        return res.status(201).json(createdVenue)
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getVenueWithoutLogin = async (req, res, next) => {
    const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })
    try {
        const rows = []
        const count = await VenueServices.count()
        await VenueServices.findAndCountAll({
            where: {
                active: true
            },
            limit,
            offset: skip,
            include: [{
                model: VenueImages,
            }, {
                model: PackagePricings
            }, {
                model: Users,
                include: {
                    model: Companies
                }
            }],
            order: [
                ['createdAt', 'DESC']
            ]
        })
            .then((result) => {
                return result.rows.map((data) => {
                    rows.push({
                        "id": data.id,
                        "venue_name": data.name,
                        "venue_description": data.description,
                        "venue_spesification": data.spesification,
                        "venue_image": data.venue_images[0].image,
                        "status_active": data.active,
                        "company": data.user.company.name,
                        "package": data.package_pricings,
                    })
                })
            })
        return res.status(200).json(paginate(rows, count));
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getVenueWithLogin = async (req, res, next) => {
    const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })
        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId
            },
            include: {
                model: Roles
            }
        })
        
        if (user.role.name === 'Stakeholder' || user.role.name === 'Event Hunter') {
            try {
                // return res.send("Sudah Masuk adada")
                const rows = []
                const count = await VenueServices.count()
                const data = await VenueServices.findAndCountAll({
                    where: {
                        active: true
                    },
                    limit,
                    offset: skip,
                    include: [{
                        model: VenueImages
                    }, {
                        model: PackagePricings
                    }, {
                        model: Users,
                        include: {
                            model: Companies
                        }
                    }],
                    order: [
                        ['createdAt', 'DESC']
                    ]
                })
                .then((result) => {
                    return result.rows.map((data) => {
                        if(data.venue_images.length > 0){
                            rows.push({
                                "id": data.id,
                                "venue_name": data.name,
                                "venue_description": data.description,
                                "venue_spesification": data.spesification,
                                "venue_image": data.venue_images[0].image,
                                "status_active": data.active,
                                "company": data.user.company.name,
                                "package": data.package_pricings,
                            })
                        }else{
                            rows.push({
                                "id": data.id,
                                "venue_name": data.name,
                                "venue_description": data.description,
                                "venue_spesification": data.spesification,
                                "venue_image": null,
                                "status_active": data.active,
                                "company": data.user.company.name,
                                "package": data.package_pricings,
                            })
                        }
                    })
                })
                return res.status(200).json(paginate(rows, count));
            } catch (error) {
                return res.status(500).json({ msg: error.message })
            }
        }

        if (user.role.name === 'Partner') {
            try {
                const rows = []
                const count = await VenueServices.count({
                    include: {
                        model: Users,
                        where: {
                            companyId: user.companyId
                        }
                    }
                })
                await VenueServices.findAndCountAll({
                    limit,
                    offset: skip,
                    include: [{
                        model: VenueImages,
                    }, {
                        model: PackagePricings
                    }, {
                        model: Users,
                        where: {
                            companyId: user.companyId
                        },
                        include: {
                            model: Companies
                        }
                    }],
                    order: [
                        ['createdAt', 'DESC']
                    ]
                })
                    .then((result) => {
                        return result.rows.map((data) => {
                            if(data.venue_images.length > 0){
                                rows.push({
                                    "id": data.id,
                                    "venue_name": data.name,
                                    "venue_description": data.description,
                                    "venue_spesification": data.spesification,
                                    "venue_image": data.venue_images[0].image,
                                    "status_active": data.active,
                                    "company": data.user.company.name,
                                    "package": data.package_pricings,
                                })
                            }else{
                                rows.push({
                                    "id": data.id,
                                    "venue_name": data.name,
                                    "venue_description": data.description,
                                    "venue_spesification": data.spesification,
                                    "venue_image": null,
                                    "status_active": data.active,
                                    "company": data.user.company.name,
                                    "package": data.package_pricings,
                                })
                            }
                        })

                    })
                return res.status(200).json(paginate(rows, count));
            } catch (error) {
                return res.status(500).json({ msg: error.message })
            }
        }

        if (user.role.name === 'Venue') {
            try {
                const rows = []
                const count = await VenueServices.count({
                    include: {
                        model: Users,
                        where: {
                            companyId: user.companyId
                        }
                    }
                })
                await VenueServices.findAndCountAll({
                    limit,
                    offset: skip,
                    include: [{
                        model: VenueImages,
                    }, {
                        model: PackagePricings
                    }, {
                        model: Users,
                        where: {
                            companyId: user.companyId
                        },
                        include: {
                            model: Companies
                        }
                    }],
                    order: [
                        ['createdAt', 'DESC']
                    ]
                })
                    .then((result) => {
                        return result.rows.map((data) => {
                            if(data.venue_images.length > 0){
                                rows.push({
                                    "id": data.id,
                                    "venue_name": data.name,
                                    "venue_description": data.description,
                                    "venue_spesification": data.spesification,
                                    "venue_image": data.venue_images[0].image,
                                    "status_active": data.active,
                                    "company": data.user.company.name,
                                    "package": data.package_pricings,
                                })
                            }else{
                                rows.push({
                                    "id": data.id,
                                    "venue_name": data.name,
                                    "venue_description": data.description,
                                    "venue_spesification": data.spesification,
                                    "venue_image": null,
                                    "status_active": data.active,
                                    "company": data.user.company.name,
                                    "package": data.package_pricings,
                                })
                            }
                        })
                    })
                return res.status(200).json(paginate(rows, count));
            } catch (error) {
                return res.status(500).json({ msg: error.message })
            }
        }

        return res.status(405).json({ msg: `You're Not Allowed` })
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getVenueDetail = async (req, res, next) => {
    try {
        let venue = await VenueServices.findOne({
            where: {
                id: req.query.id,
            },
            include: [{
                model: VenueImages,
            }, {
                model: PackagePricings,
            }, {
                model: Users,
                include: {
                    model: Companies
                }
            }],
            order: [
                [{ model: PackagePricings }, 'total_price', 'ASC']
            ]
        })
        
        if (!venue) {
            return res.status(404).json({ msg: `Venue Service Not Found` })
        }

        for (let i = 0; i < venue.package_pricings.length; i++) {
            let startDate = new Date(venue.dataValues.package_pricings[i].dataValues.start_date)
            let endDate = new Date(venue.dataValues.package_pricings[i].dataValues.end_date)
            let availableDate = []

            for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
                availableDate.push(new Date(date))
            }

            venue.dataValues.package_pricings[i].dataValues.availableDate = availableDate
        }

        let base64String
        let promises = []

        for (let i = 0; i < venue.dataValues.venue_images.length; i++) {
            const filePath = `.${venue.dataValues.venue_images[i].dataValues.image}`

            let promise = new Promise((resolve, reject) => {
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        console.error('Error:', err)
                        reject(err)
                    }

                    base64String = data.toString('base64')
                    venue.dataValues.venue_images[i].dataValues.imageBase64 = `data:image/jpeg;base64,${base64String}`

                    resolve()
                })
            })

            promises.push(promise)
        }

        Promise.all(promises).then(() => {
            return res.status(200).json({ data: venue });
        })
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const updateActivatedVenueServiceById = async (req, res, next) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId
            },
            include: [{
                model: Companies
            }, {
                model: Roles
            }]
        })

        if (user.role.name === 'Talent' || user.role.name === 'Supplier' || user.role.name === 'Stakeholder' || user.role.name === 'Event Hunter' || user.role.name === 'Event Organizer') {
            return res.status(405).json({ msg: `You're Not Allowed` })
        }

        const venue = await VenueServices.findOne({
            where: {
                id: req.query.id
            },
            include: {
                model: Users,
                include: {
                    model: Companies
                }
            }
        })

        if (user.company.id !== venue.user.company.id) {
            return res.status(404).json({ msg: `Venue Service Not Found` })
        }

        const value = venue.active

        await VenueServices.update({
            active: !value
        }, {
            where: {
                id: req.query.id
            }
        })

        res.status(200).json({ message: "Success Change Activated Service" });
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const listVenue = async (req, res, next) => {
    const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
        if (error) return res.sendStatus(403);
        return decoded
    })

    const user = await Users.findOne({
        where: {
            id: tokenDecode.userId
        },
        include: {
            model: Roles
        }
    })
    const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })
    try {
        const rows = []
        const count = await VenueServices.count({
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })
        await VenueServices.findAndCountAll({
            limit,
            offset: skip,
            include: [{
                model: VenueImages,
            }, {
                model: PackagePricings
            }, {
                model: Users,
                where: {
                    companyId: user.companyId
                },
                include: {
                    model: Companies
                }
            }],
            order: [
                ['createdAt', 'DESC']
            ]
        })
            .then((result) => {
                return result.rows.map((data) => {
                    rows.push({
                        "id": data.id,
                        "venue_name": data.name,
                        "venue_image": data.venue_images[0].image,
                        "status_active": data.active,
                        "company": data.user.company.name,
                        "package": data.package_pricings,
                    })
                })
            })

        const userFix = {
            name: user.fullname,
            startDate: user.createdAt
        }

        return res.status(200).json({
            user: userFix,
            dataVenue: paginate(rows, count)
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

const venueStatistic = async (req, res, next) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({ where: { id: tokenDecode.userId } })

        const all_venue = await VenueServices.count({
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })

        const active_venue = await VenueServices.count({
            where: {
                active: true
            },
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })

        let packageId = []

        await VenueServices.findAll({
            include: [{
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }, {
                model: PackagePricings
            }]
        })
            .then((result) => {
                return result.map((data) => {
                    return data.package_pricings.map((id) => {
                        packageId.push(id.id)
                    })
                })
            })

        let all_transaction
        let active_transaction

        if (packageId.length === 0) {
            all_transaction = 0
            active_transaction = 0
        } else {
            all_transaction = await Transactions.count({
                where: {
                    // status: 'SUCCESS',
                    // status: {
                    //     [Op.in]: ['PAID', 'COMPLETE']
                    // },
                    packagePricingId: {
                        [Op.or]: packageId
                    }
                }
            })

            active_transaction = await Transactions.count({
                where: {
                    // status: 'SUCCESS',
                    // service_status: 'INCOMPLETE',
                    status: 'PAID',
                    packagePricingId: {
                        [Op.or]: packageId
                    },
                    endDate: {
                        [Op.gte]: new Date()
                    },
                }
            })
        }

        const data = {
            'total_venue': all_venue,
            'total_venue_aktif': active_venue,
            'total_klien': all_transaction,
            'total_klien_aktif': active_transaction
        }

        return res.status(200).json({ data })
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getVenueByID = async (req, res, next) => {
    try {
        const venueID = req.params["venueID"]
        if (venueID === "" || venueID == null) {
            return res.status(400).json({ msg: `Venue service id can not be empty!` })
        }

        const venueService = await VenueServices.findOne({
            where: {
                id: venueID,
            }
        })

        if (!venueService) {
            return res.status(404).json({ msg: `Venue Service with ID [${venueID}] not found` })
        }

        return res.status(200).json({ data: venueService });
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getVenueImagesByVenueID = async (req, res, next) => {
    try {
        const venueID = req.params["venueID"]
        if (venueID === "" || venueID == null) {
            return res.status(400).json({ msg: `Venue service id can not be empty!` })
        }

        const venueImages = await VenueImages.findAll({
            where: {
                venueServiceId: venueID,
            }
        })

        if (venueImages.length === 0) {
            return res.status(404).json({ msg: `Venue Images with Venue Service ID [${venueID}] not found` })
        }

        return res.status(200).json({ data: venueImages });
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getPackagePricingsByVenueID = async (req, res, next) => {
    try {
        const venueID = req.params["venueID"]
        if (venueID === "" || venueID == null) {
            return res.status(400).json({ msg: `Venue service id can not be empty!` })
        }

        const packagePricing = await PackagePricings.findAll({
            where: {
                venueServiceId: venueID,
            }
        })

        if (packagePricing.length === 0) {
            return res.status(404).json({ msg: `Package Pricings with Venue Service ID [${venueID}] not found` })
        }

        return res.status(200).json({ data: packagePricing });
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const editVenue = async (req, res, next) => {
    const {
        venue_name,
        venue_description,
        venue_place_address,
        venue_spesification,
        venue_images_base64,
        package_id,
    } = req.body

    let {
        package_name,
        package_description,
        package_price_type,
        package_price,
        package_disc_percentage,
        package_disc_price,
        package_total_price,
        package_start_date,
        package_end_date,
        package_quantity,
    } = req.body

    // console.log("\n")
    // console.log("req.body: ", req.body)
    // console.log("\n")

    const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
        if (error) return res.sendStatus(403)
        return decoded
    })

    const venueID = req.params["venueID"]

    const venueService = await VenueServices.findOne({
        where: {
            id: venueID
        },
    })

    // Incoming data validation
    try {
        if (venueID === "" || venueID == null) throw new Error(`Venue service id can not be empty!`)

        if (!venueService) return res.status(404).json({ msg: `No Data Found with id [${venueID}]` })

    } catch (error) {
        return res.status(400).json({
            msg: `Function Validation: \n ${error.message}`,
        })
    }

    try {
        await VenueServices.update({
            name: venue_name,
            description: venue_description,
            // place_address: venue_place_address,
            spesification: venue_spesification,
        }, {
            where: {
                id: venueID,
            },
        })

        // images
        if (typeof venue_images_base64 !== "undefined") {
            const { count, rows } = await VenueImages.findAndCountAll({
                where: {
                    venueServiceId: venueID,
                },
                attributes: [
                    "image",
                ],
            })

            if (typeof venue_images_base64 === "object") {
                await VenueImages.destroy({
                    where: {
                        venueServiceId: venueID,
                    }
                })

                for (let i = 0; i < count; i++) {
                    if (fs.existsSync(`.${rows[i].image}`)) {
                        fs.unlink(`.${rows[i].image}`, (err) => {
                            if (err) return res.status(500).json({ msg: `Deleting image from directory. ${err.message}` })
                        })
                    }
                }

                for (let i = 0; i < venue_images_base64.length; i++) {
                    const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                    await VenueImages.create({
                        image: imagePath,
                        venueServiceId: venueID,
                    })

                    try {
                        let parts = venue_images_base64[i].split(';')
                        let imageData = parts[1].split(',')[1]

                        const img = new Buffer.from(imageData, 'base64')

                        await sharp(img)
                            .resize(280, 175)
                            .toFormat("jpeg", { mozjpeg: true })
                            .jpeg({ quality: 100 })
                            .toFile(`./assets/images/venue/${imageName}`)
                    } catch (error) {
                        return res.status(500).json({ msg: `Can't convert base64 to jpeg of ${category}'s image and save it into directory. ${err.message}` })
                    }
                }
            } else if (typeof venue_images_base64 === "string") {
                deleteImageFromDb(category, venueID)

                for (let i = 0; i < count; i++) {
                    deleteImageFromDirectory(rows[i].image)
                }

                const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                storeImageToDb(imagePath, category, venueID)

                try {
                    let parts = venue_images_base64.split(';')
                    let imageData = parts[1].split(',')[1]

                    const img = new Buffer.from(imageData, 'base64')

                    await sharp(img)
                        .resize(280, 175)
                        .toFormat("jpeg", { mozjpeg: true })
                        .jpeg({ quality: 100 })
                        .toFile(`./assets/images/venue/${imageName}`)
                } catch (error) {
                    return res.status(500).json({ msg: `Store image to directory. ${err.message}` })
                }
            }
        }

        // package pricings
        if (typeof package_name !== "undefined") {

            const { count, rows } = await PackagePricings.findAndCountAll({
                where: {
                    venueServiceId: venueID,
                },
            })

            portofolio = []

            if (typeof package_name === "object") {
                let packageBefore = []
                let portofolioBefore = []

                for (let i = 0; i < rows.length; i++) {
                    packageBefore.push(rows[i].id)
                    portofolioBefore.push(rows[i].portofolio)
                }

                const deleted = packageBefore.filter((value) => !package_id.includes(value))

                if (deleted.length > 0) {
                    await PackagePricings.destroy({
                        where: {
                            id: deleted,
                        }
                    })

                    for (let i = 0; i < rows.length; i++) {
                        if (fs.existsSync(`.${portofolioBefore[i]}`)) {
                            fs.unlink(`.${portofolioBefore[i]}`, (err) => {
                                if (err) return res.status(500).json({ msg: `Deleting portofolios from directory. ${err.message}` })
                            })
                        }
                    }
                }

                for (let i = 0; i < package_name.length; i++) {
                    const packageCount = await PackagePricings.count({
                        where: {
                            id: package_id[i],
                        }
                    })

                    if (req.files != null) {
                        if (req.files.package_portofolio != null) {
                            pdfFile = req.files["package_portofolio"][i]

                            if (Array.isArray(req.files.package_portofolio)) {
                                if (typeof pdfFile !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)
                                    storePDFToDirectory(pdfFile, filePath, res)

                                    portofolio[i] = `/assets/portofolio/venue/${fileName}`
                                } else {
                                    portofolio[i] = null
                                }
                            } else {
                                if (typeof pdfFile !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)
                                    storePDFToDirectory(pdfFile, filePath, res)

                                    portofolio[0] = `/assets/portofolio/talent/${fileName}`
                                } else if (typeof req.files.package_portofolio !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio, category)
                                    storePDFToDirectory(req.files.package_portofolio, filePath, res)

                                    portofolio[0] = `/assets/portofolio/venue/${fileName}`
                                } else {
                                    portofolio[i] = null
                                }
                            }
                        }
                    }

                    const price = []

                    if (package_price_type[i] === 'FIXED') {
                        price[i] = [Number(package_price[i])]
                    } else {
                        if (package_price[i].includes(" - ")) {
                            price[i] = package_price[i].split(" - ").map(num => parseInt(num))
                        } else if (package_price[i].includes("-")) {
                            price[i] = package_price[i].split("-").map(num => parseInt(num))
                        }
                    }

                    if (packageCount === 0) {
                        await PackagePricings.create({
                            name: package_name[i],
                            description: package_description[i],
                            price_type: package_price_type[i],
                            price: JSON.stringify(price[i]),
                            disc_percentage: typeof package_disc_percentage === 'undefined' ? 0 : package_disc_percentage[i],
                            disc_price: typeof package_disc_price === 'undefined' ? 0 : package_disc_price[i],
                            total_price: typeof package_total_price === 'undefined' ? 0 : package_total_price[i],
                            service_type: "VENUE",
                            venueServiceId: venueID,
                            duration: package_quantity[i],
                            start_date: package_start_date[i],
                            end_date: package_end_date[i],
                            portofolio: portofolio[i],
                        })
                    } else if (packageCount === 1) {
                        await PackagePricings.update({
                            name: package_name[i],
                            description: package_description[i],
                            price_type: package_price_type[i],
                            price: JSON.stringify(price[i]),
                            disc_percentage: typeof package_disc_percentage === 'undefined' ? 0 : package_disc_percentage[i],
                            disc_price: typeof package_disc_price === 'undefined' ? 0 : package_disc_price[i],
                            total_price: typeof package_total_price === 'undefined' ? 0 : package_total_price[i],
                            service_type: "VENUE",
                            venueServiceId: venueID,
                            duration: package_quantity[i],
                            start_date: package_start_date[i],
                            end_date: package_end_date[i],
                            portofolio: portofolio[i],
                        }, {
                            where: {
                                id: package_id[i],
                            }
                        })
                    }
                }
            } else if (typeof package_name === "string") {
                let packageBefore = []
                let portofolioBefore = []

                for (let i = 0; i < rows.length; i++) {
                    packageBefore.push(rows[i].id)
                    portofolioBefore.push(rows[i].portofolio)
                }

                const deleted = packageBefore.filter((value) => !package_id.includes(value))

                if (deleted.length > 0) {
                    await PackagePricings.destroy({
                        where: {
                            id: deleted,
                        }
                    })

                    for (let i = 0; i < rows.length; i++) {
                        if (fs.existsSync(`.${portofolioBefore[i]}`)) {
                            fs.unlink(`.${portofolioBefore[i]}`, (err) => {
                                if (err) return res.status(500).json({ msg: `Deleting a portofolio from directory. ${err.message}` })
                            })
                        }
                    }
                }

                const packageCount = await PackagePricings.count({
                    where: {
                        id: package_id,
                    }
                })

                if (req.files != null) {
                    if (req.files.package_portofolio != null) {
                        if (typeof req.files.package_portofolio !== 'undefined') {
                            const pdfFile = req.files.package_portofolio
                            const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)

                            storePDFToDirectory(pdfFile, filePath, res)

                            portofolio[0] = `/assets/portofolio/venue/${fileName}`
                        } else {
                            portofolio[0] = null
                        }
                    }
                }

                let price

                if (package_price_type === 'FIXED') {
                    price = [Number(package_price)]
                } else {
                    if (package_price.includes(" - ")) {
                        price = package_price.split(" - ").map(num => parseInt(num))
                    } else if (package_price.includes("-")) {
                        price = package_price.split("-").map(num => parseInt(num))
                    }
                }

                if (packageCount === 0) {
                    await PackagePricings.create({
                        name: package_name,
                        description: package_description,
                        price_type: package_price_type,
                        price: JSON.stringify(price),
                        disc_percentage: package_disc_percentage,
                        disc_price: package_disc_price,
                        total_price: package_total_price,
                        service_type: "VENUE",
                        venueServiceId: venueID,
                        duration: package_quantity,
                        start_date: package_start_date,
                        end_date: package_end_date,
                        portofolio: portofolio[0],
                    })
                } else if (packageCount === 1) {
                    const currentPortofolio = await PackagePricings.findOne({
                        where: {
                            id: package_id,
                        },
                    })

                    if (req.files == null) {
                        portofolio[0] = currentPortofolio.portofolio
                    }

                    await PackagePricings.update({
                        name: package_name,
                        description: package_description,
                        price_type: package_price_type,
                        price: JSON.stringify(price),
                        disc_percentage: package_disc_percentage,
                        disc_price: package_disc_price,
                        total_price: package_total_price,
                        service_type: "VENUE",
                        venueServiceId: venueID,
                        duration: package_quantity,
                        start_date: package_start_date,
                        end_date: package_end_date,
                        portofolio: portofolio[0],
                    }, {
                        where: {
                            id: package_id,
                        }
                    })
                }
            }
        }

        const updatedVenue = await VenueServices.findOne({
            where: {
                id: venueID,
            },
            include: [{
                model: VenueImages,
            }, {
                model: PackagePricings,
            }]
        })

        return res.status(201).json({
            updatedVenue,
        })
    } catch (error) {
        return res.status(500).json({
            msg: `Last catch: ${error.message}`,
        })
    }
}

module.exports = { createVenue, getVenueWithoutLogin, getVenueWithLogin, getVenueDetail, updateActivatedVenueServiceById, venueStatistic, listVenue, getVenueByID, getVenueImagesByVenueID, getPackagePricingsByVenueID, editVenue }