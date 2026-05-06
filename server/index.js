require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./lib/db')

// Connect to MongoDB
// connectDB() // Temporarily disabled since we are using frontend localStorage mock

const authRoutes = require('./routes/auth')
const availabilityRoutes = require('./routes/availability')
const bookingsRoutes = require('./routes/bookings')
const chatRoutes = require('./routes/chat')

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/bookings', bookingsRoutes)
app.use('/api/chat', chatRoutes)

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Schedula API' }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Schedula API running on port ${PORT}`)
})
