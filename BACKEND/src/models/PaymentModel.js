const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reservation"
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },


  amount: {
    type: Number,
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ["card", "upi", "wallet", "cash", "razorpay"]
  },


  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  }

}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);