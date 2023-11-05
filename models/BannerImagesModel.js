const { Sequelize } = require('sequelize')
const db = require('../config/Database.js')

const { DataTypes } = Sequelize

const BannerImages = db.define('banner_images', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    link: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        get: function() {
            return JSON.parse(this.getDataValue("link"))
        }, 
    },
    order: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    freezeTableName: true,
})

module.exports = BannerImages