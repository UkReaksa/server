// src/routes/staff.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/staff.controller");
const auth = require("../middlewares/auth.middleware");

router.use(auth.verifyToken);

router.get("/", ctrl.getAll); // GET    /api/staff
router.get("/stats", ctrl.getStats); // GET    /api/staff/stats  ← must come before "/:id"
router.get("/:id", ctrl.getById); // GET    /api/staff/:id
router.post("/", ctrl.create); // POST   /api/staff
router.put("/:id", ctrl.update); // PUT    /api/staff/:id
router.delete("/:id", ctrl.remove); // DELETE /api/staff/:id

module.exports = router;

// In app.js, alongside your other route mounts:
// const staffRoutes = require('./routes/staff.routes')
// app.use('/api/staff', staffRoutes)
