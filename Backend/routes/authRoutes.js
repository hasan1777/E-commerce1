const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile
} = require("../controllers/authController.js");
const { protect } = require("../middleware/authMiddleware.js");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Private routes
router.get("/me", protect, getUserProfile);
router.put("/me/update", protect, updateUserProfile);
// In the design doc, user profile update was PUT /:userId, but /me/update is more RESTful for self-update.
// Admin routes for managing other users will be in a separate userRoutes.js

module.exports = router;

