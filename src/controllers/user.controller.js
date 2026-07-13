const User = require("../model/user.model");

// ── Get all users ──────────────────────────────────────
exports.getUsers = (req, res) => {
  User.getAll((err, data) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Failed to get users", details: err });
    res.json({ message: "Users retrieved successfully", data });
  });
};

// ── Get user by ID ─────────────────────────────────────
exports.getUserById = (req, res) => {
  const { id } = req.params;

  User.getById(id, (err, data) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Failed to get user", details: err });

    // FIX: handle both null and empty array
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = Array.isArray(data) ? data[0] : data;
    res.json({ message: "User retrieved successfully", data: user });
  });
};

// ── Create user ────────────────────────────────────────
exports.createUser = (req, res) => {
  const { username, gmail, password, role_id, status } = req.body;

  // FIX: validate required fields
  if (!username || !gmail || !password) {
    return res
      .status(400)
      .json({ error: "username, gmail, and password are required" });
  }

  User.create({ username, gmail, password, role_id, status }, (err, result) => {
    if (err) {
      // FIX: catch duplicate gmail
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "Gmail already exists" });
      }
      return res
        .status(500)
        .json({ error: "Failed to create user", details: err });
    }
    res
      .status(201)
      .json({ message: "User created successfully", user_id: result.insertId });
  });
};

// ── Update user ────────────────────────────────────────
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const userData = req.body;

  // FIX: check user exists before updating
  User.getById(id, (err, data) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Failed to get user", details: err });
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return res.status(404).json({ message: "User not found" });
    }

    User.update(id, userData, (err2) => {
      if (err2) {
        if (err2.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Gmail already exists" });
        }
        return res
          .status(500)
          .json({ error: "Failed to update user", details: err2 });
      }
      res.json({ message: "User updated successfully" });
    });
  });
};

// ── Delete user ────────────────────────────────────────
exports.deleteUser = (req, res) => {
  const { id } = req.params;

  // FIX: check user exists before deleting
  User.getById(id, (err, data) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Failed to get user", details: err });
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return res.status(404).json({ message: "User not found" });
    }

    User.delete(id, (err2) => {
      if (err2)
        return res
          .status(500)
          .json({ error: "Failed to delete user", details: err2 });
      res.json({ message: "User deleted successfully" });
    });
  });
};
