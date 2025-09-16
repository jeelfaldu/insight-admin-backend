// src/services/calendar-generation.service.js
const Property = require("../models/property.model");
const Project = require("../models/project.model");
const Lease = require("../models/lease.model");
const Tenant = require("../models/tenant.model");
const CalendarEvent = require("../models/calendar-event.model");
const eventColors = require("../config/event-colors"); // 👈 Import colors
const sequelize = require("../config/database");
const CustomReminder = require("../models/custom-reminder.model");
const { RRule, RRuleSet } = require("rrule");

// --- This service now contains "Transformers" ---

const transformProjectToEvent = (project) => {
  return {
    title: `Project Deadline: ${project.name}`,
    startDate: project.completionDate,
    endDate: project.completionDate,
    color:
      project.status === "Completed" ? eventColors.green : eventColors.blue,
    sourceId: project.id,
    sourceType: "Project", // Readable Type for the frontend
    sourceSignature: `project-deadline-${project.id}`, // Unique key for upsert
    url: `/projects/${project.id}`,
    allDay: true,
  };
};

const transformLeaseToEvent = (lease, tenantMap, propertyMap) => {
  // Find tenant and property names for a richer title
  const tenantName = tenantMap.get(lease.tenantId) || "Unknown Tenant";
  const propName = propertyMap.get(lease.propertyId) || "Unknown Property";

  return {
    title: `Lease Expiration: ${tenantName} at ${propName}`,
    startDate: lease.endDate,
    endDate: lease.endDate,
    color: eventColors.orange,
    sourceId: lease.id,
    sourceType: "Lease Expiration", // Readable Type
    sourceSignature: `lease-expiration-${lease.id}`,
    url: `/tenants/${lease.tenantId}`,
    allDay: true,
  };
};

const transformPropertyToEvents = (property) => {
  const events = [];
  if (property.taxDetails?.paymentDeadline) {
    events.push({
      title: `Tax Deadline: ${property.name || property.entityName}`,
      startDate: property.taxDetails.paymentDeadline,
      endDate: property.taxDetails.paymentDeadline,
      color: eventColors.red,
      sourceId: property.id,
      sourceType: "Tax Deadline",
      sourceSignature: `property-tax-${property.id}`,
      url: `/properties/${property.id}`,
      allDay: true,
    });
  }
  if (property.insurance?.endDate) {
    events.push({
      title: `Insurance Renewal: ${property.name || property.entityName}`,
      startDate: property.insurance.endDate,
      endDate: property.insurance.endDate,
      color: eventColors.orange,
      sourceId: property.id,
      sourceType: "Insurance Renewal",
      sourceSignature: `property-insurance-${property.id}`,
      url: `/properties/${property.id}`,
      allDay: true,
    });
  }
  // You could add a Rent Due event here too
  return events;
};

// The main orchestrator function
const generateAllCalendarEvents = async () => {
  console.log("--- Starting Smart Calendar Event Generation ---");

  // Fetch all data needed for context in parallel
  const [projects, leases, properties, tenants] = await Promise.all([
    Project.findAll(),
    Lease.findAll(),
    Property.findAll(),
    Tenant.findAll(),
  ]);

  const tenantMap = new Map(tenants.map((t) => [String(t.id), t.name]));
  const propertyMap = new Map(
    properties.map((p) => [String(p.id), p.name || p.entityName])
  );

  // 3. Transform the data using the lookup maps
  const projectEvents = projects.map(transformProjectToEvent);
  const leaseEvents = leases.map((lease) =>
    transformLeaseToEvent(lease, tenantMap, propertyMap)
  );

  const propertyEvents = properties.flatMap(transformPropertyToEvents);

  const allEventsToUpsert = [
    ...projectEvents,
    ...leaseEvents,
    ...propertyEvents,
  ];

  // Use a single transaction to perform all upserts for efficiency
  const transaction = await sequelize.transaction();
  try {
    if (allEventsToUpsert.length > 0) {
      await Promise.all(
        allEventsToUpsert.filter(e => !!e.endDate).map((eventData) =>
          CalendarEvent.upsert(eventData, { transaction })
        )
      );
      console.log(`Upserted ${allEventsToUpsert.length} smart events.`);
    }

    // Now, handle custom reminders within the same transaction
    await generateCustomReminderEvents(transaction);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error("Failed to upsert events, transaction rolled back.", error);
    throw error;
  }

  // You would still run the pruning logic here after a successful upsert
  await pruneOrphanedEvents();

  console.log("--- Finished Smart Calendar Event Generation ---");
};
async function pruneOrphanedEvents() {
  console.log("Pruning orphaned calendar events...");
  const allEvents = await CalendarEvent.findAll();
  const sourceIdsByType = {
    project: (await Project.findAll({ attributes: ["id"] })).map((p) => p.id),
    lease: (await Lease.findAll({ attributes: ["id"] })).map((l) => l.id),
    property: (await Property.findAll({ attributes: ["id"] })).map((p) => p.id),
  };

  const eventsToDelete = [];
  allEvents.forEach((event) => {
    // We only care about auto-generated events for pruning
    const relevantTypes = ["project", "lease", "property"];
    if (relevantTypes.includes(event.sourceType)) {
      // Check if the event's sourceId still exists in the corresponding table
      if (!sourceIdsByType[event.sourceType].includes(event.sourceId)) {
        console.log(
          `Orphaned event found: ${event.title} (ID: ${event.id}). Scheduling for deletion.`
        );
        eventsToDelete.push(event.id);
      }
    }
  });

  if (eventsToDelete.length > 0) {
    await CalendarEvent.destroy({ where: { id: eventsToDelete } });
    console.log(`Deleted ${eventsToDelete.length} orphaned events.`);
  }
}

