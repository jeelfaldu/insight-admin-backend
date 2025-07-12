const { Op } = require("sequelize");
const { format, startOfMonth, eachMonthOfInterval } = require('date-fns');
const Property = require("../models/property.model");
const Tenant = require("../models/tenant.model");
const Lease = require("../models/lease.model");

// GET /api/financials/candlestick-data?propertyIds=...&tenantId=...
exports.getCandlestickData = async (req, res) => {
  try {
    const { propertyIds, tenantId } = req.query;

    // 1. Build a WHERE clause to filter leases based on the user's selection
    const whereClause = {};
    if (propertyIds) {
      whereClause.propertyId = { [Op.in]: propertyIds.split(",") };
    }
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    // 2. Fetch all relevant data in parallel: the filtered leases, and all properties/tenants for context
    const [relevantLeases, allProperties, allTenants] = await Promise.all([
      Lease.findAll({ where: whereClause }),
      Property.findAll({ attributes: ["id", "name", "entityName"] }), // Fetch only what's needed
      Tenant.findAll({ attributes: ["id", "name"] }),
    ]);

    // 3. Create efficient lookup maps for property and tenant names
    const propertyMap = new Map(
      allProperties.map((p) => [p.id, p.name || p.entityName])
    );

    // --- This is the new data processing logic ---

    // This object will hold aggregated monthly data for each property
    // Structure: { propertyId: { "YYYY-MM": [income1, income2, ...] } }
    const monthlyDataByProperty = {};

    relevantLeases.forEach((lease) => {
      const allCharges = [
        ...(lease.rentSchedule || []),
        ...(lease.camitSchedule || []),
      ];

      allCharges.forEach((charge) => {
        try {
          const interval = {
            start: new Date(charge.startDate),
            end: new Date(charge.endDate),
          };
          const monthsInInterval = eachMonthOfInterval(interval);

          monthsInInterval.forEach((monthDate) => {
            const monthKey = format(startOfMonth(monthDate), "yyyy-MM");

            // Initialize nested objects if they don't exist
            if (!monthlyDataByProperty[lease.propertyId]) {
              monthlyDataByProperty[lease.propertyId] = {};
            }
            if (!monthlyDataByProperty[lease.propertyId][monthKey]) {
              monthlyDataByProperty[lease.propertyId][monthKey] = [];
            }

            // Add the monthly amount as a transaction for that month
            monthlyDataByProperty[lease.propertyId][monthKey].push(
              charge.monthlyAmount
            );
          });
        } catch (e) {
          console.warn(
            "Skipping lease charge with invalid date range:",
            charge
          );
        }
      });
    });

    // 4. Process the aggregated data into the candlestick format needed by the chart
    const datasets = [];
    for (const propertyId in monthlyDataByProperty) {
      const propertyMonthlyData = monthlyDataByProperty[propertyId];

      const candlestickPoints = Object.keys(propertyMonthlyData)
        .map((month) => {
          const transactions = propertyMonthlyData[month];

          // For a candlestick chart based on rent, we can interpret OHLC as:
          // O(pen): The first charge of the month (often just one, so same as close)
          // H(igh): The highest single charge amount in the month
          // L(ow): The lowest single charge amount in the month
          // C(lose): The last charge amount of the month
          return {
            x: month, // e.g., '2024-05'
            o: transactions[0] || 0,
            h: Math.max(...transactions, 0),
            l: Math.min(...transactions, 0),
            c: transactions[transactions.length - 1] || 0,
          };
        })
        .sort((a, b) => a.x.localeCompare(b.x));

      datasets.push({
        label: propertyMap.get(propertyId) || `Property #${propertyId}`,
        data: candlestickPoints,
      });
    }

    res.status(200).json(datasets);
  } catch (error) {
    console.error("Error fetching candlestick data:", error);
    res
      .status(500)
      .json({
        message: "Error fetching candlestick data",
        error: error.message,
      });
  }
};
