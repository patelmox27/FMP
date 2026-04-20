const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({

  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ParkingLot"
  },

  slotNumber: {
    type: String,
    required: true
  },

  slotType: {
    type: String,
    enum: ["regular", "ev", "handicap"]
  },

  vehicleCategory: {
    type: String,
    enum: ["car", "bike"],
    default: "car"
  },

  status: {
    type: String,
    enum: ["available", "reserved", "occupied"],
    default: "available"
  }

}, { timestamps: true });

module.exports = mongoose.model("Slot", slotSchema);