const jwt = require("jsonwebtoken");
const sharp = require("sharp");
const PackagePricings = require("../models/PackagePricingsModel");
const TalentServices = require("../models/TalentServicesModel");
const TalentImages = require("../models/TalentImagesModel");
const Users = require("../models/UsersModel");
const Companies = require("../models/CompaniesModel");
const Roles = require("../models/RolesModel");
const buildPaginator = require('pagination-apis');
const Transactions = require("../models/TransactionsModel");
const { Op } = require("sequelize");
const mime = require('mime-types');
const fs = require('fs');
const { getAndCountImageFromDb, deleteImageFromDb, deleteImageFromDirectory, generateBase64ImageNameAndPath, storeImageToDb, convertBase64ToJPEG } = require("../controllers/ImageController");
const { storePDFToDirectory, generatePDFNameAndPath } = require("../controllers/PDFController");

const category = "Talent"

const createTalent = async (req, res, next) => {
    const {
        talent_name,
        deskripsiLayanan,
        spesifikasiLayanan,
        talent_email,
        talent_phone,
        talent_birthdate,
        talent_address,
        talent_skill,
        talent_skill_description,
        talent_certification,
        talent_portofolio,
        talent_instagram,
        talent_twitter,
        talent_linkedin,
        talent_facebook,
        talent_tiktok,
        talent_youtube,
        package_name,
        package_description,
        package_price_type,
        package_price,
        package_duration,
        package_disc_percentage,
        package_disc_price,
        package_total_price,
        package_start_date,
        package_end_date,
        images
    } = req.body
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        let phones = []
        if (talent_phone) {
            let phone = talent_phone.trim()
            phone = phone.replace(" ", "")
            phone = phone.replace("-", "")
            phone = phone.replace("(", "")
            phone = phone.replace(")", "")
            phone = phone.replace(".", "")
            phone = phone.replace("+", "")

            if (phone.search(0) == 0) {
                phone = phone.replace('0', 62)
                phones.push(phone)
            }

        }

        const talent = await TalentServices.create({
            name: talent_name,
            deskripsiLayanan,
            spesifikasiLayanan,
            email: talent_email,
            phone: phones[0],
            birthdate: talent_birthdate,
            address: talent_address,
            skill: talent_skill,
            skill_description: talent_skill_description,
            certification: talent_certification,
            portofolio: talent_portofolio,
            instagram: talent_instagram,
            twitter: talent_twitter,
            linkedin: talent_linkedin,
            facebook: talent_facebook,
            tiktok: talent_tiktok,
            youtube: talent_youtube,
            userId: tokenDecode.userId,
        })

        // images
        if (typeof images !== "undefined") {
            if (typeof images === "object") {
                for (let i = 0; i < images.length; i++) {
                    const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                    await TalentImages.create({
                        image: imagePath,
                        talentServiceId: talent.id,
                    })

                    try {
                        let parts = images[i].split(';')
                        let imageData = parts[1].split(',')[1]

                        const img = new Buffer.from(imageData, 'base64')

                        await sharp(img)
                            .resize(280, 175)
                            .toFormat("jpeg", { mozjpeg: true })
                            .jpeg({ quality: 100 })
                            .toFile(`./assets/images/talent/${imageName}`)
                    } catch (error) {
                        return res.status(500).json({ msg: `Can't convert base64 to jpeg of ${category}'s image and save it into directory. ${err.message}` })
                    }
                }
            } else if (typeof images === "string") {
                const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                storeImageToDb(imagePath, category, talent.id)

                try {
                    let parts = images.split(';')
                    let imageData = parts[1].split(',')[1]

                    const img = new Buffer.from(imageData, 'base64')

                    await sharp(img)
                        .resize(280, 175)
                        .toFormat("jpeg", { mozjpeg: true })
                        .jpeg({ quality: 100 })
                        .toFile(`./assets/images/talent/${imageName}`)
                } catch (error) {
                    return res.status(500).json({ msg: `Can't convert base64 to jpeg of ${category}'s image and save it into directory. ${err.message}` })
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

                            portofolioData[i] = `/assets/portofolio/talent/${fileName}`
                        } else {
                            portofolioData[i] = null
                        }
                    } else {
                        if (typeof req.files.package_portofolio !== 'undefined') {
                            const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio, category)
                            storePDFToDirectory(req.files.package_portofolio, filePath, res)

                            portofolioData[0] = `/assets/portofolio/talent/${fileName}`
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
                    start_date: package_start_date[i],
                    end_date: package_end_date[i],
                    service_type: 'TALENT',
                    portofolio: portofolioData[i],
                    talentServiceId: talent.id
                }
                packages.push(package)
            }
        } else {
            let portofolioData = null
            if (req.files) {
                if (typeof req.files.package_portofolio !== 'undefined') {
                    const { fileName, filePath } = generatePDFNameAndPath(req.files.package_portofolio, category)
                    storePDFToDirectory(req.files.package_portofolio, filePath, res)

                    portofolioData = `/assets/portofolio/talent/${fileName}`
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
                start_date: package_start_date,
                end_date: package_end_date,
                service_type: 'TALENT',
                portofolio: portofolioData,
                talentServiceId: talent.id
            }
            packages.push(package)
        }

        PackagePricings.bulkCreate(packages)
            .then(async () => {
                const newTalent = await TalentServices.findOne({
                    where: {
                        id: talent.id
                    },
                    include: [{
                        model: TalentImages,
                    }, {
                        model: PackagePricings,
                    }]
                })
                res.status(201).json(newTalent);
            })
            .catch((error) => {
                res.status(500).json(error.message,);
            });
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getTalentWithoutLogin = async (req, res, next) => {
    const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })
    try {
        const rows = []
        const count = await TalentServices.count()
        await TalentServices.findAndCountAll({
            where: {
                active: true
            },
            limit,
            offset: skip,
            include: [{
                model: TalentImages,
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
                        "talent_name": data.name,
                        "talent_deskripsi": data.deskripsiLayanan,
                        "talent_spesifikasi": data.spesifikasiLayanan,
                        "talent_image": data.talent_images[0].image,
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

const getTalentWithLogin = async (req, res, next) => {
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
                const count = await TalentServices.count()
                await TalentServices.findAndCountAll({
                    where: {
                        active: true
                    },
                    limit,
                    offset: skip,
                    include: [{
                        model: TalentImages,
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
                            if(data.talent_images.length > 0){
                                rows.push({
                                    "id": data.id,
                                    "talent_name": data.name,
                                    "talent_deskripsi": data.deskripsiLayanan,
                                    "talent_spesifikasi": data.spesifikasiLayanan,
                                    "talent_image": data.talent_images[0].image,
                                    "status_active": data.active,
                                    "company": data.user.company.name,
                                    "package": data.package_pricings,
                                })
                            }else{
                                rows.push({
                                    "id": data.id,
                                    "talent_name": data.name,
                                    "talent_deskripsi": data.deskripsiLayanan,
                                    "talent_spesifikasi": data.spesifikasiLayanan,
                                    "talent_image": null,
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
                const count = await TalentServices.count({
                    include: {
                        model: Users,
                        where: {
                            companyId: user.companyId
                        }
                    }
                })
                await TalentServices.findAndCountAll({
                    limit,
                    offset: skip,
                    include: [{
                        model: TalentImages,
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
                            if(data.talent_images.length > 0){
                                rows.push({
                                    "id": data.id,
                                    "talent_name": data.name,
                                    "talent_deskripsi": data.deskripsiLayanan,
                                    "talent_spesifikasi": data.spesifikasiLayanan,
                                    "talent_image": data.talent_images[0].image,
                                    "status_active": data.active,
                                    "company": data.user.company.name,
                                    "package": data.package_pricings,
                                })
                            }else{
                                rows.push({
                                    "id": data.id,
                                    "talent_name": data.name,
                                    "talent_deskripsi": data.deskripsiLayanan,
                                    "talent_spesifikasi": data.spesifikasiLayanan,
                                    "talent_image": null,
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

        if (user.role.name === 'Talent') {
            try {
                const rows = []
                const count = await TalentServices.count({
                    include: {
                        model: Users,
                        where: {
                            companyId: user.companyId
                        }
                    }
                })
                await TalentServices.findAndCountAll({
                    limit,
                    offset: skip,
                    include: [{
                        model: TalentImages,
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
                            if(data.talent_images.length > 0){
                                rows.push({
                                    "id": data.id,
                                    "talent_name": data.name,
                                    "talent_deskripsi": data.deskripsiLayanan,
                                    "talent_spesifikasi": data.spesifikasiLayanan,
                                    "talent_image": data.talent_images[0].image,
                                    "status_active": data.active,
                                    "company": data.user.company.name,
                                    "package": data.package_pricings,
                                })
                            }else{
                                rows.push({
                                    "id": data.id,
                                    "talent_name": data.name,
                                    "talent_deskripsi": data.deskripsiLayanan,
                                    "talent_spesifikasi": data.spesifikasiLayanan,
                                    "talent_image": null,
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

const updateActivatedTalentServiceById = async (req, res, next) => {
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

        if (user.role.name === 'Venue' || user.role.name === 'Supplier' || user.role.name === 'Stakeholder' || user.role.name === 'Event Hunter' || user.role.name === 'Event Organizer') {
            return res.status(405).json({ msg: `You're Not Allowed` })
        }

        const talent = await TalentServices.findOne({
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

        if (user.company.id !== talent.user.company.id) {
            return res.status(404).json({ msg: `Talent Service Not Found` })
        }

        const value = talent.active

        await TalentServices.update({
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

const getTalentDetail = async (req, res, next) => {
    try {
        const talent = await TalentServices.findOne({
            where: {
                id: req.query.id,
            },
            include: [{
                model: TalentImages,
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

        if (!talent) {
            return res.status(404).json({ msg: `Talent Not Found` })
        }

        for (let i = 0; i < talent.package_pricings.length; i++) {
            let startDate = new Date(talent.dataValues.package_pricings[i].dataValues.start_date)
            let endDate = new Date(talent.dataValues.package_pricings[i].dataValues.end_date)
            let availableDate = []

            for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
                availableDate.push(new Date(date))
            }

            talent.dataValues.package_pricings[i].dataValues.availableDate = availableDate
        }

        let base64String
        let promises = []

        for (let i = 0; i < talent.dataValues.talent_images.length; i++) {
            const filePath = `.${talent.dataValues.talent_images[i].dataValues.image}`

            let promise = new Promise((resolve, reject) => {
                fs.readFile(filePath, (err, data) => {
                    if (err) {
                        console.error('Error:', err)
                        reject(err)
                    }

                    base64String = data.toString('base64')
                    talent.dataValues.talent_images[i].dataValues.imageBase64 = `data:image/jpeg;base64,${base64String}`

                    resolve()
                })
            })

            promises.push(promise)
        }

        Promise.all(promises).then(() => {
            return res.status(200).json({ data: talent })
        })
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const talentStatistic = async (req, res, next) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({ where: { id: tokenDecode.userId } })

        const all_talent = await TalentServices.count({
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })

        const active_talent = await TalentServices.count({
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

        await TalentServices.findAll({
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
            'total_talent': all_talent,
            'total_talent_aktif': active_talent,
            'total_klien': all_transaction,
            'total_klien_aktif': active_transaction
        }

        return res.status(200).json({ data })
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

const getListTalent = async (req, res, next) => {
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
        const count = await TalentServices.count({
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })
        await TalentServices.findAndCountAll({
            limit,
            offset: skip,
            include: [{
                model: TalentImages,
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
                        "talent_name": data.name,
                        "talent_image": data.talent_images[0].image,
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

const editTalent = async (req, res, next) => {
    let {
        talent_name,
        talent_email,
        talent_phone,
        talent_birthdate,
        talent_address,
        talent_skill,
        talent_skill_description,
        talent_certification,
        talent_portofolio,
        talent_instagram,
        talent_twitter,
        talent_linkedin,
        talent_facebook,
        talent_tiktok,
        talent_youtube,
        deskripsiLayanan,
        spesifikasiLayanan,
        talent_images_base64,
        package_id,
        package_name,
        package_description,
        package_price_type,
        package_price,
        package_quantity,
        package_disc_percentage,
        package_disc_price,
        package_total_price,
        package_start_date,
        package_end_date,
    } = req.body

    try {
        const talentID = req.params["talentID"]
        if (talentID === "" || talentID == null) return res.status(400).json({ msg: `Talent service id can not be empty!` })

        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403)
            return decoded
        })

        let phones = []
        if (talent_phone) {
            let phone = talent_phone.trim()
            phone = phone.replace(" ", "")
            phone = phone.replace("-", "")
            phone = phone.replace("(", "")
            phone = phone.replace(")", "")
            phone = phone.replace(".", "")
            phone = phone.replace("+", "")

            if (phone.search(0) == 0) {
                phone = phone.replace('0', 62)
                phones.push(phone)
            }
        }

        const talentService = await TalentServices.findOne({
            where: {
                id: talentID
            },
        })

        if (!talentService) return res.status(404).json({ msg: `No Data Found with id [${talentID}]` })

        await TalentServices.update({
            name: talent_name,
            email: talent_email,
            phone: phones[0],
            birthdate: talent_birthdate,
            address: talent_address,
            skill: talent_skill,
            skill_description: talent_skill_description,
            certification: talent_certification,
            portofolio: talent_portofolio,
            instagram: talent_instagram,
            twitter: talent_twitter,
            linkedin: talent_linkedin,
            facebook: talent_facebook,
            tiktok: talent_tiktok,
            youtube: talent_youtube,
            userId: tokenDecode.userId,
            spesifikasiLayanan,
            deskripsiLayanan,
        }, {
            where: {
                id: talentID,
            },
        })

        // images
        if (typeof talent_images_base64 !== "undefined") {
            const { count, rows } = getAndCountImageFromDb(category, talentID)

            if (typeof talent_images_base64 === "object") {
                deleteImageFromDb(category, talentID)

                for (let i = 0; i < count; i++) {
                    deleteImageFromDirectory(rows[i].image)
                }

                for (let i = 0; i < talent_images_base64.length; i++) {
                    const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                    storeImageToDb(imagePath, category, talentID)

                    try {
                        let parts = talent_images_base64[i].split(';')
                        let imageData = parts[1].split(',')[1]

                        const img = new Buffer.from(imageData, 'base64')

                        await sharp(img)
                            .resize(280, 175)
                            .toFormat("jpeg", { mozjpeg: true })
                            .jpeg({ quality: 100 })
                            .toFile(`./assets/images/talent/${imageName}`)
                    } catch (error) {
                        return res.status(500).json({ msg: error.message })
                    }
                }
            } else if (typeof talent_images_base64 === "string") {
                deleteImageFromDb(category, talentID)

                for (let i = 0; i < count; i++) {
                    deleteImageFromDirectory(rows[i].image)
                }

                const { imageName, imagePath } = generateBase64ImageNameAndPath(category)

                storeImageToDb(imagePath, category, talentID)

                try {
                    let parts = talent_images_base64.split(';')
                    let imageData = parts[1].split(',')[1]

                    const img = new Buffer.from(imageData, 'base64')

                    await sharp(img)
                        .resize(280, 175)
                        .toFormat("jpeg", { mozjpeg: true })
                        .jpeg({ quality: 100 })
                        .toFile(`./assets/images/talent/${imageName}`)
                } catch (error) {
                    return res.status(500).json({ msg: error.message })
                }
            }
        }

        // package pricings
        if (typeof package_name !== "undefined") {
            const { count, rows } = await PackagePricings.findAndCountAll({
                where: {
                    talentServiceId: talentID,
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

                                    portofolio[i] = `/assets/portofolio/talent/${fileName}`
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

                                    portofolio[0] = `/assets/portofolio/talent/${fileName}`
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
                            service_type: "TALENT",
                            talentServiceId: talentID,
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
                            service_type: "TALENT",
                            talentServiceId: talentID,
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
                            const { fileName, filePath } = generatePDFNameAndPath(pdfFile, category)
                            const pdfFile = req.files.package_portofolio

                            storePDFToDirectory(pdfFile, filePath, res)

                            portofolio[0] = `/assets/portofolio/talent/${fileName}`
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
                        service_type: "TALENT",
                        talentServiceId: talentID,
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
                        service_type: "TALENT",
                        talentServiceId: talentID,
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

        const updatedEO = await TalentServices.findOne({
            where: {
                id: talentID,
            },
            include: [{
                model: TalentImages,
            }, {
                model: PackagePricings,
            }]
        })

        return res.status(201).json(updatedEO)
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}


module.exports = { createTalent, getTalentWithoutLogin, getTalentWithLogin, updateActivatedTalentServiceById, getTalentDetail, talentStatistic, getListTalent, editTalent }