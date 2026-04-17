const mongoose = require("mongoose");

const parkingLotSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  location: {
    address: String,
    latitude: Number,
    longitude: Number
  },

  coordinates: {
    lat: Number,
    lng: Number
  },

  totalSlots: {
    type: Number,
    required: true
  },

  availableSlots: {
    type: Number,
    default: 0
  },

  pricePerHour: {
    type: Number
  }

}, { timestamps: true });

module.exports = mongoose.model("ParkingLot", parkingLotSchema);