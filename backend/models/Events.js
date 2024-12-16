const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mappingId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Mapping'},
  eventId: { type: String, required: true, unique: true }, // Google Calendar's event ID
  title: { type: String, required: true },
  startDate: { type: String, required: true },
  startTime: { type: String },
  endDate: { type: String },
  endTime: { type: String },
  delete:{type:Boolean, default: false}
});

module.exports = mongoose.model('Event', eventSchema);
