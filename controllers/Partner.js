const Users = require("../models/UsersModel");
const EOServices = require("../models/EOServicesModel");
const VenueServices = require("../models/VenueServicesModel");
const TalentServices = require("../models/TalentServicesModel");
const ProductSupplies = require("../models/ProductSuppliesModel");
const Transactions = require("../models/TransactionsModel");
const PackagePricings = require("../models/PackagePricingsModel");
const Roles = require("../models/RolesModel");
const Companies = require("../models/CompaniesModel");
const LegalDocuments = require("../models/LegalDocumentsModel");
const TenderRequests = require("../models/TenderRequestsModel");
const TenderImages = require("../models/TanderImagesModel");
const BidApplicantsModel = require("../models/BidApplicantModels");

const sequelize = require('sequelize')
const { Op } = require("sequelize")
const jwt = require("jsonwebtoken");
const buildPaginator = require('pagination-apis')

const currentDate = new Date()


const partnerStatistic = async (req, res, next) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({ where: { id: tokenDecode.userId } })
        const role = await Roles.findOne({ where: { name: 'Partner' } })

        if (user.roleId !== role.id) {
            return res.status(405).json({ msg: `You're Not Allowed` })
        }

        const eo = await EOServices.count({
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })

        const venue = await VenueServices.count({
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })

        const talent = await TalentServices.count({
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })

        const product = await ProductSupplies.count({
            include: {
                model: Users,
                where: {
                    companyId: user.companyId
                }
            }
        })

        // Transaction Report
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


        const transaction = await Transactions.count({
            where: {
                packagePricingId: packageId,
            },
            // include: {
            //     model: PackagePricings,
            //     include: [
            //         {
            //             model: EOServices,
            //             where: {
            //                 userId: tokenDecode.userId,
            //             },
            //         },
            //         {
            //             model: VenueServices,
            //             where: {
            //                 userId: tokenDecode.userId,
            //             },
            //         },
            //         {
            //             model: ProductSupplies,
            //             where: {
            //                 userId: tokenDecode.userId,
            //             },
            //         },
            //         {
            //             model: TalentServices,
            //             where: {
            //                 userId: tokenDecode.userId,
            //             },
            //         },
            //     ],
            // },
        })

        // Bid report
        const bidCount = await BidApplicantsModel.count({
            where: {
                partnerId: user.id,
            },
        })

        const data = {
            'total_layanan': eo + venue + talent + product,
            'total_transaction': transaction,
            'total_bid': bidCount,
        }

        return res.status(200).json({ data })
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
}

// Get detail of partner
const getPartnerDetail = async (req, res, next) => {
    const partnerID = req.params["partnerId"]
    if (partnerID === "" || partnerID == null) return res.status(400).json({ msg: `Partner's id can not be empty!` })

    try {
        const partnerData = await Users.findOne({
            where: {
                id: partnerID,
            },
            attributes: [
                'id',
                'fullname',
            ],
            include: [{
                model: Companies,
                include: [{
                    model: LegalDocuments,
                }]
            },],
        })

        if (!partnerData) return res.status(404).json({ msg: `Partner's data with id [${partnerID}]is not found!` })

        return res.status(200).json({
            partnerData,
        })
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

// Get Partner's transaction report by partnerID and service type
const getPartnerTransactionReport = async (req, res) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({ where: { id: tokenDecode.userId } })

        // Selling report monthly 
        const currentYear = new Date().getFullYear()
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        const results = {}

        for (let i = 0; i < 12; i++) {
            const startDate = new Date(currentYear, i, 1)
            const endDate = new Date(currentYear, i + 1, 0)
            const monthName = months[i]

            const countEventOrganizer = await Transactions.count({
                include: {
                    model: PackagePricings,
                    where: {
                        service_type: 'EO',
                    },
                    include: {
                        model: EOServices,
                        where: {
                            userId: tokenDecode.userId,
                        },
                    },
                },
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate],
                    },
                },
            })

            const countVenue = await Transactions.count({
                include: {
                    model: PackagePricings,
                    where: {
                        service_type: 'VENUE',
                    },
                    include: {
                        model: VenueServices,
                        where: {
                            userId: tokenDecode.userId,
                        },
                    },
                },
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate],
                    },
                },
            })

            const countSupplier = await Transactions.count({
                include: {
                    model: PackagePricings,
                    where: {
                        service_type: 'PRODUCT'
                    },
                    include: {
                        model: ProductSupplies,
                        where: {
                            userId: tokenDecode.userId,
                        },
                    },
                },
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate],
                    },
                },
            });

            const countTalent = await Transactions.count({
                include: {
                    model: PackagePricings,
                    where: {
                        service_type: 'TALENT',
                    },
                    include: {
                        model: TalentServices,
                        where: {
                            userId: tokenDecode.userId,
                        },
                    },
                },
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate],
                    },
                },
            });
            results[monthName] = {
                countEventOrganizer,
                countVenue,
                countSupplier,
                countTalent,
            };

        }

        return res.status(200).json({
            user: {
                id: user.id,
                fullname: user.fullname,
            },
            selling_report_monthly: results,
        });
    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }

}

