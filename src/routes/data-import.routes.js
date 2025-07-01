// src/routes/data-import.routes.js
const express = require('express');
const router = express.Router();
const dataImportController = require('../controllers/data-import.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protect all routes in this file
router.use(authMiddleware);

router.post('/rent-roll', dataImportController.uploadRentRollData);
router.get('/rent-roll', dataImportController.getRentRollData);

module.exports = router;