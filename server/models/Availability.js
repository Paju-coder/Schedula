const mongoose = require('mongoose')

const availabilitySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day_of_week: { type: Number, required: true, min: 0, max: 6 },
  start_time: { type: String, required: true, default: '09:00:00' },
  end_time: { type: String, required: true, default: '17:00:00' },
  is_active: { type: Boolean, required: true, default: true },
  duration_minutes: { type: Number, required: true, default: 30 },
  buffer_minutes: { type: Number, required: true, default: 0 }
}, { timestamps: true })

// Ensure a user can only have one availability record per day of the week
availabilitySchema.index({ user_id: 1, day_of_week: 1 }, { unique: true })

module.exports = mongoose.model('Availability', availabilitySchema)
