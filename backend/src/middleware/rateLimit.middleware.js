const rateLimit = require('express-rate-limit');

// Rate limit for forgot password: max 3 requests per email per 15 minutes
exports.forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    status: 'error',
    message: 'Too many password reset requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use the email from the body as a key if possible, but express-rate-limit usually uses IP
  // For simplicity and standard practice, we'll use IP-based limiting here.
});

// Rate limit for OTP verification: max 5 attempts per 15 minutes
exports.otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 'error',
    message: 'Too many failed attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
