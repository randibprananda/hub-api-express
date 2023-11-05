const {
    partnerStatistic,
    getPartnerTransactionReport,
    getPartnerBiddingHistoryList,
    getPartnerBiddingHistoryDetail,
    getPartnerServices,
    getTransactionListOfPartner,
} = require("../controllers/Partner")

const verifyToken = require("../middleware/verifyToken")
const { IsPartner } = require('../middleware/roleChecker')

const express = require("express")
const router = express.Router();

router.get('/k1/partner/statistic', [verifyToken, partnerStatistic])
router.get('/k1/partner/transaction-report', [verifyToken, IsPartner, getPartnerTransactionReport])
router.get('/k1/partner/transaction-list/:partnerId', [verifyToken, IsPartner, getTransactionListOfPartner])
router.get('/k1/partner/bidding-histories', [verifyToken, IsPartner, getPartnerBiddingHistoryList])
router.get('/k1/partner/bidding-histories/:tenderId', [verifyToken, IsPartner, getPartnerBiddingHistoryDetail])
router.get('/k1/partner/services', [verifyToken, IsPartner, getPartnerServices])

module.exports = router