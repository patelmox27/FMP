const express = require("express")
const router = express.Router()

const {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingsByUser,
  cancelBooking,
  completeBooking,
  updateBooking
} = require("../controllers/BookingController")


// ================= BOOKING ROUTES =================
const validateToken = require("../middleware/auth");

// ➕ Create booking
router.post("/create", validateToken, createBooking)

// 📍 Get all bookings (admin only ideally)
router.get("/all", validateToken, getAllBookings)

// 📊 Get bookings by user
router.get("/user/:userId", validateToken, getBookingsByUser)

// 🔍 Get booking by ID
router.get("/:id", validateToken, getBookingById)

// ❌ Cancel booking
router.put("/cancel/:id", validateToken, cancelBooking)

// ✅ Complete booking
router.put("/complete/:id", validateToken, completeBooking)

// 📝 Update booking (extend)
router.patch("/update/:id", validateToken, updateBooking)



module.exports = router