const express = require("express");
const { createVenue, getVenueWithoutLogin, getVenueWithLogin, updateActivatedVenueServiceById, getVenueDetail, venueStatistic, listVenue, getVenueByID, getVenueImagesByVenueID, getPackagePricingsByVenueID, editVenue } = require("../controllers/Venue");
const verifyToken = require("../middleware/verifyToken");
const { CreateVenueRequestValidator, EditVenueRequestValidator } = require("../middleware/requestValidator");

const router = express.Router();


// router.post('/k1/venue/create', [verifyToken, createVenue]);
router.post('/k1/venue/create', [verifyToken, CreateVenueRequestValidator(), createVenue]);
router.get('/k1/venue/get-without-login', getVenueWithoutLogin);
router.get('/k1/venue/get-with-login', [verifyToken, getVenueWithLogin]);
router.get('/k1/venue', getVenueDetail);
router.post('/k1/venue/update-activated', [verifyToken, updateActivatedVenueServiceById]);
router.get('/k1/venue/statistic', [verifyToken, venueStatistic]);
router.get('/k1/venue/ListVenue', [verifyToken, listVenue]);
router.get('/k1/venue/:venueID', [verifyToken, getVenueByID]);
router.get('/k1/venue/images/:venueID', [verifyToken, getVenueImagesByVenueID]);
router.get('/k1/venue/package-pricings/:venueID', [verifyToken, getPackagePricingsByVenueID]);
router.put('/k1/venue/edit/:venueID', [verifyToken, EditVenueRequestValidator(), editVenue]);

module.exports = router