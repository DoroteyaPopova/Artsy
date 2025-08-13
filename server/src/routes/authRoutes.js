const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const router = express.Router();
const {
   registerUser,
   loginUser,
   getProfile,
   getAllUsers,
   updateUser,
   getUserById,
   getUserStats,
} = require("../controllers/authController");

router.use(cookieParser());

router.get("/logout", (req, res) => {
   res.status(200).json({ message: "Logged out successfully" });
});

router.get("/", getAllUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", getProfile);
router.post("/update", updateUser);
router.get("/:userId", getUserById);
router.get("/:userId/stats", getUserStats);

module.exports = router;
