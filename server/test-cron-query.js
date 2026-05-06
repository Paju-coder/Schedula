require('dotenv').config()
const mongoose = require('mongoose')
const Booking = require('./models/Booking')

async function checkBookings() {
  await mongoose.connect(process.env.MONGO_URI, { directConnection: true })
  console.log('✅ Connected to MongoDB')

  const bookings = await Booking.find().sort({ createdAt: -1 }).limit(10)
  
  console.log('\n--- LATEST 10 BOOKINGS IN DB ---')
  if (bookings.length === 0) {
    console.log('No bookings found in the database!')
  } else {
    bookings.forEach(b => {
      console.log(`\nID: ${b._id}`)
      console.log(`Guest: ${b.guest_name} (${b.guest_phone})`)
      console.log(`Date saved in DB: ${b.slot_date} (Type: ${typeof b.slot_date})`)
      console.log(`Time saved in DB: ${b.slot_time}`)
      console.log(`Status: ${b.status}`)
      console.log(`Reminder Sent: ${b.reminder_sent}`)
      console.log(`Created At: ${b.createdAt}`)
    })
  }

  // Test the exact cron query
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDateStr = `${year}-${month}-${day}`;

  console.log(`\n--- TESTING CRON QUERY FOR: ${currentDateStr} ---`)
  
  const todaysBookings = await Booking.find({
    slot_date: currentDateStr,
    status: 'confirmed',
    reminder_sent: { $ne: true }
  })
  
  console.log(`Cron found ${todaysBookings.length} bookings for today that need reminders.`)

  process.exit(0)
}

checkBookings()
