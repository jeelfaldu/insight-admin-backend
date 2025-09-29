const { Op, fn, col } = require("sequelize");
const CalendarEvent = require("../models/calendar-event.model");
const {
  startOfDay,
  addDays,
  subDays,
  subMonths,
  endOfToday,
  endOfMonth,
} = require("date-fns");
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
const Tenant = require("../models/tenant.model");

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
        deletedAt: null, // Exclude soft-deleted events
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
    const startOfToday = startOfDay(today); // Normalize to the very beginning of today (00:00:00)

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
      Property.findAll({ attributes: ["id", "units", "usableSqft", "type"] }),
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

    let monthlyRevenue = 0;

    activeLeases.forEach((lease) => {
      const currentRentEntry = lease.rentSchedule?.find((charge) => {
        const chargeStart = startOfDay(new Date(charge.startDate));
        const chargeEnd = startOfDay(new Date(charge.endDate));
        return chargeStart <= startOfToday && chargeEnd >= startOfToday;
      });

      monthlyRevenue += currentRentEntry?.monthlyAmount || 0;
    });

    // -- Calculate Trends --
    const propertiesTrend = calculateTrend(
      propertiesInCurrentPeriod,
      propertiesInPreviousPeriod
    );

    const occupancyByType = {};

    allPropertiesWithUnits.forEach((property) => {
      const type = property.type;
      if (!occupancyByType[type]) {
        occupancyByType[type] = 0;
      }
      occupancyByType[type]++;
    });

    const occupancyChartData = Object.keys(occupancyByType).map((key) => ({
      name: key,
      value: occupancyByType[key],
    }));

    let totalUnitCount = 0;
    allPropertiesWithUnits.forEach((p) => {
      // Safely add the number of units from each property
      totalUnitCount += p.units ? p.units.length : 0;
    });

    const occupiedUnitCount = activeLeases.length;
    const occupancyRate2 =
      totalUnitCount > 0 ? (occupiedUnitCount / totalUnitCount) * 100 : 0;

    // --- Step 3: Construct the final JSON response object ---
    const summaryData = {
      totalProperties: {
        value: totalPropertyCount,
        trend: propertiesTrend.text,
        trendDirection: propertiesTrend.trendDirection,
      },
      occupancyRate: {
        value: parseFloat(occupancyRate2.toFixed(1)),
        trend: "+1.5% from last month", // Placeholder: This requires more complex historical data
        trendDirection: "up",
      },
      totalUnits: totalUnitCount,
      occupiedUnits: occupiedUnitCount,
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
      occupancyChartData,
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
    // --- 1. Get filter values from the query string, with defaults ---
    const propertyIds = req.query.propertyIds
      ? req.query.propertyIds.split(",")
      : null;

    const timePeriod = req.query.timePeriod || "6m"; // Default to last 6 months

    // --- 2. Define the date range based on the time period ---
    let startDate;
    let endDate = endOfToday();

    if (timePeriod === "custom") {
      if (!req.query.startDate || !req.query.endDate) {
        return res.status(400).json({
          message:
            "For custom time periods, please provide a startDate and endDate.",
        });
      }
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
    } else if (timePeriod === "all") {
      // Dynamically determine the earliest date from existing data
      const [earliestLease, earliestRentRoll] = await Promise.all([
        Lease.findOne({
          attributes: [[fn("min", col("startDate")), "minDate"]],
          raw: true,
        }),
        RentRollImport.findOne({
          attributes: [[fn("min", col("lastPaymentDate")), "minDate"]],
          raw: true,
        }),
      ]);

      const minLeaseDate = earliestLease?.minDate
        ? new Date(earliestLease.minDate)
        : null;
      const minRentRollDate = earliestRentRoll?.minDate
        ? new Date(earliestRentRoll.minDate)
        : null;

      if (minLeaseDate && minRentRollDate) {
        startDate = new Date(
          Math.min(minLeaseDate.getTime(), minRentRollDate.getTime())
        );
      } else if (minLeaseDate) {
        startDate = minLeaseDate;
      } else if (minRentRollDate) {
        startDate = minRentRollDate;
      } else {
        startDate = new Date(0); // Fallback to Unix epoch if no data exists
      }

      // Dynamically determine the latest date from existing data
      const [latestLease, latestRentRoll] = await Promise.all([
        Lease.findOne({
          attributes: [[fn("max", col("endDate")), "maxDate"]],
          raw: true,
        }),
        RentRollImport.findOne({
          attributes: [[fn("max", col("lastPaymentDate")), "maxDate"]],
          raw: true,
        }),
      ]);

      const maxLeaseDate = latestLease?.maxDate
        ? new Date(latestLease.maxDate)
        : null;
      const maxRentRollDate = latestRentRoll?.maxDate
        ? new Date(latestRentRoll.maxDate)
        : null;

      if (maxLeaseDate && maxRentRollDate) {
        endDate = new Date(
          Math.max(maxLeaseDate.getTime(), maxRentRollDate.getTime())
        );
      } else if (maxLeaseDate) {
        endDate = maxLeaseDate;
      } else if (maxRentRollDate) {
        endDate = maxRentRollDate;
      } else {
        endDate = endOfToday(); // Fallback to end of today if no data exists
      }
    } else if (timePeriod === "12m") {
      startDate = subMonths(endDate, 12);
    } else if (timePeriod === "ytd") {
      startDate = new Date(endDate.getFullYear(), 0, 1); // Year to date
    } else if (timePeriod === "6m") {
      startDate = subMonths(endDate, 6); // Default: last 6 months
    } else if (timePeriod === "1m") {
      startDate = subMonths(endDate, 1); // Default: last 6 months
    } else {
      if (!req.query.startDate || !req.query.endDate) {
        return res.status(400).json({
          message:
            "For custom time periods, please provide a startDate and endDate.",
        });
      }
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
    }

    // --- 3. Build WHERE clauses for our database queries ---
    const leaseWhereClause = {
      startDate: { [Op.lte]: endDate },
      endDate: { [Op.gte]: startDate },
    };
    const receivableWhereClause = {
      lastPaymentDate: { [Op.between]: [startDate, endDate] },
    };
    if (propertyIds) {
      leaseWhereClause.propertyId = { [Op.in]: propertyIds };
      receivableWhereClause.propertyId = { [Op.in]: propertyIds };
    }

    const [receivables, leases] = await Promise.all([
      RentRollImport.findAll({
        attributes: [
          "month",
          "propertyId",
          [fn("sum", col("amountReceivable")), "totalReceivable"],
        ],
        where: receivableWhereClause,
        group: ["month", "propertyId"],
        order: [["month", "ASC"]],
        raw: true,
      }),
      Lease.findAll({ where: leaseWhereClause }),
    ]);

    // Process Billed Data from Leases, now passing the date range
    const billedData = processLeasesIntoMonthlyData(leases, {
      start: startDate,
      end: endDate,
    });

    // Format Receivable Data
    const receivableData = receivables.map((item) => ({
      name: item.month,
      value: parseFloat(item.totalReceivable),
      propertyId: item.propertyId,
    }));

    res.status(200).json({
      receivableData,
      billedData,
    });
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res
      .status(500)
      .json({ message: "Error fetching chart data", error: error.message });
  }
};

