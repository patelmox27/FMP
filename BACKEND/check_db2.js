const mongoose = require('mongoose');
const Slot = require('./src/models/SlotModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    const slots = await Slot.find({ vehicleCategory: "bike" });
    console.log("Bike slots:", slots.length);
    if (slots.length > 0) {
      console.log("Sample:", slots[0]);
    }
    const evSlots = await Slot.find({ vehicleCategory: "ev_car" });
    console.log("EV Car slots:", evSlots.length);
    if (evSlots.length > 0) {
      console.log("Sample:", evSlots[0]);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
