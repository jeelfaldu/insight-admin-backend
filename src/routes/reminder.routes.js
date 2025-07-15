const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminder.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);
router.post('/', reminderController.createOrUpdateReminder);
router.get('/', reminderController.getReminders);

module.exports = router;