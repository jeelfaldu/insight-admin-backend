const CalendarEvent = require("../models/calendar-event.model");
const CustomReminder = require("../models/custom-reminder.model");
const { generateAllCalendarEvents } = require("../services/calendar-generation.service");

exports.createOrUpdateReminder = async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) {
      delete data.id;
    }
    // Upsert logic: if an ID is provided, it updates; otherwise, it creates.
    const [reminder, created] = await CustomReminder.upsert(data);
    await generateAllCalendarEvents(); // Ensure calendar events are updated after reminder changes
    res.status(created ? 201 : 200).json(reminder);
  } catch (error) {
    console.debug("🚀 ~ exports.createOrUpdateReminder= ~ error:", error);
    res.status(500).json({ message: "Error saving reminder" });
  }
};

exports.getReminders = async (req, res) => {
  try {
    const reminders = await CustomReminder.findAll();
    res.status(200).json(reminders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reminders" });
  }
};
exports.getReminder = async (req, res) => {
  try {
    const reminder = await CustomReminder.findByPk(req.params.id);
    const reminder1 = await CalendarEvent.findOne({
      where: { sourceId: req.params.id },
    });
    const reminder2 = await CalendarEvent.findByPk(); // Corrected model

    res.status(200).json(reminder || reminder1 || reminder2);
  } catch (error) {
    console.debug("🚀 ~ error:", error);
    res.status(500).json({ message: "Error fetching reminders" });
  }
};

// PUT /api/reminders/:id
exports.updateReminder = async (req, res) => {
  try {
    const reminder = await CustomReminder.findByPk(req.params.id);
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found." });
    }
    await reminder.update(req.body);
    res.status(200).json(reminder);
  } catch (error) {
    res.status(500).json({ message: "Error updating reminder" });
  }
};

// DELETE /api/reminders/:id
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await CustomReminder.findByPk(req.params.id); // Corrected model
    const reminder1 = await CalendarEvent.findByPk(req.params.id); // Corrected model
    const reminder2 = await CalendarEvent.findOne({
      where: { sourceId: req.params.id },
    });

    if (!reminder && !reminder1 && !reminder2) {
      return res.status(404).json({ message: "Reminder not found." });
    }
    if (reminder) {
      await reminder.destroy();
    }
    if (reminder1) {
      await reminder1.destroy();
    }
    if (reminder2) {
      await reminder2.destroy();
    }
    res.status(204).send("DONE"); // Success, no content
  } catch (error) {
    console.debug("🚀 ~ error:", error);
    res.status(500).json({ message: "Error deleting reminder" });
  }
};
