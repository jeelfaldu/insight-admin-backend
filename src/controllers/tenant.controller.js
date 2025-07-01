// src/controllers/tenant.controller.js
const TenantStatusHistory = require("../models/tenant-status-history.model");
const Tenant = require("../models/tenant.model");

// GET /api/tenants
exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.findAll({ order: [["name", "ASC"]] });
    res.status(200).json(tenants);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tenants", error: error.message });
  }
};

// GET /api/tenants/:id
exports.getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    res.status(200).json(tenant);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tenant", error: error.message });
  }
};

// POST /api/tenants
exports.createTenant = async (req, res) => {
  try {
    // The request body has already been validated by the middleware
    const newTenant = await Tenant.create(req.body);
    res.status(201).json(newTenant);
  } catch (error) {
    // This will catch potential database errors, like a unique constraint if added later
    res
      .status(500)
      .json({ message: "Error creating tenant", error: error.message });
  }
};

// PUT /api/tenants/:id
exports.updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // --- NEW HISTORY LOGGING LOGIC ---
    const previousState = tenant.currentState;
    const newState = req.body.currentState;

    // Check if the state has actually changed
    if (newState && newState !== previousState) {
      console.log(
        `State changed from ${previousState} to ${newState}. Creating history log.`
      );

      await TenantStatusHistory.create({
        tenantId: tenant.id,
        // req.user.id would come from our authMiddleware if we pass it along
        changedByUserId: req.user?.id || "system",
        previousState: previousState,
        newState: newState,
        notes: `Status changed via tenant update form.`,
        // Store a snapshot of the detailed default state object if it exists
        details: req.body.defaultState || null,
      });
    }

    await tenant.update(req.body);
    res.status(200).json(tenant);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating tenant", error: error.message });
  }
};

// DELETE /api/tenants/:id
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // In a real app, you might check if the tenant has active leases before deleting
    // For now, we'll proceed with deletion.
    await tenant.destroy();
    res.status(204).send();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting tenant", error: error.message });
  }
};

exports.getTenantHistory = async (req, res) => {
  try {
    const tenantId = req.params.tenantId;

    // First, check if the tenant exists to be safe
    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    // Find all history entries where the tenantId matches
    const history = await TenantStatusHistory.findAll({
      where: { tenantId: tenantId },
      order: [["changeDate", "DESC"]], // Order by the most recent change first
    });

    res.status(200).json(history);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching tenant history", error: error.message });
  }
};
