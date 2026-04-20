const Parking = require("../models/ParkingLotModel");
const Slot = require("../models/SlotModel");

// ➕ ADD PARKING LOT
const addParkingLot = async (req, res) => {
  try {
    const { name, location, totalSlots, pricePerHour } = req.body;

    if (!name || !totalSlots) {
      return res.status(400).json({
        message: "Name and totalSlots are required",
      });
    }

    const parking = await Parking.create({
      name,
      location,
      totalSlots,
      availableSlots: totalSlots,
      pricePerHour,
    });

    res.status(201).json({
      message: "Parking lot created successfully",
      data: parking,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating parking lot",
      error: err.message,
    });
  }
};

// 📍 GET ALL PARKING LOTS
const getAllParkingLots = async (req, res) => {
  try {
    const parkingLots = await Parking.find();

    res.status(200).json({
      message: "Parking lots fetched successfully",
      data: parkingLots,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching parking lots",
      error: err.message,
    });
  }
};

// 🔍 GET PARKING LOT BY ID
const getParkingLotById = async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.id);

    if (!parking) {
      return res.status(404).json({
        message: "Parking lot not found",
      });
    }

    res.status(200).json({
      message: "Parking lot fetched successfully",
      data: parking,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching parking lot",
      error: err.message,
    });
  }
};

// ✏️ UPDATE PARKING LOT
const updateParkingLot = async (req, res) => {
  try {
    const updatedParking = await Parking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" },
    );

    if (!updatedParking) {
      return res.status(404).json({
        message: "Parking lot not found",
      });
    }

    res.status(200).json({
      message: "Parking lot updated successfully",
      data: updatedParking,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating parking lot",
      error: err.message,
    });
  }
};

// ❌ DELETE PARKING LOT
const deleteParkingLot = async (req, res) => {
  try {
    const deleted = await Parking.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Parking lot not found",
      });
    }

    // also delete related slots
    await Slot.deleteMany({ parkingLotId: req.params.id });

    res.status(200).json({
      message: "Parking lot and related slots deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting parking lot",
      error: err.message,
    });
  }
};

// 🅿️ CREATE SLOTS
const createSlots = async (req, res) => {
  try {
    const { parkingLotId, numberOfSlots, slotType, vehicleCategory } = req.body;

    if (!parkingLotId || !numberOfSlots) {
      return res.status(400).json({
        message: "parkingLotId and numberOfSlots required",
      });
    }

    const parking = await Parking.findById(parkingLotId);

    if (!parking) {
      return res.status(404).json({
        message: "Parking lot not found",
      });
    }

    const slots = [];

    for (let i = 1; i <= numberOfSlots; i++) {
      slots.push({
        parkingLotId,
        slotNumber: `S${i}`,
        slotType: slotType || "regular",
        vehicleCategory: vehicleCategory || "car",
        status: "available",
      });
    }

    const createdSlots = await Slot.insertMany(slots);

    // update available slots count
    const totalAvailable = await Slot.countDocuments({
      parkingLotId,
      status: "available",
    });

    parking.availableSlots = totalAvailable;
    await parking.save();

    res.status(201).json({
      message: "Slots created successfully",
      data: createdSlots,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating slots",
      error: err.message,
    });
  }
};

// 📊 GET SLOTS BY PARKING LOT
const getSlotsByParkingLot = async (req, res) => {
  try {
    const slots = await Slot.find({ parkingLotId: req.params.id });

    res.status(200).json({
      message: "Slots fetched successfully",
      count: slots.length,
      data: slots,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching slots",
      error: err.message,
    });
  }
};
const updateSlot = async (req, res) => {
  try {
    const { slotNumber, slotType, status, vehicleCategory } = req.body;

    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        message: "Slot not found",
      });
    }

    // update fields (only if provided)
    if (slotNumber) slot.slotNumber = slotNumber;
    if (slotType) slot.slotType = slotType;
    if (vehicleCategory) slot.vehicleCategory = vehicleCategory;
    if (status) slot.status = status;

    await slot.save();

    // update availableSlots count
    const totalAvailable = await Slot.countDocuments({
      parkingLotId: slot.parkingLotId,
      status: "available",
    });

    await Parking.findByIdAndUpdate(slot.parkingLotId, {
      availableSlots: totalAvailable,
    });

    res.status(200).json({
      message: "Slot updated successfully",
      data: slot,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating slot",
      error: err.message,
    });
  }
};
const deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({
        message: "Slot not found",
      });
    }

    await Slot.findByIdAndDelete(req.params.id);

    // update availableSlots count after deletion
    const totalAvailable = await Slot.countDocuments({
      parkingLotId: slot.parkingLotId,
      status: "available",
    });

    await Parking.findByIdAndUpdate(slot.parkingLotId, {
      availableSlots: totalAvailable,
    });

    res.status(200).json({
      message: "Slot deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting slot",
      error: err.message,
    });
  }
};

module.exports = {
  addParkingLot,
  getAllParkingLots,
  getParkingLotById,
  updateParkingLot,
  deleteParkingLot,
  createSlots,
  getSlotsByParkingLot,
  updateSlot,
  deleteSlot,
};
