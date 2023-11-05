const Transactions = require('../models/TransactionsModel.js');
const PackagePricings = require("../models/PackagePricingsModel");
const EOServices = require("../models/EOServicesModel");
const EOImages = require("../models/EOImagesModel");
const User = require("../models/UsersModel");
const UserDetail = require("../models/UsersDetailModel");
const Users = require('../models/UsersModel');
const VenueServicesModel = require('../models/VenueServicesModel')
const TalentServicesModel = require('../models/TalentServicesModel')
const ProductSuppliesModel = require('../models/ProductSuppliesModel');
const Companies = require('../models/CompaniesModel.js');
const VenueImages = require('../models/VenueImagesModel.js');
const TalentImages = require('../models/TalentImagesModel.js');
const ProductImages = require('../models/ProductImagesModel.js');

const { ImageHandler } = require('./ImageController.js');
const { generatePDFNameAndPath } = require('./PDFController')
const { generateImageNameAndPath } = require('./ImageController')

const jwt = require("jsonwebtoken");
const path = require('path')

const Xendit = require('xendit-node');
const dotenv = require("dotenv");
dotenv.config();
const urlInvoice = process.env.URL_INVOICE 
const secret_api_key = process.env.SECRET_KEY 
const userIdXendit = process.env.USER_ID
const x = new Xendit({ secretKey: secret_api_key});
const { Invoice } = x;
const invoiceSpecificOptions = {};

const { Sequelize } = require('sequelize');
const { Op } = require("sequelize")

const axios = require('axios');
const Roles = require('../models/RolesModel.js');

