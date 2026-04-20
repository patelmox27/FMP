const cron = require("node-cron");
const Reservation = require("../models/ReservationModel");
const Notification = require("../models/NotificationModel");
const Slot = require("../models/SlotModel");
const ParkingLot = require("../models/ParkingLotModel");

const initCronJobs = (io) => {
  // 🕒 EVERY MINUTE: Check for upcoming reservation expiries (15 mins warning)
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const warningTime = new Date(now.getTime() + 15 * 60000); // 15 mins from now
      const windowEnd = new Date(warningTime.getTime() + 60000); // 1 min window

      const expiringSoon = await Reservation.find({
        status: "active",
        endTime: { $gte: warningTime, $lt: windowEnd },
      });

      for (const resv of expiringSoon) {
        // Check if notification already sent for this status
        const exists = await Notification.findOne({
          userId: resv.userId,
          message: { $regex: /expires in 15 minutes/i },
          createdAt: { $gte: new Date(now.getTime() - 30 * 60000) } // within last 30 mins
        });

        if (!exists) {
          const notification = await Notification.create({
            userId: resv.userId,
            message: `Your parking reservation expires in 15 minutes. Please extend your stay or vacate the slot.`,
            type: "alert",
          });

          if (io) {
            io.to(resv.userId.toString()).emit("newNotification", notification);
          }
        }
      }
    } catch (err) {
      console.error("Cron Error (Expiry):", err.message);
    }
  });

  // 🕒 EVERY 1 MINUTE: Auto-Release Expired Reservations
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const expiredReservations = await Reservation.find({
        status: "active",
        endTime: { $lt: now },
      });

      for (const resv of expiredReservations) {
        // Mark reservation as completed
        resv.status = "completed";
        await resv.save();

        // Free the slot
        const slot = await Slot.findById(resv.slotId);
        if (slot) {
          slot.status = "available";
          await slot.save();

          // Notify User
          const notification = await Notification.create({
            userId: resv.userId,
            message: `Your reservation has expired. Slot ${slot.slotNumber} is now available.`,
            type: "reservation",
          });

          if (io) {
            io.to(resv.userId.toString()).emit("newNotification", notification);
            // Broadcast slot update
            io.emit("slotUpdated", {
              slotId: slot._id,
              status: slot.status,
              parkingLotId: slot.parkingLotId,
            });
          }

          // Update available count
          const totalAvailable = await Slot.countDocuments({
            parkingLotId: slot.parkingLotId,
            status: "available",
          });
          await ParkingLot.findByIdAndUpdate(slot.parkingLotId, {
            availableSlots: totalAvailable,
          });
        }
      }
    } catch (err) {
      console.error("Cron Error (Auto-Release):", err.message);
    }
  });

  // 🕒 EVERY 5 MINUTES: Check for unauthorized parking 
  // (Slot 'occupied' but no active reservation associated with it)
  cron.schedule("*/5 * * * *", async () => {
    try {
      const activeReservations = await Reservation.find({ status: "active" }).select("slotId");
      const activeSlotIds = activeReservations.map(r => r.slotId.toString());

      const unauthorizedSlots = await Slot.find({
        status: "occupied",
        _id: { $nin: activeSlotIds }
      }).populate("parkingLotId");

      for (const slot of unauthorizedSlots) {
        // Create an alert for Admins (we'll just flag it in Notification with type 'alert' and no userId or system-wide)
        // For simplicity, we can have a special "system" user or just use type 'alert' and omit userId for broadcast
        const message = `Unauthorized parking detected at ${slot.parkingLotId?.name || 'Lot'}, Slot ${slot.slotNumber}`;
        
        // Broadcast to all admins
        if (io) {
          io.emit("adminAlert", { message, type: "unauthorized", slotId: slot._id });
        }
      }
    } catch (err) {
      console.error("Cron Error (Unauthorized):", err.message);
    }
  });

  console.log("✅ Cron Jobs Initialized");
};

module.exports = initCronJobs;
