const express = require("express")
const { GetServiceCategories, SearchServices, GetServiceDetails, CreateService, } = require("../controllers/Services")
const verifyToken = require("../middleware/verifyToken.js");
const { createServiceValidator } = require("../middleware/requestValidator");

const router = express.Router()

router.get('/k1/service-categories', GetServiceCategories)
router.post('/k1/services', SearchServices)
router.get('/k1/services/:service_type/:id', GetServiceDetails)
router.post('/k1/create-service', [verifyToken ,createServiceValidator(), CreateService]);

module.exports = router