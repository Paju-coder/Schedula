require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')

async function checkAvail() {
  await mongoose.connect(process.env.MONGO_URI, { directConnection: true })
  console.log('✅ Connected to MongoDB')

  const user = await User.findOne()
  if (!user) {
    console.log('No user found.')
    process.exit(1)
  }

  console.log(`\nUser: ${user.name} (${user.slug})`)
  console.log(`Duration: ${user.duration_minutes} | Buffer: ${user.buffer_minutes}`)
  console.log('\n--- AVAILABILITY IN DB ---')
  if (!user.availability || user.availability.length === 0) {
    console.log('EMPTY! The user has never saved their availability, so no slots can be generated.')
  } else {
    user.availability.forEach(a => {
      console.log(`Day ${a.day_of_week}: Active=${a.is_active}, Start=${a.start_time}, End=${a.end_time}`)
    })
  }

  process.exit(0)
}

checkAvail()