// Helper function to map our weekday strings to rrule constants
const mapDaysToRRule = (days) => {
  if (!days) return null;
  const dayMap = {
    SU: RRule.SU,
    MO: RRule.MO,
    TU: RRule.TU,
    WE: RRule.WE,
    TH: RRule.TH,
    FR: RRule.FR,
    SA: RRule.SA,
  };
  return days.map((day) => dayMap[day]);
};

// --- 👇 REWRITTEN GENERATOR FUNCTION 👇 ---
async function generateCustomReminderEvents(transaction) {
  const reminders = await CustomReminder.findAll({ transaction });
  const eventsToUpsert = [];
  const signaturesToDelete = [];

  for (const reminder of reminders) {
    const isRecurring = reminder.recurrence && reminder.recurrence.frequency;

    if (isRecurring) {
      signaturesToDelete.push(`reminder-single-${reminder.id}`);
    }

    if (!isRecurring) {
      if (!reminder.isCompleted) {
        eventsToUpsert.push({
          title: `Reminder: ${reminder.title}`,
          startDate: reminder.startDate,
          endDate: reminder.startDate,
          color: eventColors[reminder.color] || eventColors.purple,
          sourceId: reminder.id,
          sourceType: "Custom Reminder",
          sourceSignature: `reminder-single-${reminder.id}`,
          allDay: true,
        });
      }
      continue;
    }

    if (reminder.isCompleted) {
      continue;
    }

    const freq = mapFrequencyToRRule(reminder.recurrence.frequency);
    if (freq === undefined) {
      console.warn(
        `Skipping recurring reminder with invalid frequency: ${reminder.title}`
      );
      continue;
    }

    // RRule works with dates in UTC. Our start date is DATEONLY (YYYY-MM-DD).
    // new Date('YYYY-MM-DD') correctly creates a date at midnight UTC.
    const dtstart = new Date(reminder.startDate);
    const until = reminder.recurrence.endDate
      ? new Date(reminder.recurrence.endDate)
      : null;

    const rule = new RRule({
      freq,
      interval: reminder.recurrence.interval || 1,
      dtstart,
      until,
      byweekday: mapDaysToRRule(reminder.recurrence.byDay),
    });

    // Define the generation window using UTC dates to match RRule behavior
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const oneYearFromNow = new Date(today);
    oneYearFromNow.setUTCFullYear(oneYearFromNow.getUTCFullYear() + 1);

    const occurrences = rule.between(today, oneYearFromNow, true);

    occurrences.forEach((date) => {
      eventsToUpsert.push({
        title: `Reminder: ${reminder.title}`,
        startDate: date,
        endDate: date,
        color: eventColors[reminder.color] || eventColors.purple,
        sourceId: reminder.id,
        sourceType: "Custom Reminder",
        sourceSignature: `reminder-recurring-${reminder.id}-${date
          .toISOString()
          .slice(0, 10)}`,
        allDay: true,
        meta: { originalStartDate: reminder.startDate },
      });
    });
  }

  if (signaturesToDelete.length > 0) {
    await CalendarEvent.destroy({
      where: { sourceSignature: signaturesToDelete },
      transaction,
    });
    console.log(
      `Cleaned up ${signaturesToDelete.length} orphaned single reminder events.`
    );
  }

  if (eventsToUpsert.length > 0) {
    await Promise.all(
      eventsToUpsert.map((event) => CalendarEvent.upsert(event, { transaction }))
    );
    console.log(`Upserted ${eventsToUpsert.length} custom reminder events.`);
  }
}
// --- 👇 NEW, ROBUST HELPER FUNCTION 👇 ---
/**
 * Maps the frequency string from our database to the correct RRule constant.
 * @param {string} frequency - 'day', 'week', 'month', or 'year'.
 * @returns {RRule.FREQUENCY} The RRule constant (e.g., RRule.WEEKLY).
 */
const mapFrequencyToRRule = (frequency) => {
  const freqMap = {
    day: RRule.DAILY,
    week: RRule.WEEKLY,
    month: RRule.MONTHLY,
    year: RRule.YEARLY,
  };
  return freqMap[frequency]; // Returns the constant, e.g., freqMap['week'] -> RRule.WEEKLY
};
module.exports = { generateAllCalendarEvents };
