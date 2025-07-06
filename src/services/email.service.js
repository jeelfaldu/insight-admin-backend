// src/services/email.service.js
const nodemailer = require("nodemailer");
require("dotenv").config();

// --- Ethereal Email Setup ---
let transporter;

async function getTestTransporter() {
  if (transporter) {
    return transporter;
  }

  // 1. Create a temporary test account with Ethereal
  const testAccount = await nodemailer.createTestAccount();
  console.log("📧 Ethereal test account created!");
  console.log("Username:", testAccount.user);
  console.log("Password:", testAccount.pass);

  // 2. Configure Nodemailer to use these temporary credentials
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  return transporter;
}

/**
 * Sends a password reset email using a test account for development.
 */
const sendPasswordResetEmail = async (userEmail, resetToken) => {
  // Determine the frontend URL based on the environment
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8100";
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: '"Insight Ventures Admin" <no-reply@insight-ventures.com>',
    to: userEmail, // In a real app, this is the user's real email
    subject: "Your Password Reset Request",
    html: `
            <h3>Password Reset Request</h3>
            <p>You requested a password reset. Please click the link below to set a new password:</p>
            <p><a href="${resetUrl}" style="color: #4f46e5; font-weight: bold;">Reset Your Password</a></p>
            <p>This link is valid for 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `,
  };

  try {
    const emailTransporter = await getTestTransporter();
    const info = await emailTransporter.sendMail(mailOptions);

    console.log("✅ Email sent: %s", info.messageId);
    // --- THIS IS THE MAGIC PART ---
    // Nodemailer provides a URL to preview the sent email
    console.log("✉️ Preview URL: %s", nodemailer.getTestMessageUrl(info));
    console.log("----------------------------------------------------");
    console.log(
      `---> Open this URL in your browser to see the email: ${nodemailer.getTestMessageUrl(
        info
      )}`
    );
    console.log("----------------------------------------------------");
  } catch (error) {
    console.error("Error sending password reset email with Ethereal:", error);
  }
};

module.exports = { sendPasswordResetEmail };
