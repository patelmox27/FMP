const express = require("express");
const router = express.Router();
const validateToken = require("../middleware/auth");
const { requireRole } = require("../middleware/auth");
const {
  loginAdmin,
  getDashboard,
  getRevenueReport,
  getPeakHours,
  getOccupancyStats,
  getAllLots,
  createLot,
  updateLot,
  deleteLot,
  getSlotsByLot,
  updateSlot,
  addSlot,
  bulkAddSlots,
  deleteSlot,
  getAllUsers,
  getRecentBookings,
  getNotifications,
  markNotificationRead,
  getAlerts,
} = require("../controllers/AdminController");

// Public admin login
router.post("/login", loginAdmin);

// All other admin routes require an authenticated admin token
router.use(validateToken, requireRole("admin"));

// ── Analytics ────────────────────
router.get("/dashboard", getDashboard);
router.get("/revenue", getRevenueReport);
router.get("/peak-hours", getPeakHours);
router.get("/occupancy", getOccupancyStats);

// ── Parking Lots ─────────────────
router.get("/lots", getAllLots);
router.post("/lots", createLot);
router.put("/lots/:id", updateLot);
router.delete("/lots/:id", deleteLot);

// ── Slots ────────────────────────
router.get("/lots/:lotId/slots", getSlotsByLot);
router.post("/lots/:lotId/slots", addSlot);
router.post("/lots/:lotId/slots/bulk", bulkAddSlots);
router.put("/slots/:id", updateSlot);
router.delete("/slots/:id", deleteSlot);

// ── Users & Bookings ─────────────
router.get("/users", getAllUsers);
router.get("/bookings", getRecentBookings);

// ── Notifications & Alerts ───────
router.get("/notifications", getNotifications);
router.patch("/notifications/:id/read", markNotificationRead);
router.get("/alerts", getAlerts);

module.exports = router;
