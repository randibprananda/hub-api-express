const express = require("express");
const { getRole, getRoleById, createRole, updateRole, deleteRole, getMainRole, getSubRole } = require("../controllers/Roles.js");

const router = express.Router();

router.get('/k1/role', getRole);
router.get('/k1/main-role', getMainRole);
router.get('/k1/sub-role', getSubRole);
router.get('/k1/role/:id', getRoleById);
router.post('/k1/role/create', createRole);
router.patch('/k1/role/:id', updateRole);
router.delete('/k1/role/:id', deleteRole);

module.exports = router