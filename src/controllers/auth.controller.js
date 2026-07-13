const User = require("../model/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const path = require("path");
const fs = require("fs");
// ---------------- Get all roles (for dropdown) ----------------
exports.getRoles = (req, res) => {
  const sql = `SELECT id, name FROM roles`;
  db.query(sql, (err, roles) => {
    if (err) return res.status(500).json(err);
    res.json(roles);
  });
};

// ---------------- Get all permissions (for dropdown) ----------------
exports.getPermissions = (req, res) => {
  const sql = `SELECT id, name FROM permissions`;
  db.query(sql, (err, permissions) => {
    if (err) return res.status(500).json(err);
    res.json(permissions);
  });
};

// ---------------- Register ----------------
exports.register = (req, res) => {
  const { username, gmail, password, role_id, status, is_admin, is_staff } =
    req.body;

  if (!username || !gmail || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  if (!role_id) {
    return res.status(400).json({ message: "role_id is required" });
  }

  User.getByEmail(gmail, (err, existingUser) => {
    if (err) return res.status(500).json(err);
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = bcrypt.hashSync(password, 10);

    const userData = {
      username,
      gmail,
      password: hashedPassword,
      role_id,
      status: status || "active",
      is_admin: is_admin || false,
      is_staff: is_staff || false,
      is_active: true,
      created_by: req.user?.id ?? 1,
    };

    User.create(userData, (err, result) => {
      if (err) return res.status(500).json(err);

      const userId = result.insertId;

      const token = jwt.sign(
        { id: userId, gmail },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );
 

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const sql = `
        INSERT INTO auth_access_token (access_token, user_id, expires_at, created_by)
        VALUES (?, ?, ?, ?)
      `;
      db.query(sql, [token, userId, expiresAt, userId], (err2) => {
        if (err2) return res.status(500).json(err2);

        res.status(201).json({
          message: "User registered and logged in",
          user_id: userId,
          token,
        });
      });
    });
  });
};


// ---------------- Login ----------------
exports.login = (req, res) => {
  const { gmail, password } = req.body;

  User.getByEmail(gmail, (err, user) => {
    if (err) return res.status(500).json(err);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ── FIX: check banned status ──────────────────────
    if (user.status === "inactive") {
      return res.status(403).json({
        message: "Your account has been banned. Please contact the administrator.",
        banned: true,
      });
    }
    // ─────────────────────────────────────────────────

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    // get role + permissions using role_id from users table
    const sql1 = `
      SELECT
        r.id   AS role_id,
        r.name AS role_name,
        p.id   AS permission_id,
        p.name AS permission_name
      FROM roles r
      LEFT JOIN permission_role pr ON pr.role_id = r.id
      LEFT JOIN permissions p      ON p.id = pr.permission_id
      WHERE r.id = ?
    `;
    db.query(sql1, [user.role_id], (err2, rows) => {
      if (err2) return res.status(500).json(err2);

      const role = {
        id:   rows[0]?.role_id,
        name: rows[0]?.role_name,
        permissions: rows
          .filter((r) => r.permission_id)
          .map((r) => ({ id: r.permission_id, name: r.permission_name })),
      };

      const token = jwt.sign(
        { id: user.id, gmail: user.gmail },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const sql2 = `
        INSERT INTO auth_access_token (access_token, user_id, expires_at, created_by)
        VALUES (?, ?, ?, ?)
      `;
      db.query(sql2, [token, user.id, expiresAt, user.id], (err3) => {
        if (err3) return res.status(500).json(err3);

        const { password: _, ...userSafe } = user;

        res.json({
          message: "Login success",
          token,
          user: userSafe,
          role,
        });
      });
    });
  });
};

// ---------------- Logout ----------------
exports.logout = (req, res) => {
  const bearer = req.headers["authorization"];
  if (!bearer) return res.status(400).json({ message: "No token provided" });

  const token = bearer.split(" ")[1];
  const sql = `
    UPDATE auth_access_token
    SET is_revoked = TRUE, updated_at = NOW()
    WHERE access_token = ?
  `;
  db.query(sql, [token], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Logout success" });
  });
};

// ---------------- Get all users ----------------
exports.getAllUsers = (req, res) => {
  User.getAll((err, users) => {
    if (err) return res.status(500).json(err);
    res.json(users);
  });
};

// ---------------- Get user by ID ----------------
exports.getUserById = (req, res) => {
  const { id } = req.params;
  User.getById(id, (err, user) => {
    if (err) return res.status(500).json(err);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });
};

// ---------------- Update user ----------------
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { username, gmail, password, role_id, status, is_admin, is_staff } =
    req.body;

  const userData = {
    username,
    gmail,
    role_id,
    status,
    is_admin,
    is_staff,
    update_at: new Date(),
  };

  if (password) {
    userData.password = bcrypt.hashSync(password, 10);
  }

  User.update(id, userData, (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully" });
  });
};
// ---------------- Delete user ----------------
exports.deleteUser = (req, res) => {
  const { id } = req.params;
 
  User.getById(id, (err, user) => {
    if (err) return res.status(500).json(err);
    if (!user || (Array.isArray(user) && user.length === 0)) {
      return res.status(404).json({ message: "User not found" });
    }
 
    User.delete(id, (err2) => {
      if (err2) return res.status(500).json(err2);
      res.json({ message: "User deleted successfully" });
    });
  });
};

// ---------------- Upload avatar ----------------
exports.uploadAvatar = (req, res) => {
  const { id } = req.params;
 
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
 
  // relative path stored in DB  e.g. "avatars/avatar_1_172000.jpg"
  const avatarPath = `avatars/${req.file.filename}`;
 
  // delete old avatar if exists
  User.getById(id, (err, user) => {
    if (err) return res.status(500).json(err);
    if (!user || (Array.isArray(user) && user.length === 0)) {
      return res.status(404).json({ message: "User not found" });
    }
 
    const oldAvatar = Array.isArray(user) ? user[0]?.avatar : user?.avatar;
    if (oldAvatar) {
      const oldPath = path.join(__dirname, "../../uploads", oldAvatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
 
    // save new avatar path to DB
    User.update(id, { avatar: avatarPath }, (err2) => {
      if (err2) return res.status(500).json(err2);
 
      res.json({
        message: "Avatar uploaded successfully",
        avatar: avatarPath,
        avatar_url: `${process.env.BASE_URL}/uploads/${avatarPath}`,
      });
    });
  });
};


// ---------------- Get online users (active in last 5 min) ----------------
exports.getOnlineUsers = (req, res) => {
  const sql = `
    SELECT DISTINCT
      u.id,
      u.username,
      u.gmail,
      u.avatar,
      r.name        AS role_name,
      t.last_active,
      t.device,
      t.created_at  AS login_time
    FROM auth_access_token t
    JOIN users u ON u.id = t.user_id
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE
      t.is_revoked  = FALSE
      AND t.expires_at > NOW()
      AND t.last_active >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    ORDER BY t.last_active DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};
 
// ---------------- Get login history ----------------
exports.getLoginHistory = (req, res) => {
  const limit  = parseInt(req.query.limit)  || 50;
  const offset = parseInt(req.query.offset) || 0;
 
  const sql = `
    SELECT
      t.id,
      u.id          AS user_id,
      u.username,
      u.gmail,
      u.avatar,
      r.name        AS role_name,
      t.created_at  AS login_time,
      t.last_active,
      t.device,
      t.is_revoked,
      CASE
        WHEN t.is_revoked = TRUE                        THEN 'logged_out'
        WHEN t.expires_at < NOW()                       THEN 'expired'
        WHEN t.last_active >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) THEN 'online'
        ELSE 'idle'
      END AS status
    FROM auth_access_token t
    JOIN users u  ON u.id = t.user_id
    LEFT JOIN roles r ON r.id = u.role_id
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `;
  db.query(sql, [limit, offset], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};
 
// ---------------- Update last_active (call this on every protected request) ----------------
exports.updateLastActive = (req, res, next) => {
  const bearer = req.headers["authorization"];
  if (!bearer) return next();
 
  const token  = bearer.split(" ")[1];
  const device = req.headers["user-agent"] || "Unknown";
 
  const sql = `
    UPDATE auth_access_token
    SET last_active = NOW(), device = ?
    WHERE access_token = ? AND is_revoked = FALSE
  `;
  db.query(sql, [device, token], () => next()); // always continue
};