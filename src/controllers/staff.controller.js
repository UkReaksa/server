// src/controllers/staff.controller.js
const Staff = require("../model/staff.model");

exports.getAll = (req, res) => {
  Staff.getAll((err, staff) => {
    if (err) return res.status(500).json(err);
    res.json(staff);
  });
};

exports.getById = (req, res) => {
  Staff.getById(req.params.id, (err, staff) => {
    if (err) return res.status(500).json(err);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.json(staff);
  });
};

exports.getStats = (req, res) => {
  Staff.stats((err, stats) => {
    if (err) return res.status(500).json(err);
    res.json(stats);
  });
};

exports.create = (req, res) => {
  const {
    staff_name,
    phone,
    gender,
    position,
    work_shift,
    hire_date,
    salary,
    status,
    address,
    created_by,
  } = req.body;

  if (!staff_name?.trim())
    return res.status(400).json({ message: "Staff name is required" });
  if (!position?.trim())
    return res.status(400).json({ message: "Position is required" });

  const data = {
    staff_name: staff_name.trim(),
    phone: phone || null,
    gender: gender || "male",
    position: position.trim(),
    work_shift: work_shift || "full_time",
    hire_date: hire_date || null,
    salary: salary || 0,
    status: status || "active",
    address: address || null,
    // Prefer the authenticated user if your auth middleware sets req.user;
    // fall back to whatever the frontend sent (AddStaff.vue currently
    // sends this directly since your backend wasn't setting it from the token).
    created_by: req.user?.id || created_by || null,
  };

  Staff.create(data, (err, result) => {
    if (err) return res.status(500).json(err);
    res
      .status(201)
      .json({ message: "Staff created", staff_id: result.insertId });
  });
};

exports.update = (req, res) => {
  const {
    staff_name,
    phone,
    gender,
    position,
    work_shift,
    hire_date,
    salary,
    status,
    address,
  } = req.body;

  Staff.getById(req.params.id, (err, staff) => {
    if (err) return res.status(500).json(err);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const data = {};
    if (staff_name !== undefined) data.staff_name = staff_name;
    if (phone !== undefined) data.phone = phone;
    if (gender !== undefined) data.gender = gender;
    if (position !== undefined) data.position = position;
    if (work_shift !== undefined) data.work_shift = work_shift;
    if (hire_date !== undefined) data.hire_date = hire_date;
    if (salary !== undefined) data.salary = salary;
    if (status !== undefined) data.status = status;
    if (address !== undefined) data.address = address;

    Staff.update(req.params.id, data, (err2) => {
      if (err2) return res.status(500).json(err2);
      res.json({ message: "Staff updated" });
    });
  });
};

// Real delete — actually removes the row from MySQL. If this still
// doesn't remove the row after using this controller, check:
//  1. Is this route actually registered in staff.routes.js?
//  2. Is Staff.delete(id, callback) in the model taking exactly 2
//     arguments? (A mismatch here silently breaks the callback and
//     can crash the whole server — the exact bug we found in Rooms.)
//  3. Does your frontend's delete button actually call this endpoint
//     with the correct staff id?
exports.remove = (req, res) => {
  Staff.getById(req.params.id, (err, staff) => {
    if (err) return res.status(500).json(err);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    Staff.delete(req.params.id, (err2) => {
      if (err2) return res.status(500).json(err2);
      res.json({ message: "Staff deleted" });
    });
  });
};
