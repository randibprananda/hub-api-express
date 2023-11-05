const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');
const Users = require('./UsersModel.js');

const {DataTypes} = Sequelize;

const UsersDetail = db.define('users_detail',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    province: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    postal_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    position: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    userId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
    },

}, {
    freezeTableName: true
});

Users.hasOne(UsersDetail, { foreignKey: 'userId' })
UsersDetail.belongsTo(Users, {as: 'user',targetKey: 'id'})


module.exports = UsersDetail