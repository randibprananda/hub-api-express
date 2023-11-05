const express = require("express");
const TenderRequestsContoller = require("../controllers/TenderRequestController");
const verifyToken = require("../middleware/verifyToken");
const { CreateTenderRequestValidator } = require("../middleware/requestValidator");


const router = express.Router();

router.get('/k1/tender/timeLine', [verifyToken, TenderRequestsContoller.timlineTender])
router.get('/k1/tender/list-partner', [verifyToken, TenderRequestsContoller.getListPartner]);
router.get('/k1/tender/timeLineVerifed', [verifyToken, TenderRequestsContoller.timlineTenderVerifed])
router.post('/k1/tender/approvedAddOn', [verifyToken, TenderRequestsContoller.approveAddOn])
router.post('/k1/tender/submitPartner', [verifyToken, TenderRequestsContoller.submitPartner])
router.post('/k1/tender/create', [verifyToken, CreateTenderRequestValidator(), TenderRequestsContoller.createTenderRequest]);
router.get('/k1/tender/detail', [verifyToken, TenderRequestsContoller.detailTenderRequest]);
router.get('/k1/tender/list', [verifyToken, TenderRequestsContoller.listTenderRequest]);
router.get('/k1/tender/detail-company', [verifyToken, TenderRequestsContoller.getCompanyDetail]);
router.get('/k1/tender', TenderRequestsContoller.getTenderList);
router.get('/k1/tender/:tenderID', TenderRequestsContoller.getTenderDetailById);

module.exports = router