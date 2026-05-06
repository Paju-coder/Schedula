require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('./lib/db')
const User = require('./models/User')
const Booking = require('./models/Booking')

async function createTestScheduledBooking() {
  await connectDB()

  const phone = process.argv[2]
  if (!phone) {
    console.error('❌ Please provide your phone number. Example: node test-schedule.js +919876543210')
    process.exit(1)
  }

  try {
    // 1. Get the first host user
    const host = await User.findOne()
    if (!host) {
      console.error('❌ No user found in the database. Please sign up on the frontend first.')
      process.exit(1)
    }

    // 2. Calculate a time 6 minutes from now
    const now = new Date()
    now.setMinutes(now.getMinutes() + 6) // Schedule 6 minutes into the future

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const slot_date = `${year}-${month}-${day}`
    
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const slot_time = `${hours}:${minutes}:00`

    // 3. Create the booking in MongoDB
    const booking = await Booking.create({
      host_id: host._id,
      guest_name: 'Judges (Live Test)',
      guest_email: 'test@example.com',
      guest_phone: phone,
      purpose: 'Hackathon Live Demonstration',
      slot_date,
      slot_time,
      meet_link: 'https://meet.google.com/live-test-link',
      status: 'confirmed'
    })

    console.log('\n✅ TEST BOOKING CREATED SUCCESSFULLY!')
    console.log('--------------------------------------------------')
    console.log(`👤 Guest: ${booking.guest_name}`)
    console.log(`📅 Date:  ${booking.slot_date}`)
    console.log(`🕒 Time:  ${slot_time.substring(0, 5)} (in exactly 2 minutes!)`)
    console.log(`📱 Phone: ${booking.guest_phone}`)
    console.log('--------------------------------------------------')
    console.log('\nNow, just keep your server running. When the clock hits that exact minute, the cron job will automatically send the WhatsApp message!')
    
    process.exit(0)
  } catch (err) {
    console.error('❌ Error creating test booking:', err)
    process.exit(1)
  }
}

createTestScheduledBooking()
