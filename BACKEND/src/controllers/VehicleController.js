const Vehicle = require("../models/VehicleModel")
const User = require("../models/UserModel")

// ➕ ADD VEHICLE
const addVehicle = async (req, res) => {
  try {
    const { userId, vehicleNumber, vehicleType } = req.body

    if (!userId || !vehicleNumber) {
      return res.status(400).json({
        message: "userId and vehicleNumber are required"
      })
    }

    // check user exists
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    // check duplicate vehicle
    const existingVehicle = await Vehicle.findOne({ vehicleNumber })
    if (existingVehicle) {
      return res.status(400).json({
        message: "Vehicle already exists"
      })
    }

    const vehicle = await Vehicle.create({
      userId,
      vehicleNumber,
      vehicleType
    })

    // add vehicle to user
    user.vehicles.push(vehicle._id)
    await user.save()

    res.status(201).json({
      message: "Vehicle added successfully",
      data: vehicle
    })

  } catch (err) {
    res.status(500).json({
      message: "Error adding vehicle",
      error: err.message
    })
  }
}


// 📍 GET ALL VEHICLES
const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate("userId", "Name email")

    res.status(200).json({
      message: "Vehicles fetched successfully",
      data: vehicles
    })

  } catch (err) {
    res.status(500).json({
      message: "Error fetching vehicles",
      error: err.message
    })
  }
}


// 🔍 GET VEHICLE BY ID
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("userId", "Name email")

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found"
      })
    }

    res.status(200).json({
      message: "Vehicle fetched successfully",
      data: vehicle
    })

  } catch (err) {
    res.status(500).json({
      message: "Error fetching vehicle",
      error: err.message
    })
  }
}


// 📊 GET VEHICLES BY USER
const getVehiclesByUser = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.params.userId })

    res.status(200).json({
      message: "User vehicles fetched successfully",
      data: vehicles
    })

  } catch (err) {
    res.status(500).json({
      message: "Error fetching user vehicles",
      error: err.message
    })
  }
}


// ✏️ UPDATE VEHICLE
const updateVehicle = async (req, res) => {
  try {
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" }
    )

    if (!updatedVehicle) {
      return res.status(404).json({
        message: "Vehicle not found"
      })
    }

    res.status(200).json({
      message: "Vehicle updated successfully",
      data: updatedVehicle
    })

  } catch (err) {
    res.status(500).json({
      message: "Error updating vehicle",
      error: err.message
    })
  }
}


// ❌ DELETE VEHICLE
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found"
      })
    }

    // remove vehicle from user
    await User.findByIdAndUpdate(vehicle.userId, {
      $pull: { vehicles: vehicle._id }
    })

    await Vehicle.findByIdAndDelete(req.params.id)

    res.status(200).json({
      message: "Vehicle deleted successfully"
    })

  } catch (err) {
    res.status(500).json({
      message: "Error deleting vehicle",
      error: err.message
    })
  }
}


module.exports = {
  addVehicle,
  getAllVehicles,
  getVehicleById,
  getVehiclesByUser,
  updateVehicle,
  deleteVehicle
}