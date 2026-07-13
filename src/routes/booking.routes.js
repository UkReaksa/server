// src/routes/booking.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/booking.controller");
const auth = require("../middlewares/auth.middleware");

router.use(auth.verifyToken);

router.get("/", ctrl.getAll); // GET  /api/bookings
router.get("/stats", ctrl.stats); // GET  /api/bookings/stats
router.get("/calendar", ctrl.getByMonth); // GET  /api/bookings/calendar?year=&month=
router.get("/today-arrivals", ctrl.todayArrivals); // GET  /api/bookings/today-arrivals
router.get("/today-departures", ctrl.todayDepartures); // GET  /api/bookings/today-departures
router.get("/:id", ctrl.getById); // GET  /api/bookings/:id
router.post("/", ctrl.create); // POST /api/bookings
router.put("/:id", ctrl.update); // PUT  /api/bookings/:id
router.patch("/:id/status", ctrl.updateStatus); // PATCH /api/bookings/:id/status
router.delete("/:id", ctrl.remove); // DELETE /api/bookings/:id

module.exports = router;
