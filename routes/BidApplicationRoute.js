const express = require("express");
const BidApplicantController = require("../controllers/BidApplicationController");
const verifyToken = require("../middleware/verifyToken");
const { createBidValidate } = require("../middleware/requestValidator");


const router = express.Router();

router.post('/k1/bidapplication/create', [verifyToken, createBidValidate(), BidApplicantController.createBid]);

module.exports = router