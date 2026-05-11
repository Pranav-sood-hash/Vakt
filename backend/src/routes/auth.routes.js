const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { signupSchema, loginSchema } = require('../validators/auth.validator');

const { forgotPasswordLimiter, otpVerifyLimiter } = require('../middleware/rateLimit.middleware');

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

// Password Reset Flow
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/verify-reset-otp', otpVerifyLimiter, authController.verifyResetOTP);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
