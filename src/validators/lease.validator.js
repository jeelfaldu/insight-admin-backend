// src/validators/lease.validator.js
const { body, validationResult } = require("express-validator");

const leaseValidationRules = () => {
  return [
    body("propertyId", "A valid Property must be linked").notEmpty(),
    body("unitId", "A valid Unit must be linked").notEmpty(),
    body("tenantId", "A valid Tenant must be linked").notEmpty(),
    body("startDate", "A valid lease start date is required")
      .isISO8601()
      .toDate(),
    // endDate is now optional
    body("endDate")
      .optional({ nullable: true, checkFalsy: true }) // Allow null or empty string
      .isISO8601()
      .toDate()
      .withMessage("A valid lease end date is required if provided."),

    // Validate that start date is before end date, only if endDate is provided
    body("endDate").custom((value, { req }) => {
      if (value && req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

    // Optional: Validate the schedule arrays
    body("rentSchedule").optional().isArray(),
    body(
      "rentSchedule.*.monthlyAmount",
      "Rent amount must be a positive number"
    )
      .optional({ checkFalsy: true })
      .isFloat({ gt: -1 }),

    body("camitSchedule").optional().isArray(),

    body("securityDisputeAmount")
      .optional({ checkFalsy: true })
      .isFloat()
      .withMessage("Dispute amount must be a valid number."),
  ];
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));
  return res.status(400).json({ errors: extractedErrors });
};

module.exports = {
  leaseValidationRules,
  validate,
};
