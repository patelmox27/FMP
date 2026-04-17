const User = require("../models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Notification = require("../models/NotificationModel");


// ================= REGISTER USER =================
const registerUser = async (req, res) => {
  try {
    const { Name, email, password, phone } = req.body;

    if (!Name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const savedUser = await User.create({
      Name,
      email,
      password: hashedPassword,
      phone
    });

    const userObj = savedUser.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userObj
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Error while creating user",
      error: err.message
    });
  }
};

// ================= LOGIN USER =================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const foundUser = await User.findOne({ email });

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, foundUser.password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // ✅ JWT TOKEN
    const token = jwt.sign(
      {
        id: foundUser._id,
        role: foundUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userObj = foundUser.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: userObj
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Error while login",
      error: err.message
    });
  }
};

// ================= GET ALL USERS =================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users
    });

  } catch (err) {
    console.log("GET USERS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: err.message
    });
  }
};

// ================= GET USER BY ID =================
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user
    });

  } catch (err) {
    console.log("GET USER ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: err.message
    });
  }
};

// ================= DELETE USER =================
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (err) {
    console.log("DELETE USER ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: err.message
    });
  }
};

// ================= FORGOT PASSWORD =================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 min

    await user.save();

    res.status(200).json({
      success: true,
      message: "Reset token generated",
      token
    });

  } catch (err) {
    console.log("FORGOT ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Error in forgot password",
      error: err.message
    });
  }
};

// ================= RESET PASSWORD =================
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and password are required"
      });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful"
    });

  } catch (err) {
    console.log("RESET ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: err.message
    });
  }
};

// Notifications
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if userId is a valid MongoDB ObjectId
    if (!require("mongoose").Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID provided" });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (err) {

    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true },
    );
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  deleteUser,
  forgotPassword,
  resetPassword,
  getUserNotifications,
  markNotificationRead,
};
  