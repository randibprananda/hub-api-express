const express = require("express");
const { createEO, updateActivatedEOServiceById, getEOTransaction, getEODetail, getEOWithoutLogin, getEOWithLogin, eoStatistic, getEOByID, getPackagePricingsByEOID, getEOImagesByEOID, editEO, getListEO } = require("../controllers/EventOrganizer");
const verifyToken = require("../middleware/verifyToken");
const { CreateEORequestValidator, EditEORequestValidator } = require("../middleware/requestValidator");


const router = express.Router();

// router.post('/k1/eo/create', [verifyToken, createEO]);
router.post('/k1/eo/create', [verifyToken, CreateEORequestValidator(), createEO]);
router.get('/k1/eo/get-without-login', getEOWithoutLogin);
router.get('/k1/eo/get-with-login', [verifyToken, getEOWithLogin]);
router.get('/k1/eo', getEODetail);
router.get('/k1/eo/ListEo', [verifyToken, getListEO]);  
router.post('/k1/eo/update-activated', [verifyToken, updateActivatedEOServiceById]);
router.get('/k1/eo/transaction', [verifyToken, getEOTransaction]);
router.get('/k1/eo/statistic', [verifyToken, eoStatistic]);
router.get('/k1/eo/:eoID', [verifyToken, getEOByID]);
router.get('/k1/eo/package-pricings/:eoID', [verifyToken, getPackagePricingsByEOID]);
router.get('/k1/eo/images/:eoID', [verifyToken, getEOImagesByEOID]);
// router.put('/k1/eo/edit/:eoID', [verifyToken, editEO]);
router.put('/k1/eo/edit/:eoID', [verifyToken, EditEORequestValidator(), editEO]);

module.exports = router