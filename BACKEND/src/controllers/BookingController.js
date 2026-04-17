const Reservation = require("../models/ReservationModel");
const Slot = require("../models/SlotModel");
const Parking = require("../models/ParkingLotModel");
const Notification = require("../models/NotificationModel");

// ➕ CREATE BOOKING (RESERVE SLOT)
const createBooking = async (req, res) => {
  try {
    const { userId, slotId, vehicleId, startTime, endTime, reservationType } =
      req.body;

    if (!userId || !slotId || !vehicleId || !startTime || !endTime) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // check slot
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({
        message: "Slot not found",
      });
    }

    // check availability
    if (slot.status !== "available") {
      return res.status(400).json({
        message: "Slot is not available",
      });
    }

    // calc duration and price
    const parking = await Parking.findById(slot.parkingLotId);
    let totalPrice = 0;
    if (parking) {
      const type = reservationType || "hourly";
      const durationHours = Math.max(1, Math.ceil(
        (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60),
      ));

      let baseRate = parking.pricePerHour || 50;

      if (type === "daily") {
        totalPrice = Math.ceil(durationHours / 24) * (baseRate * 12); // Daily rate = 12x hourly
      } else if (type === "monthly") {
        totalPrice =
          Math.ceil(durationHours / (24 * 30)) * (baseRate * 12 * 15); // Monthly = 15x daily
      } else {
        totalPrice = durationHours * baseRate;
      }
    }

    // create booking
    const booking = await Reservation.create({
      userId,
      slotId,
      vehicleId,
      reservationType: reservationType || "hourly",
      startTime,
      endTime,
      totalPrice,
    });

    await Notification.create({
      userId,
      message: "Reservation confirmed. Your slot is now reserved.",
      type: "reservation",
    });

    // update slot status
    slot.status = "reserved";
    await slot.save();

    // ✨ Emit socket event
    if (req.io) {
      req.io.emit("slotUpdated", {
        slotId: slot._id,
        status: slot.status,
        parkingLotId: slot.parkingLotId,
      });
    }

    // update parking availableSlots
    const totalAvailable = await Slot.countDocuments({
      parkingLotId: slot.parkingLotId,
      status: "available",
    });

    await Parking.findByIdAndUpdate(slot.parkingLotId, {
      availableSlots: totalAvailable,
    });

    // 🚨 Admin Alert: Full Occupancy
    if (totalAvailable === 0 && req.io) {
      req.io.emit("adminAlert", {
        message: `Lot "${parking.name}" is now fully occupied!`,
        type: "full_occupancy",
        parkingLotId: slot.parkingLotId,
      });
    }


    res.status(201).json({
      message: "Slot booked successfully",
      data: booking,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating booking",
      error: err.message,
    });
  }
};

// 📍 GET ALL BOOKINGS
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Reservation.find()
      .populate("userId", "Name email")
      .populate("slotId")
      .populate("vehicleId");

    res.status(200).json({
      message: "Bookings fetched successfully",
      data: bookings,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching bookings",
      error: err.message,
    });
  }
};

// 🔍 GET BOOKING BY ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Reservation.findById(req.params.id)
      .populate("userId", "Name email")
      .populate("slotId")
      .populate("vehicleId");

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    res.status(200).json({
      message: "Booking fetched successfully",
      data: booking,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching booking",
      error: err.message,
    });
  }
};

// 📊 GET BOOKINGS BY USER
const getBookingsByUser = async (req, res) => {
  try {
    const bookings = await Reservation.find({ userId: req.params.userId })
      .populate("slotId")
      .populate("vehicleId");

    res.status(200).json({
      message: "User bookings fetched successfully",
      data: bookings,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching user bookings",
      error: err.message,
    });
  }
};

// CANCEL BOOKING
const cancelBooking = async (req, res) => {
  try {
    const booking = await Reservation.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    // update booking status
    booking.status = "cancelled";
    await booking.save();

    // free the slot
    const slot = await Slot.findById(booking.slotId);
    if (slot) {
      slot.status = "available";
      await slot.save();

      await Notification.create({
        userId: booking.userId,
        message: `Your reservation was cancelled. Slot ${slot.slotNumber} is now available.`,
        type: "alert",
      });

      // ✨ Emit socket event
      if (req.io) {
        req.io.emit("slotUpdated", {
          slotId: slot._id,
          status: slot.status,
          parkingLotId: slot.parkingLotId,
        });
      }

      // update parking availableSlots
      const totalAvailable = await Slot.countDocuments({
        parkingLotId: slot.parkingLotId,
        status: "available",
      });

      await Parking.findByIdAndUpdate(slot.parkingLotId, {
        availableSlots: totalAvailable,
      });
    }

    res.status(200).json({
      message: "Booking cancelled successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error cancelling booking",
      error: err.message,
    });
  }
};

// ✅ COMPLETE BOOKING (EXIT PARKING)
const completeBooking = async (req, res) => {
  try {
    const booking = await Reservation.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    booking.status = "completed";
    await booking.save();

    // free slot
    const slot = await Slot.findById(booking.slotId);
    if (slot) {
      slot.status = "available";
      await slot.save();

      await Notification.create({
        userId: booking.userId,
        message: `Reservation completed. Slot ${slot.slotNumber} is now available.`,
        type: "reservation",
      });

      // ✨ Emit socket event
      if (req.io) {
        req.io.emit("slotUpdated", {
          slotId: slot._id,
          status: slot.status,
          parkingLotId: slot.parkingLotId,
        });
      }

      const totalAvailable = await Slot.countDocuments({
        parkingLotId: slot.parkingLotId,
        status: "available",
      });

      await Parking.findByIdAndUpdate(slot.parkingLotId, {
        availableSlots: totalAvailable,
      });
    }

    res.status(200).json({
      message: "Booking completed successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error completing booking",
      error: err.message,
    });
  }
};

const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { endTime } = req.body;

    const booking = await Reservation.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Check if user is owner
    if (booking.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this booking" });
    }

    if (booking.status !== "active") {
      return res
        .status(400)
        .json({ message: "Only active bookings can be updated" });
    }

    // Calc new total price if endTime changed
    if (endTime) {
      const slot = await Slot.findById(booking.slotId);
      const parking = await Parking.findById(slot.parkingLotId);

      const durationHours = Math.ceil(
        (new Date(endTime) - new Date(booking.startTime)) / (1000 * 60 * 60),
      );

      let baseRate = parking.pricePerHour;
      let newTotalPrice = 0;

      if (booking.reservationType === "daily") {
        newTotalPrice = Math.ceil(durationHours / 24) * (baseRate * 12);
      } else if (booking.reservationType === "monthly") {
        newTotalPrice =
          Math.ceil(durationHours / (24 * 30)) * (baseRate * 12 * 15);
      } else {
        newTotalPrice = durationHours * baseRate;
      }

      booking.endTime = endTime;
      booking.totalPrice = newTotalPrice;
    }

    await booking.save();
    res.json({ message: "Booking updated successfully", data: booking });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating booking", error: err.message });
  }
};


module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  getBookingsByUser,
  cancelBooking,
  completeBooking,
  updateBooking,
};
