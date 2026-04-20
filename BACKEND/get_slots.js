const mongoose = require('mongoose');
const Slot = require('./src/models/SlotModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    const slots = await Slot.find().limit(5);
    console.log(slots);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