class TransactionController {
    static async createTransaction(req, res) {
        const { status, service_status, eventBrief, startDate, endDate, billingTo, paymentMethod, packagePricingId } = req.body
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })
        try {
            const packagePricing = await PackagePricings.findOne({
                where: { id: packagePricingId },
                include: [{
                    model: EOServices,
                    include: { model: EOImages }
                }, {
                    model: VenueServicesModel,
                    include: { model: VenueImages }
                }, {
                    model: TalentServicesModel,
                    include: { model: TalentImages }
                }, {
                    model: ProductSuppliesModel,
                    include: { model: ProductImages }
                }],
            })
            if( packagePricing == null){
                return res.status(400).json({message: "Package pricing id NOT FOUND!"})
            }
            const dataUser = await Users.findOne({
                where: { id: tokenDecode.userId },
                include: [{ model: UserDetail }, { model: Roles }]
            })
            function generateInvoice() {
                let invoice = "";
                const characters = "0123456789"; // karakter yang diizinkan dalam nomor invoice
                const length = 5; // panjang nomor invoice yang diinginkan
                for (let i = 0; i < length; i++) {
                    const index = Math.floor(Math.random() * characters.length); // pilih karakter acak dari daftar karakter yang diizinkan
                    invoice += characters.charAt(index); // tambahkan karakter ke nomor invoice
                }
                return invoice;
            }
            const kode = []
            const service = {}
            for (let i = 0; i < 1; i++) {
                if (packagePricing.eo_service != undefined) {
                    kode[i] = { code: `EO${generateInvoice()}` }
                    service.code =  "eo_service",
                    service.namaProduk = packagePricing.name + " "+ packagePricing.eo_service.name
                } else if (packagePricing.venue_service != undefined) {
                    kode[i] = { code: `VE${generateInvoice()}` }
                    service.code =  "venue_service",
                    service.namaProduk = packagePricing.name + " "+ packagePricing.venue_service.name
                } else if (packagePricing.product_supply != undefined) {
                    kode[i] = { code: `PR${generateInvoice()}` }
                    service.code =  "product_supply",
                    service.namaProduk = packagePricing.name + " "+ packagePricing.product_supply.name
                } else if (packagePricing.talent_service != undefined) {
                    kode[i] = { code: `TS${generateInvoice()}` }
                    service.code =  "talent_service",
                    service.namaProduk = packagePricing.name + " "+ packagePricing.talent_service.name
                }
            }

            //total_payment
            let { servicePrice, adminFee, taxFee, qty } = req.body
            servicePrice = parseInt(servicePrice, 10)
            qty = parseInt(qty, 10)
            taxFee = parseInt(taxFee, 10)
            adminFee = parseInt(adminFee, 10)
            const sub_total = parseInt(`${(servicePrice * qty) + adminFee}`)
            taxFee = parseInt(`${sub_total * taxFee / 100}`)
            const totalPayment = `${taxFee + sub_total}`

            Transactions.create({
                status,
                service_status,
                totalPayment,
                eventBrief,
                startDate,
                endDate,
                billingTo,
                servicePrice,
                adminFee,
                taxFee,
                paymentMethod,
                numberInvoice: kode[0].code,
                dateInvoice: new Date(),
                timeInvoice: new Date(),
                qty,
                packagePricingId,
                clientId: tokenDecode.userId,
            })
            .then(async result => {
                const redirect = {}
                if(dataUser.role.name == "Event Hunter"){redirect.endpoint = "dashboard-eh"}
                if(dataUser.role.name == "Stakeholder"){redirect.endpoint = "riwayat-layanan-sh"}
                const data = {
                    external_id: result.id,
                    payer_email: dataUser.email,
                    description: packagePricing.description,
                    nameProduk : service.namaProduk,
                    amount: result.totalPayment, //`${+totalPayment + +adminFee + +taxFee}`,
                    'customer' : {
                        'given_names': `${dataUser.fullname}`,
                        'surname': `${dataUser.username}`,
                        'email': `${dataUser.email}`,
                    },
                    'customer_notification_preference': {
                        'invoice_created': [
                            // 'whatsapp',
                            // 'sms',
                            'email'
                        ],
                        'invoice_reminder': [
                            'email'
                        ],
                        'invoice_paid': [
                            'whatsapp',
                            'email'
                        ],
                        'invoice_expired': [
                            'email'
                        ]
                    },
                    'success_redirect_url': `${process.env.URL_REDIRECT_SUCCESS}/${redirect.endpoint}`,
                    'failure_redirect_url': `${process.env.URL_REDIRECT_FAILED}/${redirect.endpoint}`,
                    'currency': 'IDR',
                    'items': [
                        {
                            'name': service.namaProduk,
                            'quantity': qty,
                            'price': servicePrice,
                            'category': `${packagePricing.service_type}`,
                            'url': `${process.env.URL_PRODUCT}/${packagePricing.type}/${packagePricing.id}`
                        }
                    ],
                    'fees': [
                        {
                            'type': 'ADMIN',
                            'value': adminFee
                        },
                        {
                            'type': 'TAX',
                            'value': taxFee
                        }
                    ]
                }
                if(dataUser.phone != undefined){
                    data['mobile_number'] = `${dataUser.phone}`
                }
                if(dataUser.users_detail != undefined){
                    data['addresses'] = [
                        {
                            'city': `${dataUser.users_detail.city}`,
                            'country': 'Indonesia',
                            'postal_code': `${dataUser.users_detail.postal_code}`,
                            'state': `${dataUser.users_detail.province}`,
                            'street_line1': `${dataUser.users_detail.address}`
                        }
                    ]
                }
                const apiUrl = `${urlInvoice}`;
                const headers = {
                    'Authorization': `Basic ${Buffer.from(secret_api_key + ':').toString('base64')}`,
                    'for-user-id': `${userIdXendit}`,
                    'Content-Type': 'application/json',
                };
                axios.post(apiUrl, data, { headers })
                .then((async (response) => {
                    const updatePayment = await Transactions.findByPk(result.id);
                    updatePayment.payment_link = response.data.invoice_url
                    updatePayment.id_invoice_xendit = response.data.id
                    await updatePayment.save();
                    const transaction = {
                        linkpayment: response.data.invoice_url,
                        image: packagePricing.venue_service !== null ? packagePricing.venue_service.venue_images[0].image : packagePricing.talent_service !== null ? packagePricing.talent_service.talent_images[0].image : packagePricing.eo_service !== null ? packagePricing.eo_service.eo_images[0].image : packagePricing.product_supply.product_images[0].image,
                        productLayanan: packagePricing.venue_service !== null ? packagePricing.venue_service.name : packagePricing.talent_service !== null ? packagePricing.talent_service.name : packagePricing.eo_service !== null ? packagePricing.eo_service.name : packagePricing.product_supply.tool_type + ', ' + packagePricing.product_supply.brand + ', ' + packagePricing.product_supply.model,
                        user: dataUser.fullname,
                        // address: dataUser.users_detail.city + " " + dataUser.users_detail.province,
                        package: packagePricing.name,
                        servicePrice: result.servicePrice,
                        adminFee: result.adminFee,
                        taxFee: result.taxFee,
                        totalPayment: result.totalPayment,
                        Quantity: result.qty
                    }
                    res.status(200).json(transaction)
                }))
                .catch((error) => {
                    console.error('Error:', error);
                    return res.send("PAYMENT ERROR!, chek request body!")
                });
            })
            .catch(error => {
                if (error.errors) {
                    res.status(400).json({
                        message: error.errors[0].message
                    })
                } else {
                    res.status(400).json({
                        message: error.message
                    })
                }
            })
        } catch (error) {
            res.status(400).json({ message: error.message })
        }
    }

    static async getIdTransaction(req, res) {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })
        try {
            Transactions.findOne({
                where: {
                    id: req.query.id,
                },
                include: {
                    model: PackagePricings,
                    attributes: ['name', 'total_price', 'service_type'],
                    include: [{
                        model: VenueServicesModel,
                        include: [{
                            model: VenueImages,
                            attributes: ['image']
                        }, {
                            model: User,
                            include: {
                                model: Companies,
                                attributes: ['id', 'name']
                            }
                        }],
                        attributes: ['name']
                    }, {
                        model: TalentServicesModel,
                        include: [{
                            model: TalentImages,
                            attributes: ['image']
                        }, {
                            model: User,
                            include: {
                                model: Companies,
                                attributes: ['id', 'name']
                            }
                        }],
                        attributes: ['name']
                    }, {
                        model: ProductSuppliesModel,
                        include: [{
                            model: ProductImages,
                            attributes: ['image']
                        }, {
                            model: User,
                            include: {
                                model: Companies,
                                attributes: ['id', 'name']
                            }
                        }],
                        attributes: ['tool_type', 'brand', 'model']
                    }, {
                        model: EOServices,
                        include: [{
                            model: EOImages,
                            attributes: ['image']
                        }, {
                            model: User,
                            include: {
                                model: Companies,
                                attributes: ['id', 'name']
                            }
                        }],
                        attributes: ['name']
                    }],
                },
                attributes: ['id', 'qty', 'numberInvoice', 'dateInvoice', 'status', 'servicePrice', 'totalPayment', 'adminFee', 'paymentMethod']
            }).then(result => {
                if (result == null) {
                    return res.status(500).json({ data: "Data Null, check id transaction!" })
                }
                const data = {
                    "id": result.id,
                    "package_name": result.package_pricing.name,
                    "price": result.package_pricing.total_price,
                    "service_type": result.package_pricing.service_type,
                    "service_name": result.package_pricing.venue_service !== null ? result.package_pricing.venue_service.name : result.package_pricing.talent_service !== null ? result.package_pricing.talent_service.name : result.package_pricing.eo_service !== null ? result.package_pricing.eo_service.name : result.package_pricing.product_supply.tool_type + ', ' + result.package_pricing.product_supply.brand + ', ' + result.package_pricing.product_supply.model,
                    "image": result.package_pricing.venue_service !== null ? result.package_pricing.venue_service.venue_images[0].image : result.package_pricing.talent_service !== null ? result.package_pricing.talent_service.talent_images[0].image : result.package_pricing.eo_service !== null ? result.package_pricing.eo_service.eo_images[0].image : result.package_pricing.product_supply.product_images[0].image,
                    "company_name": result.package_pricing.venue_service !== null ? result.package_pricing.venue_service.user.company.name : result.package_pricing.talent_service !== null ? result.package_pricing.talent_service.user.company.name : result.package_pricing.eo_service !== null ? result.package_pricing.eo_service.user.company.name : result.package_pricing.product_supply.user.company.name,
                    "qty": result.qty,
                    "number_invoice": result.numberInvoice,
                    "date_invoice": result.dateInvoice,
                    "status": result.status,
                    "service_price": result.servicePrice,
                    "admin_fee": result.adminFee,
                    "total_payment": result.totalPayment,
                    "payment_method": result.paymentMethod
                }
                return res.status(200).json({ data })
            })
                .catch(err => {
                    res.status(500).json(err)
                })
        } catch (error) {
            res.status(400).json({ message: error.message })
        }
    }

    static async getListTransaction(req, res) {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })
        try {
            let transactions
            if (typeof req.query.type === 'undefined') {
                transactions = await Transactions.findAll({
                    where: {
                        clientId: tokenDecode.userId
                    },
                    include: {
                        model: PackagePricings,
                        attributes: ['name', 'total_price', 'service_type'],
                        include: [{
                            model: VenueServicesModel,
                            include: [{
                                model: VenueImages,
                                attributes: ['image']
                            }, {
                                model: User,
                                include: {
                                    model: Companies,
                                    attributes: ['id', 'name']
                                }
                            }],
                            attributes: ['name']
                        }, {
                            model: TalentServicesModel,
                            include: [{
                                model: TalentImages,
                                attributes: ['image']
                            }, {
                                model: User,
                                include: {
                                    model: Companies,
                                    attributes: ['id', 'name']
                                }
                            }],
                            attributes: ['name']
                        }, {
                            model: ProductSuppliesModel,
                            include: [{
                                model: ProductImages,
                                attributes: ['image']
                            }, {
                                model: User,
                                include: {
                                    model: Companies,
                                    attributes: ['id', 'name']
                                }
                            }],
                            // attributes: ['tool_type', 'brand', 'model']
                            attributes: ['namaLayanan']
                        }, {
                            model: EOServices,
                            include: [{
                                model: EOImages,
                                attributes: ['image']
                            }, {
                                model: User,
                                include: {
                                    model: Companies,
                                    attributes: ['id', 'name']
                                }
                            }],
                            attributes: ['name']
                        }],
                    },
                    attributes: ['id'],
                    order: [['createdAt', 'DESC']]
                })
                    .then((result) => {
                        return result.map((data) => {
                            // console.log("\n")
                            // console.log("data: ", data)
                            // console.log("\n")
                            return {
                                "id": data.id,
                                "package_name": data.package_pricing.name,
                                "price": data.package_pricing.total_price,
                                "service_type": data.package_pricing.service_type,
                                // "service_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.name : data.package_pricing.product_supply.tool_type+', '+data.package_pricing.product_supply.brand+', '+data.package_pricing.product_supply.model,
                                "service_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.name : data.package_pricing.product_supply.namaLayanan,
                                "image": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.venue_images[0].image : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.talent_images[0].image : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.eo_images[0].image : data.package_pricing.product_supply.product_images[0].image,
                                "company_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.user.company.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.user.company.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.user.company.name : data.package_pricing.product_supply.user.company.name,
                            }
                        })
                    })
            } else {
                transactions = await Transactions.findAll({
                    where: {
                        clientId: tokenDecode.userId
                    },
                    include: {
                        model: PackagePricings,
                        attributes: ['name', 'total_price', 'service_type'],
                        where: {
                            service_type: req.query.type
                        },
                        include: [{
                            model: VenueServicesModel,
                            include: [{
                                model: VenueImages,
                                attributes: ['image']
                            }, {
                                model: User,
                                include: {
                                    model: Companies,
                                    attributes: ['id', 'name']
                                }
                            }],
                            attributes: ['name']
                        }, {
                            model: TalentServicesModel,
                            include: [{
                                model: TalentImages,
                                attributes: ['image']
                            }, {
                                model: User,
                                include: {
                                    model: Companies,
                                    attributes: ['id', 'name']
                                }
                            }],
                            attributes: ['name']
                        }, {
                            model: ProductSuppliesModel,
                            include: [{
                                model: ProductImages,
                                attributes: ['image']
                            }, {
                                model: User,
                                include: {
                                    model: Companies,
                                    attributes: ['id', 'name']
                                }
                            }],
                            // attributes: ['tool_type', 'brand', 'model']
                            attributes: ['namaLayanan']
                        }, {
                            model: EOServices,
                            include: [{
                                model: EOImages,
                                attributes: ['image']
                            }, {
                                model: User,
                                include: {
                                    model: Companies,
                                    attributes: ['id', 'name']
                                }
                            }],
                            attributes: ['name']
                        }],
                    },
                    attributes: ['id'],
                    order: [['createdAt', 'DESC']]
                })
                    .then((result) => {
                        return result.map((data) => {
                            return {
                                "id": data.id,
                                "package_name": data.package_pricing.name,
                                "price": data.package_pricing.total_price,
                                "service_type": data.package_pricing.service_type,
                                // "service_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.name : data.package_pricing.product_supply.tool_type+', '+data.package_pricing.product_supply.brand+', '+data.package_pricing.product_supply.model,
                                "service_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.name : data.package_pricing.product_supply.namaLayanan,
                                "image": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.venue_images[0].image : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.talent_images[0].image : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.eo_images[0].image : data.package_pricing.product_supply.product_images[0].image,
                                "company_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.user.company.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.user.company.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.user.company.name : data.package_pricing.product_supply.user.company.name,
                            }
                        })
                    })
            }

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
                    totaldata: items.length,
                }
            }
            
            return res.status(200).json({ data: Paginator(transactions, page, limit)})
        } catch (error) {
            return res.status(500).json({ message: error.message })
        }
    }

    static async deleteTransactionByTransactionId(req, res) {
        try {
            const transactionId = req.params.transactionId

            const transaction = await Transactions.findOne({
                where: {
                    id: transactionId,
                },
            })

            if (!transaction) return res.status(404).json({ msg: `Transaction data with id [${transactionId}] id not found!` })

            await Transactions.destroy({
                where: {
                    id: transactionId,
                },
            })
                .then(
                    await ImageHandler.deleteImageHandler(transaction.payment_file)
                )

            return res.status(200).json({ msg: `Success to delete a transaction with id [${transactionId}]` })
        } catch (error) {
            return res.status(500).json({ msg: error.message })
        }
    }

    static async editTransaction(req, res) {
        const {
            status,
            eventBrief,
            paymentMethod,
            billingTo,
            qty,
            servicePrice,
            adminFee,
            taxFee,
            totalPayment,
            startDate,
            endDate,
            dateInvoice,
            timeInvoice,
            cancelation_reason,
        } = req.body

        try {
            const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
                if (error) return res.sendStatus(403);
                return decoded
            })

            // transactionId validation
            const transactionId = req.params.transactionId

            if (transactionId == null) {
                return res.status(400).json({
                    msg: `Transaction's id can not be null or undefined.`
                })
            }

            // Checking transaction data is exist
            const transactionBefore = await Transactions.findOne({
                where: {
                    id: transactionId,
                },
            })

            if (!transactionBefore) {
                return res.status(404).json({
                    msg: `Transaction with id [${transactionId}] not found.`,
                })
            }

            // Request body validation
            if (status !== 'PAID' && status !== 'UNPAID' && status !== 'COMPLETE' && status !== 'FAILED') {
                return res.status(400).json({
                    msg: `Field of [status] must be [PAID] or [UNPAID] or [COMPLETE] or [FAILED] and can not be null or undefined.`
                })
            }

            // Payment File
            let paymentFile

            if (req.files != null) {
                let file = req.files["payment_file"]

                if (typeof file !== 'undefined') {
                    const ext = path.extname(file.name)
                    const allowedExt = ['.jpg', '.jpeg', '.png', '.pdf']
                    if (!allowedExt.includes(ext)) {
                        return res.status(400).json({ message: `File type [${ext}] not allowed` })
                    }
                    const category = "payment_file"
                    const maxFileSize = 2 * 1024 * 1024;
                    if (file.size > maxFileSize) {
                        return res.status(400).json({ msg: 'Ukuran file melebihi batas (2 MB).' })
                    }
                    if (ext === '.pdf') {
                        const category = "payment_file"
                        const { fileName, filePath } = generatePDFNameAndPath(file, category)
                        paymentFile = `/assets/payment-file/${fileName}`

                        if (transactionBefore.payment_file) {
                            if (fs.existsSync(`.${transactionBefore.payment_file}`)) {
                                fs.unlink(`.${transactionBefore.payment_file}`, (err) => {
                                    if (err) return res.status(500).json({ msg: err })
                                })
                            }
                        }

                        try {
                            file.mv(filePath)
                        } catch (error) {
                            return res.status(500).json({
                                msg: "Error saving PDF file to directory",
                                error: err.message,
                            })
                        }
                    } else if (ext === '.jpg') {
                        const { imageName, imagePath } = generateImageNameAndPath(file, category)
                        paymentFile = `/assets/payment-file/${imageName}`

                        if (transactionBefore.payment_file) {
                            if (fs.existsSync(`.${transactionBefore.payment_file}`)) {
                                fs.unlink(`.${transactionBefore.payment_file}`, (err) => {
                                    if (err) return res.status(500).json({ msg: err })
                                })
                            }
                        }

                        try {
                            file.mv(imagePath)
                        } catch (error) {
                            return res.status(500).json({
                                msg: "Error saving JPG file to directory",
                                error: err.message,
                            })
                        }

                    } else if (ext === '.png') {
                        const { imageName, imagePath } = generateImageNameAndPath(file, category)
                        paymentFile = `/assets/payment-file/${imageName}`

                        if (transactionBefore.payment_file) {
                            if (fs.existsSync(`.${transactionBefore.payment_file}`)) {
                                fs.unlink(`.${transactionBefore.payment_file}`, (err) => {
                                    if (err) return res.status(500).json({ msg: err })
                                })
                            }
                        }

                        try {
                            file.mv(imagePath)
                        } catch (error) {
                            return res.status(500).json({
                                msg: "Error saving PNG file to directory",
                                error: err.message,
                            })
                        }

                    } else if (ext === '.jpeg') {
                        const { imageName, imagePath } = generateImageNameAndPath(file, category)
                        paymentFile = `/assets/payment-file/${imageName}`

                        if (transactionBefore.payment_file) {
                            if (fs.existsSync(`.${transactionBefore.payment_file}`)) {
                                fs.unlink(`.${transactionBefore.payment_file}`, (err) => {
                                    if (err) return res.status(500).json({ msg: err })
                                })
                            }
                        }

                        try {
                            file.mv(imagePath)
                        } catch (error) {
                            return res.status(500).json({
                                msg: "Error saving JPEG file to directory",
                                error: err.message,
                            })
                        }

                    } else {
                        return res.status(400).json({ message: `File type [${ext}] not allowed` })
                    }
                }
            }
            // Store the updated transaction data to the database
            await Transactions.update({
                status,
                eventBrief,
                paymentMethod,
                billingTo,
                qty,
                servicePrice,
                adminFee,
                taxFee,
                totalPayment,
                startDate,
                endDate,
                dateInvoice,
                timeInvoice,
                payment_file: paymentFile,
                cancelation_reason,
            },{
                where: {
                    id: transactionId,
                },
            })

            const updatedTransaction = await Transactions.findOne({
                where: {
                    id: transactionId,
                },
            })

            return res.status(200).json({
                updatedTransaction,
            })

            //////////////////////////////////////

            // const packagePricing = await PackagePricings.findOne({
            //     where: { id: packagePricingId },
            //     include: [{
            //         model: EOServices,
            //         include: { model: EOImages }
            //     }, {
            //         model: VenueServicesModel,
            //         include: { model: VenueImages }
            //     }, {
            //         model: TalentServicesModel,
            //         include: { model: TalentImages }
            //     }, {
            //         model: ProductSuppliesModel,
            //         include: { model: ProductImages }
            //     }],
            // })

            // const dataUser = await Users.findOne({
            //     where: { id: tokenDecode.userId },
            //     include: { model: UserDetail }
            // })

            // function generateInvoice() {
            //     let invoice = "";
            //     const characters = "0123456789"; // karakter yang diizinkan dalam nomor invoice
            //     const length = 5; // panjang nomor invoice yang diinginkan

            //     for (let i = 0; i < length; i++) {
            //         const index = Math.floor(Math.random() * characters.length); // pilih karakter acak dari daftar karakter yang diizinkan
            //         invoice += characters.charAt(index); // tambahkan karakter ke nomor invoice
            //     }
            //     return invoice;
            // }

            // const kode = []
            // for (let i = 0; i < 1; i++) {
            //     // console.log(packagePricing.eo_service != undefined)
            //     if (packagePricing.eo_service != undefined) {
            //         kode[i] = { code: `EO${generateInvoice()}` }
            //     } else if (packagePricing.venue_service != undefined) {
            //         kode[i] = { code: `VE${generateInvoice()}` }
            //     } else if (packagePricing.product_supply != undefined) {
            //         kode[i] = { code: `PR${generateInvoice()}` }
            //     } else if (packagePricing.talent_service != undefined) {
            //         kode[i] = { code: `TS${generateInvoice()}` }
            //     }
            // }

            // Transactions.create({
            //     status,
            //     service_status,
            //     totalPayment,
            //     eventBrief,
            //     startDate,
            //     endDate,
            //     billingTo,
            //     servicePrice,
            //     adminFee,
            //     taxFee,
            //     paymentMethod,
            //     numberInvoice: kode[0].code,
            //     dateInvoice: new Date(),
            //     timeInvoice: new Date(),
            //     qty,
            //     packagePricingId,
            //     clientId: tokenDecode.userId
            // })
            //     .then(result => {
            //         const transaction = {
            //             image: packagePricing.venue_service !== null ? packagePricing.venue_service.venue_images[0].image : packagePricing.talent_service !== null ? packagePricing.talent_service.talent_images[0].image : packagePricing.eo_service !== null ? packagePricing.eo_service.eo_images[0].image : packagePricing.product_supply.product_images[0].image,
            //             productLayanan: packagePricing.venue_service !== null ? packagePricing.venue_service.name : packagePricing.talent_service !== null ? packagePricing.talent_service.name : packagePricing.eo_service !== null ? packagePricing.eo_service.name : packagePricing.product_supply.tool_type + ', ' + packagePricing.product_supply.brand + ', ' + packagePricing.product_supply.model,
            //             user: dataUser.fullname,
            //             address: dataUser.users_detail.city + " " + dataUser.users_detail.province,
            //             package: packagePricing.name,
            //             servicePrice: result.servicePrice,
            //             adminFee: result.adminFee,
            //             taxFee: result.taxFee,
            //             totalPayment: result.totalPayment,
            //             Quantity: result.qty
            //         }
            //         res.send(transaction)
            //     })
            //     .catch(error => {
            //         if (error.errors) {
            //             res.status(404).json({
            //                 message: error.errors[0].message
            //             })
            //         } else {
            //             res.status(404).json({
            //                 message: error.message
            //             })
            //         }
            //     })
        } catch (error) {
            res.status(400).json({ message: error.message })
        }
    }

    static async webhookPaymentXendit(req, res) {
        try {
            console.log(req.headers)
            console.log(req.headers['x-callback-token'])
            if(req.headers['x-callback-token'] == `${process.env.CALLBACK_TOKEN}`){
                const status = req.body.status
                if(status == "PAID"){
                    await Transactions.update({
                        status: "PAID"
                    },{
                        where: {
                            id: req.body.external_id
                        }
                    })
                    res.send("PAYMENT SUCCESS")
                }else if ( status == "EXPIRED"){
                    await Transactions.update({
                        status: "FAILED"
                    },{
                        where: {
                            id: req.body.external_id
                        }
                    })
                    res.send("PAYMENT EXPIRED")
                }
            }
        } catch (error) {
            return res.status(500).json({ msg: error.message })
        }
    }

    static async historyTransactionStakeholder(req, res) {
        try {
            if( !req.query.service){return res.status(400).json({msg: "Please add query service_type !"})}
            const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
                if (error) return res.sendStatus(403);
                return decoded
            })
            const whereClause =  {clientId: tokenDecode.userId}
            if( req.query.transactionId){whereClause.id= req.query.transactionId}
            const transaction = await Transactions.findAll({
                where: whereClause,
                // attributes: ['id', 'status', "qty", "eventBrief", "adminFee", "totalPayment", "numberInvoice", "billingTo", "payment_link", "taxFee" ],
                include: {
                    model: PackagePricings,
                    attributes: ['name', 'total_price', 'service_type', "start_date", "end_date"],
                    where: {service_type: req.query.service},
                    include: [{
                        model: VenueServicesModel,
                        include: [{
                            model: VenueImages,
                            attributes: ['image']
                        }, {
                            model: User,
                            include: {
                                model: Companies,
                                attributes: ['id', 'name']
                            }
                        }],
                        attributes: ['name']
                    }, {
                        model: TalentServicesModel,
                        include: [{
                            model: TalentImages,
                            attributes: ['image']
                        }, {
                            model: User,
                            include: {
                                model: Companies,
                                attributes: ['id', 'name']
                            }
                        }],
                        attributes: ['name']
                    }, {
                        model: ProductSuppliesModel,
                        include: [{
                            model: ProductImages,
                            attributes: ['image']
                        }, {
                            model: User,
                            include: {
                                model: Companies,
                                attributes: ['id', 'name']
                            }
                        }],
                        attributes: ['namaLayanan']
                    }, {
                        model: EOServices,
                        include: [{
                            model: EOImages,
                            attributes: ['image']
                        }, {
                            model: User,
                            include: {
                                model: Companies,
                                attributes: ['id', 'name']
                            }
                        }],
                        attributes: ['name']
                    }],
                },
                order: [['createdAt', 'DESC']]
            })
            .then((result) => {
                return result.map((data) => {
                    if(req.query.transactionId){
                        const sub_total = parseInt(`${(data.servicePrice * data.qty) + data.adminFee}`)
                        return {
                            "id": data.id,
                            "service_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.name : data.package_pricing.product_supply.namaLayanan,
                            "package_name": data.package_pricing.name,
                            "date": `${data.package_pricing.start_date} - ${data.package_pricing.end_date}`,
                            "event_brief": data.eventBrief,
                            "billing_to": data.billingTo,
                            "invoice": data.numberInvoice,
                            "company_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.user.company.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.user.company.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.user.company.name : data.package_pricing.product_supply.user.company.name,
                            "payment_status": data.status,
                            "service_price": data.servicePrice,
                            "qty": data.qty,
                            "admin_fee": data.adminFee,
                            "sub_total": sub_total,
                            "tax_fee": data.taxFee,
                            "total_payment": data.totalPayment,
                            "image": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.venue_images[0].image : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.talent_images[0].image : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.eo_images[0].image : data.package_pricing.product_supply.product_images[0].image,
                            "payment_link": data.payment_link,
                        }
                    }else{
                        return {
                            "id": data.id,
                            "payment_status": data.status,
                            "package_name": data.package_pricing.name,
                            "price": data.package_pricing.total_price,
                            "service_type": data.package_pricing.service_type,
                            "service_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.name : data.package_pricing.product_supply.namaLayanan,
                            "image": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.venue_images[0].image : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.talent_images[0].image : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.eo_images[0].image : data.package_pricing.product_supply.product_images[0].image,
                            "company_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.user.company.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.user.company.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.user.company.name : data.package_pricing.product_supply.user.company.name,
                        }
                    }
                })
            })
            //pagination array
            const page = req.query.page || 1
            const limit = req.query.limit|| 20
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
                    totaldata: items.length,
                }
            }
            if(req.query.transactionId){
                return res.status(200).json({data: transaction[0]})
            }
            return res.status(200).json(Paginator(transaction, page, limit))
        } catch (error) {
            return res.status(500).json({ msg: error.message })
        }
    }

    static async historyTransactionEventHunter(req, res) {
        try {
            const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
                if (error) return res.sendStatus(403);
                return decoded
            })
            const filter = req.query.filter || "all"
            const whereClause =  {clientId: tokenDecode.userId,}
            if( req.query.transactionId){whereClause.id= req.query.transactionId}
            if( filter == "all"){ whereClause.status = {[Op.or]: ['paid', 'unpaid','failed']}}
            else if( filter == "booking"){ whereClause.status = {[Op.or]: ['paid', 'unpaid']}}
            else if( filter == "finish"){ whereClause.status = 'complete'}
            const transaction = await Transactions.findAll({
                where: whereClause,
                // attributes: ['id', 'status', "qty", "eventBrief", "adminFee", "totalPayment", "numberInvoice", "billingTo", "payment_link", "taxFee", "dateInvoice" ],
                include: {
                    model: PackagePricings,
                    attributes: ['name', 'total_price', 'service_type', "start_date", "end_date"],
                    include: [{
                        model: VenueServicesModel,
                        include: [{
                            model: VenueImages,
                            attributes: ['image']
                        }, {
                            model: User,
                            include: {
                                model: Companies,
                                attributes: ['id', 'name', 'phone']
                            }
                        }],
                        attributes: ['name']
                    }, {
                        model: TalentServicesModel,
                        include: [{
                            model: TalentImages,
                            attributes: ['image']
                        }, {
                            model: User,
                            include: {
                                model: Companies,
                                attributes: ['id', 'name', 'phone']
                            }
                        }],
                        attributes: ['name']
                    }, {
                        model: ProductSuppliesModel,
                        include: [{
                            model: ProductImages,
                            attributes: ['image']
                        }, {
                            model: User,
                            include: {
                                model: Companies,
                                attributes: ['id', 'name', 'phone']
                            }
                        }],
                        attributes: ['namaLayanan']
                    }, {
                        model: EOServices,
                        include: [{
                            model: EOImages,
                            attributes: ['image']
                        }, {
                            model: User,
                            include: {
                                model: Companies,
                                attributes: ['id', 'name', 'phone']
                            }
                        }],
                        attributes: ['name']
                    }],
                },
                order: [['createdAt', 'DESC']]
            })
            .then((result) => {
                return result.map((data) => {
                    if(req.query.transactionId){
                        const sub_total = parseInt(`${(data.servicePrice * data.qty) + data.adminFee}`)
                        return {
                            "id": data.id,
                            "service_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.name : data.package_pricing.product_supply.namaLayanan,
                            "package_name": data.package_pricing.name,
                            "date": `${data.package_pricing.start_date} - ${data.package_pricing.end_date}`,
                            "event_brief": data.eventBrief,
                            "billing_to": data.billingTo,
                            "invoice": data.numberInvoice,
                            "date_invoice": data.dateInvoice,
                            "company_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.user.company.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.user.company.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.user.company.name : data.package_pricing.product_supply.user.company.name,
                            "company_phone": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.user.company.phone : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.user.company.phone : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.user.company.phone : data.package_pricing.product_supply.user.company.phone,
                            "service_price": data.servicePrice,
                            "qty": data.qty,
                            "admin_fee": data.adminFee,
                            "sub_total": sub_total,
                            "tax_fee": data.taxFee,
                            "total_payment": data.totalPayment,
                            "image": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.venue_images[0].image : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.talent_images[0].image : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.eo_images[0].image : data.package_pricing.product_supply.product_images[0].image,
                            "payment_link": data.payment_link,
                        }
                    }else{
                        return {
                            "id": data.id,
                            "payment_status": data.status,
                            "package_name": data.package_pricing.name,
                            "price": data.package_pricing.total_price,
                            "service_type": data.package_pricing.service_type,
                            "service_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.name : data.package_pricing.product_supply.namaLayanan,
                            "image": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.venue_images[0].image : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.talent_images[0].image : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.eo_images[0].image : data.package_pricing.product_supply.product_images[0].image,
                            "company_name": data.package_pricing.venue_service !== null ? data.package_pricing.venue_service.user.company.name : data.package_pricing.talent_service !== null ? data.package_pricing.talent_service.user.company.name : data.package_pricing.eo_service !== null ? data.package_pricing.eo_service.user.company.name : data.package_pricing.product_supply.user.company.name,
                        }
                    }
                })
            })
            //pagination array
            const page = req.query.page || 1
            const limit = req.query.limit|| 20
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
                    totaldata: items.length,
                }
            }
            if(req.query.transactionId){
                return res.status(200).json({data: transaction[0]})
            }
            return res.status(200).json(Paginator(transaction, page, limit))
        } catch (error) {
            return res.status(500).json({ msg: error.message })
        }
    }

    // static async callbackPayment (req, res){
    //     const headers = {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Basic ${Buffer.from(secret_api_key + ':').toString('base64')}`,
    //         'for-user-id': `${userIdXendit}`
    //     };
    //     axios.post("https://api.xendit.co/callback_urls/invoice", {
    //         url: "https://api.staginghub.konect.id/k1/invoice_webhook_url"
    //     }, {headers})
    //         .then((response) => {
    //             console.log(response.data);
    //         })
    //         .catch((error) => {
    //             console.error(error);
    //         });
    // }
}



module.exports = TransactionController