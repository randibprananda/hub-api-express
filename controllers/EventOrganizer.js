const jwt = require("jsonwebtoken");
const sharp = require("sharp");
const PackagePricings = require("../models/PackagePricingsModel");
const EOServices = require("../models/EOServicesModel");
const EOImages = require("../models/EOImagesModel");
const fs = require('fs');
const Users = require("../models/UsersModel");
const Roles = require("../models/RolesModel");
const Transactions = require("../models/TransactionsModel");
const Companies = require("../models/CompaniesModel");
const mime = require('mime-types');
const { Op } = require("sequelize");
const buildPaginator = require('pagination-apis');
const { getAndCountImageFromDb, deleteImageFromDb, deleteImageFromDirectory, storeImageToDb, convertBase64ToJPEG, generateBase64ImageNameAndPath } = require("../controllers/ImageController");
const { storePDFToDirectory, generatePDFNameAndPath } = require("../controllers/PDFController");

const category = "EO"

const createEO = async (req, res, next) => {
    const {
        eo_name,
        eo_description,
        eo_spesification,
        eo_images,
        package_name,
        package_description,
        package_price_type,
        package_price,
        package_disc_percentage,
        package_disc_price,
        package_total_price,
        package_start_date,
        package_end_date,
        package_qty
    } = req.body;

    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const eo = await EOServices.create({
            name: eo_name,
            description: eo_description,
            spesification: eo_spesification,
            userId: tokenDecode.userId,
        })

        // images
        if (typeof eo_images !== "undefined") {
            if (typeof eo_images === "object") {
                for (let i = 0; i < eo_images.length; i++) {
                    const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                    await EOImages.create({
                        image: imagePath,
                        eoServiceId: eo.id,
                    })

                    try {
                        let parts = eo_images[i].split(';')
                        let imageData = parts[1].split(',')[1]

                        const img = new Buffer.from(imageData, 'base64')

                        await sharp(img)
                            .resize(280, 175)
                            .toFormat("jpeg", { mozjpeg: true })
                            .jpeg({ quality: 100 })
                            .toFile(`./assets/images/eo/${imageName}`)
                    } catch (error) {
                        return res.status(500).json({ msg: `Can't convert base64 to jpeg of ${category}'s image and save it into directory. ${err.message}` })
                    }
                }
            } else if (typeof eo_images === "string") {
                const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                storeImageToDb(imagePath, category, eo.id)

                try {
                    let parts = eo_images.split(';')
                    let imageData = parts[1].split(',')[1]

                    const img = new Buffer.from(imageData, 'base64')

                    await sharp(img)
                        .resize(280, 175)
                        .toFormat("jpeg", { mozjpeg: true })
                        .jpeg({ quality: 100 })
                        .toFile(`./assets/images/eo/${imageName}`)
                } catch (error) {
                    return res.status(500).json({ msg: `Error when storing image to directory. ${err.message}` })
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

                                    portofolio[i] = `/assets/portofolio/eo/${fileName}`
                                } else {
                                    portofolio[i] = null
                                }
                            } else {
                                if (typeof pdfFile !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)
                                    storePDFToDirectory(pdfFile, filePath, res)

                                    portofolio[0] = `/assets/portofolio/eo/${fileName}`
                                } else if (typeof req.files.package_portofolio !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio, category)
                                    storePDFToDirectory(req.files.package_portofolio, filePath, res)

                                    portofolio[0] = `/assets/portofolio/eo/${fileName}`
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
                        service_type: "EO",
                        eoServiceId: eo.id,
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
                            portofolio[0] = `/assets/portofolio/eo/${fileName}`
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
                    service_type: "EO",
                    eoServiceId: eo.id,
                    duration: package_qty,
                    start_date: package_start_date,
                    end_date: package_end_date,
                    portofolio: portofolio[0],
                })
            }
        }

        const createdEO = await EOServices.findOne({
            where: {
                id: eo.id,
            },
            include: [
                {
                    model: EOImages,
                },
                {
                    model: PackagePricings,
                },
            ],
        })

        return res.status(201).json(createdEO)
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getEOWithoutLogin = async (req, res, next) => {
    const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })
    try {
        const rows = []
        const count = await EOServices.count()
        await EOServices.findAndCountAll({
            where: {
                active: true
            },
            limit,
            offset: skip,
            include: [{
                model: EOImages,
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
                        "eo_name": data.name,
                        "eo_description": data.description,
                        "eo_spesification": data.spesification,
                        "eo_image": data.eo_images[0].image,
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

const getEOWithLogin = async (req, res, next) => {
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
                const rows = []
                const count = await EOServices.count()
                await EOServices.findAndCountAll({
                    where: {
                        active: true
                    },
                    limit,
                    offset: skip,
                    include: [{
                        model: EOImages,
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
                                "eo_name": data.name,
                                "eo_description": data.description,
                                "eo_spesification": data.spesification,
                                "eo_image": typeof data.eo_images[0] === 'undefined' ? null : data.eo_images[0].image,
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

        if (user.role.name === 'Partner') {
            try {
                const rows = []
                const count = await EOServices.count({
                    include: {
                        model: Users,
                        where: {
                            companyId: user.companyId
                        }
                    }
                })
                await EOServices.findAndCountAll({
                    limit,
                    offset: skip,
                    include: [{
                        model: EOImages,
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
                                "eo_name": data.name,
                                "eo_description": data.description,
                                "eo_spesification": data.spesification,
                                "eo_image": typeof data.eo_images[0] === 'undefined' ? null : data.eo_images[0].image,
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

        if (user.role.name === 'Event Organizer') {
            try {
                const rows = []
                const count = await EOServices.count({
                    include: {
                        model: Users,
                        where: {
                            companyId: user.companyId
                        }
                    }
                })
                await EOServices.findAndCountAll({
                    limit,
                    offset: skip,
                    include: [{
                        model: EOImages,
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
                                "eo_name": data.name,
                                "eo_description": data.description,
                                "eo_spesification": data.spesification,
                                "eo_image": typeof data.eo_images[0] === 'undefined' ? null : data.eo_images[0].image,
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

        return res.status(405).json({ msg: `You're Not Allowed` })
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getEODetail = async (req, res, next) => {
    try {
        const eo = await EOServices.findOne({
            where: {
                id: req.query.id,
            },
            include: [{
                model: EOImages,
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

        if (!eo) {
            return res.status(404).json({ msg: `EO Service Not Found` })
        }

        for (let i = 0; i < eo.package_pricings.length; i++) {
            let startDate = new Date(eo.dataValues.package_pricings[i].dataValues.start_date)
            let endDate = new Date(eo.dataValues.package_pricings[i].dataValues.end_date)
            let availableDate = []

            for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
                availableDate.push(new Date(date))
            }

            eo.dataValues.package_pricings[i].dataValues.availableDate = availableDate
        }

        let base64String
        let promises = []

        for (let i = 0; i < eo.dataValues.eo_images.length; i++) {
            const filePath = `.${eo.dataValues.eo_images[i].dataValues.image}`

            let promise = new Promise((resolve, reject) => {
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        console.error('Error:', err)
                        reject(err)
                    }

                    base64String = data.toString('base64')
                    eo.dataValues.eo_images[i].dataValues.imageBase64 = `data:image/jpeg;base64,${base64String}`

                    resolve()
                })
            })

            promises.push(promise)
        }

        Promise.all(promises).then(() => {
            return res.status(200).json({ data: eo })
        })

        // return res.status(200).json({ data: eo });
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const updateActivatedEOServiceById = async (req, res, next) => {
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

        if (user.role.name === 'Talent' || user.role.name === 'Venue' || user.role.name === 'Stakeholder' || user.role.name === 'Event Hunter' || user.role.name === 'Supplier') {
            return res.status(405).json({ msg: `You're Not Allowed` })
        }

        const eo = await EOServices.findOne({
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

        if (user.company.id !== eo.user.company.id) {
            return res.status(404).json({ msg: `EO Service Not Found` })
        }

        const value = eo.active

        await EOServices.update({
            active: !value
        }, {
            where: {
                id: req.query.id
            }
        })

        return res.status(200).json({ message: "Success Change Activated Service" });
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getEOTransaction = async (req, res, next) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })
        const transaction = await Transactions.findAll({
            where: {
                packagePricingId: {
                    [Op.ne]: null
                }
            },
            include: {
                model: PackagePricings,
                where: {
                    eoServiceId: {
                        [Op.ne]: null
                    }
                },
                include: {
                    model: EOServices,
                    where: {
                        userId: tokenDecode.userId
                    }
                }
            }
        })

        return res.json({ data: transaction })
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const eoStatistic = async (req, res, next) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({ where: { id: tokenDecode.userId } })

        const all_eo = await EOServices.count({
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })

        const active_eo = await EOServices.count({
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

        await EOServices.findAll({
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
            'total_eo': all_eo,
            'total_eo_aktif': active_eo,
            'total_klien': all_transaction,
            'total_klien_aktif': active_transaction
        }

        return res.status(200).json({ data })
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getEOByID = async (req, res, next) => {
    try {
        const eoID = req.params["eoID"]
        if (eoID === "" || eoID == null) {
            return res.status(400).json({ msg: `EO service id can not be empty!` })
        }

        const eoService = await EOServices.findOne({
            where: {
                id: eoID,
            }
        })

        if (!eoService) {
            return res.status(404).json({ msg: `EO Service with ID [${eoID}] not found` })
        }

        return res.status(200).json({ data: eoService });
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getPackagePricingsByEOID = async (req, res, next) => {
    try {
        const eoID = req.params["eoID"]
        if (eoID === "" || eoID == null) {
            return res.status(400).json({ msg: `EO service id can not be empty!` })
        }

        const packagePricing = await PackagePricings.findAll({
            where: {
                eoServiceId: eoID,
            }
        })

        if (packagePricing.length === 0) {
            return res.status(404).json({ msg: `Package Pricings with EO Service ID [${eoID}] not found` })
        }

        return res.status(200).json({ data: packagePricing });
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getListEO = async (req, res, next) => {
    const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
        if (error) return res.sendStatus(403);
        return decoded
    })
    const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })
    try {
        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId
            },
            include: {
                model: Roles
            }
        })

        const rows = []
        const count = await EOServices.count({
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })
        await EOServices.findAndCountAll({
            limit,
            offset: skip,
            include: [{
                model: EOImages,
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
                        "eo_name": data.name,
                        "eo_image": data.eo_images[0].image,
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
            dataPricing: paginate(rows, count)
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

const getEOImagesByEOID = async (req, res, next) => {
    try {
        const eoID = req.params["eoID"]
        if (eoID === "" || eoID == null) {
            return res.status(400).json({ msg: `EO service id can not be empty!` })
        }

        const eoImages = await EOImages.findAll({
            where: {
                eoServiceId: eoID,
            }
        })

        if (eoImages.length === 0) {
            return res.status(404).json({ msg: `EO Images with EO Service ID [${eoID}] not found` })
        }

        return res.status(200).json({ data: eoImages });
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const editEO = async (req, res, next) => {
    const {
        eo_name,
        eo_description,
        eo_spesification,
        eo_images_base64,
        package_id,
    } = req.body

    let {
        // eo_images_name,
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

    try {
        const eoID = req.params["eoID"]
        if (eoID === "" || eoID == null) return res.status(400).json({ msg: `EO service id can not be empty!` })

        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403)
            return decoded
        })

        const eoService = await EOServices.findOne({
            where: {
                id: eoID
            },
        })

        if (!eoService) return res.status(404).json({ msg: `No Data Found with id [${eoID}]` })

        await EOServices.update({
            name: eo_name,
            description: eo_description,
            spesification: eo_spesification,
        }, {
            where: {
                id: eoID,
            },
        })

        // images
        if (typeof eo_images_base64 !== "undefined") {
            const { count, rows } = getAndCountImageFromDb(category, eoID)

            if (typeof eo_images_base64 === "object") {
                deleteImageFromDb(category, eoID)

                for (let i = 0; i < count; i++) {
                    deleteImageFromDirectory(rows[i].image)
                }

                for (let i = 0; i < eo_images_base64.length; i++) {
                    const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                    storeImageToDb(imagePath, category, eoID)

                    try {
                        let parts = eo_images_base64[i].split(';')
                        let imageData = parts[1].split(',')[1]

                        const img = new Buffer.from(imageData, 'base64')

                        await sharp(img)
                            .resize(280, 175)
                            .toFormat("jpeg", { mozjpeg: true })
                            .jpeg({ quality: 100 })
                            .toFile(`./assets/images/eo/${imageName}`)
                    } catch (error) {
                        return res.status(500).json({ msg: error.message })
                    }
                }
            } else if (typeof eo_images_base64 === "string") {
                deleteImageFromDb(category, eoID)

                for (let i = 0; i < count; i++) {
                    deleteImageFromDirectory(rows[i].image)
                }

                const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                storeImageToDb(imagePath, category, eoID)

                try {
                    let parts = eo_images_base64.split(';')
                    let imageData = parts[1].split(',')[1]

                    const img = new Buffer.from(imageData, 'base64')

                    await sharp(img)
                        .resize(280, 175)
                        .toFormat("jpeg", { mozjpeg: true })
                        .jpeg({ quality: 100 })
                        .toFile(`./assets/images/eo/${imageName}`)
                } catch (error) {
                    return res.status(500).json({ msg: error.message })
                }
            }
        }

        // package pricings
        if (typeof package_name !== "undefined") {
            const { count, rows } = await PackagePricings.findAndCountAll({
                where: {
                    eoServiceId: eoID,
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
                                if (err) return res.status(500).json({ msg: err })
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

                    let pdfFile = null

                    if (req.files != null) {
                        if (req.files.package_portofolio != null) {
                            pdfFile = req.files["package_portofolio"][i]

                            if (Array.isArray(req.files.package_portofolio)) {
                                if (typeof pdfFile !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)
                                    storePDFToDirectory(pdfFile, filePath, res)

                                    portofolio[i] = `/assets/portofolio/eo/${fileName}`
                                } else {
                                    portofolio[i] = null
                                }
                            } else {
                                if (typeof pdfFile !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)
                                    storePDFToDirectory(pdfFile, filePath, res)

                                    portofolio[0] = `/assets/portofolio/eo/${fileName}`
                                } else if (typeof req.files.package_portofolio !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio, category)
                                    storePDFToDirectory(req.files.package_portofolio, filePath, res)

                                    portofolio[0] = `/assets/portofolio/eo/${fileName}`
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
                            service_type: "EO",
                            eoServiceId: eoID,
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
                            service_type: "EO",
                            eoServiceId: eoID,
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
                                if (err) return res.status(500).json({ msg: err })
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

                            portofolio[0] = `/assets/portofolio/eo/${fileName}`
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
                        service_type: "EO",
                        eoServiceId: eoID,
                        duration: package_quantity,
                        start_date: package_start_date,
                        end_date: package_end_date,
                        portofolio: portofolio[0],
                    })
                } else if (packageCount === 1) {
                    await PackagePricings.update({
                        name: package_name,
                        description: package_description,
                        price_type: package_price_type,
                        price: JSON.stringify(price),
                        disc_percentage: package_disc_percentage,
                        disc_price: package_disc_price,
                        total_price: package_total_price,
                        service_type: "EO",
                        eoServiceId: eoID,
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

        const updatedEO = await EOServices.findOne({
            where: {
                id: eoID,
            },
            include: [{
                model: EOImages,
            }, {
                model: PackagePricings,
            }]
        })

        return res.status(201).json(updatedEO)
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

module.exports = { createEO, getEOWithoutLogin, getEOWithLogin, getEODetail, updateActivatedEOServiceById, getEOTransaction, eoStatistic, getEOByID, getPackagePricingsByEOID, getEOImagesByEOID, editEO, getListEO }