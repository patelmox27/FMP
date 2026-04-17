const express = require("express");
const router = express.Router();

const {
  addParkingLot,
  getAllParkingLots,
  getParkingLotById,
  updateParkingLot,
  deleteParkingLot,
  createSlots,
  getSlotsByParkingLot,
  updateSlot,
  deleteSlot
} = require("../controllers/ParkingController");

const validateToken = require("../middleware/auth");

// ================= PARKING LOT ROUTES =================

// ➕ Create parking lot
router.post("/", validateToken, addParkingLot);

// 📍 Get all parking lots
router.get("/", validateToken, getAllParkingLots);

// 🔍 Get parking lot by ID
router.get("/:id", validateToken, getParkingLotById);

// ✏️ Update parking lot
router.put("/:id", validateToken, updateParkingLot);

// ❌ Delete parking lot
router.delete("/:id", validateToken, deleteParkingLot);


// ================= SLOT ROUTES =================

// ➕ Create slots
router.post("/slots", validateToken, createSlots);

// 📊 Get slots by parking lot
router.get("/slots/:id", validateToken, getSlotsByParkingLot);

// ✏️ Update slot
router.put("/slots/:id", validateToken, updateSlot);

// ❌ Delete slot
router.delete("/slots/:id", validateToken, deleteSlot);

module.exports = router;