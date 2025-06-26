// src/routes/project.routes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { projectValidationRules, validate } = require('../validators/project.validator');

// All project routes are protected and require a valid token
router.use(authMiddleware);

// Define the routes
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', projectValidationRules(), validate, projectController.createProject);
router.put('/:id', projectValidationRules(), validate, projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;