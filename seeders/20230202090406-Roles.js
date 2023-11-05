'use strict';

const uuid = require('uuid')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up (queryInterface, Sequelize) {
        return queryInterface.bulkInsert('roles', [
        {
            id: 'd3d48c98-0297-4d97-86fe-328fdc9c0dc3',
            name: 'Admin',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: uuid.v4(),
            name: 'Event Hunter',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: uuid.v4(),
            name: 'Stakeholder',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: uuid.v4(),
            name: 'Partner',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: uuid.v4(),
            name: 'Event Organizer',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: uuid.v4(),
            name: 'Venue',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: uuid.v4(),
            name: 'Supplier',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: uuid.v4(),
            name: 'Talent',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        ]);
    },

    async down (queryInterface, Sequelize) {
        return queryInterface.bulkDelete('roles', null, {});
    }
};
