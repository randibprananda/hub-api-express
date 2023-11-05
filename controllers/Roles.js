const Roles = require("../models/RolesModel.js");

const getRole = async (req, res) => {
    try {
        const response = await Roles.findAll();
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getMainRole = async (req, res) => {
    try {
        const response = await Roles.findAll({
            where: {
                name: ['PARTNER', 'EVENT HUNTER', 'STAKEHOLDER']
            }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getSubRole = async (req, res) => {
    try {
        const response = await Roles.findAll({
            where: {
                name: ['EVENT ORGANIZER', 'VENUE', 'SUPPLIER', 'TALENT']
            }
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const getRoleById = async (req, res) => {
    try {
        const response = await Roles.findOne({
            where: {
                id: req.params.id
            },
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message })
    }
}

const createRole = async (req, res) => {
    const {name} = req.body;
    try {
        await Roles.create({
            name: name,
        });
        res.status(201).json({ msg: 'Create Roles Success' });
    } catch (error) {
        res.status(400).json({ msg: error.messasge });
    }
}

const updateRole = async (req, res) => {
    const roles = await Roles.findOne({
        where: {
            id: req.params.id
        },
    });
    if(!roles) return res.status(404).json({ msg: 'Role Not Found' });
    const {name} = req.body;
    try {
        await Roles.update({
            name: name,
        },{
            where: {
                id: roles.id
            }
        });
        res.status(200).json({ msg: 'Update Role Success' });
    } catch (error) {
        res.status(400).json({ msg: error.messasge });
    }

}

const deleteRole = async (req, res) => {
    const roles = await Roles.findOne({
        where: {
            id: req.params.id
        },
    });
    if(!roles) return res.status(404).json({ msg: 'Role Not Found' });
    try {
        await Roles.destroy({
            where: {
                id: roles.id
            }
        });
        res.status(200).json({ msg: 'Delete Role Success' });
    } catch (error) {
        res.status(400).json({ msg: error.messasge });
    }
}

module.exports = { getRole, getMainRole, getSubRole, getRoleById, createRole, updateRole, deleteRole }