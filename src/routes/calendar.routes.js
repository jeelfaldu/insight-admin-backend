const express = require("express");
const router = express.Router();
const {
  generateAllCalendarEvents,
} = require("../services/calendar-generation.service");
const authMiddleware = require("../middleware/auth.middleware");
const calendarController = require("../controllers/calendar.controller");
// POST /api/calendar/generate
router.post("/generate", authMiddleware, async (req, res) => {
  // Optional: Add another middleware here to check if req.user.role === 'admin'
  try {
    await generateAllCalendarEvents();
    res
      .status(200)
      .json({ message: "Calendar events successfully generated." });
  } catch (error) {
    res.status(500).json({
      message: "Error generating calendar events",
      error: error.message,
    });
  }
});

router.get("/", calendarController.getEvents);

module.exports = router;
