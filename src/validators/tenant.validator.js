// src/validators/tenant.validator.js
const { body, validationResult } = require("express-validator");

const tenantValidationRules = () => {
  return [
    body("name", "Tenant or Business Name is required").notEmpty().trim(),
    body("email").optional().trim(),
    body("status", "A valid status is required").isIn([
      "Active",
      "Inactive",
      "Pending",
    ]),
    body("businessType").optional().trim(),
    body("phone").optional().trim(),
    body("notes").optional().trim(),
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
  tenantValidationRules,
  validate,
};
