const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ── CORS first ─────────────────────────────────────────
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

// ── Static files (BEFORE routes) ───────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Routes ─────────────────────────────────────────────
const user = require("./routes/user.route");
const authRoutes = require("./routes/auth.routes");
const roleRoutes = require("./routes/role.routes");
const permissionRoute = require("./routes/permission.route");
const guestRoutes = require("./routes/guest.route");
const superAdminRoutes = require("./routes/superadmin.routes");
const roomRoutes = require("./routes/room.routes");
const bookingRoutes = require("./routes/booking.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const staffRoutes = require("./routes/staff.routes");
const locationRoutes = require("./routes/location.routes");
const priceRoutes = require("./routes/price.route");


app.use("/api/auth", authRoutes);
app.use("/api/users", user);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoute);
app.use("/api/guests", guestRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/prices", priceRoutes);

module.exports = app;
