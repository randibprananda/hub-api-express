const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');

const { DataTypes } = Sequelize;

const Companies = db.define('companies', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    description: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        defaultValue: null
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    type: { // badan usaha (perorangan/cv/pt/dll)
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    type_business: { // jenis usaha (produsen/retail/perdagangan/dll)
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        get: function() {
            // console.log(JSON.parse(this.getDataValue("type_business")))
            return JSON.parse(this.getDataValue("type_business"))
        }, 
        // set: function(val) {
        //     return this.setDataValue("type_business", JSON.stringify(val));
        // }
        // get: function() {
        //     const typeBusiness = JSON.parse(this.getDataValue("type_business"))
        //     if (typeBusiness != null) {
        //         const data = []
        //         for (let i = 0; i < typeBusiness.length; i++) {
        //             data[i] = typeBusiness[i]
        //         }
        //         return data
        //     } else {
        //         return null
        //     }
        // },
    },
    type_siup: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    province: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    postal_code: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    company_logo: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    pic_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    pic_position: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    pic_phone: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    pic_email: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    website_url: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    website_type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    marketplace_url: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    marketplace_type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    is_verified_company: { // status perusahaan dari partner/stakeholder itu terverifikasi atau tidak
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "is_verified_partner can't be empty"
            },
            notNull: {
                args: true,
                msg: "is_verified_partner can't be null"
            }
        },
    },
}, {
    freezeTableName: true
});


module.exports = Companies