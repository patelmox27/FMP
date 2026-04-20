const mongoose = require('mongoose');
const Slot = require('./src/models/SlotModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const slots = await Slot.find({ createdAt: { $gte: fifteenMinsAgo } });
    console.log("Recently added slots:", slots.length);
    if (slots.length > 0) {
      console.log(slots);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
