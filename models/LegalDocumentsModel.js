const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');
const Companies = require('./CompaniesModel.js');

const {DataTypes} = Sequelize;

const LegalDocuments = db.define('legal_documents',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    path: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    document_identities: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    companyId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
    },
}, {
    freezeTableName: true
});

Companies.hasMany(LegalDocuments, {foreignKey: 'companyId'})
LegalDocuments.belongsTo(Companies, {targetKey: 'id'})

module.exports = LegalDocuments