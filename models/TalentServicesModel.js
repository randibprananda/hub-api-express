const { Sequelize } = require('sequelize');
const db = require('../config/Database.js');

const {DataTypes} = Sequelize;

const TalentServices = db.define('talent_services',{
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
    deskripsiLayanan: {
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
    
    email: {
        type: DataTypes.STRING,
        // allowNull: false,
        // validate:{
        //     notEmpty: {
        //         args: true,
        //         msg: "Email can't be empty"
        //     },
        //     notNull: {
        //         args: true,
        //         msg: "Email can't be null"
        //     }
        // }
    },
    phone: {
        type: DataTypes.STRING,
        // allowNull: false,
        // validate:{
        //     notEmpty: {
        //         args: true,
        //         msg: "Phone can't be empty"
        //     },
        //     notNull: {
        //         args: true,
        //         msg: "Phone can't be null"
        //     }
        // }
    },
    birthdate: {
        type: DataTypes.DATE,
        // allowNull: false,
        // validate:{
        //     notEmpty: {
        //         args: true,
        //         msg: "Birthdate can't be empty"
        //     },
        //     notNull: {
        //         args: true,
        //         msg: "Birthdate can't be null"
        //     }
        // }
    },
    address: {
        type: DataTypes.STRING,
        // allowNull: false,
        // validate:{
        //     notEmpty: {
        //         args: true,
        //         msg: "Address can't be empty"
        //     },
        //     notNull: {
        //         args: true,
        //         msg: "Address can't be null"
        //     }
        // }
    },
    skill: {
        type: DataTypes.STRING,
        // allowNull: false,
        // validate:{
        //     notEmpty: {
        //         args: true,
        //         msg: "Skill can't be empty"
        //     },
        //     notNull: {
        //         args: true,
        //         msg: "Skill can't be null"
        //     }
        // }
    },
    skill_description: {
        type: DataTypes.STRING,
        // allowNull: false,
        // validate:{
        //     notEmpty: {
        //         args: true,
        //         msg: "Skill description can't be empty"
        //     },
        //     notNull: {
        //         args: true,
        //         msg: "Skill description can't be null"
        //     }
        // }
    },
    certification: {
        type: DataTypes.STRING,
        // allowNull: false,
        // validate:{
        //     notEmpty: {
        //         args: true,
        //         msg: "Certification can't be empty"
        //     },
        //     notNull: {
        //         args: true,
        //         msg: "Certification can't be null"
        //     }
        // }
    },
    portofolio: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    instagram: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    twitter: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    linkedin: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    facebook: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    tiktok: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    youtube: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    freezeTableName: true
});

module.exports = TalentServices