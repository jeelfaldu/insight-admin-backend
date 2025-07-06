// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');
// const { userValidationRules, validate } = require('../validators/user.validator.js'); // Assuming you create a validator for users

// CRITICAL: All routes in this file require the user to be logged in AND to be an admin.
router.use(authMiddleware, adminMiddleware);

// Define the routes
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);

// We would add a user validator similar to the others here
router.post('/', userController.createUser);

router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;