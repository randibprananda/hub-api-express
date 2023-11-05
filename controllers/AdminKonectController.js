const Users = require('../models/UsersModel')
const UserDetails = require('../models/UsersDetailModel')
const EOServices = require('../models/EOServicesModel')
const LegalDocuments = require('../models/LegalDocumentsModel')
const Roles = require('../models/RolesModel')
const Companies = require('../models/CompaniesModel')
const VenueServices = require('../models/VenueServicesModel')
const TalentServices = require('../models/TalentServicesModel')
const ProductSupplies = require('../models/ProductSuppliesModel')
const Transactions = require('../models/TransactionsModel')
const TenderRequests = require('../models/TenderRequestsModel')
const TenderImages = require('../models/TanderImagesModel')
const BidApplicantsModel = require('../models/BidApplicantModels')
const PackagePricings = require('../models/PackagePricingsModel')

const sequelize = require('sequelize')
const { Op } = require("sequelize")
const buildPaginator = require('pagination-apis')
const jwt = require("jsonwebtoken")
const path = require('path')
const fs = require('fs')

const { generatePDFNameAndPath } = require('./PDFController')
const { generateImageNameAndPath } = require('./ImageController')
const EOImages = require('../models/EOImagesModel')
const ProductImages = require('../models/ProductImagesModel')
const TalentImages = require('../models/TalentImagesModel')
const VenueImages = require('../models/VenueImagesModel')

class AdminKonectController {

    // Get stakeholder's list for Konect's Admin with searching and filtering
    static async getStakeholderListAdminKonect(req, res) {
        try {
          const { search = "", isActive, sort = 'ASC' } = req.query;
          const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit });
          const whereClause = {
            is_active: isActive === 'true' ? true : isActive === 'false' ? false : { [Op.in]: [true, false] },
            [Op.or]: [
              sequelize.where(sequelize.fn('lower', sequelize.col('company.name')), {
                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
              }),
              sequelize.where(sequelize.fn('lower', sequelize.col('company.type')), {
                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
              }),
              sequelize.where(sequelize.fn('lower', sequelize.col('company.type_business')), {
                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
              }),
              sequelize.where(sequelize.fn('lower', sequelize.col('company.city')), {
                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
              }),
              sequelize.where(sequelize.fn('lower', sequelize.col('company.province')), {
                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
              }),
              sequelize.where(sequelize.fn('lower', sequelize.col('company.email')), {
                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
              }),
              sequelize.where(sequelize.fn('lower', sequelize.col('users.fullname')), {
                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
              }),
            ]
          };
      
          const result = await Users.findAndCountAll({
            limit,
            offset: skip > 1 ? (skip - 1) * limit : 0,
            attributes: [
              'id',
              'fullname',
              'is_active',
            ],
            include: [
              {
                model: Companies,
                attributes: [
                  'id',
                  'name',
                  'company_logo',
                  ['type', 'badan_usaha'],
                  ['type_business', 'jenis_usaha'],
                  'city',
                  'province',
                  'email',
                  'phone',
                ]
              },
              {
                model: Roles,
                where: {
                  name: 'Stakeholder',
                },
                attributes: [
                  'name',
                ]
              },
            ],
            where: whereClause,
            order: [
              [sequelize.literal(`users.fullname ${sort}`)] // Sorting ascending/descending berdasarkan users.fullname
            ],
          });
      
          if (result.count == 0) {
            return res.status(404).json({ msg: `Stakeholder data not found!` });
          }
      
          const pagination = paginate(result.rows, result.count);
      
