const express = require('express');
const router = express.Router();
const focusController = require('../controllers/focus.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/start', focusController.startFocus);
router.post('/end', focusController.endFocus);
router.get('/stats/today', focusController.getTodayStats);

module.exports = router;
