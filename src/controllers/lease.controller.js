// src/controllers/lease.controller.js
const Lease = require("../models/lease.model");

// POST /api/leases - Create a new lease
exports.createLease = async (req, res) => {
  try {
    // The request body is pre-validated by our middleware
    const newLease = await Lease.create(req.body);
    res.status(201).json(newLease);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating lease", error: error.message });
  }
};

// GET /api/leases - Get all leases (can be filtered)
exports.getAllLeases = async (req, res) => {
  try {
    const whereClause = {};
    // Allow filtering by tenant or property, e.g., /api/leases?tenantId=t1
    if (req.query.tenantId) {
      whereClause.tenantId = req.query.tenantId;
    }
    if (req.query.propertyId) {
      whereClause.propertyId = req.query.propertyId;
    }

    const leases = await Lease.findAll({
      where: whereClause,
      order: [["endDate", "DESC"]],
    });
    res.status(200).json(leases);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching leases", error: error.message });
  }
};

// ... You would add getLeaseById, updateLease, and deleteLease methods here
//     following the same pattern as the other controllers.
