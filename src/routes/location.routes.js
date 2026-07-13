// src/routes/location.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const db = require("../config/db");

router.use(auth.verifyToken);

router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM attendance_locations ORDER BY is_active DESC, id ASC",
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    },
  );
});

router.get("/active", (req, res) => {
  db.query(
    "SELECT * FROM attendance_locations WHERE is_active=1 LIMIT 1",
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows[0] || null);
    },
  );
});

router.post("/", (req, res) => {
  const { name, address, latitude, longitude, radius_m } = req.body;
  if (!name) return res.status(400).json({ message: "name required" });
  db.query(
    "INSERT INTO attendance_locations SET ?",
    {
      name,
      address,
      latitude: latitude || null,
      longitude: longitude || null,
      radius_m: radius_m || 200,
      created_at: new Date(),
    },
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ message: "Created", id: result.insertId });
    },
  );
});

router.put("/:id", (req, res) => {
  const { name, address, latitude, longitude, radius_m, is_active } = req.body;
  db.query(
    "UPDATE attendance_locations SET ? WHERE id=?",
    [
      { name, address, latitude, longitude, radius_m, is_active },
      req.params.id,
    ],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: "Updated" });
    },
  );
});

router.delete("/:id", (req, res) => {
  db.query(
    "DELETE FROM attendance_locations WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: "Deleted" });
    },
  );
});

module.exports = router;
