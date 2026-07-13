// controllers/price.controller.js
const PriceModel = require("../model/price.model");

// GET /api/prices
exports.getAll = async (req, res) => {
  try {
    const presets = await PriceModel.getAll();
    res.json(presets);
  } catch (err) {
    console.error("[price.getAll]", err);
    res.status(500).json({ message: "Failed to fetch price presets" });
  }
};

// GET /api/prices/:id
exports.getById = async (req, res) => {
  try {
    const preset = await PriceModel.getById(req.params.id);
    if (!preset) return res.status(404).json({ message: "Preset not found" });
    res.json(preset);
  } catch (err) {
    console.error("[price.getById]", err);
    res.status(500).json({ message: "Failed to fetch preset" });
  }
};

// POST /api/prices
exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }
    const preset = await PriceModel.create(req.body);
    res.status(201).json(preset);
  } catch (err) {
    console.error("[price.create]", err);
    res.status(500).json({ message: "Failed to create preset" });
  }
};

// PUT /api/prices/:id
exports.update = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }
    const preset = await PriceModel.update(req.params.id, req.body);
    if (!preset) return res.status(404).json({ message: "Preset not found" });
    res.json(preset);
  } catch (err) {
    console.error("[price.update]", err);
    res.status(500).json({ message: "Failed to update preset" });
  }
};

// DELETE /api/prices/:id
exports.remove = async (req, res) => {
  try {
    const ok = await PriceModel.remove(req.params.id);
    if (!ok) return res.status(404).json({ message: "Preset not found" });
    res.json({ message: "Preset deleted" });
  } catch (err) {
    console.error("[price.remove]", err);
    res.status(500).json({ message: "Failed to delete preset" });
  }
};
