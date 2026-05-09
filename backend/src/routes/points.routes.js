const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/points.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', pointsController.getPoints);
router.get('/history/weekly', pointsController.getWeeklyHistory);

module.exports = router;