/**
 * A helper function to process an array of Lease objects into monthly aggregated data.
 * It calculates the total billed rent and CAMIT for each month based on lease schedules.
 * @param {Array} leases - An array of Lease objects from the database.
 * @param {object} dateRange - An object containing start and end dates for filtering.
 * @param {Date} dateRange.start - The start date of the period.
 * @param {Date} dateRange.end - The end date of the period.
 * @returns {Array<{name: string, value: number}>} An array of ChartDataPoint objects.
 */
function processLeasesIntoMonthlyData(leases, dateRange) {
  const monthlyBilled = {};

  if (!leases || !dateRange || !dateRange.start || !dateRange.end) {
    return [];
  }

  const filterStartDate = startOfMonth(dateRange.start);
  const filterEndDate = startOfMonth(dateRange.end);

  leases.forEach((lease) => {
    const allCharges = [...(lease.rentSchedule || [])];

    allCharges.forEach((charge) => {
      try {
        let chargeStart = startOfMonth(new Date(charge.startDate));
        const chargeEnd = startOfMonth(new Date(charge.endDate));

        // Determine the effective start and end for this charge within the filter period
        const effectiveStart = isBefore(chargeStart, filterStartDate)
          ? filterStartDate
          : chargeStart;
        const effectiveEnd = isBefore(filterEndDate, chargeEnd)
          ? filterEndDate
          : chargeEnd;

        let currentMonth = effectiveStart;

        while (
          (isBefore(currentMonth, effectiveEnd) ||
            isEqual(currentMonth, effectiveEnd)) &&
          (isBefore(currentMonth, filterEndDate) ||
            isEqual(currentMonth, filterEndDate))
        ) {
          const monthKey = format(currentMonth, "yyyy-MM");

          if (!monthlyBilled[monthKey]) {
            monthlyBilled[monthKey] = 0;
          }

          monthlyBilled[monthKey] += charge.monthlyAmount;

          currentMonth = addMonths(currentMonth, 1);
        }
      } catch (e) {
        console.warn(
          "Skipping a charge with an invalid date range:",
          charge,
          e.message
        );
      }
    });
  });

  // Ensure all months in the requested range are present, even if no data
  let currentMonthInRange = startOfMonth(filterStartDate);
  while (
    isBefore(currentMonthInRange, filterEndDate) ||
    isEqual(currentMonthInRange, filterEndDate)
  ) {
    const monthKey = format(currentMonthInRange, "yyyy-MM");
    if (!monthlyBilled[monthKey]) {
      monthlyBilled[monthKey] = 0;
    }
    currentMonthInRange = addMonths(currentMonthInRange, 1);
  }

  return Object.keys(monthlyBilled)
    .sort() // Sort by month key to ensure chronological order
    .map((monthKey) => ({
      name: monthKey,
      value: monthlyBilled[monthKey],
    }));
}

