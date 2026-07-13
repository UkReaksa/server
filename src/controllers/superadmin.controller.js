// src/controllers/superadmin.controller.js
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ══════════════════════════════════════════════════════
//  SUPER ADMIN AUTH
// ══════════════════════════════════════════════════════

exports.register = (req, res) => {
  const { username, password, email } = req.body;
  if (!username?.trim())
    return res.status(400).json({ message: "username required" });
  if (!password?.trim())
    return res.status(400).json({ message: "password required" });

  db.query(
    "SELECT id FROM super_admins WHERE username=?",
    [username],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length)
        return res.status(400).json({ message: "Username already exists" });

      const hashed = bcrypt.hashSync(password, 10);
      db.query(
        "INSERT INTO super_admins (username,password,email) VALUES (?,?,?)",
        [username.trim(), hashed, email || null],
        (err2, result) => {
          if (err2) return res.status(500).json(err2);
          res
            .status(201)
            .json({ message: "Super admin created", id: result.insertId });
        },
      );
    },
  );
};

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "username and password required" });

  db.query(
    "SELECT * FROM super_admins WHERE username=?",
    [username],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (!rows[0])
        return res.status(404).json({ message: "Super admin not found" });

      if (!bcrypt.compareSync(password, rows[0].password))
        return res.status(401).json({ message: "Wrong password" });

      const token = jwt.sign(
        { id: rows[0].id, username: rows[0].username, role: "super_admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );
      res.json({
        message: "Login success",
        token,
        admin: {
          id: rows[0].id,
          username: rows[0].username,
          email: rows[0].email,
        },
      });
    },
  );
};

// ══════════════════════════════════════════════════════
//  WORKSPACE (HOTEL SYSTEM) CRUD
// ══════════════════════════════════════════════════════

// GET all workspaces
exports.getAll = (req, res) => {
  const sql = `
    SELECT w.*, sa.username AS created_by_name
    FROM workspaces w
    LEFT JOIN super_admins sa ON sa.id = w.created_by
    ORDER BY w.id DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows.map(({ password, ...r }) => r));
  });
};

// GET one workspace
exports.getById = (req, res) => {
  db.query(
    "SELECT * FROM workspaces WHERE id=?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (!rows[0])
        return res.status(404).json({ message: "Workspace not found" });
      const { password, ...safe } = rows[0];
      res.json(safe);
    },
  );
};

// GET workspace stats
exports.getStats = (req, res) => {
  const sql = `
    SELECT
      COUNT(*)                              AS total,
      SUM(status = 'active')               AS active,
      SUM(status = 'inactive')             AS inactive,
      SUM(status = 'suspended')            AS suspended,
      SUM(expired_date < CURDATE()
        AND expired_date IS NOT NULL)       AS expired
    FROM workspaces
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows[0]);
  });
};

// POST create workspace
exports.create = (req, res) => {
  const {
    name,
    username,
    password,
    email,
    phone,
    address,
    note,
    status,
    expired_date,
    can_booking,
    can_guest,
    can_room,
    can_staff,
    can_attendance,
    can_payment,
    can_report,
    max_users,
    max_rooms,
  } = req.body;

  if (!name?.trim()) return res.status(400).json({ message: "name required" });
  if (!username?.trim())
    return res.status(400).json({ message: "username required" });
  if (!password?.trim())
    return res.status(400).json({ message: "password required" });

  db.query(
    "SELECT id FROM workspaces WHERE username=?",
    [username],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length)
        return res.status(400).json({ message: "Username already exists" });

      const data = {
        name: name.trim(),
        username: username.trim(),
        password: bcrypt.hashSync(password, 10),
        email: email || null,
        phone: phone || null,
        address: address || null,
        note: note || null,
        status: status || "active",
        expired_date: expired_date || null,
        can_booking: can_booking ?? 1,
        can_guest: can_guest ?? 1,
        can_room: can_room ?? 1,
        can_staff: can_staff ?? 1,
        can_attendance: can_attendance ?? 1,
        can_payment: can_payment ?? 1,
        can_report: can_report ?? 1,
        max_users: max_users || 10,
        max_rooms: max_rooms || 50,
        created_by: req.user?.id || null,
      };

      db.query("INSERT INTO workspaces SET ?", data, (err2, result) => {
        if (err2) return res.status(500).json(err2);
        res
          .status(201)
          .json({
            message: "Workspace created successfully",
            workspace_id: result.insertId,
          });
      });
    },
  );
};

