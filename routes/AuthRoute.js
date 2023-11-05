const express = require("express");
const { Login, VerificationResetPassword, ResetPassword, Register, ResendVerifiCode, ConfirmVerifiCode, LoginWithFirebase } = require("../controllers/Auth.js") ;
const { RegisterRequestValidator, loginValidator, loginFairbaseValidator, ConfirmVerifiCodeValidor, ResetPasswordValidator } = require("../middleware/requestValidator");
const router = express.Router();

router.post('/k1/register', [RegisterRequestValidator(), Register]);
router.post('/k1/login', [loginValidator(), Login]);
router.post('/k1/login-firebase', [loginFairbaseValidator() ,LoginWithFirebase]);
router.post('/k1/send-link-forget-password', [loginFairbaseValidator(), VerificationResetPassword]);
router.post('/k1/authentication-code', [ConfirmVerifiCodeValidor(), ConfirmVerifiCode]);
router.patch('/k1/resend-verifi-code/:id', ResendVerifiCode);
router.patch('/k1/forget-password/:id', [ResetPasswordValidator(), ResetPassword]);

module.exports = router