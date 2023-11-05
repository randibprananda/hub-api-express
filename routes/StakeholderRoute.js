const express = require("express");
const { createBidding, getBidding, getBiddingDetail, getStakeholderList, getStakeholderStatistic } = require("../controllers/Stakeholder");
const verifyToken = require("../middleware/verifyToken");
const { IsStakeholder } = require('../middleware/roleChecker')
const TransactionController = require("../controllers/TransactionController");

const router = express.Router();

router.post('/k1/stakeholder/create-bidding', [verifyToken, createBidding]);
router.get('/k1/stakeholder/bidding', getBidding);
router.get('/k1/stakeholder/bidding/:id', getBiddingDetail);
router.get('/k1/stakeholder/statistics', [verifyToken, IsStakeholder, getStakeholderStatistic]);
router.get('/k1/stakeholder/history-transaction', [verifyToken, IsStakeholder, TransactionController.historyTransactionStakeholder]);

module.exports = router