// PUT update workspace
exports.update = (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    note,
    status,
    expired_date,
    password,
    can_booking,
    can_guest,
    can_room,
    can_staff,
    can_attendance,
    can_payment,
    can_report,
    max_users,
    max_rooms,
  } = req.body;

  const data = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (address !== undefined) data.address = address;
  if (note !== undefined) data.note = note;
  if (status !== undefined) data.status = status;
  if (expired_date !== undefined) data.expired_date = expired_date;
  if (max_users !== undefined) data.max_users = max_users;
  if (max_rooms !== undefined) data.max_rooms = max_rooms;
  if (can_booking !== undefined) data.can_booking = can_booking;
  if (can_guest !== undefined) data.can_guest = can_guest;
  if (can_room !== undefined) data.can_room = can_room;
  if (can_staff !== undefined) data.can_staff = can_staff;
  if (can_attendance !== undefined) data.can_attendance = can_attendance;
  if (can_payment !== undefined) data.can_payment = can_payment;
  if (can_report !== undefined) data.can_report = can_report;
  if (password?.trim()) data.password = bcrypt.hashSync(password, 10);

  db.query(
    "UPDATE workspaces SET ? WHERE id=?",
    [data, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Workspace updated" });
    },
  );
};

// PATCH update permissions only
exports.updatePermissions = (req, res) => {
  const {
    can_booking,
    can_guest,
    can_room,
    can_staff,
    can_attendance,
    can_payment,
    can_report,
    max_users,
    max_rooms,
  } = req.body;

  const data = {};
  if (can_booking !== undefined) data.can_booking = can_booking;
  if (can_guest !== undefined) data.can_guest = can_guest;
  if (can_room !== undefined) data.can_room = can_room;
  if (can_staff !== undefined) data.can_staff = can_staff;
  if (can_attendance !== undefined) data.can_attendance = can_attendance;
  if (can_payment !== undefined) data.can_payment = can_payment;
  if (can_report !== undefined) data.can_report = can_report;
  if (max_users !== undefined) data.max_users = max_users;
  if (max_rooms !== undefined) data.max_rooms = max_rooms;

  db.query(
    "UPDATE workspaces SET ? WHERE id=?",
    [data, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Permissions updated" });
    },
  );
};

// PATCH toggle status
exports.toggleStatus = (req, res) => {
  const { status } = req.body;
  if (!["active", "inactive", "suspended"].includes(status))
    return res
      .status(400)
      .json({ message: "Invalid status. Use: active | inactive | suspended" });

  db.query(
    "UPDATE workspaces SET status=? WHERE id=?",
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: `Workspace ${status}` });
    },
  );
};

// DELETE workspace
exports.remove = (req, res) => {
  db.query("DELETE FROM workspaces WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Workspace deleted" });
  });
};

// ══════════════════════════════════════════════════════
//  WORKSPACE LOGIN → Hotel Dashboard
// ══════════════════════════════════════════════════════
exports.workspaceLogin = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "username and password required" });

  db.query(
    "SELECT * FROM workspaces WHERE username=?",
    [username],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (!rows[0])
        return res.status(404).json({ message: "Account not found" });

      const w = rows[0];

      // check status
      if (w.status === "suspended")
        return res
          .status(403)
          .json({
            message: "Account suspended. Contact super admin.",
            banned: true,
          });
      if (w.status === "inactive")
        return res
          .status(403)
          .json({ message: "Account is inactive.", banned: true });

      // check expired
      if (w.expired_date && new Date(w.expired_date) < new Date())
        return res
          .status(403)
          .json({
            message: "Account expired. Please contact super admin.",
            expired: true,
          });

      // check password
      if (!bcrypt.compareSync(password, w.password))
        return res.status(401).json({ message: "Wrong password" });

      // build permissions from workspace modules
      const permissions = [];
      if (w.can_booking) permissions.push({ id: 6, name: "use_booking" });
      if (w.can_guest) permissions.push({ id: 9, name: "use_guest" });
      if (w.can_room) permissions.push({ id: 10, name: "use_room" });
      if (w.can_staff) permissions.push({ id: 36, name: "use_staff" });
      if (w.can_attendance) permissions.push({ id: 7, name: "use_attendance" });
      if (w.can_payment) permissions.push({ id: 11, name: "use_payment" });
      if (w.can_report) permissions.push({ id: 8, name: "use_report" });

      // All user management always available for workspace owner
      permissions.push({ id: 5, name: "view_user" });
      permissions.push({ id: 2, name: "create_user" });
      permissions.push({ id: 3, name: "edit_user" });
      permissions.push({ id: 4, name: "delete_user" });

      const token = jwt.sign(
        {
          id: w.id,
          gmail: w.username,
          role: "workspace_owner",
          workspace_id: w.id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      // save to auth_access_token
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      db.query(
        "INSERT INTO auth_access_token (access_token,user_id,expires_at,created_by) VALUES (?,?,?,?)",
        [token, w.id, expiresAt, w.id],
        (err2) => {
          if (err2) console.error("Token save:", err2);
        },
      );

      res.json({
        message: "Login success",
        token,
        user: {
          id: w.id,
          username: w.name,
          gmail: w.email || w.username,
          avatar: w.logo || null,
          workspace_id: w.id,
        },
        role: {
          id: 0,
          name: "Workspace Owner",
          permissions: permissions,
        },
      });
    },
  );
};
