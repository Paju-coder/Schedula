const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const { generateSlots } = require('../utils/slots')
const User = require('../models/User')
const Availability = require('../models/Availability')
const BlockedDate = require('../models/BlockedDate')
const Booking = require('../models/Booking')

// GET /api/availability/:slug?date=YYYY-MM-DD
// Public — guest fetches available slots
router.get('/:slug', async (req, res) => {
  const { slug } = req.params
  const { date } = req.query

  try {
    const host = await User.findOne({ slug }).select('id name bio slug')
    if (!host) {
      return res.status(404).json({ error: 'Host not found' })
    }

    if (!date) {
      return res.json({ host, slots: [] })
    }

    // Check if date is blocked
    const blocked = await BlockedDate.findOne({ user_id: host._id, blocked_date: date })
    if (blocked) {
      return res.json({ host, slots: [], blocked: true })
    }

    // Get availability settings
    const availability = await Availability.find({ user_id: host._id, is_active: true })
    if (!availability || availability.length === 0) {
      return res.json({ host, slots: [] })
    }

    // Get existing bookings for this date
    const existingBookings = await Booking.find({
      host_id: host._id,
      slot_date: date,
      status: { $ne: 'cancelled' }
    }).select('slot_date slot_time status')

    // Generate slots
    const slots = generateSlots(availability, existingBookings, date)

    // Pass duration info
    const dateObj = new Date(date + 'T00:00:00')
    const dayOfWeek = dateObj.getDay()
    const dayAvail = availability.find(a => a.day_of_week === dayOfWeek)

    return res.json({
      host: {
        id: host._id,
        name: host.name,
        bio: host.bio,
        slug: host.slug,
        duration_minutes: dayAvail ? dayAvail.duration_minutes : 30,
      },
      slots,
    })
  } catch (err) {
    console.error('Availability error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/availability/settings — Admin gets their settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const availability = await Availability.find({ user_id: req.user._id }).sort({ day_of_week: 1 })
    res.json({ availability })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/availability — Admin saves schedule
router.post('/', authMiddleware, async (req, res) => {
  const { schedule, duration_minutes, buffer_minutes } = req.body

  if (!schedule || !Array.isArray(schedule)) {
    return res.status(400).json({ error: 'Invalid schedule data' })
  }

  try {
    const promises = schedule.map(day => {
      return Availability.findOneAndUpdate(
        { user_id: req.user._id, day_of_week: day.day_of_week },
        {
          start_time: day.is_active ? `${day.start_time}:00` : '09:00:00',
          end_time: day.is_active ? `${day.end_time}:00` : '17:00:00',
          duration_minutes: duration_minutes || 30,
          buffer_minutes: buffer_minutes || 0,
          is_active: day.is_active,
        },
        { upsert: true, new: true }
      )
    })

    await Promise.all(promises)
    return res.json({ message: 'Availability saved successfully' })
  } catch (err) {
    console.error('Save availability error:', err)
    return res.status(500).json({ error: 'Failed to save availability' })
  }
})

// POST /api/availability/block — Admin blocks a date
router.post('/block', authMiddleware, async (req, res) => {
  const { date, reason } = req.body

  if (!date) {
    return res.status(400).json({ error: 'Date is required' })
  }

  try {
    await BlockedDate.create({
      user_id: req.user._id,
      blocked_date: date,
      reason: reason || null,
    })
    return res.json({ message: `Date ${date} blocked successfully` })
  } catch (err) {
    console.error('Block date error:', err)
    return res.status(500).json({ error: 'Failed to block date' })
  }
})

module.exports = router
