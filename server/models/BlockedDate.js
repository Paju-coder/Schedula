const mongoose = require('mongoose')

const blockedDateSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  blocked_date: { type: Date, required: true },
  reason: { type: String }
}, { timestamps: true })

blockedDateSchema.index({ user_id: 1, blocked_date: 1 }, { unique: true })

module.exports = mongoose.model('BlockedDate', blockedDateSchema)
