const jwt = require("jsonwebtoken");
const sharp = require("sharp");
const PackagePricings = require("../models/PackagePricingsModel");
const ProductSupplies = require("../models/ProductSuppliesModel");
const ProductImages = require("../models/ProductImagesModel");
const Users = require("../models/UsersModel");
const Companies = require("../models/CompaniesModel");
const buildPaginator = require('pagination-apis');
const Roles = require("../models/RolesModel");
const Transactions = require("../models/TransactionsModel");
const { Op } = require("sequelize");
const mime = require('mime-types');
const fs = require('fs');
const { generatePDFNameAndPath, storePDFToDirectory } = require("./PDFController");
const { getAndCountImageFromDb, deleteImageFromDb, deleteImageFromDirectory, storeImageToDb, convertBase64ToJPEG, generateBase64ImageNameAndPath } = require("../controllers/ImageController");

const category = "Product"

const createProduct = async (req, res, next) => {
    const {
        product_tool_type,
        product_brand,
        product_model,
        product_condition,
        product_note,
        product_namaLayanan,
        product_deskripsiLayanan,
        product_spesifikasiLayanan,
        images,
        package_name,
        package_start_date,
        package_end_date,
        package_description,
        package_price_type,
        package_price,
        package_duration,
        package_disc_percentage,
        package_disc_price,
        package_total_price
    } = req.body

    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const product = await ProductSupplies.create({
            tool_type: product_tool_type,
            brand: product_brand,
            model: product_model,
            condition: product_condition,
            note: product_note,
            userId: tokenDecode.userId,
            namaLayanan: product_namaLayanan,
            deskripsiLayanan: product_deskripsiLayanan,
            spesifikasiLayanan: product_spesifikasiLayanan
        })

        // const productImages = []

        // if (Array.isArray(images)) {
        //     for (let i = 0; i < images.length; i++) {
        //         try {
        //             let parts = images[i].split(';');
        //             let imageData = parts[1].split(',')[1];

        //             const img = new Buffer.from(imageData, 'base64')

        //             const imageName = `konect-image-${Date.now()}.jpeg`

        //             await sharp(img)
        //                 .resize(280, 175)
        //                 .toFormat("jpeg", { mozjpeg: true })
        //                 .jpeg({ quality: 100 })
        //                 .toFile(`./assets/images/product/${imageName}`);

        //             let productImage = {
        //                 productSupplyId: product.id,
        //                 image: `/assets/images/product/${imageName}`
        //             }
        //             productImages.push(productImage);
        //         } catch (error) {
        //             res.status(500).json({ msg: error.message })
        //         }
        //     }
        // } else {
        //     let parts = images.split(';');
        //     let imageData = parts[1].split(',')[1];

        //     const img = new Buffer.from(imageData, 'base64')

        //     const imageName = `konect-image-${Date.now()}.jpeg`

        //     await sharp(img)
        //         .resize(280, 174)
        //         .toFormat("jpeg", { mozjpeg: true })
        //         .jpeg({ quality: 100 })
        //         .toFile(`./assets/images/product/${imageName}`);

        //     let productImage = {
        //         productSupplyId: product.id,
        //         image: `/assets/images/product/${imageName}`
        //     }
        //     productImages.push(productImage);
        // }

        // images
        if (typeof images !== "undefined") {
            if (typeof images === "object") {
                for (let i = 0; i < images.length; i++) {
                    const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                    await ProductImages.create({
                        image: imagePath,
                        productSupplyId : product.id,
                    })

                    try {
                        let parts = images[i].split(';')
                        let imageData = parts[1].split(',')[1]

                        const img = new Buffer.from(imageData, 'base64')

                        await sharp(img)
                            .resize(280, 175)
                            .toFormat("jpeg", { mozjpeg: true })
                            .jpeg({ quality: 100 })
                            .toFile(`./assets/images/product/${imageName}`)
                    } catch (error) {
                        return res.status(500).json({ msg: `Can't convert base64 to jpeg of ${category}'s image and save it into directory. ${err.message}` })
                    }
                }
            } else if (typeof images === "string") {
                const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                storeImageToDb(imagePath, category, product.id)

                try {
                    let parts = images.split(';')
                    let imageData = parts[1].split(',')[1]

                    const img = new Buffer.from(imageData, 'base64')

                    await sharp(img)
                        .resize(280, 175)
                        .toFormat("jpeg", { mozjpeg: true })
                        .jpeg({ quality: 100 })
                        .toFile(`./assets/images/product/${imageName}`)
                } catch (error) {
                    return res.status(500).json({ msg: `Error when storing image to directory. ${err.message}` })
                }
            }
        }

        const packages = []

        if (Array.isArray(package_name)) {
            const portofolioData = []
            for (let i = 0; i < (package_name).length; i++) {
                if (req.files) {
                    if (Array.isArray(req.files.package_portofolio)) {
                        if (typeof req.files.package_portofolio[i] !== 'undefined') {
                            const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio[i], category)
                            storePDFToDirectory(req.files.package_portofolio[i], filePath, res)

                            portofolioData[i] = `/assets/portofolio/product/${fileName}`
                        } else {
                            portofolioData[i] = null
                        }
                    } else {
                        if (typeof req.files.package_portofolio !== 'undefined') {
                            const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio, category)
                            storePDFToDirectory(req.files.package_portofolio, filePath, res)

                            portofolioData[0] = `/assets/portofolio/product/${fileName}`
                        } else {
                            portofolioData[i] = null
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

                let package = {
                    name: package_name[i],
                    description: package_description[i],
                    price_type: package_price_type[i],
                    price: JSON.stringify(price[i]),
                    duration: package_duration[i],
                    disc_percentage: typeof package_disc_percentage === 'undefined' ? 0 : package_disc_percentage[i],
                    disc_price: typeof package_disc_price === 'undefined' ? 0 : package_disc_price[i],
                    total_price: typeof package_total_price === 'undefined' ? 0 : package_total_price[i],
                    service_type: 'PRODUCT',
                    start_date: package_start_date[i],
                    end_date: package_end_date[i],
                    portofolio: portofolioData[i],
                    productSupplyId: product.id,
                }
                packages.push(package)
            }
        } else {
            let portofolioData = null
            if (req.files) {
                if (typeof req.files.package_portofolio !== 'undefined') {
                    const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio, category)
                    storePDFToDirectory(req.files.package_portofolio, filePath, res)

                    portofolioData = `/assets/portofolio/product/${fileName}`
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

            let package = {
                name: package_name,
                description: package_description,
                price_type: package_price_type,
                price: JSON.stringify(price),
                duration: package_duration,
                disc_percentage: package_disc_percentage,
                disc_price: package_disc_price,
                total_price: package_total_price,
                service_type: 'PRODUCT',
                start_date: package_start_date,
                end_date: package_end_date,
                portofolio: portofolioData,
                productSupplyId: product.id
            }
            packages.push(package)
        }

        // ProductImages.bulkCreate(productImages)

        PackagePricings.bulkCreate(packages)
            .then(async () => {
                const newProduct = await ProductSupplies.findOne({
                    where: {
                        id: product.id
                    },
                    include: [{
                        model: ProductImages,
                    }, {
                        model: PackagePricings,
                    }]
                })
                res.status(201).json(newProduct);
            })
            .catch((error) => {
                res.status(500).json(error.message,);
            });
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getProductWithoutLogin = async (req, res, next) => {
    const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })
    try {
        const rows = []
        const count = await ProductSupplies.count()
        await ProductSupplies.findAndCountAll({
            where: {
                active: true
            },
            limit,
            offset: skip,
            include: [{
                model: ProductImages,
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
                        "product_name": data.namaLayanan,
                        "product_deskripsi": data.deskripsiLayanan,
                        "product_spesifikasi": data.spesifikasiLayanan,
                        "product_image": typeof data.product_images[0].image == 'undefined' || data.product_images[0].image == null ? null : data.product_images[0].image,
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

const getProductWithLogin = async (req, res, next) => {
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
                const count = await ProductSupplies.count()
                await ProductSupplies.findAndCountAll({
                    where: {
                        active: true
                    },
                    limit,
                    offset: skip,
                    include: [{
                        model: ProductImages,
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
                                "product_name": data.namaLayanan,
                                "product_deskripsi": data.deskripsiLayanan,
                                "product_spesifikasi": data.spesifikasiLayanan,
                                "product_image": typeof data.product_images[0].image === 'undefined' ? null : data.product_images[0].image,
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
                const count = await ProductSupplies.count({
                    include: {
                        model: Users,
                        where: {
                            companyId: user.companyId
                        }
                    }
                })
                await ProductSupplies.findAndCountAll({
                    limit,
                    offset: skip,
                    include: [{
                        model: ProductImages,
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
                                "product_name": data.namaLayanan,
                                "product_deskripsi": data.deskripsiLayanan,
                                "product_spesifikasi": data.spesifikasiLayanan,
                                "product_image": typeof data.product_images[0] === 'undefined' ? null : data.product_images[0].image,
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

        if (user.role.name === 'Supplier') {
            try {
                const rows = []
                const count = await ProductSupplies.count({
                    include: {
                        model: Users,
                        where: {
                            companyId: user.companyId
                        }
                    }
                })
                await ProductSupplies.findAndCountAll({
                    limit,
                    offset: skip,
                    include: [{
                        model: ProductImages,
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
                                "product_name": data.namaLayanan,
                                "product_deskripsi": data.deskripsiLayanan,
                                "product_spesifikasi": data.spesifikasiLayanan,
                                "product_image": typeof data.product_images[0] === 'undefined' ? null : data.product_images[0].image,
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

const getProductDetail = async (req, res, next) => {
    try {
        const product = await ProductSupplies.findOne({
            where: {
                id: req.query.id,
            },
            include: [{
                model: ProductImages,
            }, {
                model: PackagePricings,
            }, {
                model: Users,
                attributes: { exclude: ['password'] },
                include: {
                    model: Companies
                }
            }],
            order: [
                [{ model: PackagePricings }, 'total_price', 'ASC']
            ]
        })

        if (!product) {
            return res.status(404).json({ msg: `Product Supply Not Found` })
        }

        for (let i = 0; i < product.package_pricings.length; i++) {
            let startDate = new Date(product.dataValues.package_pricings[i].dataValues.start_date)
            let endDate = new Date(product.dataValues.package_pricings[i].dataValues.end_date)
            let availableDate = []

            for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
                availableDate.push(new Date(date))
            }

            product.dataValues.package_pricings[i].dataValues.availableDate = availableDate
        }

        let base64String
        let promises = []

        for (let i = 0; i < product.dataValues.product_images.length; i++) {
            const filePath = `.${product.dataValues.product_images[i].dataValues.image}`

            let promise = new Promise((resolve, reject) => {
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        console.error('Error:', err)
                        reject(err)
                    }

                    base64String = data.toString('base64')
                    product.dataValues.product_images[i].dataValues.imageBase64 = `data:image/jpeg;base64,${base64String}`

                    resolve()
                })
            })

            promises.push(promise)
        }

        Promise.all(promises).then(() => {
            return res.status(200).json({ data: product });
        })
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const updateActivatedProductSupplyById = async (req, res, next) => {
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

        if (user.role.name === 'Talent' || user.role.name === 'Venue' || user.role.name === 'Stakeholder' || user.role.name === 'Event Hunter' || user.role.name === 'Event Organizer') {
            return res.status(405).json({ msg: `You're Not Allowed` })
        }

        const product = await ProductSupplies.findOne({
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

        if (user.company.id !== product.user.company.id) {
            return res.status(404).json({ msg: `Product Supply Not Found` })
        }

        const value = product.active

        await ProductSupplies.update({
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

const productStatistic = async (req, res, next) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({ where: { id: tokenDecode.userId } })

        const all_product = await ProductSupplies.count({
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })

        const active_product = await ProductSupplies.count({
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

        await ProductSupplies.findAll({
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
            'total_product': all_product,
            'total_product_aktif': active_product,
            'total_klien': all_transaction,
            'total_klien_aktif': active_transaction
        }

        return res.status(200).json({ data })
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const editProductSupply = async (req, res, next) => {
    const {
        product_name,
        product_description,
        product_spesification,
        // product_image_name,
        images,
        package_id,
        package_name,
        package_start_date,
        package_end_date,
        package_description,
        package_price_type,
        package_price,
        package_duration,
        package_disc_percentage,
        package_disc_price,
        package_total_price
    } = req.body

    try {
        const productID = req.params["productID"]
        if (productID === "" || productID == null) return res.status(400).json({ msg: `Product Supply id can not be empty!` })

        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403)
            return decoded
        })

        const product = await ProductSupplies.findOne({
            where: {
                id: productID
            },
        })

        if (!product) return res.status(404).json({ msg: `Product Not Found With Id [${productID}]` })

        await ProductSupplies.update({
            namaLayanan: product_name,
            deskripsiLayanan: product_description,
            spesifikasiLayanan: product_spesification,
        }, {
            where: {
                id: productID,
            },
        })

        // images
        if (typeof images !== "undefined") {
            const { count, rows } = getAndCountImageFromDb(category, productID)

            if (typeof images === "object") {
                deleteImageFromDb(category, productID)

                for (let i = 0; i < count; i++) {
                    deleteImageFromDirectory(rows[i].image)
                }

                for (let i = 0; i < images.length; i++) {
                    const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                    storeImageToDb(imagePath, category, productID)

                    try {
                        let parts = images[i].split(';')
                        let imageData = parts[1].split(',')[1]

                        const img = new Buffer.from(imageData, 'base64')

                        await sharp(img)
                            .resize(280, 175)
                            .toFormat("jpeg", { mozjpeg: true })
                            .jpeg({ quality: 100 })
                            .toFile(`./assets/images/product/${imageName}`)
                    } catch (error) {
                        return res.status(500).json({ msg: error.message })
                    }
                }
            } else if (typeof images === "string") {
                deleteImageFromDb(category, productID)

                for (let i = 0; i < count; i++) {
                    deleteImageFromDirectory(rows[i].image)
                }

                const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                storeImageToDb(imagePath, category, productID)

                try {
                    let parts = images.split(';')
                    let imageData = parts[1].split(',')[1]

                    const img = new Buffer.from(imageData, 'base64')

                    await sharp(img)
                        .resize(280, 175)
                        .toFormat("jpeg", { mozjpeg: true })
                        .jpeg({ quality: 100 })
                        .toFile(`./assets/images/product/${imageName}`)
                } catch (error) {
                    return res.status(500).json({ msg: error.message })
                }
            }
        }

        // package pricings
        if (typeof package_name !== "undefined") {
            const productPackage = await PackagePricings.findAll({
                where: {
                    productSupplyId: productID,
                },
            })

            portofolioData = []

            if (typeof package_name === "object") {
                let packageBefore = []
                let portofolioBefore = []

                for (let i = 0; i < productPackage.length; i++) {
                    packageBefore.push(productPackage[i].id)
                    portofolioBefore.push(productPackage[i].portofolio)
                }

                const deletedPackage = packageBefore.filter((value) => !package_id.includes(value))

                if (deletedPackage.length > 0) {
                    await PackagePricings.destroy({
                        where: {
                            id: deletedPackage,
                        }
                    })

                    for (let i = 0; i < productPackage.length; i++) {
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
                        // if (Array.isArray(req.files.package_portofolio)) {
                        //     if (typeof req.files.package_portofolio[i] !== 'undefined') {
                        //         const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio[i], category)
                        //         storePDFToDirectory(req.files.package_portofolio[i], filePath, res)

                        //         portofolioData[i] = `/assets/portofolio/product/${fileName}`
                        //     } else {
                        //         portofolioData[i] = null
                        //     }
                        // } else {
                        //     if (typeof req.files.package_portofolio !== 'undefined') {
                        //         const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio, category)
                        //         storePDFToDirectory(req.files.package_portofolio, filePath, res)

                        //         portofolioData[0] = `/assets/portofolio/product/${fileName}`
                        //     } else {
                        //         portofolioData[i] = null
                        //     }
                        // }

                        if (req.files.package_portofolio != null) {
                            pdfFile = req.files["package_portofolio"][i]

                            if (Array.isArray(req.files.package_portofolio)) {
                                if (typeof pdfFile !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)
                                    storePDFToDirectory(pdfFile, filePath, res)

                                    portofolioData[i] = `/assets/portofolio/product/${fileName}`
                                } else {
                                    portofolioData[i] = null
                                }
                            } else {
                                if (typeof pdfFile !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)
                                    storePDFToDirectory(pdfFile, filePath, res)

                                    portofolioData[0] = `/assets/portofolio/product/${fileName}`
                                } else if (typeof req.files.package_portofolio !== 'undefined') {
                                    const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio, category)
                                    storePDFToDirectory(req.files.package_portofolio, filePath, res)

                                    portofolioData[0] = `/assets/portofolio/product/${fileName}`
                                } else {
                                    portofolioData[i] = null
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
                            service_type: "PRODUCT",
                            productSupplyId: productID,
                            duration: package_duration[i],
                            start_date: package_start_date[i],
                            end_date: package_end_date[i],
                            portofolio: portofolioData[i],
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
                            service_type: "PRODUCT",
                            productSupplyId: productID,
                            duration: package_duration[i],
                            start_date: package_start_date[i],
                            end_date: package_end_date[i],
                            portofolio: portofolioData[i],
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

                for (let i = 0; i < productPackage.length; i++) {
                    packageBefore.push(productPackage[i].id)
                    portofolioBefore.push(productPackage[i].portofolio)
                }

                const deletedPackage = packageBefore.filter((value) => !package_id.includes(value))

                if (deletedPackage.length > 0) {
                    await PackagePricings.destroy({
                        where: {
                            id: deletedPackage,
                        }
                    })

                    for (let i = 0; i < productPackage.length; i++) {
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
                    // if (typeof req.files.package_portofolio !== 'undefined') {
                    //     const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio, category)
                    //     storePDFToDirectory(req.files.package_portofolio, filePath, res)

                    //     portofolioData[0] = `/assets/portofolio/product/${fileName}`
                    // } else {
                    //     portofolioData[0] = null
                    // }

                    if (req.files.package_portofolio != null) {
                        if (typeof req.files.package_portofolio !== 'undefined') {
                            const pdfFile = req.files.package_portofolio
                            const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)

                            storePDFToDirectory(pdfFile, filePath, res)

                            portofolioData[0] = `/assets/portofolio/product/${fileName}`
                        } else {
                            portofolioData[0] = null
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
                        service_type: "PRODUCT",
                        productSupplyId: productID,
                        duration: package_duration,
                        start_date: package_start_date,
                        end_date: package_end_date,
                        portofolio: portofolioData[0],
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
                        service_type: "PRODUCT",
                        productSupplyId: productID,
                        duration: package_duration,
                        start_date: package_start_date,
                        end_date: package_end_date,
                        portofolio: portofolioData[0],
                    }, {
                        where: {
                            id: package_id,
                        }
                    })
                }
            }
        }

        const updatedProduct = await ProductSupplies.findOne({
            where: {
                id: productID,
            },
            include: [{
                model: ProductImages,
            }, {
                model: PackagePricings,
            }]
        })

        return res.status(201).json(updatedProduct)
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getListSupply = async (req, res, next) => {
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
        const count = await ProductSupplies.count({
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })
        await ProductSupplies.findAndCountAll({
            limit,
            offset: skip,
            include: [{
                model: ProductImages,
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
                        "supply_name": data.name,
                        "supply_image": data.product_images[0].image,
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

module.exports = { createProduct, getProductWithoutLogin, getProductWithLogin, getProductDetail, updateActivatedProductSupplyById, productStatistic, editProductSupply, getListSupply }