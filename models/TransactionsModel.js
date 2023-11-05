const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');
const PackagePricings = require('./PackagePricingsModel.js');
const Users = require('./UsersModel.js');

const {DataTypes} = Sequelize;

const Transactions = db.define('transactions',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    status: {
        type: DataTypes.ENUM,
        allowNull: false,
        // values: ['PENDING', 'SUCCESS', 'FAILED'],
        values: ['PAID', 'UNPAID', 'COMPLETE', 'FAILED'],
        validate: {
            notEmpty: {
                args: true,
                msg: "Status can't be empty"
            },
            notNull: {
                args: true,
                msg: "Status can't be null"
            }
        }
    },
    service_status: {
        type: DataTypes.ENUM,
        allowNull: false,
        values: ['COMPLETE', 'INCOMPLETE'],
        validate: {
            notEmpty: {
                args: true,
                msg: "Service status can't be empty"
            },
            notNull: {
                args: true,
                msg: "Service status can't be null"
            }
        }
    },
    totalPayment: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "totalPayment can't be empty"
            },
            notNull: {
                args: true,
                msg: "totalPayment can't be null"
            }
        }
    },
    eventBrief: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "eventBrief can't be empty"
            },
            notNull: {
                args: true,
                msg: "eventBrief can't be null"
            }
        }
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "Start Date can't be empty"
            },
            notNull: {
                args: true,
                msg: "Start Date can't be null"
            }
        }
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "End Date can't be empty"
            },
            notNull: {
                args: true,
                msg: "End Date can't be null"
            }
        }
    },
    billingTo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "Billing can't be empty"
            },
            notNull: {
                args: true,
                msg: "Billing can't be null"
            }
        }
    },
    servicePrice: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "service Price can't be empty"
            },
            notNull: {
                args: true,
                msg: "Service Price can't be null"
            }
        }
    },
    adminFee: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "Admin Fee can't be empty"
            },
            notNull: {
                args: true,
                msg: "Admin Fee can't be null"
            }
        },
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "Payment Method can't be empty"
            },
            notNull: {
                args: true,
                msg: "Payment Method can't be null"
            }
        },
    },
    numberInvoice: {
        type: DataTypes.STRING,
        unique: true,
        
        // allowNull: false,
        // validate:{
        //     notEmpty: {
        //         args: true,
        //         msg: "Payment Method can't be empty"
        //     },
        //     notNull: {
        //         args: true,
        //         msg: "Payment Method can't be null"
        //     }
        // }
    },
    dateInvoice: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "Date Invoice can't be empty"
            },
            notNull: {
                args: true,
                msg: "Date Invoice can't be null"
            }
        }
    },
    qty:{
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate:{
            notEmpty: {
                args: true,
                msg: "Qty can't be empty"
            },
            notNull: {
                args: true,
                msg: "Qty can't be null"
            }
        }
    },
    payment_file:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    payment_link:{
        type: DataTypes.STRING,
        defaultValue: null
    },
    id_invoice_xendit:{
        type: DataTypes.STRING,
        defaultValue: null
    },
    cancelation_reason:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    timeInvoice: {
        type: DataTypes.TIME,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "Time Invoice can't be empty"
            },
            notNull: {
                args: true,
                msg: "Time Invoice can't be null"
            }
        }
    },
    taxFee: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate:{
            notEmpty: {
                args: true,
                msg: "Tax Fee can't be empty"
            },
            notNull: {
                args: true,
                msg: "Tax Fee can't be null"
            }
        },
    },

}, {
    freezeTableName: true
});

module.exports = Transactions