// Get list of bidding histories by partnerID for user with partner role
const getPartnerBiddingHistoryList = async (req, res) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({ where: { id: tokenDecode.userId } })

        let filter = req.query.filter || "All"

        if (filter !== "submitted_bid" && filter !== "closed_tender" && filter !== "selected_bid" && filter !== "All") {
            return res.status(400).json({ msg: `field of [filter] must be [submitted_bid] or [closed_tender] or [selected_bid] or null!` })
        }

        let isActive, isSelectedBid
        // if (req.query.isActive === 'true') {
        //     isActive = true
        // } else if (req.query.isActive === 'false') {
        //     isActive = false
        // } else {
        //     isActive = [true, false]
        // }

        if (filter === "closed_tender") {
            isActive = false
        } else {
            isActive = [true, false]
        }

        if (filter === "submitted_bid") {
            isSelectedBid = false
        } else if (filter === "selected_bid") {
            isSelectedBid = true
        } else {
            isSelectedBid = [true, false]
        }

        // if (filter === "selected_bid") {
        //     isSelectedBid = true
        // } else {
        //     isSelectedBid = [true, false]
        // }

        // const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })

        // get tender id bided by partner
        const tenderBidedByPartner = await TenderRequests.findAll({
            attributes: [
                'id',
            ],
            include: {
                model: BidApplicantsModel,
                where: {
                    partnerId: user.id,
                },
                attributes: [],
            },
        })
        
        let tenderIdBidedByPartner = []
        for (let i = 0; i < tenderBidedByPartner.length; i++) {
            tenderIdBidedByPartner.push(tenderBidedByPartner[i].id)
        }
        // return res.send(tenderIdBidedByPartner)

        let whereClause = {
            is_active: isActive,
            id: tenderIdBidedByPartner,
        }

        const tenderResult = await TenderRequests.findAndCountAll({
            where: whereClause,
            // limit: limit,
            // offset: skip,
            attributes: [
                'id',
                'title',
                'description',
                'is_active',
                'participant_estimate',
                'implementation_estimate',
                'budget_target',
                'maksimal_partner',
                [sequelize.fn('DATEDIFF', sequelize.col('deadline'), currentDate), 'daysLeft'],
            ],
            include: [
                {
                    model: BidApplicantsModel,
                    where: {
                        status: isSelectedBid,
                    },
                },
                {
                    model: TenderImages,
                },
                {
                    model: Users,
                    as: `stakeholder`,
                    attributes: [
                        `id`,
                        `fullname`,
                        `image`,
                    ],
                },
            ],
        })
        
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
        // venue: Paginator(venue, page, limit)
        if (tenderResult.count == 0) {
            return res.status(404).json({ msg: `Tender data bided by partner_id [${user.id}] not found` })
        }

        const tenderResultWithBidApplicantsCount = tenderResult.rows.map((tender) => {
            const bidApplicantsCount = tender.dataValues.bid_applicants.length
            return { ...tender.toJSON(), bidApplicantsCount }
        })

        return res.status(200).json({
            accessed_user: {
                id: user.id,
                fullname: user.fullname,
            },
            filtering: filter,
            isActive,
            isSelectedBid,
            pagination: Paginator(tenderResultWithBidApplicantsCount, page, limit)
            // paginate(tenderResultWithBidApplicantsCount, tenderResult.count),
        })
    } catch (error) {
        return res.status(500).json({ msg: `End of catch: ${error.message}` })
    }
}

