const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true
  },

  // lastName: {
  //   type: String,
  //   required: true
  // },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  phone: {
    type: String
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  profilePic: {
    type: String,
    default: ""
  }, resetToken: {
    type: String
  },

  resetTokenExpiry: {
    type: Date
  },


  vehicles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle"
  }]

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);