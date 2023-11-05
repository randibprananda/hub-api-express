const { Sequelize } = require('sequelize')
const db = require('../config/Database.js')

const {DataTypes} = Sequelize

const ShopDecoration = db.define('shop_decorations', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    highlight: {
        type: DataTypes.ENUM,
        allowNull: true,
        values: ['TERBARU', 'TERLARIS'],
        defaultValue: 'TERLARIS',
    },
    service_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
}, {
    freezeTableName: true
});

module.exports = ShopDecoration