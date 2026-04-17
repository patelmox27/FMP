const express = require("express")
const router = express.Router()

const {
  addVehicle,
  getAllVehicles,
  getVehicleById,
  getVehiclesByUser,
  updateVehicle,
  deleteVehicle
} = require("../controllers/VehicleController")


// ================= VEHICLE ROUTES =================

// ➕ Add vehicle
const validateToken = require("../middleware/auth");

router.post("/add", validateToken, addVehicle)
router.get("/all", validateToken, getAllVehicles)
router.get("/:id", validateToken, getVehicleById)
router.get("/user/:userId", validateToken, getVehiclesByUser)
router.put("/update/:id", validateToken, updateVehicle)
router.delete("/delete/:id", validateToken, deleteVehicle)

module.exports = router