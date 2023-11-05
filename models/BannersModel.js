const { Sequelize } = require('sequelize')
const db = require('../config/Database.js')

const { DataTypes } = Sequelize

const Banners = db.define('banners', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Name can't be empty",
            },
            notNull: {
                args: true,
                msg: "Name can't be null",
            },
        },
    },
    banner_type: {
        type: DataTypes.ENUM,
        allowNull: true,
        values: ['BESAR', 'SLIDE'],
        defaultValue: null,
    },
    order: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    freezeTableName: true,
})

module.exports = Banners