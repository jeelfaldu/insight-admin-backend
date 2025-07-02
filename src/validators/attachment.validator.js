const { body, validationResult } = require('express-validator');

exports.attachmentValidationRules = () => [
  body('parentId').notEmpty().withMessage('Parent ID is required'),
  body('parentType').isIn(['property', 'tenant', 'project']).withMessage('Invalid parent type'),
  body('fileName').notEmpty().withMessage('File name is required'),
  body('fileUrl').isURL().withMessage('A valid file URL is required'),
  body('category').notEmpty().withMessage('Category is required'),
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({ errors: errors.array() });
};