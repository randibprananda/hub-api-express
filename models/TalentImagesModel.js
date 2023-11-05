const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');

const {DataTypes} = Sequelize;

const TalentImages = db.define('talent_images',{
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

module.exports = TalentImages