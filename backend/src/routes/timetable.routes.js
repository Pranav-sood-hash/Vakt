const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetable.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', timetableController.getSlots);
router.post('/', timetableController.createSlot);
router.patch('/:id', timetableController.updateSlot);
router.patch('/:id/complete', timetableController.completeSlot);
router.delete('/:id', timetableController.deleteSlot);

module.exports = router;
