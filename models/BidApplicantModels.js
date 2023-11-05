const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');

const {DataTypes} = Sequelize;

const BidApplicantsModel = db.define('bid_applicants',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    bidding: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Bidding can't be empty"
            },
            notNull: {
                args: true,
                msg: "Bidding can't be null"
            }
        }
    },
    offering_letter: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Offering Letter can't be empty"
            },
            notNull: {
                args: true,
                msg: "Offering Letter can't be null"
            }
        }
    },
    concept_presentation: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Concept Presentation can't be empty"
            },
            notNull: {
                args: true,
                msg: "Concept Presentation can't be null"
            }
        }
    },
    budget_plan: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Budget Plan can't be empty"
            },
            notNull: {
                args: true,
                msg: "Budget Plan can't be null"
            }
        }
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    freezeTableName: true
});


module.exports = BidApplicantsModel