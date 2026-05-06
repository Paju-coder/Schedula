const express = require('express')
const router = express.Router()
const supabase = require('../lib/supabase')
const authMiddleware = require('../middleware/auth')
const { generateMeetLink } = require('../services/calendar')
const { sendBookingEmail } = require('../services/mailer')

// POST /api/bookings — Guest creates a booking
router.post('/', async (req, res) => {
  const { slug, guest_name, guest_email, guest_phone, purpose, slot_date, slot_time } = req.body

  if (!slug || !guest_name || !guest_email || !slot_date || !slot_time) {
    return res.status(400).json({ error: 'Missing required booking fields' })
  }

  try {
    // Get host
    const { data: host, error: hostError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('slug', slug)
      .single()

    if (hostError || !host) {
      return res.status(404).json({ error: 'Host not found' })
    }

    // Check if slot is still available
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('host_id', host.id)
      .eq('slot_date', slot_date)
      .eq('slot_time', `${slot_time}:00`)
      .neq('status', 'cancelled')
      .single()

    if (existing) {
      return res.status(409).json({ error: 'This slot was just booked. Please choose another time.' })
    }

    // Generate Meet link
    const meet_link = generateMeetLink()

    // Save booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        host_id: host.id,
        guest_name,
        guest_email,
        guest_phone: guest_phone || null,
        purpose: purpose || null,
        slot_date,
        slot_time: `${slot_time}:00`,
        meet_link,
        status: 'confirmed',
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // Send emails in background (don't fail booking if email fails)
    const emailData = { ...booking, slot_time }
    Promise.all([
      sendBookingEmail(guest_email, emailData).catch(console.error),
      sendBookingEmail(host.email, { ...emailData, guest_name: `${guest_name} (your guest)` }).catch(console.error),
    ])

    return res.status(201).json({
      message: 'Booking confirmed!',
      booking: {
        ...booking,
        slot_time: slot_time, // return clean format
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
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('host_id', req.user.id)
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true })

    if (error) throw error

    return res.json({ bookings: bookings || [] })
  } catch (err) {
    console.error('Get bookings error:', err)
    return res.status(500).json({ error: 'Failed to fetch bookings' })
  }
})

// PUT /api/bookings/:id/cancel — Cancel a booking
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    // Verify ownership
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, host_id, guest_email, guest_name, slot_date, slot_time')
      .eq('id', id)
      .single()

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (booking.host_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own bookings' })
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) throw error

    return res.json({ message: 'Booking cancelled successfully' })
  } catch (err) {
    console.error('Cancel error:', err)
    return res.status(500).json({ error: 'Failed to cancel booking' })
  }
})

module.exports = router
