require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./lib/db')
const { startCronScheduler } = require('./services/cron')

// Connect to MongoDB
connectDB()

// Start the cron scheduler for notifications
startCronScheduler()

const authRoutes = require('./routes/auth')
const availabilityRoutes = require('./routes/availability')
const bookingsRoutes = require('./routes/bookings')
const chatRoutes = require('./routes/chat')
const notificationsRoutes = require('./routes/notifications')

const app = express()

app.use(cors({
  origin: true, // Allow all origins (needed for network/multi-device access)
  credentials: true,
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/bookings', bookingsRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/notifications', notificationsRoutes)

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Schedula API' }))

const PORT = process.env.PORT || 5000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Schedula API running on port ${PORT} (all interfaces)`)
})
