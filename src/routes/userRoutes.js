const express = require("express");
const {verifyToken} = require("../middleware/authMiddleware.js");
const {authorizeRoles} = require("../middleware/roleMiddleware.js");
const { getUserProfile, updateUserProfile } = require("../controllers/userController.js");

const router = express.Router();

// Get user profile - accessible by all logged-in users
router.get("/profile", verifyToken, getUserProfile);

// Update user profile - accessible by all logged-in users
router.put("/profile", verifyToken, updateUserProfile);

// Only doctors
router.get(
  "/doctor-dashboard",
  verifyToken,
  authorizeRoles("doctor"),
  (req, res) => {
    res.json({ message: "Doctor Dashboard" });
  }
);

// Only patients
router.get(
  "/patient-dashboard",
  verifyToken,
  authorizeRoles("patient"),
  (req, res) => {
    res.json({ message: "Patient Dashboard" });
  }
);

// Only admins
router.get(
  "/admin-dashboard",
  verifyToken,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Admin Dashboard" });
  }
);

module.exports = router;