// Get detail of bidding history
const getPartnerBiddingHistoryDetail = async (req, res) => {
    const tenderId = req.params["tenderId"]

    const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
        if (error) return res.sendStatus(403);
        return decoded
    })

    const user = await Users.findOne({ where: { id: tokenDecode.userId } })

    try {
        const tenderResult = await TenderRequests.findOne({
            where: {
                id: tenderId,
            },
            include: [
                {
                    model: TenderImages,
                },
                {
                    model: Users,
                    as: `stakeholder`,
                    attributes: [
                        `id`,
                        `fullname`,
                        `image`,
                    ],
                },
                {
                    model: BidApplicantsModel,
                    attributes: [
                        'id',
                        'createdAt', ['bidding', 'nominal_bidding'],
                    ],
                    include: [{
                        model: Users,
                        as: 'partner',
                        attributes: [
                            'id'
                        ],
                        include: [{
                            model: Companies,
                            attributes: [
                                'id', ['name', 'company_name']
                            ],
                        }],
                    }],
                },
            ],
            order: [
                [BidApplicantsModel, 'bidding', 'DESC'],
            ],
        })

        const bidApplicantsCount = await BidApplicantsModel.count({
            where: {
                tenderRequestId: tenderId,
            }
        })

        return res.status(200).json({
            user: {
                id: user.id,
                fullname: user.fullname,
            },
            tenderResult,
            bidApplicantsCount,
        })
    } catch (error) {
        return res.status(500).json({ msg: `End of catch: ${error.message}` })
    }
}

