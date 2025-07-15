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

// GET /api/leases/:id - Get a single lease by ID
exports.getLeaseById = async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.id);
    if (!lease) {
      return res.status(404).json({ message: "Lease not found" });
    }
    res.status(200).json(lease);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching lease", error: error.message });
  }
};

// PUT /api/leases/:id - Update a lease
exports.updateLease = async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.id);
    if (!lease) {
      return res.status(404).json({ message: "Lease not found" });
    }
    const updatedLease = await lease.update(req.body);
    res.status(200).json(updatedLease);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating lease", error: error.message });
  }
};

// DELETE /api/leases/:id - Delete a lease
exports.deleteLease = async (req, res) => {
  try {
    const lease = await Lease.findByPk(req.params.id);
    if (!lease) {
      return res.status(404).json({ message: "Lease not found" });
    }
    await lease.destroy();
    res.status(204).send(); // No content
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting lease", error: error.message });
  }
};
