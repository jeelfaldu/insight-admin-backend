const CalendarEvent = require("../models/calendar-event.model");

// GET /api/calendar-events
exports.getEvents = async (req, res) => {
  try {
    const dbEvents = await CalendarEvent.findAll({
      order: [["startDate", "ASC"]],
    });

    // Transform the database model into the exact frontend model
    const frontendEvents = dbEvents.map((event) => ({
      id: event.id,
      start: new Date(event.startDate), // Convert string to Date object
      end: event.endDate ? new Date(event.endDate) : undefined,
      title: event.title,
      color: event.color, // This is already a JSONB object {primary, secondary}
      allDay: event.allDay,
      meta: {
        id: event.sourceId,
        type: event.sourceType, // This is now 'Project Deadline', 'Lease Expiration', etc.
        url: event.url,
      },
    }));

    res.status(200).json(frontendEvents);
  } catch (error) {
    res.status(500).json({ message: "Error fetching calendar events" });
  }
};
