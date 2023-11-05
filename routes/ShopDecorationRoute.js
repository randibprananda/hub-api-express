const ShopDecorationController = require("../controllers/ShopDecorationController")

const verifyToken = require("../middleware/verifyToken")
const { IsPartner } = require('../middleware/roleChecker')
const {
    AddBannerRequestValidator,
    EditBannerRequestValidator,
    EditServiceHighlightRequestValidator,
} = require('../middleware/requestValidator')

const express = require("express")
const router = express.Router()

router.post('/k1/partner/shop-decorations/add-banner', [verifyToken, IsPartner, AddBannerRequestValidator(), ShopDecorationController.CreateBanner])
router.get('/k1/partner/shop-decorations/banners', [verifyToken, IsPartner, ShopDecorationController.GetBanners])
router.put('/k1/partner/shop-decorations/edit-banner/:bannerId', [verifyToken, IsPartner, EditBannerRequestValidator(), ShopDecorationController.EditBanner])
router.delete('/k1/partner/shop-decorations/delete-banner/:bannerId', [verifyToken, IsPartner, ShopDecorationController.DeleteBanner])
router.get('/k1/partner/shop-decorations', [verifyToken, IsPartner, ShopDecorationController.GetServiceHighlights])
router.put('/k1/partner/shop-decorations/edit-service-highlights', [verifyToken, IsPartner, EditServiceHighlightRequestValidator(), ShopDecorationController.EditServiceHighlights])
router.put('/k1/partner/shop-decorations/edit-about-us', [verifyToken, IsPartner, ShopDecorationController.EditAboutUs])
router.get('/k1/partner/get-decoration/:partnerId', [verifyToken, IsPartner, ShopDecorationController.gethighlights])
router.get('/k1/partner/get-all-product/:partnerId', [verifyToken, IsPartner, ShopDecorationController.getAllProductServiceByPartnerId])
router.get('/k1/partner/cardInfo/:partnerId', [verifyToken, IsPartner, ShopDecorationController.cardInfo])
router.get('/k1/partner/shop-decorations/image-banners', [verifyToken, IsPartner, ShopDecorationController.bannerImage])

module.exports = router