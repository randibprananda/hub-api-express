// const { Sequelize } = require('sequelize');
// const db = require('../config/Database.js');

// const {DataTypes} = Sequelize;

// const BiddingRequest = db.define('bidding_requests',{
//     id: {
//         type: DataTypes.UUID,
//         defaultValue: DataTypes.UUIDV4,
//         allowNull: false,
//         primaryKey: true
//     },
//     title: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         validate:{
//             notEmpty: {
//                 args: true,
//                 msg: "Title can't be empty"
//             },
//             notNull: {
//                 args: true,
//                 msg: "Title can't be null"
//             }
//         }
//     },
//     image: {
//         type: DataTypes.STRING,
//         allowNull: true,
//         defaultValue: null
//     },
//     description: {
//         type: DataTypes.TEXT,
//         allowNull: false,
//         validate: {
//             notEmpty: {
//                 args: true,
//                 msg: "Description can't be empty"
//             },
//             notNull: {
//                 args: true,
//                 msg: "Description can't be null"
//             }
//         }
//     },
//     budgetMinimum: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         validate: {
//             notEmpty: {
//                 args: true,
//                 msg: "Budget minimum can't be empty"
//             },
//             notNull: {
//                 args: true,
//                 msg: "Budget minimum can't be null"
//             }
//         }
//     },
//     budgetMaximum: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         validate: {
//             notEmpty: {
//                 args: true,
//                 msg: "Budget maximum can't be empty"
//             },
//             notNull: {
//                 args: true,
//                 msg: "Budget maximum can't be null"
//             }
//         }
//     },
//     maximumApplicants: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         validate: {
//             notEmpty: {
//                 args: true,
//                 msg: "Maximum applicant can't be empty"
//             },
//             notNull: {
//                 args: true,
//                 msg: "Maximum applicant can't be null"
//             }
//         }
//     },
//     expiredAt: {
//         type: DataTypes.DATE,
//         allowNull: false,
//         validate: {
//             notEmpty: {
//                 args: true,
//                 msg: "Expired at can't be empty"
//             },
//             notNull: {
//                 args: true,
//                 msg: "Expired at can't be null"
//             }
//         }
//     },
//     status: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         validate: {
//             notEmpty: {
//                 args: true,
//                 msg: "Status can't be empty"
//             },
//             notNull: {
//                 args: true,
//                 msg: "Status can't be null"
//             }
//         }
//     },
// }, {
//     freezeTableName: true
// });


// module.exports = BiddingRequest