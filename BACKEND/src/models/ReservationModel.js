const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Slot"
  },

  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle"
  },

  reservationType: {
    type: String,
    enum: ["hourly", "daily", "monthly"],
    default: "hourly"
  },

  startTime: {
    type: Date,
    required: true
  },

  endTime: {
    type: Date,
    required: true
  },

  status: {
    type: String,
    enum: ["active", "completed", "cancelled"],
    default: "active"
  },

  totalPrice: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model("Reservation", reservationSchema);