/**
 * GET /api/dashboard/bar-chart-data?propertyIds=...&tenantId=...
 * Aggregates rent and camit data for the current and previous month
 * to be displayed in a bar chart.
 */
exports.getBarChartData = async (req, res) => {
  try {
    const { propertyIds, tenantId } = req.query;

    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const prevMonthStart = startOfMonth(subMonths(today, 1));
    const prevMonthEnd = endOfMonth(subMonths(today, 1));

    const leaseWhereClause = {};
    if (tenantId) {
      leaseWhereClause.tenantId = tenantId;
    }
    if (propertyIds) {
      leaseWhereClause.propertyId = { [Op.in]: propertyIds.split(",") };
    }

    const leases = await Lease.findAll({ where: leaseWhereClause });
    const properties = await Property.findAll({
      attributes: ["id", "name", "entityName"],
      where: propertyIds ? { id: { [Op.in]: propertyIds.split(",") } } : {},
    });

    const propertyMap = new Map(
      properties.map((p) => [p.id.toString(), p.name || p.entityName])
    );
    const chartData = {
      labels: [],
      currentMonthData: [],
      previousMonthData: [],
    };

    // Logic to aggregate data
    const monthlyTotalsByProp = {}; // { propId: { current: 100, previous: 90 } }

    leases.forEach((lease) => {
      if (!monthlyTotalsByProp[lease.propertyId]) {
        monthlyTotalsByProp[lease.propertyId] = { current: 0, previous: 0 };
      }

      // Calculate current month's total billed
      const allCharges = [
        ...(lease.rentSchedule || []),
        // ...(lease.camitSchedule || []),
      ];
      allCharges.forEach((charge) => {
        const startDate = new Date(charge.startDate);
        const endDate = new Date(charge.endDate);
        if (currentMonthStart >= startDate && currentMonthStart <= endDate) {
          monthlyTotalsByProp[lease.propertyId].current += charge.monthlyAmount;
        }
        if (prevMonthStart >= startDate && prevMonthStart <= endDate) {
          monthlyTotalsByProp[lease.propertyId].previous +=
            charge.monthlyAmount;
        }
      });
    });

    // Format for Chart.js
    for (const propId in monthlyTotalsByProp) {
      const log = propertyMap.has(propId);
      chartData.labels.push(propertyMap.get(propId) || `Property #${propId}`);
      chartData.currentMonthData.push(monthlyTotalsByProp[propId].current);
      chartData.previousMonthData.push(monthlyTotalsByProp[propId].previous);
    }

    res.status(200).json(chartData);
  } catch (error) {
    console.error("Error fetching bar chart data:", error);
    res.status(500).json({ message: "Error fetching bar chart data" });
  }
};

