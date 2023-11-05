const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');

const {DataTypes} = Sequelize;

const ProductSupplies = db.define('product_supplies',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    tool_type: {
        type: DataTypes.STRING,
        // allowNull: false,
        // validate:{
        //     notEmpty: {
        //         args: true,
        //         msg: "Tool type can't be empty"
        //     },
        //     notNull: {
        //         args: true,
        //         msg: "Tool type can't be null"
        //     }
        // }
    },
    brand: {
        type: DataTypes.STRING,
        // allowNull: false,
        // validate:{
        //     notEmpty: {
        //         args: true,
        //         msg: "Brand type can't be empty"
        //     },
        //     notNull: {
        //         args: true,
        //         msg: "Brand type can't be null"
        //     }
        // }
    },
    model: {
        type: DataTypes.STRING,
        // allowNull: false,
        // validate:{
        //     notEmpty: {
        //         args: true,
        //         msg: "Model type can't be empty"
        //     },
        //     notNull: {
        //         args: true,
        //         msg: "Model type can't be null"
        //     }
        // }
    },
    condition: {
        type: DataTypes.STRING,
        // allowNull: false,
        // validate:{
        //     notEmpty: {
        //         args: true,
        //         msg: "Condition type can't be empty"
        //     },
        //     notNull: {
        //         args: true,
        //         msg: "Condition type can't be null"
        //     }
        // }
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    namaLayanan: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "namaLayanan description can't be empty"
            },
            notNull: {
                args: true,
                msg: "namaLayanan description can't be null"
            }
        }
    },deskripsiLayanan: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "deskripsiLayanan description can't be empty"
            },
            notNull: {
                args: true,
                msg: "deskripsiLayanan description can't be null"
            }
        }
    },spesifikasiLayanan: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "spesifikasiLayanan description can't be empty"
            },
            notNull: {
                args: true,
                msg: "spesifikasiLayanan description can't be null"
            }
        }
    },
}, {
    freezeTableName: true
});

module.exports = ProductSupplies