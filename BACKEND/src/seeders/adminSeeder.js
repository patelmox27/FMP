const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env.local"),
  override: true,
});
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/UserModel");

const MONGO_CONNECTION_STRING =
  process.env.MONGO_URL || process.env.MONGODB_URI || process.env.MONGO_URI;

const ADMIN_DEFAULTS = {
  Name: process.env.ADMIN_NAME || "Super Admin",
  email: process.env.ADMIN_EMAIL || "admin@findmyparking.com",
  password: process.env.ADMIN_PASSWORD || "Admin@123",
  phone: process.env.ADMIN_PHONE || "",
  role: "admin",
  status: "active",
  profilePic: "",
};

async function seedAdmin() {
  try {
    if (!MONGO_CONNECTION_STRING) {
      throw new Error(
        "Mongo connection string is missing. Set MONGO_URL (or MONGODB_URI / MONGO_URI) in BACKEND/.env",
      );
    }

    await mongoose.connect(MONGO_CONNECTION_STRING);
    console.log("DB connected for admin seeding");

    const existingUser = await User.findOne({ email: ADMIN_DEFAULTS.email });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(ADMIN_DEFAULTS.password, 10);

      await User.create({
        Name: ADMIN_DEFAULTS.Name,
        email: ADMIN_DEFAULTS.email,
        password: hashedPassword,
        phone: ADMIN_DEFAULTS.phone,
        role: ADMIN_DEFAULTS.role,
        status: ADMIN_DEFAULTS.status,
        profilePic: ADMIN_DEFAULTS.profilePic,
      });

      console.log(`Admin created: ${ADMIN_DEFAULTS.email}`);
      return;
    }

    const updates = {};

    if (existingUser.role !== "admin") {
      updates.role = "admin";
    }

    if (existingUser.status !== "active") {
      updates.status = "active";
    }

    if (existingUser.Name !== ADMIN_DEFAULTS.Name) {
      updates.Name = ADMIN_DEFAULTS.Name;
    }

    if (ADMIN_DEFAULTS.phone && existingUser.phone !== ADMIN_DEFAULTS.phone) {
      updates.phone = ADMIN_DEFAULTS.phone;
    }

    if (Object.keys(updates).length > 0) {
      await User.updateOne({ _id: existingUser._id }, { $set: updates });
      console.log(`Admin updated: ${ADMIN_DEFAULTS.email}`);
    } else {
      console.log(`Admin already seeded: ${ADMIN_DEFAULTS.email}`);
    }
  } catch (error) {
    console.error("Admin seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("DB connection closed");
    }
  }
}

seedAdmin();
