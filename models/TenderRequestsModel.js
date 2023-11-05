const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');
const Users = require('./UsersModel.js');

const { DataTypes } = Sequelize;

const TenderRequests = db.define('tender_requests', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Title can't be empty"
            },
            notNull: {
                args: true,
                msg: "Title can't be null"
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
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
    partner_category: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
        get: function() {
            // const partnersCategory = JSON.parse(this.getDataValue("partner_category"))
            // if (partnersCategory != null) {
                
            //     console.log("\n")
            //     console.log("partnersCategory: ", partnersCategory)
            //     console.log("typeof partnersCategory: ", typeof partnersCategory)
            //     console.log("partnersCategory.length: ", partnersCategory.length)
            //     console.log("\n")

            //     const data = []
            //     for (let i = 0; i < partnersCategory.length; i++) {
            //         data[i] = {
            //             SIUP: partnersCategory[i]
            //         }
            //     }
            //     console.log("\n")
            //     console.log("data: ", data)
            //     console.log("\n")
            //     return data
            //         // const data = (partnersCategory != null) ? {

            //     // SIUP_Mikro: partnersCategory.SIUP_Mikro,
            //     // SIUP_Kecil: partnersCategory.SIUP_Kecil,
            //     // SIUP_Menengah: partnersCategory.SIUP_Menengah,
            //     // SIUP_Besar: partnersCategory.SIUP_Besar
            //     // } : null
            // } else {
            //     return null
            // }
            // console.log(`JSON.parse(this.getDataValue("partner_category")): `, JSON.parse(this.getDataValue("partner_category")))
            return JSON.parse(this.getDataValue("partner_category"))

        },
    },
    participant_estimate: { //estimasi peserta
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Participant Estimate can't be empty"
            },
            notNull: {
                args: true,
                msg: "Participant Estimate can't be null"
            }
        }
    },
    implementation_estimate: { //estimasi pelaksanaan
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Implementation Estimate can't be empty"
            },
            notNull: {
                args: true,
                msg: "Implementation Estimate can't be null"
            }
        }
    },
    deadline: { //batas akhir
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Deadline can't be empty"
            },
            notNull: {
                args: true,
                msg: "Deadline  can't be null"
            }
        }
    },
    budget_target: { //estimasi biaya
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Budget target can't be empty"
            },
            notNull: {
                args: true,
                msg: "Budget target can't be null"
            }
        }
    },
    minimal_bidding: { //minimal bidding 
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Minimal Bidding Estimate can't be empty"
            },
            notNull: {
                args: true,
                msg: "Minimal Bidding Estimate can't be null"
            }
        }
    },
    maksimal_partner: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Maksimal Partner can't be empty"
            },
            notNull: {
                args: true,
                msg: "Maksimal Partner can't be null"
            }
        }
    },
    add_on: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    status_addOn: {
        type: DataTypes.ENUM,
        values: ['pending', 'approved', 'rejected'],
        allowNull: true,
        defaultValue: null
    },
    is_active: { // status keaktifan dari tender
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Active Status can't be empty"
            },
            notNull: {
                args: true,
                msg: "Active Status can't be null"
            }
        },
    },
    is_assisted: { // status pendampingan oleh tim konect
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Assistance Status can't be empty"
            },
            notNull: {
                args: true,
                msg: "Assistance Status can't be null"
            }
        },
    },
}, {
    freezeTableName: true
});


module.exports = TenderRequests