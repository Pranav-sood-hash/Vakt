const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for Avatar Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only JPG, PNG and WEBP allowed.'));
  }
});

router.use(authMiddleware);

router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.get('/me/activity', userController.getActivity);
router.get('/stats', userController.getStats);

// Edit Profile Routes
router.post('/send-email-otp', userController.sendEmailOTP);
router.post('/verify-email-otp', userController.verifyEmailOTP);
router.post('/send-password-otp', userController.sendPasswordOTP);
router.post('/verify-password-otp', userController.verifyPasswordOTP);
router.post('/upload-avatar', upload.single('avatar'), userController.uploadAvatar);
router.delete('/me', userController.deleteMe);

module.exports = router;
