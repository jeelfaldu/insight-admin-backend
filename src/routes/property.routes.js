// src/routes/property.routes.js
const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/property.controller");
const authMiddleware = require("../middleware/auth.middleware");
const {
  createPropertyValidationRules,
  validate,
} = require("../validators/property.validator");

// --- PUBLIC ROUTE (anyone logged in can view) ---
router.get("/", authMiddleware, propertyController.getAllProperties);
router.get("/:id", authMiddleware, propertyController.getPropertyById);

// --- PROTECTED "WRITE" ROUTES (only admins should do this) ---
// Note: We would add another middleware here for role checking, e.g., checkRole('admin')
router.post(
  "/",
  authMiddleware, // First, ensure the user is logged in
  // createPropertyValidationRules(), // Then, run our validation rules
  // validate, // Then, check if there were any errors
  propertyController.createProperty // Finally, if all passed, run the controller
);
router.put("/:id", authMiddleware, propertyController.updateProperty);
router.delete("/:id", authMiddleware, propertyController.deleteProperty);

module.exports = router;
