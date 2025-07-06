const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All dashboard routes are protected
router.use(authMiddleware);

// Define the route to get our prioritized alerts
router.get('/alerts', dashboardController.getDashboardAlerts);
router.get('/summary', dashboardController.getSummaryData);
router.get('/chart-data', dashboardController.getChartData);

module.exports = router;