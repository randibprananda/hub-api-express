const {Sequelize} = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const db = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_TYPE
})

module.exports = db