// src/routes/superadmin.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/superadmin.controller");
const jwt = require("jsonwebtoken");

// ── Middleware ─────────────────────────────────────────
function verifySuperAdmin(req, res, next) {
  const bearer = req.headers["authorization"];
  if (!bearer) return res.status(403).json({ message: "No token" });
  const token = bearer.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    if (decoded.role !== "super_admin")
      return res.status(403).json({ message: "Super admin only" });
    req.user = decoded;
    next();
  });
}

// ── Public ─────────────────────────────────────────────
router.post("/register", ctrl.register); // create super admin
router.post("/login", ctrl.login); // super admin login
router.post("/workspace-login", ctrl.workspaceLogin); // hotel login to dashboard

// ── Protected ──────────────────────────────────────────
router.get("/stats", verifySuperAdmin, ctrl.getStats);
router.get("/workspaces", verifySuperAdmin, ctrl.getAll);
router.get("/workspaces/:id", verifySuperAdmin, ctrl.getById);
router.post("/workspaces", verifySuperAdmin, ctrl.create);
router.put("/workspaces/:id", verifySuperAdmin, ctrl.update);
router.delete("/workspaces/:id", verifySuperAdmin, ctrl.remove);
router.patch("/workspaces/:id/status", verifySuperAdmin, ctrl.toggleStatus);
router.patch(
  "/workspaces/:id/permissions",
  verifySuperAdmin,
  ctrl.updatePermissions,
);

module.exports = router;
