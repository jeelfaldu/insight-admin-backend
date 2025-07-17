const CustomReminder = require("../models/custom-reminder.model");

exports.createOrUpdateReminder = async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) {
      delete data.id;
    }
    // Upsert logic: if an ID is provided, it updates; otherwise, it creates.
    const [reminder, created] = await CustomReminder.upsert(data);
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
    console.debug("🚀 ~ exports.getReminder= ~ req.params.id:", req.params.id);
    const reminder = await CustomReminder.findByPk(req.params.id);
    res.status(200).json(reminder);
  } catch (error) {
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
    const reminder = await CustomReminder.findByPk(req.params.id);
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found." });
    }
    await reminder.destroy();
    res.status(204).send(); // Success, no content
  } catch (error) {
    res.status(500).json({ message: "Error deleting reminder" });
  }
};
