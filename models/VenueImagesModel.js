const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');

const {DataTypes} = Sequelize;

const VenueImages = db.define('venue_images',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
}, {
    freezeTableName: true
});

module.exports = VenueImages