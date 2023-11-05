const express = require("express");
const { createTalent, updateActivatedTalentServiceById, getTalentDetail, getTalentWithoutLogin, getTalentWithLogin, talentStatistic, getListTalent, editTalent } = require("../controllers/Talent");
const verifyToken = require("../middleware/verifyToken");
const { CreateTalentRequestValidator, EditTalentRequestValidator } = require("../middleware/requestValidator");


const router = express.Router();

router.post('/k1/talent/create', [verifyToken, CreateTalentRequestValidator(), createTalent]);
router.get('/k1/talent/get-without-login', getTalentWithoutLogin);
router.get('/k1/talent/get-with-login', [verifyToken, getTalentWithLogin]);
router.post('/k1/talent/update-activated', [verifyToken, updateActivatedTalentServiceById])
router.get('/k1/talent', getTalentDetail);
router.get('/k1/talent/statistic', [verifyToken, talentStatistic]);
router.get('/k1/talent/ListTalent', [verifyToken, getListTalent]);
// router.put('/k1/talent/edit/:talentID', [verifyToken, editTalent]);
router.put('/k1/talent/edit/:talentID', [verifyToken, EditTalentRequestValidator(), editTalent]);


module.exports = router