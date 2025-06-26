// src/controllers/tenant.controller.js
const Tenant = require('../models/tenant.model');

// GET /api/tenants
exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.findAll({ order: [['name', 'ASC']] });
    res.status(200).json(tenants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tenants', error: error.message });
  }
};

// GET /api/tenants/:id
exports.getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.status(200).json(tenant);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tenant', error: error.message });
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
    res.status(500).json({ message: 'Error creating tenant', error: error.message });
  }
};

// PUT /api/tenants/:id
exports.updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    await tenant.update(req.body);
    res.status(200).json(tenant);
  } catch (error) {
    res.status(500).json({ message: 'Error updating tenant', error: error.message });
  }
};

// DELETE /api/tenants/:id
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    
    // In a real app, you might check if the tenant has active leases before deleting
    // For now, we'll proceed with deletion.
    await tenant.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tenant', error: error.message });
  }
};