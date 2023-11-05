const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');

const {DataTypes} = Sequelize;

const PackagePricings = db.define('package_pricings',{
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
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "Description can't be empty"
            },
            notNull: {
                args: true,
                msg: "Description can't be null"
            }
        }
    },
    participant_estimates: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    duration: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    price_type: {
        type: DataTypes.ENUM,
        allowNull: false,
        values: ['FIXED', 'RANGE'],
        validate: {
            notEmpty: {
                args: true,
                msg: "Price type can't be empty"
            },
            notNull: {
                args: true,
                msg: "Price type can't be null"
            }
        }
    },
    price: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Price can't be empty"
            },
            notNull: {
                args: true,
                msg: "Price can't be null"
            }
        },
        get: function() {
            const price = JSON.parse(this.getDataValue("price"))
            const data = []
            for (let i = 0; i < price.length; i++) {
                data.push(price[i])
            }
            return data
        },
    },
    disc_percentage: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        defaultValue: null,
    },
    disc_price: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    total_price: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    service_type: {
        type: DataTypes.ENUM,
        values: ['EO', 'VENUE', 'PRODUCT', 'TALENT']
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null,
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null,
    },
    portofolio: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
}, {
    freezeTableName: true
});

module.exports = PackagePricings