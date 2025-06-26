// src/validators/lease.validator.js
const { body, validationResult } = require('express-validator');

const leaseValidationRules = () => {
  return [
    body('propertyId', 'A valid Property must be linked').notEmpty(),
    body('unitId', 'A valid Unit must be linked').notEmpty(),
    body('tenantId', 'A valid Tenant must be linked').notEmpty(),
    body('startDate', 'A valid lease start date is required').isISO8601().toDate(),
    body('endDate', 'A valid lease end date is required').isISO8601().toDate(),
    
    // Validate that start date is before end date
    body('endDate').custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.startDate)) {
            throw new Error('End date must be after start date');
        }
        return true;
    }),

    // Optional: Validate the schedule arrays
    body('rentSchedule').optional().isArray(),
    body('rentSchedule.*.monthlyAmount', 'Rent amount must be a positive number').optional({ checkFalsy: true }).isFloat({ gt: -1 }),
    
    body('camitSchedule').optional().isArray()
  ];
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));
  return res.status(400).json({ errors: extractedErrors });
};

module.exports = {
  leaseValidationRules,
  validate,
};