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
const reminderRoutes = require("./routes/reminder.routes");
const getInTouchRoutes = require("./routes/get-in-touch.routes");
const offerRequestRoutes = require("./routes/offer-request.routes"); // New: Offer Request Routes
const listingInquiryRoutes = require("./routes/listing-inquiry.routes"); // New: Listing Inquiry Routes
const app = express();
const PORT = process.env.PORT || 3000;

var BoxSDK = require("box-node-sdk");
var sdk = new BoxSDK({
  clientID: "3hj4shnttfw7uvq0hdhgx4i1byb69hjs",
  clientSecret: "68995UMjYJSvIFoVLrFO4jDWgFPXVxBE",
});

// === Middleware ===
app.use(cors());
// Parse JSON request bodies
app.use(express.json());

// === API Routes ===
app.get("/", (req, res) => {
  res.send("Insight Ventures API is running!");
});
app.get("/box/login", (req, res) => {
  var authorize_url = sdk.getAuthorizeURL({
    response_type: "code",
    redirect_uri: "https://insight-admin-backend.onrender.com/box/callback",
  });
  res.status(200).json({ authorize_url });
});
app.get("/box/callback", (req, res) => {
  const { code, state } = req.query;

  sdk.getTokensAuthorizationCodeGrant(code, null, function (err, tokenInfo) {
    res.send(`
  <!DOCTYPE html>
  <html>
    <head>
      <title>Box Auth Success</title>
    </head>
    <body>
      <script>
        (function () {
          // Debug: show we’re in the popup
          console.log("🔑 Box popup loaded");

          const tokenInfo = {
            accessToken: "${tokenInfo.accessToken}",
            refreshToken: "${tokenInfo.refreshToken || ""}",
            accessTokenTTLMS: ${tokenInfo.accessTokenTTLMS || 0},
            acquiredAtMS: ${tokenInfo.acquiredAtMS || Date.now()}
          };

          const targetOrigin = "https://www.insightventuresga.com/"; // Make sure your main app runs on this

          if (window.opener && !window.opener.closed) {
            console.log("✅ Sending postMessage to opener");
            window.opener.postMessage({
              type: "box-auth-success",
              payload: tokenInfo
            }, targetOrigin);
          } else {
            console.warn("❌ No opener window found");
          }

          // Close after 1 second to ensure message is sent
          setTimeout(() => {
            window.close();
          }, 1000);
        })();
      </script>
      <p>Authentication successful. You can close this window.</p>
    </body>
  </html>
`);
  });
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
app.use('/api/reminders', reminderRoutes);
app.use("/api/get-in-touch", getInTouchRoutes);
app.use("/api/request-offer", offerRequestRoutes); // New: Offer Request Routes
app.use("/api/inquiries", listingInquiryRoutes); // New: Listing Inquiry Routes
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
