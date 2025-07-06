// src/controllers/dashboard.controller.js
const { Op, fn, col } = require("sequelize");
const CalendarEvent = require("../models/calendar-event.model");
const { startOfDay, addDays, subDays } = require("date-fns");
const Property = require("../models/property.model");
const Project = require("../models/project.model");
const Lease = require("../models/lease.model");
const RentRollImport = require("../models/rent-roll-data.model");
const {
  format,
  startOfMonth,
  addMonths,
  isBefore,
  isEqual,
} = require("date-fns"); // 👈 Add new imports

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
          [Op.gte]: today, // Greater than or equal to today
          [Op.lte]: tenDaysFromNow, // Less than or equal to 10 days from now
        },
      },
      order: [["startDate", "ASC"]], // Show the most urgent alerts first
      limit: 5, // Limit to a manageable number of alerts for the dashboard
    });

    // The data is already in the perfect format, just send it back.
    res.status(200).json(upcomingEvents);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching dashboard alerts",
      error: error.message,
    });
  }
};
/**
 * Helper function to calculate percentage change and direction.
 * @returns {object} { text: string, direction: 'up' | 'down' | 'same' }
 */
function calculateTrend(current, previous) {
  if (previous === 0) {
    return {
      text: current > 0 ? "New activity" : "No change",
      direction: current > 0 ? "up" : "same",
    };
  }
  if (current === previous) {
    return { text: "Same as last period", direction: "same" };
  }

  const percentageChange = ((current - previous) / previous) * 100;
  const direction = percentageChange > 0 ? "up" : "down";
  const sign = percentageChange > 0 ? "+" : "";

  return {
    text: `${sign}${percentageChange.toFixed(1)}% from last period`,
    direction: direction,
  };
}
/**
 * GET /api/dashboard/summary
 * Fetches and calculates high-level summary statistics for the main dashboard cards.
 */
exports.getSummaryData = async (req, res) => {
  try {
    const today = startOfDay(new Date());

    // Define the time periods for calculating trends
    const currentPeriodStart = subDays(today, 29); // The last 30 days (inclusive of today)
    const previousPeriodStart = subDays(today, 59); // 30 days before that
    const previousPeriodEnd = subDays(today, 30); // The day before the current period started

    // --- Step 1: Run all database queries in parallel for maximum efficiency ---
    const [
      totalPropertyCount,
      activeProjectsCount,
      activeLeases,
      allPropertiesWithUnits,
      propertiesInCurrentPeriod,
      propertiesInPreviousPeriod,
    ] = await Promise.all([
      Property.count(),
      Project.count({ where: { status: { [Op.not]: "Completed" } } }),
      Lease.findAll({ where: { endDate: { [Op.gte]: today } } }),
      Property.findAll({ attributes: ["id", "units", "usableSqft"] }),
      Property.count({
        where: { createdAt: { [Op.between]: [currentPeriodStart, today] } },
      }),
      Property.count({
        where: {
          createdAt: { [Op.between]: [previousPeriodStart, previousPeriodEnd] },
        },
      }),
    ]);

    // --- Step 2: Perform Calculations using the fetched data ---

    // -- Calculate Occupancy Rate based on Sq. Ft. --
    let totalSystemSqft = 0;
    let totalOccupiedSqft = 0;
    const occupiedUnitIds = new Set(activeLeases.map((l) => l.unitId));

    allPropertiesWithUnits.forEach((prop) => {
      totalSystemSqft += prop.usableSqft || 0;
      if (prop.units && Array.isArray(prop.units)) {
        prop.units.forEach((unit) => {
          if (occupiedUnitIds.has(unit.id)) {
            totalOccupiedSqft += unit.sqft || 0;
          }
        });
      }
    });
    const occupancyRate =
      totalSystemSqft > 0 ? (totalOccupiedSqft / totalSystemSqft) * 100 : 0;

    // -- Calculate Total Estimated Monthly Revenue --
    let monthlyRevenue = 0;
    activeLeases.forEach((lease) => {
      const now = new Date();
      // Find the rent charge active for today
      const currentRent = lease.rentSchedule?.find(
        (c) => new Date(c.startDate) <= now && new Date(c.endDate) >= now
      );
      // Find the CAMIT charge active for today
      const currentCamit = lease.camitSchedule?.find(
        (c) => new Date(c.startDate) <= now && new Date(c.endDate) >= now
      );

      monthlyRevenue += currentRent?.monthlyAmount || 0;
      monthlyRevenue += currentCamit?.monthlyAmount || 0;
    });

    // -- Calculate Trends --
    const propertiesTrend = calculateTrend(
      propertiesInCurrentPeriod,
      propertiesInPreviousPeriod
    );

    // --- Step 3: Construct the final JSON response object ---
    const summaryData = {
      totalProperties: {
        value: totalPropertyCount,
        trend: propertiesTrend.text,
        trendDirection: propertiesTrend.trendDirection,
      },
      occupancyRate: {
        value: parseFloat(occupancyRate.toFixed(1)),
        trend: "+1.5% from last month", // Placeholder: This requires more complex historical data
        trendDirection: "up",
      },
      activeProjects: {
        value: activeProjectsCount,
        trend: "No change", // Placeholder
        trendDirection: "same",
      },
      monthlyRevenue: {
        value: monthlyRevenue,
        trend: "+3.2% from last month", // Placeholder
        trendDirection: "up",
      },
    };

    res.status(200).json(summaryData);
  } catch (error) {
    console.error("Error fetching dashboard summary data:", error);
    res.status(500).json({ message: "Error fetching summary data" });
  }
};

