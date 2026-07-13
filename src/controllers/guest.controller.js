// src/controllers/guest.controller.js
const GuestModel = require("../model/guest.model");

// GET /api/guests
exports.getAll = async (req, res) => {
  try {
    const guests = await GuestModel.getAll();
    res.json(guests);
  } catch (err) {
    console.error("[guest.getAll]", err);
    res.status(500).json({ message: "Failed to fetch guests" });
  }
};

// GET /api/guests/stats
exports.stats = async (req, res) => {
  try {
    const stats = await GuestModel.getStats();
    res.json(stats);
  } catch (err) {
    console.error("[guest.stats]", err);
    res.status(500).json({ message: "Failed to fetch guest stats" });
  }
};

// GET /api/guests/search?q=keyword
exports.search = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    const results = await GuestModel.search(q);
    res.json(results);
  } catch (err) {
    console.error("[guest.search]", err);
    res.status(500).json({ message: "Failed to search guests" });
  }
};

// GET /api/guests/:id
exports.getById = async (req, res) => {
  try {
    const guest = await GuestModel.getById(req.params.id);
    if (!guest) return res.status(404).json({ message: "Guest not found" });
    res.json(guest);
  } catch (err) {
    console.error("[guest.getById]", err);
    res.status(500).json({ message: "Failed to fetch guest" });
  }
};

// POST /api/guests
exports.create = async (req, res) => {
  try {
    const { full_name } = req.body;
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ message: "full_name is required" });
    }

    const guest = await GuestModel.create(req.body);
    res.status(201).json(guest);
  } catch (err) {
    console.error("[guest.create]", err);
    res.status(500).json({ message: "Failed to create guest" });
  }
};

// PUT /api/guests/:id
exports.update = async (req, res) => {
  try {
    const { full_name } = req.body;
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ message: "full_name is required" });
    }

    const guest = await GuestModel.update(req.params.id, req.body);
    if (!guest) return res.status(404).json({ message: "Guest not found" });
    res.json(guest);
  } catch (err) {
    console.error("[guest.update]", err);
    res.status(500).json({ message: "Failed to update guest" });
  }
};

// DELETE /api/guests/:id
exports.remove = async (req, res) => {
  try {
    const ok = await GuestModel.remove(req.params.id);
    if (!ok) return res.status(404).json({ message: "Guest not found" });
    res.json({ message: "Guest deleted" });
  } catch (err) {
    console.error("[guest.remove]", err);
    res.status(500).json({ message: "Failed to delete guest" });
  }
};
