const express = require("express");
const { fetch, getUser, getUserById, updateUser, deleteUser, getUserRole, CreateService, getDataService, getDataServiceByCategory } = require("../controllers/Users.js") ;
const verifyToken = require("../middleware/verifyToken.js");

const router = express.Router();

router.get('/k1/user/fetch', [verifyToken, fetch])
router.get('/k1/user', [verifyToken ,getUser]);
router.get('/k1/service-admin', [verifyToken ,getDataService]);
router.get('/k1/service-admin/:rolename', [verifyToken ,getDataServiceByCategory]);
router.get('/k1/user-role', [verifyToken ,getUserRole]);
router.get('/k1/user/:id', getUserById);
router.patch('/k1/user/:id', [verifyToken, updateUser]);
router.delete('/k1/user/:id', deleteUser);

module.exports = router