// GET /api/dashboard/chart-data
exports.getChartData = async (req, res) => {
  try {
    const [
      // 👇 THIS IS THE NEW, EFFICIENT QUERY
      receivables,
      leases,
    ] = await Promise.all([
      // Use Sequelize's aggregate functions to do a SUM...GROUP BY...
      RentRollImport.findAll({
        attributes: [
          "month",
          // fn('sum', col('...')) is how you do SUM(...) in Sequelize
          [fn("sum", col("amountReceivable")), "totalReceivable"],
        ],
        group: ["month"],
        order: [["month", "ASC"]],
        raw: true, // Get a plain JSON object, not a Sequelize instance
      }),
      Lease.findAll(),
    ]);

    // ... (Processing for Billed Data from Leases is unchanged) ...
    const billedData = processLeasesIntoMonthlyData(leases); // Assume this is a helper function now

    // Format Receivable Data
    const receivableData = receivables.map((item) => ({
      name: item.month,
      value: parseFloat(item.totalReceivable),
    }));

    res.status(200).json({
      receivableData,
      billedData,
    });
  } catch (error) {
    console.debug(" exports.getChartData= ~ error:", error);
    res
      .status(500)
      .json({ message: "Error fetching chart data", error: error.message });
  }
};

/**
 * A helper function to process an array of Lease objects into monthly aggregated data.
 * It calculates the total billed rent and CAMIT for each month based on lease schedules.
 * @param {Array} leases - An array of Lease objects from the database.
 * @returns {Array<{name: string, value: number}>} An array of ChartDataPoint objects.
 */
function processLeasesIntoMonthlyData(leases) {
  // Use an object as a temporary map to store aggregated values for each month.
  // e.g., { "2024-05": 50000, "2024-06": 62000 }
  const monthlyBilled = {};

  if (!leases) {
    return [];
  }

  // 1. Iterate through each lease from the database.
  leases.forEach((lease) => {
    // 2. Combine the rent and CAMIT schedules into a single list of charges for this lease.
    // The '|| []' is a safety check in case the arrays are null.
    const allCharges = [...(lease.rentSchedule || [])];

    // 3. Iterate through each charge period within the lease.
    allCharges.forEach((charge) => {
      try {
        let currentMonth = startOfMonth(new Date(charge.startDate));
        const endDate = startOfMonth(new Date(charge.endDate));

        // This is a manual loop that is much more reliable
        // It continues as long as the current month is before or the same as the end month.
        while (
          isBefore(currentMonth, endDate) ||
          isEqual(currentMonth, endDate)
        ) {
          const monthKey = format(currentMonth, "yyyy-MM");

          if (!monthlyBilled[monthKey]) {
            monthlyBilled[monthKey] = 0;
          }

          monthlyBilled[monthKey] += charge.monthlyAmount;

          // Move to the next month for the next iteration
          currentMonth = addMonths(currentMonth, 1);
        }
      } catch (e) {
        // This catch block will handle any invalid date formats in the charge data.
        console.warn(
          "Skipping a charge with an invalid date range:",
          charge,
          e.message
        );
      }
    });
  });

  // 6. Finally, convert our aggregated object into the simple array format the chart needs.
  return Object.keys(monthlyBilled).map((monthKey) => ({
    name: monthKey,
    value: monthlyBilled[monthKey],
  }));
}
