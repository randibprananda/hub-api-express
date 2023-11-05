const express = require("express");
const TransactionController = require("../controllers/TransactionController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.post('/k1/transaction/create', [verifyToken, TransactionController.createTransaction]);
router.get('/k1/transaction/by', [verifyToken, TransactionController.getIdTransaction]);
router.get('/k1/transaction', [verifyToken, TransactionController.getListTransaction]);
router.delete('/k1/transaction/:transactionId', [verifyToken, TransactionController.deleteTransactionByTransactionId]);
router.put('/k1/transaction/:transactionId', [verifyToken, TransactionController.editTransaction]);
router.post('/k1/invoice_webhook_url', TransactionController.webhookPaymentXendit)

module.exports = router