          return res.status(200).json({
            totalStakeholderCount: result.count,
            filtering: {
              keyword: search,
              is_active: isActive,
              sort_order: sort,
            },
            pagination,
          });
        } catch (error) {
          res.status(500).json({ msg: error.message });
        }
      }

    // Get tender's list for Konect's Admin with searching and filtering
    static async getTenderListAdminKonect(req, res) { //wherecluase diubah menjadi iss asssisted
        const Op = sequelize.Op

        let search = req.query.search || ""

        let isActive
        if (req.query.isActive === 'true') {
            isActive = true
        } else if (req.query.isActive === 'false') {
            isActive = false
        } else {
            isActive = [true, false]
        }

        let stakeholderId = (req.query.stakeholderId === 'all' ? 'All' : req.query.stakeholderId) || 'All'

        let withAddOns
        if (req.query.withAddOns === 'true') {
            withAddOns = true
        } else if (req.query.withAddOns === 'false') {
            withAddOns = false
        } else {
            withAddOns = 'All'
        }

        const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })

        let whereClause = {
            is_active: isActive,
            [Op.and]: [{
                [Op.or]: [
                    sequelize.where(sequelize.fn('lower', sequelize.col('tender_requests.title')), {
                        [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                    }),
                    sequelize.where(sequelize.fn('lower', sequelize.col('tender_requests.description')), {
                        [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                    }),
                ]
            }]
        }

        if (stakeholderId != 'All') {
            whereClause.stakeholderId = stakeholderId
        }

        if (withAddOns == true) {
            whereClause.is_assisted = {
                [Op.like]: true
            }
        } else if (withAddOns == false) {
            whereClause.is_assisted = {
                [Op.like]: false
            }
        }

        try {
            const result = await TenderRequests.findAndCountAll({
                limit: limit,
                offset: skip,
                attributes: [
                    'id',
                    'title',
                    'is_active',
                    'is_assisted',
                    'implementation_estimate',
                    'add_on'
                ],
                include: [{
                    model: TenderImages,
                },
                {
                    model: Users,
                    as: 'stakeholder',
                    attributes: [
                        'id',
                        'fullname',
                        'image',
                    ],
                },
                ],
                where: whereClause,
            })

            if (result.count == 0) {
                return res.status(404).json({ 
                    msg: `Tender data not found!`,
                    totalTenderCount: result.count,
                    filtering: {
                        keyword: search,
                        is_active: isActive,
                        stakeholder_id: stakeholderId,
                        withAddOns,
                    },
                })
            }

            console.log(result.rows.length)

            return res.status(200).json({
                totalTenderCount: result.rows.length,
                filtering: {
                    keyword: search,
                    is_active: isActive,
                    stakeholder_id: stakeholderId,
                    withAddOns,
                },
                pagination: paginate(result.rows, result.rows.length),
            })
        } catch (error) {
            res.status(500).json({ msg: error.message })
        }
    }

    // Update activation status of Stakeholder for Konect's Admin
    static async activationStakeholder(req, res) {
        const stakeholderId = req.params.id
        const isActive = req.body.status

        if (isActive == null) {
            return res.status(400).json({
                msg: `status is null or undefined.`
            })
        }

        try {
            await Users.update(
                {
                    is_active: isActive,
                },
                {
                    where: {
                        id: stakeholderId,
                    }
                }
            ).then(data => {
                if (data.length != 0) {
                    var responseMessage
                    if (isActive) {
                        responseMessage = `Stakeholder with id [${stakeholderId}] have been activated.`
                    } else if (!isActive) {
                        responseMessage = `Stakeholder with id [${stakeholderId}] have been deactivated.`
                    }

                    return res.status(200).json({
                        stakeholderId: stakeholderId,
                        isActive: isActive,
                        msg: responseMessage,
                    })
                } else {
                    return res.status(404).json({
                        stakeholderId: stakeholderId,
                        isActive: isActive,
                        msg: `Stakeholder with id [${stakeholderId}] not found.`
                    })
                }
            })
        } catch (error) {
            res.status(500).json({
                msg: error.message
            })
        }
    }

    // Get detail of Stakeholder for Konect's Admin
    static async getStakeholderDetail(req, res) {
        const stakeholderId = req.params.id

        if (stakeholderId == null) {
            return res.status(400).json({
                msg: `Stakeholder's id can not be null or undefined.`
            })
        }

        try {
            const stakeholder = await Users.findOne({
                where: {
                    id: stakeholderId,
                },
                attributes: [
                    'id',
                    'fullname',
                ],
                include: [
                    {
                        model: Companies,
                        include: [
                            { model: LegalDocuments }
                        ]
                    },
                ]
            })

            if (!stakeholder) {
                return res.status(404).json({
                    msg: `Stakeholder with id [${stakeholderId}] not found.`,
                })
            } else {
                return res.status(200).json({
                    stakeholder,
                })
            }
        } catch (error) {
            res.status(500).json({
                msg: error.message
            })
        }
    }

    // Edit Stakeholder for Konect's Admin
    static async editStakeholder(req, res) {
        const stakeholderId = req.params.id

        if (stakeholderId == null) {
            return res.status(400).json({
                msg: `Stakeholder's id can not be null or undefined.`
            })
        }

        const { fullname, username, email, image, phone, city, province, postal_code, address, position } = req.body
        try {
            await Users.update({
                fullname,
                username,
                email,
                image,
                phone
            }, {
                where: {
                    id: req.params.id
                }
            })

            await UsersDetail.update({
                city,
                province,
                postal_code,
                address,
                position
            }, {
                where: {
                    id: checkDetail.id
                }
            })

            res.status(200).json({
                msg: "Data Berhasil di Edit!"
            })

        } catch (error) {
            res.status(500).json({
                msg: error.message
            })
        }
    }

    static async partnerWithFilter(req, res) {
        const Op = sequelize.Op

        let search = req.query.search || ""

        let isActive
        if (req.query.isActive === 'true') {
            isActive = true
        } else if (req.query.isActive === 'false') {
            isActive = false
        } else {
            isActive = [true, false]
        }

        let sortOrder = req.query.sort || 'ASC'

        const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })

        let whereClause = {
            is_active: isActive,
            [Op.and]: [{
                [Op.or]: [
                    sequelize.where(sequelize.fn('lower', sequelize.col('company.name')), {
                        [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                    }),
                    sequelize.where(sequelize.fn('lower', sequelize.col('company.type')), {
                        [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                    }),
                    sequelize.where(sequelize.fn('lower', sequelize.col('company.type_business')), {
                        [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                    }),
                    sequelize.where(sequelize.fn('lower', sequelize.col('company.city')), {
                        [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                    }),
                    sequelize.where(sequelize.fn('lower', sequelize.col('company.province')), {
                        [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                    }),
                    sequelize.where(sequelize.fn('lower', sequelize.col('company.email')), {
                        [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                    }),
                    sequelize.where(sequelize.fn('lower', sequelize.col('users.fullname')), {
                        [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                    }),
                ]
            }]
        }

        try {
            const result = await Users.findAndCountAll({
                limit: limit,
                offset: skip,
                attributes: [
                    'id',
                    'fullname',
                    'is_active',
                ],
                include:
                    [
                        {
                            model: Companies,
                            attributes: [
                                'id',
                                'name',
                                'company_logo',
                                ['type', 'badan_usaha'],
                                ['type_business', 'jenis usaha'],
                                ['createdAt', 'created'],
                                'city',
                                'province',
                                'email',
                                'phone',
                            ]
                        },
                        {
                            model: Roles,
                            where: {
                                name: 'Partner',
                            },
                            attributes: [
                                'name',
                            ]
                        },
                    ],
                where: whereClause,
                order: [[Companies, 'name', sortOrder]],
            })

            if (result.count == 0) {
                return res.status(404).json({ msg: `Partner data not found!` })
            }

            return res.status(200).json({
                totalPartnerCount: result.count,
                filtering: {
                    keyword: search,
                    is_active: isActive,
                    sort_order: sortOrder,
                },
                pagination: paginate(result.rows, result.count),
            })
        } catch (error) {
            res.status(500).json({ msg: error.message })
        }
    }

    static async activationPartner(req, res) {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })
        try {
            const user = await Users.findOne({
                where: {
                    id: tokenDecode.userId
                },
                include: {
                    model: Roles
                }
            })

            const checkPartner = await Users.findOne({
                where: {
                    id: req.params.id
                },
                include: {
                    model: Roles
                }
            })

            if (user.role.name !== 'Admin') {
                return res.status(405).json({ msg: `You don't have access` })
            } else if (!checkPartner) {
                return res.status(405).json({ msg: `User Not Found, Chek userId!` })
            } else if (checkPartner.role.name != "Partner") {
                return res.status(405).json({ msg: `You Must be activation Partner!` })
            }

            await Users.update({
                is_active: req.body.status
            }, {
                where: {
                    id: req.params.id
                }
            }).then(data => {
                if (data.length != 0) {
                    res.status(200).json({
                        msg: "Data Berhasil di Edit!"
                    })
                } else {
                    res.status(200).json({
                        msg: "Invalid!"
                    })
                }
            })
        } catch (error) {
            res.status(500).json({
                msg: error.message
            })
        }
    }

    static async detailPartnerAdmin(req, res) {
        try {
            // relassi user companies sama legal dokumen, talen buat tiktok
            const data = await Users.findOne({
                attributes: ['id', 'fullname'],
                include:
                    [
                        {
                            model: Companies,
                            where: { id: req.params.companyId },
                            include: {
                                model: LegalDocuments
                            }
                        },
                        {
                            model: Roles,
                            where: {
                                name: 'Partner',
                            },
                            attributes: [
                                'name',
                            ]
                        },
                    ]
            })

            const eo = await EOServices.count({
                where: {
                    userId: data.id
                }
            })

            const venue = await VenueServices.count({
                where: {
                    userId: data.id
                }
            })

            const talent = await TalentServices.count({
                where: {
                    userId: data.id
                }
            })

            const product = await ProductSupplies.count({
                where: {
                    userId: data.id
                }
            })

            let countJenisLayanan
            if (eo > 0) {
                countJenisLayanan = 1
            }
            if (talent > 0) {
                countJenisLayanan += 1
            }
            if (venue > 0) {
                countJenisLayanan += 1
            }
            if (product > 0) {
                countJenisLayanan += 1
            }

            const countBidding = await BidApplicantsModel.count({
                where: {
                    partnerId: data.id
                }
            })

            res.status(200).json({
                countJenisLayanan: countJenisLayanan,
                countTotalLayanan: eo + venue + talent + product,
                countBidding: countBidding,
                data: data
            })
        } catch (error) {
            res.status(500).json({
                msg: error.message
            })
        }
    }

    // Get list of transactions with filtering, searching, and paginating for Konect's Admin
    static async getTransactionsList(req, res) {
        const Op = sequelize.Op

        let search = req.query.search || ""

        let status
        if (req.query.status === 'PAID') {
            status = 'PAID'
        } else if (req.query.status === 'UNPAID') {
            status = 'UNPAID'
        } else if (req.query.status === 'COMPLETE') {
            status = 'COMPLETE'
        } else if (req.query.status === 'FAILED') {
            status = 'FAILED'
        } else {
            status = 'ALL'
        }

        let minDate = req.query.minDate || '[null]'
        let maxDate = req.query.maxDate || '[null]'

        let serviceType
        if (req.query.serviceType === 'EO') {
            serviceType = 'EO'
        } else if (req.query.serviceType === 'VENUE') {
            serviceType = 'VENUE'
        } else if (req.query.serviceType === 'PRODUCT') {
            serviceType = 'PRODUCT'
        } else if (req.query.serviceType === 'TALENT') {
            serviceType = 'TALENT'
        } else {
            serviceType = ['EO', 'VENUE', 'PRODUCT', 'TALENT']
        }

        let companyId = req.query.companyId || null

        let whereClause = {
            [Op.and]: [{
                [Op.or]: [
                    sequelize.where(sequelize.fn('lower', sequelize.col('numberInvoice')), {
                        [Op.like]: `%${search.toLowerCase()}%`,
                    }),
                ]
            }]
        }

        if (status !== 'ALL') {
            whereClause.status = status
        }

        if (minDate !== '[null]' && maxDate !== '[null]') {
            if (minDate > maxDate) {
                return res.status(400).json({
                    msg: `minDate must be lower than maxDate!`,
                    keyword: search,
                    status: status,
                    date: `${minDate} until ${maxDate}`,
                    service_type: serviceType,
                    company_id: companyId,
                })
            }
            whereClause.dateInvoice = {
                [Op.between]: [minDate, maxDate]
            }
        } else if (minDate !== '[null]' && maxDate === '[null]') {
            whereClause.dateInvoice = {
                [Op.gte]: minDate
            }
        } else if (minDate === '[null]' && maxDate !== '[null]') {
            whereClause.dateInvoice = {
                [Op.lte]: maxDate
            }
        }

        let companyFilter
        if (companyId != null) {
            companyFilter = {
                [Op.and]: [{
                    [Op.or]: [
                        sequelize.where(sequelize.col('package_pricing.eo_service.user.company.id'), {
                            [Op.like]: companyId,
                        }),
                        sequelize.where(sequelize.col('package_pricing.venue_service.user.company.id'), {
                            [Op.like]: companyId,
                        }),
                        sequelize.where(sequelize.col('package_pricing.talent_service.user.company.id'), {
                            [Op.like]: companyId,
                        }),
                        sequelize.where(sequelize.col('package_pricing.product_supply.user.company.id'), {
                            [Op.like]: companyId,
                        }),
                    ]
                }]
            }
        }

        const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })

        try {
            const transaction = await Transactions.findAndCountAll({
                limit,
                offset: skip,
                where: [
                    whereClause,
                    companyFilter,
                ],
                order: [['dateInvoice', 'DESC']],
                include: [
                    {
                        model: PackagePricings,
                        attributes: [
                            'name',
                            'service_type',
                        ],
                        where: {
                            'service_type': serviceType,
                        },
                        include: [
                            {
                                model: EOServices,
                                attributes: [
                                    'id',
                                ],
                                include: [
                                    {
                                        model: Users,
                                        attributes: [
                                            'id',
                                        ],
                                        include: [
                                            {
                                                model: Companies,
                                                attributes: [
                                                    'id',
                                                    'name',
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                model: VenueServices,
                                attributes: [
                                    'id',
                                ],
                                include: [
                                    {
                                        model: Users,
                                        attributes: [
                                            'id',
                                        ],
                                        include: [
                                            {
                                                model: Companies,
                                                attributes: [
                                                    'id',
                                                    'name',
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                model: TalentServices,
                                attributes: [
                                    'id',
                                ],
                                include: [
                                    {
                                        model: Users,
                                        attributes: [
                                            'id',
                                        ],
                                        include: [
                                            {
                                                model: Companies,
                                                attributes: [
                                                    'id',
                                                    'name',
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                model: ProductSupplies,
                                attributes: [
                                    'id',
                                ],
                                include: [
                                    {
                                        model: Users,
                                        attributes: [
                                            'id',
                                        ],
                                        include: [
                                            {
                                                model: Companies,
                                                attributes: [
                                                    'id',
                                                    'name',
                                                ],
                                            },
                                        ],
                                    },
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
                        ],
                    },
                ],
            })

            if (transaction.count == 0) {
                return res.status(404).json({
                    msg: `Transaction data not found!`,
                    keyword: search,
                    status: status,
                    date: `${minDate} until ${maxDate}`,
                    service_type: serviceType,
                    company_id: companyId,
                })
            }

            for (let index = 0; index < transaction.rows.length; index++) {
    
                if (transaction.rows[index].dataValues.package_pricing.dataValues.eo_service != null) {
                    transaction.rows[index].dataValues.package_pricing.dataValues['company'] = transaction.rows[index].dataValues.package_pricing.dataValues.eo_service.dataValues.user.dataValues.company != null ? transaction.rows[index].dataValues.package_pricing.dataValues.eo_service.dataValues.user.dataValues.company : null
                } else if (transaction.rows[index].dataValues.package_pricing.dataValues.venue_service != null) {
                    transaction.rows[index].dataValues.package_pricing.dataValues['company'] = transaction.rows[index].dataValues.package_pricing.dataValues.venue_service.dataValues.user.dataValues.company != null ? transaction.rows[index].dataValues.package_pricing.dataValues.venue_service.dataValues.user.dataValues.company : null
                } else if (transaction.rows[index].dataValues.package_pricing.dataValues.talent_service != null) {
                    transaction.rows[index].dataValues.package_pricing.dataValues['company'] = transaction.rows[index].dataValues.package_pricing.dataValues.talent_service.dataValues.user.dataValues.company != null ? transaction.rows[index].dataValues.package_pricing.dataValues.talent_service.dataValues.user.dataValues.company : null
                } else if (transaction.rows[index].dataValues.package_pricing.dataValues.product_supply != null) {
                    transaction.rows[index].dataValues.package_pricing.dataValues['company'] = transaction.rows[index].dataValues.package_pricing.dataValues.product_supply.dataValues.user.dataValues.company != null ? transaction.rows[index].dataValues.package_pricing.dataValues.product_supply.dataValues.user.dataValues.company : null
                }
                
                delete transaction.rows[index].dataValues.package_pricing.dataValues.eo_service
                delete transaction.rows[index].dataValues.package_pricing.dataValues.venue_service
                delete transaction.rows[index].dataValues.package_pricing.dataValues.talent_service
                delete transaction.rows[index].dataValues.package_pricing.dataValues.product_supply
            }
            
            return res.status(200).json({
                total_transaction_count: transaction.count,
                filtering: {
                    keyword: search,
                    status: status,
                    date: `${minDate} until ${maxDate}`,
                    service_type: serviceType,
                    company_id: companyId,
                },
                pagination: paginate(transaction.rows, transaction.count),
            })
        } catch (error) {
            return res.status(500).json({
                msg: error.message,
                filtering: {
                    keyword: search,
                    status: status,
                    date: `${minDate} until ${maxDate}`,
                    service_type: serviceType,
                    company_id: companyId,
                },
            })
        }
    }

    // Get Name of companies for Transaction List's filter on Konect's Admin
    static async getCompaniesName(req, res) {
        try {
            const companies = await Companies.findAll({
                attributes: [
                    'id',
                    'name',
                ]
            })

            return res.status(200).json({
                companies,
            })
        } catch (error) {
            return res.status(500).json({
                msg: error.message
            })
        }
    }

    static async listLayananPertnerWithFilter(req, res) {
        try {
            const chekPartner = await Users.findOne({
                where: {
                    id: req.params.partnerId
                },
                include: {
                    model: Roles,
                    where: {
                        name: "Partner"
                    }
                }
            })

            if (!chekPartner) {
                res.status(500).json({
                    msg: "Check your ID, Must be Partner Id !"
                })
                return
            }

            let search = req.query.search || ""
            let category = req.query.category || "All"

            let isActive
            if (req.query.isActive === 'true') {
                isActive = true
            } else if (req.query.isActive === 'false') {
                isActive = false
            } else {
                isActive = [true, false]
            }

            const categoryOptions = [
                "EO",
                "PRODUCT",
                "TALENT",
                "VENUE"
            ]


            let sortOrder = req.query.sort || 'ASC'
            // const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })
            category === "All" ? (category = [...categoryOptions]) : (category = req.query.category.split(","))

            let service
            if (category == "EO") {
                service = "eo_services"
            } else if (category == "PRODUCT") {
                service = "product_supplies"
            } else if (category == "TALENT") {
                service = "talent_services"
            } else if (category == "VENUE") {
                service = "venue_services"
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
                const eoServices = await EOServices.findAll({
                    // limit: limit,
                    // offset: skip,
                    attributes: ["id", "name", "active"],
                    where: {
                        userId: req.params.partnerId,
                        active: isActive
                    },
                    include: [{
                        model: PackagePricings,
                        attributes: ["id", "name", "total_price","disc_percentage"],
                        where: whereClause
                    },{
                        model: EOImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ],
                    }],
                    order: [['name', sortOrder]],
                })

                res.status(200).json({
                    search,
                    category,
                    eoServices: Paginator(eoServices, page, limit)
                })
            } else if (category == "PRODUCT") {
                const product = await ProductSupplies.findAll({
                    // limit: limit,
                    // offset: skip,
                    attributes: ["id", ["namaLayanan", "name"], "active"],
                    where: {
                        userId: req.params.partnerId,
                        active: isActive
                    },
                    include: [{
                        model: PackagePricings,
                        attributes: ["id", "name", "total_price","disc_percentage"],
                        where: whereClause
                    },{
                        model: ProductImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ]
                    }],
                    order: [['namaLayanan', sortOrder]],
                })

                res.status(200).json({
                    search,
                    category,
                    product: Paginator(product, page, limit)
                })
            } else if (category == "TALENT") {
                const talent = await TalentServices.findAll({
                    // limit: limit,
                    // offset: skip,
                    attributes: ["id", "name", "active"],
                    where: {
                        userId: req.params.partnerId,
                        active: isActive
                    },
                    include: [{
                        model: PackagePricings,
                        attributes: ["id", "name", "total_price","disc_percentage"],
                        where: whereClause
                    },{
                        model: TalentImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ]
                }],
                    order: [['name', sortOrder]],
                })

                res.status(200).json({
                    search,
                    category,
                    talent: Paginator(talent, page, limit)
                })
            } else if (category == "VENUE") {
                const venue = await VenueServices.findAll({
                    // limit: limit,
                    // offset: skip,
                    attributes: ["id", "name", "active"],
                    where: {
                        userId: req.params.partnerId,
                        active: isActive
                    },
                    include: [{
                        model: PackagePricings,
                        attributes: ["id", "name", "total_price","disc_percentage"],
                        where: whereClause
                    },{
                        model: VenueImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ]
                }],
                    order: [['name', sortOrder]],
                })

                res.status(200).json({
                    search,
                    category,
                    venue: Paginator(venue, page, limit)
                })
            } else {
                //menggabungkan dari hasil semua layanan tambahkan limit dan skip, jumlah data dan gunakan pagination

                const eoServices = await EOServices.findAll({
                    where: {
                        userId: req.params.partnerId
                    },
                    attributes: ["id", "name", "active"],
                    include: [{
                        model: PackagePricings,
                        attributes: ["id", "name", "total_price","disc_percentage"],
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
                    },{
                        model: EOImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ]
                    }],
                    order: [['name', sortOrder]]
                })
                    .then(data => {
                        return data.map(result => {
                            return {
                                service: "Event Organizer",
                                id: result.id,
                                name: result.name,
                                active: result.active,
                                images : {
                                    id: result.eo_images[0].dataValues.id,
                                    images: result.eo_images[0].dataValues.image
                                },
                                package_pricings: {
                                    id: result.package_pricings[0].dataValues.id,
                                    name: result.package_pricings[0].dataValues.name,
                                    total_price: result.package_pricings[0].dataValues.total_price,
                                    disc_percentage: result.package_pricings[0].dataValues.disc_percentage
                                }
                            }
                        })
                    })
                const product = await ProductSupplies.findAll({
                    where: {
                        userId: req.params.partnerId
                    },
                    attributes: ["id", ["namaLayanan", "name"], "active"],
                    include: [{
                        model: PackagePricings,
                        attributes: ["id", "name", "total_price","disc_percentage"],
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
                    },{
                        model: ProductImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ]
                }],
                    order: [['namaLayanan', sortOrder]]
                }).then(data => {
                    return data.map(result => {
                        return {
                            service: "Product Supplies",
                            id: result.id,
                            name: result.dataValues.name,
                            active: result.active,
                            images : {
                                id: result.product_images[0].dataValues.id,
                                images: result.product_images[0].dataValues.image
                            },
                            package_pricings: {
                                id: result.package_pricings[0].dataValues.id,
                                name: result.package_pricings[0].dataValues.name,
                                total_price: result.package_pricings[0].dataValues.total_price,
                                disc_percentage: result.package_pricings[0].dataValues.disc_percentage
                            }
                        }
                    })
                })
                const talent = await TalentServices.findAll({
                    where: {
                        userId: req.params.partnerId
                    },
                    attributes: ["id", "name", "active"],
                    include: [{
                        model: PackagePricings,
                        attributes: ["id", "name", "total_price","disc_percentage"],
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
                    },{
                        model: TalentImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ]
                }],
                    order: [['name', sortOrder]]
                })
                    .then(data => {
                        return data.map(result => {
                            return {
                                service: "Talent",
                                id: result.id,
                                name: result.name,
                                active: result.active,
                                images : {
                                    id: result.talent_images[0].dataValues.id,
                                    images: result.talent_images[0].dataValues.image
                                },
                                package_pricings: {
                                    id: result.package_pricings[0].dataValues.id,
                                    name: result.package_pricings[0].dataValues.name,
                                    total_price: result.package_pricings[0].dataValues.total_price,
                                    disc_percentage: result.package_pricings[0].dataValues.disc_percentage
                                }
                            }
                        })
                    })
                const venue = await VenueServices.findAll({
                    where: {
                        userId: req.params.partnerId
                    },
                    attributes: ["id", "name", "active"],
                    include: [{
                        model: PackagePricings,
                        attributes: ["id", "name", "total_price","disc_percentage"],
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
                    },{
                        model: VenueImages,
                        limit: 1,
                        attributes: [
                            "id",
                            "image",
                        ]
                }],
                    order: [['name', sortOrder]]
                })
                    .then(data => {
                        return data.map(result => {
                            return {
                                service: "Venue",
                                id: result.id,
                                name: result.name,
                                active: result.active,
                                images : {
                                    id: result.venue_images[0].dataValues.id,
                                    images: result.venue_images[0].dataValues.image
                                },
                                package_pricings: {
                                    id: result.package_pricings[0].dataValues.id,
                                    name: result.package_pricings[0].dataValues.name,
                                    total_price: result.package_pricings[0].dataValues.total_price,
                                    disc_percentage: result.package_pricings[0].dataValues.disc_percentage
                                }
                            }
                        })
                    })

                const combinedArray = eoServices.concat(product, talent, venue);


                res.status(200).json({
                    search,
                    category,
                    // talent
                    // eoServices
                    dataAll: Paginator(combinedArray, page, limit)
                })
            }
        } catch (error) {
            res.status(500).json({ msg: error.message })
        }
    }

    //get total card on dashboard
    static async getDashboardCard(req, res, next) {
        try {

            const countStakeholder = await Users.count({
                include: {
                    model: Roles,
                    where: {
                        name: 'Stakeholder'
                    }
                }
            })

            const countPartner = await Users.count({
                include: {
                    model: Roles,
                    where: {
                        name: 'Partner'
                    }
                }
            })

            const countEventHunter = await Users.count({
                include: {
                    model: Roles,
                    where: {
                        name: 'Event Hunter'
                    }
                }
            })

            const countOpenTender = await TenderRequests.count()

            return res.status(200).json({
                countStakeholder,
                countPartner,
                countEventHunter,
                countOpenTender

            });
        } catch (error) {
            return res.status(500).json({ msg: error.message })

        }

    }

    //get statistic from total user already registered
    static async getStatistic(req, res, next) {
        try {
            const currentYear = new Date().getFullYear();
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const results = {};

            for (let i = 0; i < 12; i++) {
                const startDate = new Date(currentYear, i, 1);
                const endDate = new Date(currentYear, i + 1, 0);
                const monthName = months[i];

                const countEventOrganizer = await Transactions.count({
                    where: {
                        createdAt: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    include: {
                        model: PackagePricings,
                        where: {
                            service_type: 'EO',
                        },
                        // include: {
                        //     model: EOServices,
                        //     include: {
                        //         model: Users,
                        //         where: {
                        //             id: tokenDecode.userId,
                        //         },
                        //     },
                        // },
                    },
                });

                const countVenue = await Transactions.count({
                    where: {
                        createdAt: {
                            [Op.between]: [startDate, endDate]
                        },
                    },
                    include: {
                        model: PackagePricings,
                        where: {
                            service_type: 'VENUE',
                        },
                        // include: {
                        //     model: VenueServices,
                        //     include: {
                        //         model: Users,
                        //         where: {
                        //             id: tokenDecode.userId,
                        //         },
                        //     },
                        // },
                    },
                });

                const countSupplier = await Transactions.count({
                    where: {
                        createdAt: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    include: {
                        model: PackagePricings,
                        where: {
                            service_type: 'PRODUCT'
                        },
                        // include: {
                        //     model: ProductSupplies,
                        //     include: {
                        //         model: Users,
                        //         where: {
                        //             id: tokenDecode.userId,
                        //         },
                        //     }
                        // },
                    },
                });

                const countTalent = await Transactions.count({
                    where: {
                        createdAt: {
                            [Op.between]: [startDate, endDate]
                        }
                    },
                    include: {
                        model: PackagePricings,
                        where: {
                            service_type: 'TALENT',
                        },
                        // include: {
                        //     model: TalentServices,
                        //     include: {
                        //         model: Users,
                        //         where: {
                        //             id: tokenDecode.userId,
                        //         },
                        //     },
                        // },
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
                results,
            });
        } catch (error) {
            return res.status(500).json({ msg: error.message });
        }
    };

    // Get Transaction Detail (Invoice) for Konect's Admin
    static async getTransactionsDetailById(req, res) {
        const transactionId = req.params.transactionId

        if (transactionId == null) {
            return res.status(400).json({
                msg: `Transaction's id can not be null or undefined.`
            })
        }
        try {
            const transaction = await Transactions.findOne({
                where: {
                    id: transactionId,
                },
                include: [
                    {
                        model: Users,
                        as: 'client',
                        attributes: [
                            'id',
                            'fullname',
                            'image',
                            'email',
                            'phone',
                        ],
                        include: {
                            model: UserDetails,
                        },
                    },
                    {
                        model: PackagePricings,
                        attributes: [
                            'id',
                            'name',
                        ],
                        include: [
                            {
                                model: EOServices,
                                include: [
                                    {
                                        model: Users,
                                        attributes: [
                                            'id',
                                            'fullname',
                                        ],
                                        include: [
                                            {
                                                model: Companies,
                                                attributes: [
                                                    'id',
                                                    'name',
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                model: VenueServices,
                                include: [
                                    {
                                        model: Users,
                                        attributes: [
                                            'id',
                                            'fullname',
                                        ],
                                        include: [
                                            {
                                                model: Companies,
                                                attributes: [
                                                    'id',
                                                    'name',
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                model: TalentServices,
                                include: [
                                    {
                                        model: Users,
                                        attributes: [
                                            'id',
                                            'fullname',
                                        ],
                                        include: [
                                            {
                                                model: Companies,
                                                attributes: [
                                                    'id',
                                                    'name',
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                model: ProductSupplies,
                                include: [
                                    {
                                        model: Users,
                                        attributes: [
                                            'id',
                                            'fullname',
                                        ],
                                        include: [
                                            {
                                                model: Companies,
                                                attributes: [
                                                    'id',
                                                    'name',
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                        ],
                    }
                ],
            })

            if (transaction.dataValues.package_pricing.dataValues.eo_service) {
                transaction.dataValues.package_pricing.dataValues['service'] = transaction.dataValues.package_pricing.dataValues.eo_service
                // transaction.dataValues.package_pricing.dataValues['service'] = transaction.dataValues.package_pricing.dataValues.eo_service.dataValues
                delete transaction.dataValues.package_pricing.dataValues.eo_service
            } else if (transaction.dataValues.package_pricing.dataValues.venue_service) {
                transaction.dataValues.package_pricing.dataValues['service'] = transaction.dataValues.package_pricing.dataValues.venue_service
                delete transaction.dataValues.package_pricing.dataValues.venue_service
            } else if (transaction.dataValues.package_pricing.dataValues.talent_service) {
                transaction.dataValues.package_pricing.dataValues['service'] = transaction.dataValues.package_pricing.dataValues.talent_service
                delete transaction.dataValues.package_pricing.dataValues.talent_service
            } else if (transaction.dataValues.package_pricing.dataValues.product_supply) {
                transaction.dataValues.package_pricing.dataValues['service'] = transaction.dataValues.package_pricing.dataValues.product_supply
                delete transaction.dataValues.package_pricing.dataValues.product_supply
            }

            if (!transaction) {
                return res.status(404).json({
                    msg: `Transaction with id [${transactionId}] not found.`,
                })
            } else {
                return res.status(200).json({
                    transaction,
                })
            }
        } catch (error) {
            return res.status(500).json({
                msg: error.message
            })
        }
    }

    // Update Transaction by Id for Konect's Admin
    static async updateTransactionbyId(req, res) {
        try {
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
            const dateInvoice = req.body.date_invoice
            const cancelationReason = req.body.cancelation_reason || null

            let status
            if (req.body.status === 'PAID') {
                status = 'PAID'
            } else if (req.body.status === 'UNPAID') {
                status = 'UNPAID'
            } else if (req.body.status === 'COMPLETE') {
                status = 'COMPLETE'
            } else if (req.body.status === 'FAILED') {
                status = 'FAILED'
            } else {
                return res.status(400).json({
                    msg: `Field of [status] must be valid and can not be null or undefined.`
                })
            }

            // Updating the new transaction data

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

            // Store the newest transaction data to the database
            await Transactions.update({
                status: status,
                dateInvoice: dateInvoice,
                cancelation_reason: cancelationReason,
                payment_file: paymentFile
            },
                {
                    where: {
                        id: transactionId,
                    },
                },
            )

            const transactionAfter = await Transactions.findOne({
                where: {
                    id: transactionId,
                },
            })

            return res.status(200).json({
                request_body: {
                    status,
                    dateInvoice,
                    cancelationReason,
                },
                transactionAfter,
            })
        } catch (error) {
            return res.status(500).json({
                msg: error.message
            })
        }
    }

    // Get Top Company Transactions each Services
    static async getTop4CompanyTransactions(req, res) {
        try {
            const eoService = await Transactions.findAll({
                limit: 1,
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('status')), 'total_transactions'],
                ],
                where: {
                    status: 'COMPLETE',
                },
                include: [
                    {
                        model: PackagePricings,
                        attributes: [
                            'id',
                            'service_type',
                        ],
                        where: {
                            eoServiceId: {
                                [Op.not]: null,
                            },
                        },
                        include: [
                            {
                                model: EOServices,
                                attributes: [
                                    'id',
                                ],
                                include: [
                                    {
                                        model: Users,
                                        attributes: [
                                            'id',
                                        ],
                                        include: [
                                            {
                                                model: Companies,
                                                attributes: [
                                                    'id',
                                                    'name',
                                                    'company_logo',
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
                group: [
                    'package_pricing.eo_service.user.company.id',
                ],
                order: [
                    [sequelize.fn('COUNT', sequelize.col('status')), 'DESC'],
                ],
            })

            const venueService = await Transactions.findAll({
                limit: 1,
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('status')), 'total_transactions'],
                ],
                where: {
                    status: 'COMPLETE',
                },
                include: [
                    {
                        model: PackagePricings,
                        attributes: [
                            'id',
                            'service_type',
                        ],
                        where: {
                            venueServiceId: {
                                [Op.not]: null,
                            },
                        },
                        include: [
                            {
                                model: VenueServices,
                                attributes: [
                                    'id',
                                ],
                                include: [
                                    {
                                        model: Users,
                                        attributes: [
                                            'id',
                                        ],
                                        include: [
                                            {
                                                model: Companies,
                                                attributes: [
                                                    'id',
                                                    'name',
                                                    'company_logo',
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
                group: [
                    'package_pricing.venue_service.user.company.id',
                ],
                order: [
                    [sequelize.fn('COUNT', sequelize.col('status')), 'DESC'],
                ],
            })

            const talentService = await Transactions.findAll({
                limit: 1,
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('status')), 'total_transactions'],
                ],
                where: {
                    status: 'COMPLETE',
                },
                include: [
                    {
                        model: PackagePricings,
                        attributes: [
                            'id',
                            'service_type',
                        ],
                        where: {
                            talentServiceId: {
                                [Op.not]: null,
                            },
                        },
                        include: [
                            {
                                model: TalentServices,
                                attributes: [
                                    'id',
                                ],
                                include: [
                                    {
                                        model: Users,
                                        attributes: [
                                            'id',
                                        ],
                                        include: [
                                            {
                                                model: Companies,
                                                attributes: [
                                                    'id',
                                                    'name',
                                                    'company_logo',
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
                group: [
                    'package_pricing.talent_service.user.company.id',
                ],
                order: [
                    [sequelize.fn('COUNT', sequelize.col('status')), 'DESC'],
                ],
            })

            const productSupply = await Transactions.findAll({
                limit: 1,
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('status')), 'total_transactions'],
                ],
                where: {
                    status: 'COMPLETE',
                },
                include: [
                    {
                        model: PackagePricings,
                        attributes: [
                            'id',
                            'service_type',
                        ],
                        where: {
                            productSupplyId: {
                                [Op.not]: null,
                            },
                        },
                        include: [
                            {
                                model: ProductSupplies,
                                attributes: [
                                    'id',
                                ],
                                include: [
                                    {
                                        model: Users,
                                        attributes: [
                                            'id',
                                        ],
                                        include: [
                                            {
                                                model: Companies,
                                                attributes: [
                                                    'id',
                                                    'name',
                                                    'company_logo',
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
                group: [
                    'package_pricing.product_supply.user.company.id',
                ],
                order: [
                    [sequelize.fn('COUNT', sequelize.col('status')), 'DESC'],
                ],
            })

            console.log("\n")
            console.log("eoService: ", eoService)
            console.log("\n")

            let result = []
            let service

            // Top 1 EO Service
            if (eoService.length > 0) {
                service = {
                    company_name: eoService[0].dataValues.package_pricing.dataValues.eo_service.dataValues.user.dataValues.company.dataValues.name,
                    company_logo: eoService[0].dataValues.package_pricing.dataValues.eo_service.dataValues.user.dataValues.company.dataValues.company_logo,
                    total_transactions: eoService[0].dataValues.total_transactions,
                    service_type: eoService[0].dataValues.package_pricing.dataValues.service_type,
                }

                result.push(service)
            } else {
                service = {
                    msg: `Transaction data of EO Service is empty`,
                    total_transactions: 0,
                    service_type: `EO`,
                }

                result.push(service)
            }

            // Top 1 Venue Service
            if (venueService.length > 0) {
                service = {
                    company_name: venueService[0].dataValues.package_pricing.dataValues.venue_service.dataValues.user.dataValues.company.dataValues.name,
                    company_logo: eoService[0].dataValues.package_pricing.dataValues.eo_service.dataValues.user.dataValues.company.dataValues.company_logo,
                    total_transactions: venueService[0].dataValues.total_transactions,
                    service_type: venueService[0].dataValues.package_pricing.dataValues.service_type,
                }

                result.push(service)
            } else {
                service = {
                    msg: `Transaction data of Venue Service is empty`,
                    total_transactions: 0,
                    service_type: `VENUE`,
                }

                result.push(service)
            }

            // Top 1 Talent Service
            if (talentService.length > 0) {
                service = {
                    company_name: talentService[0].dataValues.package_pricing.dataValues.talent_service.dataValues.user.dataValues.company.dataValues.name,
                    company_logo: eoService[0].dataValues.package_pricing.dataValues.eo_service.dataValues.user.dataValues.company.dataValues.company_logo,
                    total_transactions: talentService[0].dataValues.total_transactions,
                    service_type: talentService[0].dataValues.package_pricing.dataValues.service_type,
                }

                result.push(service)
            } else {
                service = {
                    msg: `Transaction data of Talent Service is empty`,
                    total_transactions: 0,
                    service_type: `TALENT`,
                }

                result.push(service)
            }

            // Top 1 Product Supply
            if (productSupply.length > 0) {
                service = {
                    company_name: productSupply[0].dataValues.package_pricing.dataValues.product_supply.dataValues.user.dataValues.company.dataValues.name,
                    company_logo: eoService[0].dataValues.package_pricing.dataValues.eo_service.dataValues.user.dataValues.company.dataValues.company_logo,
                    total_transactions: productSupply[0].dataValues.total_transactions,
                    service_type: productSupply[0].dataValues.package_pricing.dataValues.service_type,
                }

                result.push(service)
            } else {
                service = {
                    msg: `Transaction data of Product Supply is empty`,
                    total_transactions: 0,
                    service_type: `PRODUCT`,
                }

                result.push(service)
            }

            result.sort((a, b) => b.total_transactions - a.total_transactions)

            return res.status(200).json({
                result,
            })
        } catch (error) {
            return res.status(500).json({
                msg: error.message
            })
        }
    }

    static async listBiddingPartnerWithFilter(req, res) {
        const formattedDate = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`;
        try {
            let search = req.query.search || ""
            let isActive
            if (req.query.isActive === 'true') {
                isActive = true
            } else if (req.query.isActive === 'false') {
                isActive = false
            } else {
                isActive = [true, false]
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
                    total: items.length,
                }
            }

            //get bidding by id partner dan nampilkan tenderid
            const bidApp = await TenderRequests.findAll({
                where: {
                    is_active: isActive,
                    [Op.and]: [{
                        [Op.or]: [
                            sequelize.where(sequelize.fn('lower', sequelize.col('title')), {
                                [Op.like]: `%${search.toLowerCase().replace("%20", " ")}%`,
                            }),
                        ]
                    }]
                },
                include: [{
                    model: BidApplicantsModel,
                    include: {
                        model: Users,
                        as: 'partner',
                        where: {
                            id: req.params.partnerId
                        }
                    }
                }, {
                    model: Users,
                    as: 'stakeholder'
                }]
            })
                .then((data) => {
                    return data.map(result => {
                        let status
                        if (result.deadline < formattedDate) {
                            status = "Open Tender di Tutup"
                        } else if (result.deadline >= formattedDate) {
                            status = "Bidding di Ajukan"
                        }
                        return {
                            "name": result.title,
                            "user": result.stakeholder.fullname,
                            "status": status
                        }
                    })
                })

            // res.send(bidApp)
            res.status(200).json({
                search,
                isActive,
                dataAll: Paginator(bidApp, page, limit)
            })
        } catch (error) {
            res.status(400).json({
                msg: error.message
            })
        }
    }
}



module.exports = AdminKonectController