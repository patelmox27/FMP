const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({

  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  parkingLot_id: {
    type: Schema.Types.ObjectId,
    ref: "ParkingLot",
    required: true
  },

  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },

  comments: {
    type: String,
    trim: true
  },

  feedback_date: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);