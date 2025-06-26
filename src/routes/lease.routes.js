// src/routes/lease.routes.js
const express = require("express");
const router = express.Router();
const leaseController = require("../controllers/lease.controller");
const authMiddleware = require("../middleware/auth.middleware");
const {
  leaseValidationRules,
  validate,
} = require("../validators/lease.validator");

// All lease routes are protected
router.use(authMiddleware);

// GET all leases (with potential query filters)
router.get("/", leaseController.getAllLeases);

// POST a new lease
router.post("/", leaseValidationRules(), validate, leaseController.createLease);

// ... (Add GET by ID, PUT, DELETE routes here as needed)

module.exports = router;
