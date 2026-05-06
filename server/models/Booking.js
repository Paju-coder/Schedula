const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
  host_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  guest_name: { type: String, required: true },
  guest_email: { type: String, required: true },
  guest_phone: { type: String },
  purpose: { type: String },
  slot_date: { type: Date, required: true },
  slot_time: { type: String, required: true },
  meet_link: { type: String },
  status: { type: String, enum: ['confirmed', 'cancelled', 'rescheduled', 'completed'], default: 'confirmed' }
}, { timestamps: true })

module.exports = mongoose.model('Booking', bookingSchema)
