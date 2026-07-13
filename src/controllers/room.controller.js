// src/controllers/room.controller.js
const Room = require("../model/room.model");

exports.getAll = (req, res) => {
  Room.getAll((err, rooms) => {
    if (err) return res.status(500).json(err);
    res.json(rooms);
  });
};

// GET /api/rooms/available
// GET /api/rooms/available?check_in=2026-07-10&check_out=2026-07-15
// GET /api/rooms/available?check_in=...&check_out=...&exclude_booking_id=42
//
// Without dates: falls back to the old behavior (static status column).
// With dates: checks REAL booking overlaps, so a room booked Day 1-3
// correctly shows as available again for Day 5-8, instead of staying
// blocked just because its status column says "reserved".
exports.getAvailable = (req, res) => {
  const { check_in, check_out, exclude_booking_id } = req.query;

  if (check_in && check_out) {
    return Room.getAvailableForDates(
      check_in,
      check_out,
      exclude_booking_id || null,
      (err, rooms) => {
        if (err) return res.status(500).json(err);
        res.json(rooms);
      },
    );
  }

  // No dates given — old status-based behavior (kept for backward compatibility)
  Room.getAvailable((err, rooms) => {
    if (err) return res.status(500).json(err);
    res.json(rooms);
  });
};

// GET /api/rooms/:id/booking-ranges
// Every upcoming/active booking date-range for one room — used to
// show that room's booked periods (e.g. highlighted blue) on a detail view.
exports.getBookingRanges = (req, res) => {
  Room.getBookingRangesForRoom(req.params.id, (err, ranges) => {
    if (err) return res.status(500).json(err);
    res.json(ranges);
  });
};

// GET /api/rooms/booking-ranges
// Every room's booking ranges in one call, for the All Rooms page to
// mark booked dates in blue without firing one request per room.
exports.getAllBookingRanges = (req, res) => {
  Room.getAllBookingRanges((err, ranges) => {
    if (err) return res.status(500).json(err);
    res.json(ranges);
  });
};

exports.getById = (req, res) => {
  Room.getById(req.params.id, (err, room) => {
    if (err) return res.status(500).json(err);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });
};

exports.getStats = (req, res) => {
  Room.stats((err, stats) => {
    if (err) return res.status(500).json(err);
    res.json(stats);
  });
};

exports.create = (req, res) => {
  const {
    number,
    type,
    floor,
    capacity,
    price,
    status,
    amenities,
    description,
  } = req.body;
  if (!number?.trim())
    return res.status(400).json({ message: "Room number is required" });

  // check duplicate
  Room.getByNumber(number, (err, existing) => {
    if (err) return res.status(500).json(err);
    if (existing)
      return res.status(400).json({ message: `Room ${number} already exists` });

    const data = {
      number: number.trim(),
      type: type || "Standard",
      floor: floor || 1,
      capacity: capacity || 2,
      price: price || 0,
      status: status || "available",
      amenities: amenities || [],
      description: description || null,
      created_by: req.user?.id || null,
      created_at: new Date(),
    };

    Room.create(data, (err2, result) => {
      if (err2) return res.status(500).json(err2);
      res
        .status(201)
        .json({ message: "Room created", room_id: result.insertId });
    });
  });
};

exports.update = (req, res) => {
  const {
    number,
    type,
    floor,
    capacity,
    price,
    status,
    amenities,
    description,
  } = req.body;

  Room.getById(req.params.id, (err, room) => {
    if (err) return res.status(500).json(err);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const data = {};
    if (number !== undefined) data.number = number;
    if (type !== undefined) data.type = type;
    if (floor !== undefined) data.floor = floor;
    if (capacity !== undefined) data.capacity = capacity;
    if (price !== undefined) data.price = price;
    if (status !== undefined) data.status = status;
    if (amenities !== undefined) data.amenities = amenities;
    if (description !== undefined) data.description = description;

    Room.update(req.params.id, data, (err2) => {
      if (err2) return res.status(500).json(err2);
      res.json({ message: "Room updated" });
    });
  });
};

// ── Quick status update (used when guest checks in/out) ─
exports.updateStatus = (req, res) => {
  const { status } = req.body;
  if (!["available", "occupied", "maintenance", "reserved"].includes(status))
    return res.status(400).json({ message: "Invalid status" });

  Room.updateStatus(req.params.id, status, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: `Room status updated to ${status}` });
  });
};

exports.remove = (req, res) => {
  Room.getById(req.params.id, (err, room) => {
    if (err) return res.status(500).json(err);
    if (!room) return res.status(404).json({ message: "Room not found" });

    Room.delete(req.params.id, req.user?.id || null, (err2) => {
      if (err2) return res.status(500).json(err2);
      res.json({ message: "Room deleted" });
    });
  });
};
