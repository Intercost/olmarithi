const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  dateTime: { type: Date, required: true },
  notes: { type: String },
  host: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Event', EventSchema);
