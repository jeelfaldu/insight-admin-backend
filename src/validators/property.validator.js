const { body, validationResult } = require('express-validator');

// Create the chain of validation rules
const createPropertyValidationRules = () => {
  return [
    // --- Summary Tab Fields ---
     body('summary.entityName', 'Entity Name is required').notEmpty().trim(),
    body('summary.name').optional().trim(),
    body('summary.propertyId', 'Property ID is required').notEmpty().trim(),
    body('summary.type', 'Property Type is required').isIn(['Residential', 'Commercial', 'Industrial', 'Mixed Use']),
    body('summary.county', 'County is required').notEmpty(),
    body('summary.imageUrls', 'At least one image URL is required').isArray({ min: 1 }),

    // --- Address Nested Object ---
    body('summary.address.street', 'Street is required').notEmpty(),
    body('summary.address.city', 'City is required').notEmpty(),
    body('summary.address.state', 'State is required').notEmpty(),
    body('summary.address.zip', 'Zip code is required').notEmpty(),

    // --- Metrics Tab Fields ---
    body('metrics.totalSqft', 'Total Sq. Ft. must be a positive number').isFloat({ gt: 0 }),
    body('metrics.usableSqft', 'Usable Sq. Ft. must be a positive number').isFloat({ gt: 0 }),
    body('metrics.noi', 'NOI must be a number').isNumeric(),
    body('metrics.noiFrequency', 'NOI Frequency is required').isIn(['Monthly', 'Annual']),

    // Custom validator to ensure usable sqft <= total sqft
    body('metrics').custom((metrics) => {
      if (metrics.usableSqft > metrics.totalSqft) {
        throw new Error('Usable square footage cannot exceed total square footage');
      }
      return true; // Indicates the success of this synchronous custom validator
    }),
  ];
};

// Middleware to check the result of the validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next(); // If no errors, proceed to the controller
  }

  // If there are errors, format them and send back a 400 Bad Request response
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(400).json({
    errors: extractedErrors,
  });
};

module.exports = {
  createPropertyValidationRules,
  validate,
};