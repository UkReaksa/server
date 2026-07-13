const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permission.controller");

// GET ALL
router.get("/", permissionController.getPermissions);

// GET BY ID
router.get("/:id", permissionController.getPermission);

// CREATE
router.post("/", permissionController.createPermission);

// UPDATE
router.put("/:id", permissionController.updatePermission);

// DELETE
router.delete("/:id", permissionController.deletePermission);

module.exports = router;
