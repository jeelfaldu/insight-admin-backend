const express = require("express");
const router = express.Router();
const reminderController = require("../controllers/reminder.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);
router.post("/", reminderController.createOrUpdateReminder);
router.get("/", reminderController.getReminders);
router.get("/get/:id", reminderController.getReminder);
router.put("/:id", reminderController.updateReminder);
router.delete("/:id", reminderController.deleteReminder);
module.exports = router;
