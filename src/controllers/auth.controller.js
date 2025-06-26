// src/controllers/auth.controller.js
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }
    const user = await User.create({ username, password });
    res
      .status(201)
      .json({ message: "User created successfully", userId: user.id });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering new user", error: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Find the user by their username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" }); // User not found
    }

    // Check if the provided password matches the hashed password in the database
    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" }); // Incorrect password
    }

    // If credentials are valid, create a JWT
    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Token will be valid for 1 day
    );

    // Send the token back to the client
    res.status(200).json({
      message: "Login successful",
      token: token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during login", error: error.message });
  }
};
