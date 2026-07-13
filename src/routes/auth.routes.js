const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// ── Public ─────────────────────────────────────────────
router.post("/login", authController.login);

// ── Auth ───────────────────────────────────────────────
router.post("/logout", authMiddleware.verifyToken, authController.logout);

// ── Register — protected so req.user is available ──────
router.post("/register", authMiddleware.verifyToken, authController.register);

// ── Roles & Permissions ────────────────────────────────
router.get("/roles", authMiddleware.verifyToken, authController.getRoles);
router.get(
  "/permissions",
  authMiddleware.verifyToken,
  authController.getPermissions,
);

// ── Users CRUD ─────────────────────────────────────────
router.get("/users", authMiddleware.verifyToken, authController.getAllUsers);
router.get(
  "/users/:id",
  authMiddleware.verifyToken,
  authController.getUserById,
);
router.put("/users/:id", authMiddleware.verifyToken, authController.updateUser);
router.delete(
  "/users/:id",
  authMiddleware.verifyToken,
  authController.deleteUser,
);

// ── Avatar ─────────────────────────────────────────────
router.post(
  "/users/:id/avatar",
  authMiddleware.verifyToken,
  upload.single("avatar"),
  authController.uploadAvatar,
);

// ── Online users & Login history ───────────────────────
// FIX: add verifyToken + updateLastActive here too
router.get(
  "/online-users",
  authMiddleware.verifyToken,
  authController.updateLastActive,
  authController.getOnlineUsers,
);
router.get(
  "/login-history",
  authMiddleware.verifyToken,
  authController.updateLastActive,
  authController.getLoginHistory,
);

// ── Update last_active on ALL protected routes ─────────
// NOTE: remove router.use() — it was running verifyToken twice
// and potentially overwriting req.user incorrectly

module.exports = router;
