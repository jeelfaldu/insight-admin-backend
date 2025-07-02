// src/controllers/dashboard.controller.js
const { Op } = require('sequelize');
const CalendarEvent = require('../models/calendar-event.model');
const { startOfDay, addDays } = require('date-fns');

// GET /api/dashboard/alerts
exports.getDashboardAlerts = async (req, res) => {
    try {
        const today = startOfDay(new Date());
        const tenDaysFromNow = addDays(today, 10);

        // Fetch all future events from the CalendarEvents table that fall
        // within the next 10 days.
        const upcomingEvents = await CalendarEvent.findAll({
            where: {
                startDate: {
                    [Op.gte]: today,          // Greater than or equal to today
                    [Op.lte]: tenDaysFromNow   // Less than or equal to 10 days from now
                }
            },
            order: [['startDate', 'ASC']], // Show the most urgent alerts first
            limit: 5 // Limit to a manageable number of alerts for the dashboard
        });

        // The data is already in the perfect format, just send it back.
        res.status(200).json(upcomingEvents);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard alerts', error: error.message });
    }
};