const express = require("express");
const { createProduct, getProductWithoutLogin, getProductWithLogin, getProductDetail, updateActivatedProductSupplyById, productStatistic, editProductSupply, getListSupply } = require("../controllers/ProductSupply");
const verifyToken = require("../middleware/verifyToken");
const { CreateProductRequestValidator, EditProductRequestValidator } = require("../middleware/requestValidator");


const router = express.Router();

router.post('/k1/product/create', [verifyToken, CreateProductRequestValidator(), createProduct]);
router.get('/k1/product/get-without-login', getProductWithoutLogin);
router.get('/k1/product/get-with-login', [verifyToken, getProductWithLogin]);
router.get('/k1/product', getProductDetail);
router.post('/k1/product/update-activated', [verifyToken, updateActivatedProductSupplyById]);
router.get('/k1/product/statistic', [verifyToken, productStatistic]);
// router.put('/k1/product/edit/:productID', [verifyToken, editProductSupply]);
router.put('/k1/product/edit/:productID', [verifyToken, EditProductRequestValidator(), editProductSupply]);
router.get('/k1/product/ListSupply', [verifyToken, getListSupply]); 

module.exports = router