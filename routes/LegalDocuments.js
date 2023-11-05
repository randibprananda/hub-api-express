const express = require("express");
const { getLegalDocuments, getLegalDocumentsById, createLegalDocuments, updateLegalDocuments, deleteLegalDocuments, getLegalDocumentsByCompanyId } = require("../controllers/LegalDocuments.js");
const verifyToken = require("../middleware/verifyToken.js");

const router = express.Router();

router.get('/k1/legal-documents', [verifyToken, getLegalDocuments]);
router.get('/k1/legal-documents/:id', [verifyToken, getLegalDocumentsById]);
router.get('/k1/legal-documents/company/:companyId', [verifyToken, getLegalDocumentsByCompanyId]);
router.post('/k1/legal-documents/create', [verifyToken, createLegalDocuments]);
router.patch('/k1/legal-documents/:id', [verifyToken, updateLegalDocuments]);
router.delete('/k1/legal-documents/:id', [verifyToken, deleteLegalDocuments]);

module.exports = router