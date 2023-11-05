const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');

const {DataTypes} = Sequelize;

const VenueServices = db.define('venue_services',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "Name can't be empty"
            },
            notNull: {
                args: true,
                msg: "Name can't be null"
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    spesification: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    place_address: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    freezeTableName: true
});

module.exports = VenueServices