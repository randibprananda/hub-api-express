const TenderRequestsContoller = require("../controllers/TenderRequestController")
const AdminKonectController = require("../controllers/AdminKonectController")
const { getStakeholderList } = require("../controllers/Stakeholder")
const { getPartnerDetail } = require("../controllers/Partner")
const { getArticles, createArticle, getArticleById, updateArticle, deleteArticle,getArticlesByCategory, getArticleBySlug } = require("../controllers/ArticleController")
const { createArticleValidator } = require("../middleware/requestValidator");

const verifyToken = require("../middleware/verifyToken")
const { IsAdmin } = require('../middleware/roleChecker')

const express = require("express")
const router = express.Router()


router.get('/k1/admin-konect/card-dashboard', [verifyToken, IsAdmin, AdminKonectController.getDashboardCard])
router.get('/k1/admin-konect/statistic-dashboard', [verifyToken, IsAdmin, AdminKonectController.getStatistic])
router.get('/k1/admin-konect/top4-dashboard', [verifyToken, IsAdmin, AdminKonectController.getTop4CompanyTransactions])
router.get('/k1/admin-konect/bidding-partner/:partnerId', [verifyToken, IsAdmin, AdminKonectController.listBiddingPartnerWithFilter])

router.get('/k1/admin-konect/tender', [verifyToken, IsAdmin, AdminKonectController.getTenderListAdminKonect])
router.get('/k1/admin-konect/tender/:tenderID', [verifyToken, IsAdmin, TenderRequestsContoller.getTenderInformationById])

router.get('/k1/admin-konect/stakeholder', [verifyToken, IsAdmin, AdminKonectController.getStakeholderListAdminKonect])
router.get('/k1/admin-konect/stakeholder/list', [verifyToken, IsAdmin, getStakeholderList])
router.get('/k1/admin-konect/stakeholder/:id', [verifyToken, IsAdmin, AdminKonectController.getStakeholderDetail])
router.get('/k1/admin-konect/update-stakeholder/:id', [verifyToken, IsAdmin, AdminKonectController.editStakeholder])
router.put('/k1/admin-konect/activation-stakeholder/:id', [verifyToken, IsAdmin, AdminKonectController.activationStakeholder])

router.get('/k1/admin-konect/partner/:partnerId', [verifyToken, IsAdmin, getPartnerDetail])
router.get('/k1/admin-konect/partner-filter', [verifyToken, IsAdmin, AdminKonectController.partnerWithFilter])
router.get('/k1/admin-konect/detail-partner/:companyId', [verifyToken, IsAdmin, AdminKonectController.detailPartnerAdmin])
router.get('/k1/admin-konect/layanan-partner/:partnerId', [verifyToken, IsAdmin, AdminKonectController.listLayananPertnerWithFilter])
router.put('/k1/admin/activation-partner/:id', [verifyToken, AdminKonectController.activationPartner])

router.get('/k1/admin-konect/transaction', [verifyToken, IsAdmin, AdminKonectController.getTransactionsList])
router.get('/k1/admin-konect/transaction/:transactionId', [verifyToken, IsAdmin, AdminKonectController.getTransactionsDetailById])
router.get('/k1/admin-konect/transactions/companies', [verifyToken, IsAdmin, AdminKonectController.getCompaniesName])
router.put('/k1/admin-konect/transaction/:transactionId', [verifyToken, IsAdmin, AdminKonectController.updateTransactionbyId])



router.get('/k1/admin-konect/get-article', [getArticles])
router.get('/k1/admin-konect/get-article-bySlug/:articleSlug', [getArticleBySlug])
router.get('/k1/admin-konect/get-article-by-category/:category', [getArticlesByCategory])
router.post('/k1/admin-konect/create-article', [verifyToken, IsAdmin, createArticleValidator(), createArticle])
router.get('/k1/admin-konect/get-article/:articleId', [getArticleById])
router.put('/k1/admin-konect/update-article/:articleId', [verifyToken, IsAdmin, createArticleValidator(), updateArticle])
router.delete('/k1/admin-konect/delete-article/:articleId', [verifyToken, IsAdmin, deleteArticle])


module.exports = router