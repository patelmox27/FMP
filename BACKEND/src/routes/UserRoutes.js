const express = require("express")
const router = express.Router()

const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  deleteUser,
  forgotPassword,
  resetPassword,
  getUserNotifications,
  markNotificationRead,
} = require("../controllers/UserController")

const validateToken = require("../middleware/auth");

router.post("/register", registerUser)
router.post("/login", loginUser)

router.get("/getallusers", getAllUsers)
router.get("/notifications/:userId", validateToken, getUserNotifications)
router.put("/notifications/:id/read", validateToken, markNotificationRead)
router.get("/:id", getUserById)


router.delete("/:id", deleteUser)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router