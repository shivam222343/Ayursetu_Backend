const express = require("express");
const { register, login, checkGoogleUser, registerGoogleUser, loginGoogleUser } = require("../controllers/authController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Google OAuth routes
router.get("/google/check/:googleId", checkGoogleUser);
router.post("/google/register", registerGoogleUser);
router.post("/google/login", loginGoogleUser);

module.exports = router;
