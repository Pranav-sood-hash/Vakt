const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', settingsController.getSettings);
router.patch('/', settingsController.updateSettings);
router.post('/reset', settingsController.resetSettings);

module.exports = router;
