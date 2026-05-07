const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth')
const { generateMeetLink } = require('../services/calendar')
const { sendBookingEmail } = require('../services/mailer')
const { sendWhatsAppNotification } = require('../services/twilio')
const User = require('../models/User')
const Booking = require('../models/Booking')

// POST /api/bookings — Guest creates a booking
router.post('/', async (req, res) => {
  const { slug, guest_name, guest_email, guest_phone, purpose, slot_date, slot_time, meeting_type } = req.body

  if (!slug || !guest_name || !guest_email || !slot_date || !slot_time) {
    return res.status(400).json({ error: 'Missing required booking fields' })
  }

  try {
    const host = await User.findOne({ slug }).select('id name email')
    if (!host) {
      return res.status(404).json({ error: 'Host not found' })
    }

    const existing = await Booking.findOne({
      host_id: host._id,
      slot_date,
      slot_time: `${slot_time}:00`,
      status: { $ne: 'cancelled' }
    })

    if (existing) {
      return res.status(409).json({ error: 'This slot was just booked. Please choose another time.' })
    }

    const meet_link = generateMeetLink()

    const booking = await Booking.create({
      host_id: host._id,
      guest_name,
      guest_email,
      guest_phone: guest_phone || null,
      purpose: purpose || null,
      slot_date,
      slot_time: `${slot_time}:00`,
      meet_link,
      meeting_type: meeting_type || 'Google Meet',
      status: 'confirmed',
    })

    // Send notifications in background
    const notificationData = { ...booking.toObject(), slot_time }
    Promise.all([
      sendBookingEmail(guest_email, notificationData).catch(console.error),
      sendBookingEmail(host.email, { ...notificationData, guest_name: `${guest_name} (your guest)` }).catch(console.error),
      sendWhatsAppNotification(guest_phone, notificationData).catch(console.error),
    ])

    return res.status(201).json({
      message: 'Booking confirmed!',
      booking: {
        ...booking.toObject(),
        slot_time: slot_time,
      },
    })
  } catch (err) {
    console.error('Booking error:', err)
    return res.status(500).json({ error: 'Failed to create booking' })
  }
})

// GET /api/bookings/admin — Admin gets all their bookings
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ host_id: req.user._id }).sort({ slot_date: 1, slot_time: 1 })
    return res.json({ bookings })
  } catch (err) {
    console.error('Get bookings error:', err)
    return res.status(500).json({ error: 'Failed to fetch bookings' })
  }
})

// PUT /api/bookings/:id/cancel — Cancel a booking
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const booking = await Booking.findById(id)

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (booking.host_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only cancel your own bookings' })
    }

    booking.status = 'cancelled'
    await booking.save()

    return res.json({ message: 'Booking cancelled successfully' })
  } catch (err) {
    console.error('Cancel error:', err)
    return res.status(500).json({ error: 'Failed to cancel booking' })
  }
})

// DELETE /api/bookings/:id — Permanently delete a booking
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const booking = await Booking.findById(id)

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (booking.host_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own bookings' })
    }

    await Booking.findByIdAndDelete(id)

    return res.json({ message: 'Booking deleted permanently' })
  } catch (err) {
    console.error('Delete error:', err)
    return res.status(500).json({ error: 'Failed to delete booking' })
  }
})

module.exports = router
