const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');
// const BiddingRequest = require('./BiddingRequestModel.js');
const Companies = require('./CompaniesModel.js');
const EOImages = require('./EOImagesModel.js');
const EOServices = require('./EOServicesModel.js');
const PackagePricings = require('./PackagePricingsModel.js');
const ProductImages = require('./ProductImagesModel.js');
const ProductSupplies = require('./ProductSuppliesModel.js');
const Roles = require('./RolesModel.js');
const TalentImages = require('./TalentImagesModel.js');
const TalentServices = require('./TalentServicesModel.js');
// const TenderApplicants = require('./TenderApplicantsModel.js');
const TenderRequests = require('./TenderRequestsModel.js');
const Transactions = require('./TransactionsModel.js');
const VenueImages = require('./VenueImagesModel.js');
const VenueServices = require('./VenueServicesModel.js');
const TenderImages = require('./TanderImagesModel.js')
const TenderRequestsModel = require('./TenderRequestsModel.js')
const BidApplicantsModel = require('./BidApplicantModels.js');
const ShopDecoration = require('./ShopDecorationsModel.js');
const Banners = require('./BannersModel.js');
const BannerImages = require('./BannerImagesModel.js');

const {DataTypes} = Sequelize;


const Users = db.define('users',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    fullname: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Username can't be empty"
            },
            notNull: {
                args: true,
                msg: "Username can't be null"
            }
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Email can't be empty"
            },
            notNull: {
                args: true,
                msg: "Email can't be null"
            }
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Password can't be empty"
            },
            notNull: {
                args: true,
                msg: "Password can't be null"
            }
        }
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    verification_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    roleId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
    },
    adminId: {
        type: DataTypes.UUID,
        defaultValue: null,
        allowNull: true,
    },
    companyId: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
    },
    is_active: { // status user itu aktif atau tidak
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        validate: {
            notEmpty: {
                args: true,
                msg: "Active Status can't be empty"
            },
            notNull: {
                args: true,
                msg: "Active Status can't be null"
            }
        },
    },
}, {
    freezeTableName: true
});

Roles.hasMany(Users, {foreignKey: 'roleId'})
Users.belongsTo(Roles, {targetKey: 'id'})

Users.hasMany(Users, {foreignKey: 'adminId'})
Users.belongsTo(Users, {as:'admin', targetKey: 'id'})

Companies.hasMany(Users, { foreignKey: 'companyId' })
Users.belongsTo(Companies, {targetKey: 'id'})

Users.hasMany(VenueServices, {foreignKey: 'userId'})
VenueServices.belongsTo(Users, {targetKey: 'id'})

VenueServices.hasMany(VenueImages, {foreignKey: 'venueServiceId'})
VenueImages.belongsTo(VenueServices, {targetKey: 'id'})

Users.hasMany(TalentServices, {foreignKey: 'userId'})
TalentServices.belongsTo(Users, {targetKey: 'id'})

TalentServices.hasMany(TalentImages, {foreignKey: 'talentServiceId'})
TalentImages.belongsTo(TalentServices, {targetKey: 'id'})

Users.hasMany(ProductSupplies, {foreignKey: 'userId'})
ProductSupplies.belongsTo(Users, {targetKey: 'id'})

ProductSupplies.hasMany(ProductImages, {foreignKey: 'productSupplyId'})
ProductImages.belongsTo(ProductSupplies, {targetKey: 'id'})

Users.hasMany(EOServices, {foreignKey: 'userId'})
EOServices.belongsTo(Users, {targetKey: 'id'})

EOServices.hasMany(EOImages, {foreignKey: 'eoServiceId'})
EOImages.belongsTo(EOServices, {targetKey: 'id'})

VenueServices.hasMany(PackagePricings)
PackagePricings.belongsTo(VenueServices, {targetKey: 'id'})

TalentServices.hasMany(PackagePricings)
PackagePricings.belongsTo(TalentServices, {targetKey: 'id'})

ProductSupplies.hasMany(PackagePricings)
PackagePricings.belongsTo(ProductSupplies, {targetKey: 'id'})

EOServices.hasMany(PackagePricings)
PackagePricings.belongsTo(EOServices, {targetKey: 'id'})

Users.hasMany(TenderRequestsModel, {foreignKey: 'stakeholderId'})
TenderRequestsModel.belongsTo(Users, {as: 'stakeholder', targetKey: 'id'})

TenderRequestsModel.hasMany(TenderImages, {foreignKey: 'tenderRequestId'})
TenderImages.belongsTo(TenderRequestsModel, {targetKey: 'id'})

// Users.hasMany(TenderApplicants, {foreignKey: 'stakeholderId'})
// TenderApplicants.belongsTo(Users, {as: 'stakeholder', targetKey: 'id'})
Users.hasMany(BidApplicantsModel, {foreignKey: 'partnerId'})
BidApplicantsModel.belongsTo(Users, {as: 'partner', targetKey: 'id'})

TenderRequests.hasMany(BidApplicantsModel, {foreignKey: 'tenderRequestId'})
BidApplicantsModel.belongsTo(TenderRequests, {as: 'tenderRequest', targetKey: 'id'})

// TenderRequests.hasMany(TenderApplicants, {foreignKey: 'tenderRequestId'})
// TenderApplicants.belongsTo(TenderRequests, {as: 'tenderRequest', targetKey: 'id'})

Users.hasMany(Transactions, {foreignKey: 'clientId'})
Transactions.belongsTo(Users, {as: 'client', targetKey: 'id'})

PackagePricings.hasMany(Transactions, {foreignKey: 'packagePricingId'})
Transactions.belongsTo(PackagePricings, {targetKey: 'id'})

// Users.hasMany(BiddingRequest, {foreignKey: 'stakeholderId'})
// BiddingRequest.belongsTo(Users, {as: 'stakeholder', targetKey: 'id'})

// Users.hasOne(ShopDecoration, {foreignKey: 'partner_id'})
Users.hasOne(ShopDecoration, {foreignKey: 'partnerId'})
ShopDecoration.belongsTo(Users, {as: 'partner'})

// ShopDecoration.hasMany(Banners, {foreignKey: 'shop_decoration_id'})
ShopDecoration.hasMany(Banners, {foreignKey: 'shopDecorationId'})
Banners.belongsTo(ShopDecoration, {targetKey: 'id'})

// Banners.hasMany(BannerImages, {foreignKey: 'banner_id'})
Banners.hasMany(BannerImages, {foreignKey: 'bannerId'})
BannerImages.belongsTo(Banners, {targetKey: 'id'})

module.exports = Users