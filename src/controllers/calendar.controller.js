const CalendarEvent = require("../models/calendar-event.model");

// GET /api/calendar-events
exports.getEvents = async (req, res) => {
  try {
    const dbEvents = await CalendarEvent.findAll({
      where: { deletedAt: null }, // Only fetch non-deleted calendar events
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
      isDone: event.isDone,
      deletedAt: event.deletedAt || null
    }));

    res.status(200).json(frontendEvents);
  } catch (error) {
    res.status(500).json({ message: "Error fetching calendar events" });
  }
};

// PUT /api/calendar-events/:id/mark-done
exports.markEventAsDone = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await CalendarEvent.findByPk(id);

    if (!event) {
      return res.status(404).json({ message: "Calendar event not found" });
    }

    event.isDone = true;
    await event.save();

    res.status(200).json({ message: "Calendar event marked as done", event });
  } catch (error) {
    console.error("Error marking event as done:", error);
    res.status(500).json({ message: "Error marking calendar event as done" });
  }
};

// DELETE /api/calendar-events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await CalendarEvent.findByPk(id);

    if (!event) {
      return res.status(404).json({ message: "Calendar event not found" });
    }

    await event.update({ deletedAt: new Date() }); // Soft delete CalendarEvent

    res.status(200).json({ message: "Calendar event soft-deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Error deleting calendar event" });
  }
};
