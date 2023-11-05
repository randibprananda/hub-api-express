const TenderRequests = require('../models/TenderRequestsModel');
const TenderImages = require('../models/TanderImagesModel');
const BidApplicantsModel = require('../models/BidApplicantModels');
const Users = require('../models/UsersModel');
const Roles = require('../models/RolesModel');
const Companies = require('../models/CompaniesModel');
const LegalDocuments = require('../models/LegalDocumentsModel');

const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const buildPaginator = require('pagination-apis');
const sequelize = require('sequelize');
const { Op } = require("sequelize");
const moment = require('moment');

const currentDate = new Date()


class TenderRequestsContoller {
    static async createTenderRequest(req, res) {
        const { title, description, deadline, partner_category, participant_estimate, implementation_estimate, budget_target, minimal_bidding, maksimal_partner, add_on, tender_images } = req.body
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })
        
        try {
            const tenderImages = []
            if (Array.isArray(tender_images)) {
                for (let i = 0; i < tender_images.length; i++) {
                    try {
                        // console.log(tender_images)
                        let parts = tender_images[i].split(';');
                        let imageData = parts[1].split(',')[1];

                        const img = new Buffer.from(imageData, 'base64')

                        const imageName = `konect-image-${Date.now()}.jpeg`

                        await sharp(img)
                            .resize(280, 175)
                            .toFormat("jpeg", { mozjpeg: true })
                            .jpeg({ quality: 100 })
                            .toFile(`./assets/images/tender/${imageName}`);

                        const tenderImage = {
                            // tenderRequestId: createTender.id,
                            image: `/assets/images/tender/${imageName}`
                        }
                        tenderImages.push(tenderImage);
                    } catch (error) {
                        return res.status(500).json({ msg: error.message })
                    }
                }
            } else {
                try{
                    let parts = tender_images.split(';');
                    let imageData = parts[1].split(',')[1];
    
                    const img = new Buffer.from(imageData, 'base64')
    
                    const imageName = `konect-image-${Date.now()}.jpeg`
    
                    await sharp(img)
                        .resize(280, 174)
                        .toFormat("jpeg", { mozjpeg: true })
                        .jpeg({ quality: 100 })
                        .toFile(`./assets/images/tender/${imageName}`);
    
                    const tenderImage = {
                        // tenderRequestId: createTender.id,
                        image: `/assets/images/tender/${imageName}`
                    }
                    tenderImages.push(tenderImage);
                } catch (error) {
                    return res.status(500).json({ msg: error.message })
                }
            }

            const createTender = await TenderRequests.create({
                title,
                description,
                deadline,
                participant_estimate,
                implementation_estimate,
                budget_target,
                minimal_bidding,
                maksimal_partner,
                add_on: add_on == '' || add_on == null ? null : add_on,
                partner_category: JSON.stringify(partner_category),
                stakeholderId: tokenDecode.userId,
                is_active: new Date(deadline) > new Date() ? true : false,
            })

            if (add_on != null) {
                await TenderRequests.update({
                    status_addOn: "pending"
                }, {
                    where: {
                        id: createTender.id
                    }
                })
            }

            for( let i = 0 ; i < tenderImages.length; i++){
                tenderImages[i].tenderRequestId = createTender.id;
            }

            TenderImages.bulkCreate(tenderImages)

            const showCreate = await TenderRequests.findOne({
                where: {
                    id: createTender.id
                },
                include: { model: TenderImages }
            })

            res.status(201).json({
                data: showCreate
            })

        } catch (error) {
            res.status(404).json({
                message: error.message
            })
        }
    }

    static async detailTenderRequest(req, res) {
        const tender = await TenderRequests.findOne({
            where: {
                id: req.query.id
            },
            include: [{
                model: Users,
                as: 'stakeholder'
            }, {
                model: TenderImages
            }]
        })

        if (!tender) {
            return res.status(404).json({ msg: `Tender Not Found` })
        }

        return res.status(200).json({ data: tender })
    }

    static async listTenderRequest(req, res) {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })

        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId
            },
            include: {
                model: Roles
            }
        })

        if (user.role.name === 'Partner') {
            const { rows, count } = await TenderRequests.findAndCountAll({
                limit,
                offset: skip,
                attributes: {
                    include: [
                        [sequelize.fn('DATEDIFF', sequelize.col('deadline'), currentDate), 'daysLeft'],
                    ],
                },
                where: {
                    stakeholderId: user.id,
                },
                include: [{
                    model: Users,
                    as: 'stakeholder',
                    attributes: {
                        exclude: [
                            'password',
                            'verification_code',
                        ],
                    },
                }, {
                    model: TenderImages
                },
                {
                    model: BidApplicantsModel,
                    attributes: [],
                },
                ]
            })

            if (count == 0) {
                return res.status(404).json({ msg: `Tender data is empty` })
            }

            const tenderResultWithBidApplicantsCount = rows.map((tender) => {
                const bidApplicantsCount = tender.dataValues.bid_applicants.length
                return { ...tender.toJSON(), bidApplicantsCount }
            })

            return res.status(200).json(paginate(tenderResultWithBidApplicantsCount, count))
        }

        if (user.role.name === 'Stakeholder') {
            const { rows, count } = await TenderRequests.findAndCountAll({
                limit,
                offset: skip,
                attributes: {
                    include: [
                        [sequelize.fn('DATEDIFF', sequelize.col('deadline'), currentDate), 'daysLeft'],
                    ],
                },
                where: {
                    stakeholderId: tokenDecode.userId
                },
                include: [
                    {
                        model: Users,
                        as: 'stakeholder',
                        attributes: {
                            exclude: [
                                'password',
                                'verification_code',
                            ],
                        },
                    },
                    {
                        model: TenderImages
                    },
                    {
                        model: BidApplicantsModel,
                        attributes: [
                            'id',
                        ],
                    },
                ]
            })

            if (count == 0) {
                return res.status(404).json({ msg: `Tender data is empty` })
            }

            const tenderResultWithBidApplicantsCount = rows.map((tender) => {
                const bidApplicantsCount = tender.dataValues.bid_applicants.length
                return { ...tender.toJSON(), bidApplicantsCount }
            })

            return res.status(200).json(paginate(tenderResultWithBidApplicantsCount, count))
        }

        return res.status(405).json({ msg: `You Not Allowed` })
    }

    // get tender's list on homepage without authorization
    static async getTenderList(req, res) {
        const { limit, skip, paginate } = buildPaginator({ page: req.query.page, limit: req.query.limit })
        try {
            const tenderResult = await TenderRequests.findAll({
                // limit: limit,
                // offset: skip,
                attributes: {
                    include: [
                        [sequelize.fn('DATEDIFF', sequelize.col('deadline'), currentDate), 'daysLeft'],
                    ],
                },
                include: [{
                    model: Users,
                    as: 'stakeholder',
                    attributes: {
                        exclude: [
                            'password',
                            'verification_code',
                        ],
                    },
                },
                {
                    model: TenderImages,
                },
                {
                    model: BidApplicantsModel,
                },
                ],
            })

            // return res.status(200).json(Paginator(tenderResult, page, limit))
            if (tenderResult.count == 0) {
                return res.status(204).json({ msg: `Tender data is empty` })
            }
            
            const tenderResultWithBidApplicantsCount = tenderResult.map((tender) => {
                const bidApplicantsCount = tender.dataValues.bid_applicants.length
                return { ...tender.toJSON(), bidApplicantsCount }
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
            
            
            return res.status(200).json(Paginator(tenderResultWithBidApplicantsCount, page, limit))
        } catch (error) {
            res.status(500).json({ msg: error.message })
        }
    }

    // get detail of tender for tender request
    static async getTenderDetailById(req, res) {
        try {
            const tenderID = req.params["tenderID"]
            if (tenderID === "" || tenderID == null) return res.status(400).json({ msg: `Tender id can not be empty!` })

            const tenderData = await TenderRequests.findOne({
                where: {
                    id: tenderID
                },
                attributes: {
                    include: [
                        [sequelize.fn('DATEDIFF', sequelize.col('deadline'), currentDate), 'daysLeft'],
                    ],
                },
                include: [{
                    model: Users,
                    as: 'stakeholder',
                    attributes: {
                        exclude: [
                            'password',
                            'verification_code',
                        ],
                    },
                },
                {
                    model: TenderImages,
                },
                {
                    model: BidApplicantsModel,
                    attributes: [
                        ['bidding', 'nominal_bidding'],
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
                                ['name', 'company_name']
                            ],
                        }],
                    }],
                },
                ],
                order: [
                    [BidApplicantsModel, 'bidding', 'DESC'],
                ],
            })

            if (!tenderData) return res.status(404).json({ msg: `Tender with ID [${tenderID}] not nound` })

            return res.status(200).json({
                tenderData,
            })
        } catch (error) {
            res.status(500).json({ msg: error.message })
        }
    }

    // get detail of tender for "Informasi Tender" tab in Admin Konect
    static async getTenderInformationById(req, res) {
        try {
            const tenderID = req.params["tenderID"]
            if (tenderID === "" || tenderID == null) return res.status(400).json({ msg: `Tender id can not be empty!` })

            const tenderData = await TenderRequests.findOne({
                where: {
                    id: tenderID
                },
                attributes: [
                    'id',
                    'title',
                    'is_active',
                    'description',
                    'participant_estimate',
                    'implementation_estimate',
                    'budget_target',
                    'maksimal_partner',
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

            if (!tenderData) return res.status(404).json({ msg: `Tender with ID [${tenderID}] not nound` })

            const bidApplicantsCount = await BidApplicantsModel.count({
                where: {
                    tenderRequestId: tenderID,
                }
            })

            return res.status(200).json({
                tenderData,
                bidApplicantsCount,
            })
        } catch (error) {
            res.status(500).json({ msg: error.message })
        }
    }

    static async getListPartner(req, res) {
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

            if (user.role.name !== 'Stakeholder') {
                return res.status(405).json({ msg: `You don't have access` })
            }

            const tenderID = req.query.tenderId
            if (tenderID === "" || tenderID == null) return res.status(400).json({ msg: `Tender id can not be empty!` })

            const rows = []
            const count = await BidApplicantsModel.count({
                where: {
                    tenderRequestId: tenderID
                }
            })

            await BidApplicantsModel.findAndCountAll({
                where: {
                    tenderRequestId: tenderID
                },
                attributes: ['bidding', 'createdAt', 'status', 'id'],
                include: {
                    model: Users,
                    as: 'partner',
                    attributes: {
                        exclude: [
                            'password',
                            'verification_code'
                        ],
                    },
                    include: {
                        model: Companies,
                        include: {
                            model: Users,
                            include: {
                                model: Roles,
                                where: {
                                    name: {
                                        [Op.in]: ['Event Organizer', 'Venue', 'Supplier', 'Talent'],
                                    }
                                },
                                attributes: ['name']
                            }
                        },
                    }
                },
                order: [
                    ['bidding', 'DESC']
                ],
            })
                .then((result) => {
                    return result.rows.map((data) => {
                        rows.push({
                            "company_id": data.partner.company.id,
                            "company_name": data.partner.company.name,
                            "company_address": data.partner.company.province,
                            "company_logo": data.partner.company.company_logo,
                            "company_type": data.partner.company.type,
                            "status": data.status,
                            "idBidApp": data.id,
                            "company_service": data.partner.company.users.map((dataService) => { return dataService.role.name }),
                            "bidding_value": data.bidding,
                            "date": moment(data.createdAt).format('DD MMMM YYYY')
                        })
                    })
                })

            return res.status(200).json({
                count,
                data: rows
            });
        } catch (error) {
            res.status(500).json({ msg: error.message })
        }
    }

    static async getCompanyDetail(req, res) {
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

            if (user.role.name !== 'Stakeholder') {
                return res.status(405).json({ msg: `You don't have access` })
            }

            const companyId = req.query.companyId
            if (companyId === "" || companyId == null) return res.status(400).json({ msg: `Company id can not be empty!` })

            const company = await Companies.findOne({
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                },
                where: {
                    id: companyId
                },
                include: {
                    model: LegalDocuments,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'companyId']
                    }
                }
            })

            if (!company) {
                return res.status(404).json({ msg: "Company not found" })
            }

            return res.status(200).json({
                data: company
            });
        } catch (error) {
            res.status(500).json({ msg: error.message })
        }
    }

    static async timlineTender(req, res) {
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

            if (user.role.name !== 'Admin') {
                return res.status(405).json({ msg: `You don't have access` })
            }

            const data = await TenderRequests.findAll({
                where: {
                    id: req.query.tenderId,
                },
                attributes: ["createdAt", "deadline"],
                include: {
                    model: BidApplicantsModel,
                    where: {
                        status: true
                    }
                }
            })

            return res.status(200).json({ data: data })
        } catch (error) {
            res.status(500).json({
                message: error.message
            })
        }
    }

    static async timlineTenderVerifed(req, res) {
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

            if (user.role.name !== 'Admin') {
                return res.status(405).json({ msg: `You don't have access` })
            }

            const data = await TenderRequests.findAll({
                where: {
                    id: req.query.tenderId,
                },
                attributes: ["id", "createdAt", "deadline", "add_on", "status_addOn"],
                include: {
                    model: BidApplicantsModel,
                    where: {
                        status: true
                    },
                    include: {
                        model: Users,
                        as: 'partner',
                        attributes: ['fullname'],
                        include: {
                            model: Companies
                        }
                    }
                }
            })

            if (data.length === 0) {
                const data = await TenderRequests.findAll({
                    where: {
                        id: req.query.tenderId,
                    },
                    attributes: ["createdAt", "deadline", "add_on", "status_addOn"],
                    // include: {
                    //     model: BidApplicantsModel,
                    //     where: {
                    //         status: true
                    //     },
                    //     include: {
                    //         model: Users,
                    //         as: 'partner',
                    //         attributes: ['fullname'],
                    //         include: {
                    //             model: Companies
                    //         }
                    //     }
                    // }
                })
                return res.status(200).json({ admin: user.fullname, data: data })
            } else {
                return res.status(200).json({ admin: user.fullname, data: data })
            }
            // console.log(data === [])
            // res.send(data.length === 0)
        } catch (error) {
            res.status(500).json({
                message: error.message
            })
        }
    }

    static async approveAddOn(req, res) {
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

            if (user.role.name !== 'Admin') {
                return res.status(405).json({ msg: `You don't have access` })
            }

            const data = await TenderRequests.update({
                status_addOn: "approved",
                is_assisted: true,
            }, {
                where: {
                    id: req.query.tenderId,
                }
            })

            return res.status(200).json({ msg: "Success to aprove the add on!", status: data })
        } catch (error) {
            res.status(500).json({
                message: error.message
            })
        }
    }

    static async submitPartner(req, res) {
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

            if (user.role.name !== 'Stakeholder') {
                return res.status(405).json({ msg: `You don't have access` })
            }
            const dataPartner = req.body.idBidApp

            dataPartner.forEach(async (data) => {
                console.log(data)
                await BidApplicantsModel.update({
                    status: req.body.status
                }, {
                    where: {
                        id: data,
                        tenderRequestId: req.query.tenderId
                    }
                })
            });

            // res.send(dataPartner) 

            // for(let i = 0; i < dataPartner.length; i++){
            //         await BidApplicantsModel.update({
            //             status: true
            //         },{
            //             where: {
            //                 id: dataPartner[i].idBidApp,
            //                 tenderRequestId: req.query.tenderId
            //             }
            //         })
            // }

            return res.status(200).json({ msg: "Sucess Submit Partner" })

        } catch (error) {
            res.status(500).json({
                message: error.message
            })
        }
    }
}


module.exports = TenderRequestsContoller