const jwt = require("jsonwebtoken");
const sharp = require("sharp");

const BiddingRequest = require("../models/BiddingRequestModel");
const Users = require("../models/UsersModel");
const TenderRequests = require("../models/TenderRequestsModel");
const Transactions = require("../models/TransactionsModel");
const BidApplicantsModel = require("../models/BidApplicantModels");
const Roles = require("../models/RolesModel");
const Companies = require("../models/CompaniesModel");

const createBidding = async (req, res, next) => {
    const {
        title,
        description,
        image,
        budget_minimum,
        budget_maximum,
        maximum_applicants,
        expired_at,
        status
    } = req.body
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const bidding = await BiddingRequest.create({
            title,
            description,
            budgetMinimum: budget_minimum,
            budgetMaximum: budget_maximum,
            maximumApplicants: maximum_applicants,
            expiredAt: expired_at,
            status,
            stakeholderId: tokenDecode.userId,
        })

        if (typeof image !== 'undefined') {
            let parts = image.split(';');
            let imageData = parts[1].split(',')[1];

            const img = new Buffer.from(imageData, 'base64')

            const imageName = `konect-image-${Date.now()}.jpeg`

            await sharp(img)
                .resize(280, 174)
                .toFormat("jpeg", { mozjpeg: true })
                .jpeg({ quality: 100 })
                .toFile(`./assets/images/stakeholder/bidding/${imageName}`);

            await BiddingRequest.update({
                image: `/assets/images/stakeholder/bidding/${imageName}`
            }, {
                where: {
                    id: bidding.id
                }
            })
        }

        const newBidding = await BiddingRequest.findOne({ where: { id: bidding.id } })

        return res.status(201).json(newBidding);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getBidding = async (req, res, next) => {
    try {
        if (typeof req.cookies.refreshToken === 'undefined') {
            const all = await BiddingRequest.findAll({
                include: {
                    model: Users,
                    as: 'stakeholder'
                }
            })
            return res.status(200).json({ data: all });
        }

        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const user = await Users.findOne({
            where: {
                id: tokenDecode.userId
            }
        })

        const all = await TenderRequests.findAll({
            where: {
                stakeholderId: user.id
            },
            include: {
                model: Users,
                as: 'stakeholder'
            }
        })
        return res.status(200).json({ data: all });
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getBiddingDetail = async (req, res, next) => {
    try {
        const biddingId = req.params["id"]

        const result = await TenderRequests.findOne({
            where: {
                id: biddingId
            },
            include: {
                model: Users,
                as: 'stakeholder'
            }
        })

        if (!result) {
            return res.status(404).json({ msg: `Bidding data with ID = [${biddingId}] not found!` })
        }

        const bidCount = await BidApplicantsModel.count({
            where: {
                tenderRequestId: biddingId,
            },
        })

        result.dataValues.bid_applicants_count = bidCount
        if (result.maksimal_partner == result.bid_applicants_count) {
            result.dataValues.is_achieved = true
        } else {
            result.dataValues.is_achieved = false
        }

        return res.status(200).json({ data: result })
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

// Get list of stakeholder (id and fullname)
const getStakeholderList = async (req, res, next) => {
    try {
        const stakeholder = await Users.findAndCountAll({
            attributes: [
                'id',
                'fullname',
            ],
            // as: 'stakeholder',
            order: [
                ['fullname', 'ASC'],
            ],
            include: [
                {
                    model: Roles,
                    where: {
                        name: 'Stakeholder',
                    },
                    attributes: [
                        // 'name',
                    ]
                },
                {
                    model: Companies,
                    attributes: [
                        'id',
                        'name',
                    ],
                },
            ],
        })

        if (!stakeholder) {
            return res.status(404).json({ msg: `Stakeholder data not found!` })
        } else {
            return res.status(200).json({ stakeholder })
        }
    } catch (error) {
        res.status(500).json({ msg: `Failed to get stakeholder data from database!\n${error.message}` })
    }
}

// Get stakeholder's statistic for statistic card on stakeholder dashboard profile
const getStakeholderStatistic = async (req, res) => {
    try {
        const tokenDecode = jwt.verify(req.cookies.refreshToken, process.env.REFRESH_TOKEN_SECRET, (error, decoded) => {
            if (error) return res.sendStatus(403);
            return decoded
        })

        const transactionCount = await Transactions.count({
            where: {
                clientId: tokenDecode.userId,
            },
        })

        const tender = await TenderRequests.findAndCountAll({
            where: {
                stakeholderId: tokenDecode.userId,
            },
            attributes: [
                'id',
            ],
        })

        const tenderIds = tender.rows.map(t => t.id)

        const bidCount = await BidApplicantsModel.count({
            where: {
                tenderRequestId: tenderIds,
            },
        })

        return res.status(200).json({
            message: `Success to get stakeholder's statistic data`,
            booked_service_count: transactionCount,
            tender_count: tender.count,
            bidding_count: bidCount,
        })
    } catch (error) {
        return res.status(500).json({
            error: `Failed to get stakeholder's statistic data`,
            msg: error.message,
        })
    }
}

module.exports = { createBidding, getBidding, getBiddingDetail, getStakeholderList, getStakeholderStatistic }