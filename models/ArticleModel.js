const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/Database.js');

const Article = db.define('articles', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  title_article: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        args: true,
        msg: "Article can't be empty"
      },
      notNull: {
        args: true,
        msg: "Article can't be null"
      }
    }
  },
  writers_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        args: true,
        msg: "Writers Name can't be empty"
      },
      notNull: {
        args: true,
        msg: "Writers Name can't be null"
      }
    }
  },
  image: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    defaultValue: null,
  },
  contents_article: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  avatar: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    defaultValue: null,
  },
  categories: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
    validate: {
      isIn: {
        args: [['Events', 'Hiburan', 'Pariwisata', 'Bisnis', 'Olahraga', 'Pendidikan', 'Politik', 'Sosial', 'Teknologi']],
        msg: "Please Insert catagory: Events, Hiburan, Pariwisata, Bisnis, Olahraga, Pendidikan, Politik, Sosial, Teknologi'"
    }
        // isValidArray(value) {
        //     if (value && value.some(category => !['Events', 'Hiburan', 'Pariwisata', 'Bisnis', 'Olahraga', 'Pendidikan', 'Politik', 'Sosial', 'Teknologi'].includes(category))) {
        //       return res.status(400).JSON('Invalid category!, Please insert Events, Hiburan, Pariwisata, Bisnis, Olahraga, Pendidikan, Politik, Sosial, Teknologi');
        //     }
        //   }
    }
  },
  hashtags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  }
}, {
  freezeTableName: true
});

module.exports = Article;
