// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

// Route for user registration
// POST http://localhost:3000/api/auth/register
router.post("/register", authController.register);

// Route for user login
// POST http://localhost:3000/api/auth/login
router.post("/login", authController.login);

// GET http://localhost:3000/api/auth/verify
// This route is protected by our middleware.
router.get("/verify", authMiddleware, (req, res) => {
  // If the authMiddleware succeeds (by calling next()), this code will run.
  // The user's information from the token is in req.user.
  res.status(200).json({
    message: "Token is valid",
    user: req.user,
  });
});

module.exports = router;
