// src/routes/tenant.routes.js
const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { tenantValidationRules, validate } = require('../validators/tenant.validator');

// All tenant routes are protected and require a user to be logged in
router.use(authMiddleware);

// Define the CRUD routes
router.get('/', tenantController.getAllTenants);
router.get('/:id', tenantController.getTenantById);
router.post('/', tenantValidationRules(), validate, tenantController.createTenant);
router.put('/:id', tenantValidationRules(), validate, tenantController.updateTenant);
router.delete('/:id', tenantController.deleteTenant);

module.exports = router;