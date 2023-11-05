// const { Sequelize } = require('sequelize');
// const db = require('../config/Database.js');
// const Users = require('./UsersModel.js');

// const {DataTypes} = Sequelize;

// const TenderApplicants = db.define('tender_applicants',{
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
//     budgetEstimate: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         validate: {
//             notEmpty: {
//                 args: true,
//                 msg: "Budget target can't be empty"
//             },
//             notNull: {
//                 args: true,
//                 msg: "Budget target can't be null"
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


// module.exports = TenderApplicants