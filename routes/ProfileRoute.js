const express = require("express");
const {updateProfile} = require("../controllers/ProfileController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.patch('/k1/profile/update-profile/:id', [verifyToken, updateProfile]);


module.exports = router