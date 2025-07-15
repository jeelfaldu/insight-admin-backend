const CustomReminder = require('../models/custom-reminder.model');

exports.createOrUpdateReminder = async (req, res) => {
    try {
        const data = req.body;
        // Upsert logic: if an ID is provided, it updates; otherwise, it creates.
        const [reminder, created] = await CustomReminder.upsert(data);
        res.status(created ? 201 : 200).json(reminder);
    } catch (error) {
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