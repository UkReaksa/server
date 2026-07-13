// src/routes/guest.routes.js
const express = require("express");
const router = express.Router();
const guestController = require("../controllers/guest.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// all routes protected
router.use(authMiddleware.verifyToken);

router.get("/", guestController.getAll); // GET  /api/guests
router.get("/stats", guestController.stats); // GET  /api/guests/stats
router.get("/search", guestController.search); // GET  /api/guests/search?q=keyword
router.get("/:id", guestController.getById); // GET  /api/guests/:id
router.post("/", guestController.create); // POST /api/guests
router.put("/:id", guestController.update); // PUT  /api/guests/:id
router.delete("/:id", guestController.remove); // DELETE /api/guests/:id

module.exports = router;
