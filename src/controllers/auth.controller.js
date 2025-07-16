// src/controllers/auth.controller.js
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../services/email.service");
const { Op } = require("sequelize");
require("dotenv").config();
const bcrypt = require("bcryptjs");
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
      { expiresIn: "30d" } // Token will be valid for 15 days
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

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    // 1. Find user by email
    const user = await User.findOne({ where: { email: req.body.email } });

    // IMPORTANT SECURITY NOTE: Always send a success message, even if the user
    // is not found. This prevents "user enumeration" attacks.
    if (!user) {
      console.log(
        `Password reset attempt for non-existent email: ${req.body.email}`
      );
      return res.status(200).json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // 2. Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 3. Hash the token before saving it to the database
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 4. Set an expiration time (e.g., 10 minutes from now)
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // 5. Send the email with the PLAIN TEXT token
    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    // Generic error
    res.status(500).json({ message: "An error occurred." });
  }
};

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    let { password } = req.body;
    const resetToken = req.params.token;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      password = await bcrypt.hash(password, salt);
    }
    // 1. Hash the incoming token from the URL so we can match it against the DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 2. Find the user by the HASHED token AND check if it's expired
    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [Op.gt]: Date.now() }, // Must be greater than now
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired." });
    }

    // 3. If token is valid, update the user's password
    user.password = password; // The 'beforeUpdate' hook will hash this automatically

    // 4. Invalidate the reset token
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    // Log the user in automatically by sending back a new JWT
    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });    

    res.status(200).json({
      message: "Password has been reset successfully.",
      token: token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password" });
  }
};