/**
 * GET /api/dashboard/portfolio-units
 * Finds and returns a detailed list of ALL units, correctly joining
 * tenant and lease data to provide a complete picture for the UI.
 */
exports.getVacantUnits = async (req, res) => {
  try {
    const properties = await Property.findAll({
      attributes: ["id", "name", "entityName", "address", "units"],
    });

    const vacantUnits = [];

    properties.forEach((prop) => {
      if (prop.units && Array.isArray(prop.units)) {
        prop.units.forEach((unit, index) => {
          // Check the status of each unit
          if (unit.status === "Unoccupied") {
            // If it's unoccupied, add it to our list with parent property info
            vacantUnits.push({
              propertyId: prop.id,
              propertyName: prop.name || prop.entityName,
              propertyAddress: `${prop.address.street}, ${prop.address.city}`,
              unitName: unit.name || `Unit #${index + 1}`,
              unitSqft: unit.sqft,
              // In a real system, rent would come from the unit or a "market rent" field
              // For now, we'll pull from the first lease charge as a placeholder.
              unitRent: unit.rent || 0,
              unitCamit: 0, // Placeholder, as CAMIT is on the lease level
            });
          }
        });
      }
    });

    res.status(200).json(vacantUnits);
  } catch (error) {
    console.error("Error fetching vacant units:", error);
    res.status(500).json({ message: "Error fetching vacant units" });
  }
};
exports.getPortfolioUnits = async (req, res) => {
  try {
    const [properties, activeLeases, allTenants] = await Promise.all([
      Property.findAll({
        attributes: ["id", "name", "entityName", "address", "units"],
      }),
      Lease.findAll({ where: { endDate: { [Op.gte]: new Date() } } }),
      Tenant.findAll({ attributes: ["id", "name"] }),
    ]);

    const allUnits = [];

    // --- 👇 THIS IS THE CORRECTED PART 👇 ---

    // Create efficient lookup maps, ensuring all keys are STRINGS.
    const activeLeaseMap = new Map(
      activeLeases.map((l) => [String(l.unitId), l])
    );
    const tenantMap = new Map(allTenants.map((t) => [String(t.id), t.name]));

    properties.forEach((prop) => {
      if (prop.units && Array.isArray(prop.units)) {
        prop.units.forEach((unit, index) => {
          // Make sure the key used for lookup is also a STRING
          const lease = activeLeaseMap.get(String(unit.id));

          let tenantId = null;
          let tenantName = "VACANT"; // Default to VACANT

          if (lease) {
            // Make sure the key used for lookup is also a STRING
            tenantId = lease.tenantId;
            tenantName =
              tenantMap.get(String(lease.tenantId)) || "Tenant Not Found";
          }

          allUnits.push({
            status: lease ? "Occupied" : "Vacant",
            tenantId: tenantId,
            tenantName: tenantName,

            propertyId: prop.id,
            propertyName: prop.name || prop.entityName,
            propertyAddress: `${prop.address.street}, ${prop.address.city}`,
            unitId: unit.id,
            unitName: unit.name || `Unit #${index + 1}`,
            unitSqft: unit.sqft,
            unitRent: lease ? lease.rentSchedule[0]?.monthlyAmount || 0 : 0,
            unitCamit: lease ? lease.camitSchedule[0]?.monthlyAmount || 0 : 0,
          });
        });
      }
    });

    res.status(200).json(allUnits);
  } catch (error) {
    console.error("Error fetching portfolio units:", error);
    res.status(500).json({
      message: "Error fetching portfolio units",
      error: error.message,
    });
  }
};
