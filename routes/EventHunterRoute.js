const express = require("express");
const { getBookingService, getFinishedService, getAllService, getServiceById, getHistoryStatService} = require("../controllers/EventHunter");
const verifyToken = require("../middleware/verifyToken");
const { IsEventHunter } = require('../middleware/roleChecker')
const TransactionController = require("../controllers/TransactionController");

const router = express.Router();

router.get('/k1/event-hunter/service-booking', [verifyToken, getBookingService]);
router.get('/k1/event-hunter/service-finish', [verifyToken, getFinishedService]);
router.get('/k1/event-hunter/service-all', [verifyToken, getAllService]);
router.get('/k1/event-hunter/service/:id', [verifyToken, getServiceById]);
router.get('/k1/event-hunter/service-history-statistic',[verifyToken,getHistoryStatService])
router.get('/k1/event-hunter/history-transaction', [verifyToken, IsEventHunter, TransactionController.historyTransactionEventHunter]);

module.exports = router