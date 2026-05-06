const express = require('express')
const router = express.Router()
const supabase = require('../lib/supabase')
const authMiddleware = require('../middleware/auth')
const { generateSlots } = require('../utils/slots')

// GET /api/availability/:slug?date=YYYY-MM-DD
// Public — guest fetches available slots
router.get('/:slug', async (req, res) => {
  const { slug } = req.params
  const { date } = req.query

  try {
    // Get host user
    const { data: host, error: hostError } = await supabase
      .from('users')
      .select('id, name, bio, slug')
      .eq('slug', slug)
      .single()

    if (hostError || !host) {
      return res.status(404).json({ error: 'Host not found' })
    }

    // If no date, just return host info
    if (!date) {
      return res.json({ host, slots: [] })
    }

    // Check if date is blocked
    const { data: blocked } = await supabase
      .from('blocked_dates')
      .select('id')
      .eq('user_id', host.id)
      .eq('blocked_date', date)
      .single()

    if (blocked) {
      return res.json({ host, slots: [], blocked: true })
    }

    // Get availability settings
    const { data: availability } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', host.id)
      .eq('is_active', true)

    if (!availability || availability.length === 0) {
      return res.json({ host, slots: [] })
    }

    // Get existing bookings for this date
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('slot_date, slot_time, status')
      .eq('host_id', host.id)
      .eq('slot_date', date)
      .neq('status', 'cancelled')

    const slots = generateSlots(availability, existingBookings || [], date)

    // Pass duration info for display
    const dateObj = new Date(date + 'T00:00:00')
    const dayOfWeek = dateObj.getDay()
    const dayAvail = availability.find(a => a.day_of_week === dayOfWeek)

    return res.json({
      host: {
        ...host,
        duration_minutes: dayAvail?.duration_minutes || 30,
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
    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', req.user.id)
      .order('day_of_week')

    res.json({ availability: data || [] })
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
    // Upsert all days
    const rows = schedule.map(day => ({
      user_id: req.user.id,
      day_of_week: day.day_of_week,
      start_time: day.is_active ? `${day.start_time}:00` : '09:00:00',
      end_time: day.is_active ? `${day.end_time}:00` : '17:00:00',
      duration_minutes: duration_minutes || 30,
      buffer_minutes: buffer_minutes || 0,
      is_active: day.is_active,
    }))

    const { error } = await supabase
      .from('availability')
      .upsert(rows, { onConflict: 'user_id,day_of_week' })

    if (error) throw error

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
    const { error } = await supabase
      .from('blocked_dates')
      .insert({
        user_id: req.user.id,
        blocked_date: date,
        reason: reason || null,
      })

    if (error) throw error

    return res.json({ message: `Date ${date} blocked successfully` })
  } catch (err) {
    console.error('Block date error:', err)
    return res.status(500).json({ error: 'Failed to block date' })
  }
})

module.exports = router
