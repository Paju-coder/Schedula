// Generate available time slots from availability settings
function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function generateSlots(availability, existingBookings, date) {
  const dateObj = new Date(date + 'T00:00:00')
  const dayOfWeek = dateObj.getDay()

  const dayAvailability = availability.find(
    a => a.day_of_week === dayOfWeek && a.is_active
  )

  if (!dayAvailability) return []

  const slots = []
  const { start_time, end_time, duration_minutes, buffer_minutes } = dayAvailability

  let current = parseTime(start_time.slice(0, 5))
  const end = parseTime(end_time.slice(0, 5))
  const step = (duration_minutes || 30) + (buffer_minutes || 0)

  while (current + (duration_minutes || 30) <= end) {
    const timeStr = formatTime(current)
    const isBooked = existingBookings.some(
      b => b.slot_date === date && b.slot_time?.slice(0, 5) === timeStr && b.status !== 'cancelled'
    )
    if (!isBooked) slots.push(timeStr)
    current += step
  }

  return slots
}

module.exports = { generateSlots }
