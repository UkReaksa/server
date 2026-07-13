// src/routes/room.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/room.controller");
const auth = require("../middlewares/auth.middleware");

router.use(auth.verifyToken);

router.get("/", ctrl.getAll); // GET  /api/rooms
router.get("/stats", ctrl.getStats); // GET  /api/rooms/stats
router.get("/available", ctrl.getAvailable); // GET  /api/rooms/available  ← for guest form dropdown

// These two MUST come before "/:id" below — otherwise Express treats
// "booking-ranges" as if it were the :id value, which is exactly what
// was causing "404: Room not found" instead of your booking data.
router.get("/booking-ranges", ctrl.getAllBookingRanges); // GET /api/rooms/booking-ranges
router.get("/:id/booking-ranges", ctrl.getBookingRanges); // GET /api/rooms/:id/booking-ranges

router.get("/:id", ctrl.getById); // GET  /api/rooms/:id
router.post("/", ctrl.create); // POST /api/rooms
router.put("/:id", ctrl.update); // PUT  /api/rooms/:id
router.patch("/:id/status", ctrl.updateStatus); // PATCH /api/rooms/:id/status
router.delete("/:id", ctrl.remove); // DELETE /api/rooms/:id

module.exports = router;
