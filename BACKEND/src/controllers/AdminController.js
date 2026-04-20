const Reservation = require("../models/ReservationModel");
const ParkingLot = require("../models/ParkingLotModel");
const Slot = require("../models/SlotModel");
const User = require("../models/UserModel");
const Notification = require("../models/NotificationModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const debugAdminLogin = (message, data) => {
  if (process.env.DEBUG_ADMIN_LOGIN === "true") {
    if (data === undefined) {
      console.log(`[admin-login] ${message}`);
      return;
    }

    console.log(`[admin-login] ${message}`, data);
  }
};
//YES
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    debugAdminLogin("login attempt received", {
      email,
      hasPassword: Boolean(password),
      ip: req.ip,
    });

    if (!email || !password) {
      debugAdminLogin("missing email or password", {
        hasEmail: Boolean(email),
        hasPassword: Boolean(password),
      });

      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await User.findOne({ email });

    debugAdminLogin("admin lookup completed", {
      found: Boolean(admin),
      role: admin?.role,
      status: admin?.status,
    });

    if (!admin || admin.role !== "admin") {
      debugAdminLogin("admin credentials rejected", {
        reason: !admin ? "admin_not_found" : "not_an_admin",
        email,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    if (admin.status !== "active") {
      debugAdminLogin("admin account inactive", {
        email,
        status: admin.status,
      });

      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, admin.password);

    debugAdminLogin("password comparison finished", {
      email,
      matched: isPasswordMatched,
    });

    if (!isPasswordMatched) {
      debugAdminLogin("admin credentials rejected", {
        reason: "password_mismatch",
        email,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const adminData = admin.toObject();
    delete adminData.password;

    debugAdminLogin("admin login successful", {
      adminId: String(admin._id),
      email: admin.email,
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      data: adminData,
    });
  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Error while admin login",
      error: err.message,
    });
  }
};

// ─── Dashboard Overview ────────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const totalLots = await ParkingLot.countDocuments();
    const totalSlots = await Slot.countDocuments();
    const occupiedSlots = await Slot.countDocuments({ status: "occupied" });
    const reservedSlots = await Slot.countDocuments({ status: "reserved" });
    const totalUsers = await User.countDocuments();

    const revenueAgg = await Reservation.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    const activeBookings = await Reservation.countDocuments({
      status: "active",
    });
    const completedBookings = await Reservation.countDocuments({
      status: "completed",
    });
    const cancelledBookings = await Reservation.countDocuments({
      status: "cancelled",
    });

    // Today's revenue
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayRevenueAgg = await Reservation.aggregate([
      { $match: { status: "completed", createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const todayRevenue = todayRevenueAgg[0]?.total || 0;

    const occupancyRate =
      totalSlots > 0
        ? (((occupiedSlots + reservedSlots) / totalSlots) * 100).toFixed(1)
        : 0;

    res.json({
      overview: {
        totalLots,
        totalSlots,
        occupiedSlots,
        reservedSlots,
        availableSlots: totalSlots - occupiedSlots - reservedSlots,
        occupancyRate: parseFloat(occupancyRate),
        totalUsers,
      },
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
      },
      bookings: {
        active: activeBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        total: activeBookings + completedBookings + cancelledBookings,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Revenue Report (Last 7 Days) ─────────────────────────────────────────────
const getRevenueReport = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const revenueByDay = await Reservation.aggregate([
      { $match: { status: "completed", createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueByType = await Reservation.aggregate([
      { $match: { status: "completed", createdAt: { $gte: from } } },
      {
        $group: {
          _id: "$reservationType",
          revenue: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ revenueByDay, revenueByType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Peak Hours Analytics ──────────────────────────────────────────────────────
const getPeakHours = async (req, res) => {
  try {
    const from = new Date();
    from.setDate(from.getDate() - 30);

    const peakHours = await Reservation.aggregate([
      { $match: { createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $hour: "$startTime" },
          bookings: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format hours 0-23 filling empty ones
    const hours = Array.from({ length: 24 }, (_, i) => {
      const found = peakHours.find((p) => p._id === i);
      return {
        hour: i,
        label: `${i.toString().padStart(2, "0")}:00`,
        bookings: found?.bookings || 0,
        revenue: found?.revenue || 0,
      };
    });

    res.json({ peakHours: hours });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Occupancy Stats Per Lot ───────────────────────────────────────────────────
const getOccupancyStats = async (req, res) => {
  try {
    const lots = await ParkingLot.find({});

    const stats = await Promise.all(
      lots.map(async (lot) => {
        const total = await Slot.countDocuments({ parkingLotId: lot._id });
        const occupied = await Slot.countDocuments({
          parkingLotId: lot._id,
          status: "occupied",
        });
        const reserved = await Slot.countDocuments({
          parkingLotId: lot._id,
          status: "reserved",
        });
        const ev = await Slot.countDocuments({
          parkingLotId: lot._id,
          slotType: "ev",
        });
        const handicap = await Slot.countDocuments({
          parkingLotId: lot._id,
          slotType: "handicap",
        });

        const lotRevenue = await Reservation.aggregate([
          {
            $lookup: {
              from: "slots",
              localField: "slotId",
              foreignField: "_id",
              as: "slot",
            },
          },
          { $unwind: "$slot" },
          { $match: { "slot.parkingLotId": lot._id, status: "completed" } },
          { $group: { _id: null, revenue: { $sum: "$totalPrice" } } },
        ]);

        return {
          lotId: lot._id,
          name: lot.name,
          location: lot.location?.address || "",
          pricePerHour: lot.pricePerHour,
          totalSlots: total,
          occupied,
          reserved,
          available: total - occupied - reserved,
          ev,
          handicap,
          occupancyRate:
            total > 0
              ? (((occupied + reserved) / total) * 100).toFixed(1)
              : "0",
          revenue: lotRevenue[0]?.revenue || 0,
        };
      }),
    );

    res.json({ lots: stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Manage Parking Lots (CRUD) ────────────────────────────────────────────────
const getAllLots = async (req, res) => {
  try {
    const lots = await ParkingLot.find({}).sort({ createdAt: -1 });
    res.json({ lots });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const createLot = async (req, res) => {
  try {
    const { name, location, coordinates, totalSlots, pricePerHour } = req.body;
    const lot = await ParkingLot.create({
      name,
      location,
      coordinates,
      totalSlots,
      availableSlots: totalSlots,
      pricePerHour,
    });
    res.status(201).json({ message: "Parking lot created", lot });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateLot = async (req, res) => {
  try {
    const lot = await ParkingLot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!lot) return res.status(404).json({ message: "Lot not found" });
    res.json({ message: "Lot updated", lot });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteLot = async (req, res) => {
  try {
    await ParkingLot.findByIdAndDelete(req.params.id);
    await Slot.deleteMany({ parkingLotId: req.params.id });
    res.json({ message: "Lot and associated slots deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Manage Slots ──────────────────────────────────────────────────────────────
const getSlotsByLot = async (req, res) => {
  try {
    const slots = await Slot.find({ parkingLotId: req.params.lotId });
    res.json({ slots });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateSlot = async (req, res) => {
  try {
    const slot = await Slot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    res.json({ message: "Slot updated", slot });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const addSlot = async (req, res) => {
  try {
    const { lotId } = req.params;
    const { slotNumber, slotType, vehicleCategory } = req.body;

    const lot = await ParkingLot.findById(lotId);
    if (!lot) return res.status(404).json({ message: "Parking lot not found" });

    const newSlot = await Slot.create({
      parkingLotId: lotId,
      slotNumber,
      slotType,
      vehicleCategory: vehicleCategory || "car",
      status: "available",
    });

    // Update lot stats
    lot.totalSlots = (lot.totalSlots || 0) + 1;
    lot.availableSlots = (lot.availableSlots || 0) + 1;
    await lot.save();

    res.status(201).json({ message: "Slot added successfully", slot: newSlot });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await Slot.findById(id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    const lotId = slot.parkingLotId;
    await Slot.findByIdAndDelete(id);

    // Update lot stats
    const lot = await ParkingLot.findById(lotId);
    if (lot) {
      lot.totalSlots = Math.max(0, (lot.totalSlots || 0) - 1);
      if (slot.status === "available") {
        lot.availableSlots = Math.max(0, (lot.availableSlots || 0) - 1);
      }
      await lot.save();
    }

    res.json({ message: "Slot deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const bulkAddSlots = async (req, res) => {
  try {
    const { lotId } = req.params;
    const { count, slotType, vehicleCategory } = req.body;
    const numCount = Number(count);

    if (!numCount || numCount <= 0) {
      return res.status(400).json({ message: "Valid slot count is required" });
    }

    const lot = await ParkingLot.findById(lotId);
    if (!lot) return res.status(404).json({ message: "Parking lot not found" });

    // Find all slots for this lot to determine the next number
    // We fetch all to handle potential non-sequential gaps or mixed prefixes better
    const existingSlots = await Slot.find({ parkingLotId: lotId });

    let prefix = "Slot-";
    let maxNum = 0;

    if (existingSlots.length > 0) {
      existingSlots.forEach((s) => {
        const match = s.slotNumber.match(/^(.*?)(\d+)$/);
        if (match) {
          const p = match[1];
          const n = parseInt(match[2]);
          if (n > maxNum) {
            maxNum = n;
            prefix = p;
          }
        }
      });
    }

    const newSlotsData = [];
    for (let i = 1; i <= numCount; i++) {
      newSlotsData.push({
        parkingLotId: lotId,
        slotNumber: `${prefix}${maxNum + i}`,
        slotType: slotType || "regular",
        vehicleCategory: vehicleCategory || "car",
        status: "available",
      });
    }

    await Slot.insertMany(newSlotsData);

    // Update lot stats
    lot.totalSlots = (lot.totalSlots || 0) + numCount;
    lot.availableSlots = (lot.availableSlots || 0) + numCount;
    await lot.save();

    res
      .status(201)
      .json({ message: `${numCount} slots added successfully`, prefix, start: maxNum + 1 });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// ─── User Management ──────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Recent Bookings ──────────────────────────────────────────────────────────
const getRecentBookings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const bookings = await Reservation.find({})
      .populate("userId", "name email")
      .populate("slotId", "slotNumber slotType")
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Notifications & Alerts ───────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const notifications = await Notification.find({})
      .populate("userId", "Name email")
      .sort({ createdAt: -1 })
      .limit(limit);

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
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification marked as read", notification });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getAlerts = async (req, res) => {
  try {
    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

    const lots = await ParkingLot.find({});
    const occupancyStats = await Promise.all(
      lots.map(async (lot) => {
        const total = await Slot.countDocuments({ parkingLotId: lot._id });
        const occupied = await Slot.countDocuments({
          parkingLotId: lot._id,
          status: "occupied",
        });
        const reserved = await Slot.countDocuments({
          parkingLotId: lot._id,
          status: "reserved",
        });
        const usage = total > 0 ? ((occupied + reserved) / total) * 100 : 0;
        return {
          lotId: lot._id,
          name: lot.name,
          total,
          occupied,
          reserved,
          occupancyRate: parseFloat(usage.toFixed(1)),
          full: total > 0 && occupied + reserved >= total,
        };
      }),
    );

    const fullyOccupiedLots = occupancyStats.filter((l) => l.full);

    const activeReservations = await Reservation.find({ status: "active" })
      .select("slotId")
      .lean();
    const activeSlotIds = new Set(
      activeReservations.map((r) => String(r.slotId)),
    );

    const occupiedSlots = await Slot.find({ status: "occupied" })
      .populate("parkingLotId", "name")
      .lean();
    const unauthorizedParking = occupiedSlots
      .filter((slot) => !activeSlotIds.has(String(slot._id)))
      .map((slot) => ({
        slotId: slot._id,
        slotNumber: slot.slotNumber,
        lotName: slot.parkingLotId?.name || "Unknown lot",
      }));

    const expiringReservations = await Reservation.find({
      status: "active",
      endTime: { $gte: now, $lte: nextHour },
    })
      .populate("userId", "Name email")
      .populate("slotId", "slotNumber parkingLotId")
      .sort({ endTime: 1 })
      .lean();

    const availableSlotsCount = await Slot.countDocuments({
      status: "available",
    });

    res.json({
      summary: {
        fullOccupancyLots: fullyOccupiedLots.length,
        unauthorizedParkingCount: unauthorizedParking.length,
        expiringSoonCount: expiringReservations.length,
        availableSlotsCount,
      },
      fullOccupancyLots: fullyOccupiedLots,
      unauthorizedParking,
      expiringReservations,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  loginAdmin,
  getDashboard,
  getRevenueReport,
  getPeakHours,
  getOccupancyStats,
  getAllLots,
  createLot,
  updateLot,
  deleteLot,
  getSlotsByLot,
  updateSlot,
  addSlot,
  bulkAddSlots,
  deleteSlot,
  getAllUsers,
  getRecentBookings,
  getNotifications,
  markNotificationRead,
  getAlerts,
};
