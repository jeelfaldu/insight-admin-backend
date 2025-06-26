// src/validators/project.validator.js
const { body, validationResult } = require('express-validator');

const projectValidationRules = () => {
  return [
    body('name', 'Project Name is required').notEmpty().trim(),
    body('linkedPropertyId', 'A linked property is required').notEmpty(),
    body('status', 'A valid status is required').isIn(['Planning', 'In Progress', 'On Hold', 'Completed']),
    body('completionDate', 'A valid completion date is required').isISO8601().toDate(),
    body('description', 'A description is required').notEmpty(),
    // We can also validate the attachments array if needed
    body('attachments').optional().isArray(),
    body('attachments.*.name', 'Attachment name is required').if(body('attachments').exists()).notEmpty(),
    body('attachments.*.url', 'Attachment URL is required and must be a valid URL').if(body('attachments').exists()).isURL()
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
  projectValidationRules,
  validate,
};