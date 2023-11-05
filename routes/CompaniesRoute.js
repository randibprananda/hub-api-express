const express = require("express");
const { getCompanies, getCompaniesById, createCompanies, updateCompanies, deleteCompanies } = require("../controllers/Companies.js");
const verifyToken = require("../middleware/verifyToken.js");
const { EditCompanyRequestValidator } = require("../middleware/requestValidator");

const router = express.Router();

router.get('/k1/companies', [verifyToken, getCompanies]);
router.get('/k1/companies/:id', [verifyToken, getCompaniesById]);
router.post('/k1/companies/create', [verifyToken, createCompanies]);
router.patch('/k1/companies/:id', [verifyToken, EditCompanyRequestValidator(), updateCompanies]);
router.delete('/k1/companies/:id', [verifyToken, deleteCompanies]);

module.exports = router