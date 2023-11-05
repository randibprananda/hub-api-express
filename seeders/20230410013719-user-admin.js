'use strict';

/** @type {import('sequelize-cli').Migration} */
const bcrypt = require("bcrypt");
const {v4} = require('uuid');

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync('password', salt);

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('users', [{
      id: v4(),
      fullname: 'Admin Konect',
      username: 'admin',
      email: 'konectverse@gmail.com',
      phone: '6281123456789',
      password: hash,
      verified_at: new Date(),
      verification_code: 'ABCDEF',
      roleId: 'd3d48c98-0297-4d97-86fe-328fdc9c0dc3',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', null, {});
  }
};
