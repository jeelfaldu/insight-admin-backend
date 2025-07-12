const express = require("express");
const cors = require("cors");
require("dotenv").config();
const sequelize = require("./config/database");
const propertyRoutes = require("./routes/property.routes");
const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const tenantRoutes = require("./routes/tenant.routes");
const leaseRoutes = require("./routes/lease.routes");
const uploadRoutes = require("./routes/upload.routes");
const dataImportRoutes = require("./routes/data-import.routes");
const attachmentRoutes = require("./routes/attachment.routes");
const calendarRoutes = require("./routes/calendar.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const userRoutes = require("./routes/user.routes");
const boxRoutes = require("./routes/box.routes"); // 👈 1. Import the new routes
const financials = require("./routes/financials.routes");
const app = express();
const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(cors());
// Parse JSON request bodies
app.use(express.json());

// === API Routes ===
app.get("/", (req, res) => {
  res.send("Insight Ventures API is running!");
});

// Use the property routes, prefixed with /api/properties
app.use("/api/properties", propertyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/leases", leaseRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/data-import", dataImportRoutes); // Use new routes
app.use("/api/attachments", attachmentRoutes);
app.use("/api/calendar-events", calendarRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/box", boxRoutes); // 👈 2. Use the new routes with the '/api/box' prefix
app.use("/api/financials", financials); // 👈 2. Use the new routes with the '/api/box' prefix

// === Database Connection & Server Start ===
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Database connection has been established successfully.");
    // Synchronize models (optional, good for development)
    // Use { alter: true } to non-destructively update tables
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Unable to connect to the database:", err);
  });
