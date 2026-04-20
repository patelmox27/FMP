const mongoose = require('mongoose');
const Slot = require('./src/models/SlotModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    const slots = await Slot.find({ vehicleCategory: { $ne: 'car' } });
    console.log("Slots with non-car vehicleCategory:", slots.length);
    if (slots.length > 0) {
      console.log("Sample:", slots[0]);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