// Get Partner's services (EO, Venue, Product Supply, Talent) by accessed user with role partner
const getPartnerServices = async (req, res) => {

    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403)
            return decoded
        })

        let search = req.query.search || ""
        let serviceNameColumn, serviceDescriptionColumn, serviceSpecificationColumn

        serviceNameColumn = 'eo_services.name'
        serviceDescriptionColumn = 'eo_services.description'
        serviceSpecificationColumn = 'eo_services.spesification'

        const eoServices = await EOServices.findAll({
            where: {
                [Op.and]: [
                    {
                        userId: tokenDecode.userId,
                    },
                    {
                        [Op.or]: [
                            sequelize.where(sequelize.fn('lower', sequelize.col(serviceNameColumn)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            sequelize.where(sequelize.fn('lower', sequelize.col(serviceDescriptionColumn)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            sequelize.where(sequelize.fn('lower', sequelize.col(serviceSpecificationColumn)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ],
                    }
                ],
            },
            include: [
                {
                    model: PackagePricings,
                },
            ],
        })

        serviceNameColumn = 'venue_services.name'
        serviceDescriptionColumn = 'venue_services.description'
        serviceSpecificationColumn = 'venue_services.spesification'
        const venueServices = await VenueServices.findAll({
            where: {
                [Op.and]: [
                    {
                        userId: tokenDecode.userId,
                    },
                    {
                        [Op.or]: [
                            sequelize.where(sequelize.fn('lower', sequelize.col(serviceNameColumn)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            sequelize.where(sequelize.fn('lower', sequelize.col(serviceDescriptionColumn)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            sequelize.where(sequelize.fn('lower', sequelize.col(serviceSpecificationColumn)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ],
                    }
                ],
            },
            include: [
                {
                    model: PackagePricings,
                },
            ],
        })

        serviceNameColumn = 'product_supplies.namaLayanan'
        serviceDescriptionColumn = 'product_supplies.deskripsiLayanan'
        serviceSpecificationColumn = 'product_supplies.spesifikasiLayanan'
        const productSupplies = await ProductSupplies.findAll({
            where: {
                [Op.and]: [
                    {
                        userId: tokenDecode.userId,
                    },
                    {
                        [Op.or]: [
                            sequelize.where(sequelize.fn('lower', sequelize.col(serviceNameColumn)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            sequelize.where(sequelize.fn('lower', sequelize.col(serviceDescriptionColumn)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            sequelize.where(sequelize.fn('lower', sequelize.col(serviceSpecificationColumn)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ],
                    }
                ],
            },
            include: [
                {
                    model: PackagePricings,
                },
            ],
        })

        serviceNameColumn = 'talent_services.name'
        serviceDescriptionColumn = 'talent_services.deskripsiLayanan'
        serviceSpecificationColumn = 'talent_services.spesifikasiLayanan'
        const talentServices = await TalentServices.findAll({
            where: {
                [Op.and]: [
                    {
                        userId: tokenDecode.userId,
                    },
                    {
                        [Op.or]: [
                            sequelize.where(sequelize.fn('lower', sequelize.col(serviceNameColumn)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            sequelize.where(sequelize.fn('lower', sequelize.col(serviceDescriptionColumn)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                            sequelize.where(sequelize.fn('lower', sequelize.col(serviceSpecificationColumn)), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ],
                    }
                ],
            },
            include: [
                {
                    model: PackagePricings,
                },
            ],
        })

        let services = []

        for (let i = 0; i < eoServices.length; i++) {
            services.push(eoServices[i])
        }
        for (let i = 0; i < venueServices.length; i++) {
            services.push(venueServices[i])
        }
        for (let i = 0; i < productSupplies.length; i++) {
            services.push(productSupplies[i])
        }
        for (let i = 0; i < talentServices.length; i++) {
            services.push(talentServices[i])
        }

        if (services.length === 0) {
            return res.status(404).json({
                keyword: search,
                services: `Services not found`,
            })
        }

        return res.status(200).json({
            keyword: search,
            services,
        })
    } catch (error) {
        return res.status(500).json({
            msg: error.message,
        })
    }
}

// Get Partner's Transaction List by accessed user with role partner
const getTransactionListOfPartner = async (req, res) => {
    const startDateFilter = new Date(req.query.start_date_filter || '1900-01-01')
    const endDateFilter = new Date(req.query.end_date_filter || '3000-12-31')
    const sortedColumn = req.query.sorted_column || 'createdAt'
    const sortType = req.query.sort_type || 'DESC'

    if (sortedColumn != 'client_name' && sortedColumn != 'invoice_number' && sortedColumn != 'invoice_date' && sortedColumn != 'phone' && sortedColumn != 'email' && sortedColumn != 'createdAt' && sortedColumn != 'invoice_status') {
        return res.status(400).json({ msg: `sorted_column must be [client_name] or [invoice_number] or [invoice_date] or [phone] or [email] or [invoice_status]` })
    }

    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({ where: { id: tokenDecode.userId } })

        if (!user) return res.status(404).json({ msg: `User data is not found!` })

        const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })

        const transactionOrder = []

        if (sortedColumn === 'createdAt') {
            transactionOrder.push([sortedColumn, sortType])
        } else if (sortedColumn === 'client_name') {
            transactionOrder.push(['client', 'fullname', sortType])
        } else if (sortedColumn === 'invoice_number') {
            transactionOrder.push(['numberInvoice', sortType])
        } else if (sortedColumn === 'invoice_date') {
            transactionOrder.push(['createdAt', sortType])
        } else if (sortedColumn === 'phone') {
            transactionOrder.push(['client', 'phone', sortType])
        } else if (sortedColumn === 'email') {
            transactionOrder.push(['client', 'email', sortType])
        }else if (sortedColumn === 'invoice_status') {
            transactionOrder.push(['status', sortType])
        }

        let packagePricingIds = []
        await PackagePricings.findAll({
            attributes: [
                'id',
            ],
            include: {
                model: EOServices,
                attributes: [],
                where: {
                    userId: tokenDecode.userId,
                },
            },
        })
            .then((result) => {
                return result.map((data) => {
                    packagePricingIds.push(data.id)
                })
            })

        await PackagePricings.findAll({
            attributes: [
                'id',
            ],
            include: {
                model: VenueServices,
                attributes: [],
                where: {
                    userId: tokenDecode.userId,
                },
            },
        })
            .then((result) => {
                return result.map((data) => {
                    packagePricingIds.push(data.id)
                })
            })

        await PackagePricings.findAll({
            attributes: [
                'id',
            ],
            include: {
                model: ProductSupplies,
                attributes: [],
                where: {
                    userId: tokenDecode.userId,
                },
            },
        })
            .then((result) => {
                return result.map((data) => {
                    packagePricingIds.push(data.id)
                })
            })

        await PackagePricings.findAll({
            attributes: [
                'id',
            ],
            include: {
                model: TalentServices,
                attributes: [],
                where: {
                    userId: tokenDecode.userId,
                },
            },
        })
            .then((result) => {
                return result.map((data) => {
                    packagePricingIds.push(data.id)
                })
            })

        const result = await Transactions.findAndCountAll({
            limit,
            offset: skip,
            order: transactionOrder,
            where: {
                createdAt: {
                    [Op.between]: [startDateFilter, new Date(endDateFilter.getTime() + 24 * 60 * 60 * 1000)]
                }
            },
            include: [
                {
                    model: PackagePricings,
                    attributes: [
                        'id',
                        'name',
                        'service_type',
                    ],
                    where: {
                        id: packagePricingIds,
                    },
                    include: [
                        {
                            model: EOServices,
                            attributes: [
                                'id',
                                'name',
                                'userId',
                            ],
                        },
                        {
                            model: VenueServices,
                            attributes: [
                                'id',
                                'name',
                                'userId',
                            ],
                        },
                        {
                            model: TalentServices,
                            attributes: [
                                'id',
                                'name',
                                'userId',
                            ],
                        },
                        {
                            model: ProductSupplies,
                            attributes: [
                                'id',
                                'namaLayanan',
                                'userId',
                            ],
                        },
                    ],
                },
                {
                    model: Users,
                    as: 'client',
                    attributes: [
                        'id',
                        'fullname',
                        'image',
                        'phone',
                        'email',
                    ],
                    include: [{
                        model: Roles,
                        attributes: [
                            'name',
                        ],
                    },{
                        model: Companies,
                        attributes: [
                            'name',
                        ],
                    }],
                }
            ]
        })
        .then((result) => {
            return {
                rows: result.rows.map((data) => {
                    return {
                        "id": data.id,
                        "number_invoice": data.numberInvoice,
                        "created_at": data.createdAt,
                        "status": data.status,
                        "payment_date": data.dateInvoice,
                        "payment_time": data.timeInvoice,
                        "total_payment": data.totalPayment,
                        "quantity": data.qty,
                        "payment_file": data.payment_file,
                        "cancelation_reason": data.cancelation_reason,
                        "client": data.client,
                        "service": {
                            "id": data.package_pricing.eo_service?.id || data.package_pricing.venue_service?.id || data.package_pricing.product_supply?.id || data.package_pricing.talent_service?.id,
                            "name": data.package_pricing.eo_service?.name || data.package_pricing.venue_service?.name || data.package_pricing.product_supply?.namaLayanan || data.package_pricing.talent_service?.name,
                            "type": data.package_pricing.service_type,
                            "company": data.client.company.name,
                            "package_pricing": {
                                "id": data.package_pricing.id,
                                "name": data.package_pricing.name,
                            },
                        }
                    }
                }),
                count: result.count,
            }
        })

        if (result.count == 0) {
            return res.status(200).json({
                msg: `Transaction data is not found!`,
                filter: {
                    limit: req.query.limit,
                    page: req.query.page,
                    start_date_filter: startDateFilter,
                    end_date_filter: endDateFilter,
                    sorted_column: sortedColumn,
                    sort_type: sortType,
                },
            })
        }

        return res.status(200).json({
            msg: `Success to get transaction list of partner with id [${req.params.partnerId}]`,
            filter: {
                limit: req.query.limit,
                page: req.query.page,
                start_date_filter: startDateFilter,
                end_date_filter: endDateFilter,
                sorted_column: sortedColumn,
                sort_type: sortType,
            },
            pagination: paginate(result.rows, result.count),
        })
    } catch (error) {
        return res.status(500).json({
            msg: `Failed to get transaction list of partner with id [${req.params.partnerId}]`,
            error: error.message,
            filter: {
                limit: req.query.limit,
                page: req.query.page,
                start_date_filter: startDateFilter,
                end_date_filter: endDateFilter,
                sorted_column: sortedColumn,
                sort_type: sortType,
            },
        })
    }
}

module.exports = {
    partnerStatistic,
    getPartnerDetail,
    getPartnerTransactionReport,
    getPartnerBiddingHistoryList,
    getPartnerBiddingHistoryDetail,
    getPartnerServices,
    getTransactionListOfPartner,
}