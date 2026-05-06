// ==========================================
// LOCAL STORAGE MOCK API (No backend required)
// ==========================================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const getDB = () => {
  const defaultDB = { users: [], availability: {}, bookings: [], blockedDates: {} }
  const db = localStorage.getItem('schedula_db')
  return db ? JSON.parse(db) : defaultDB
}

const saveDB = (db) => {
  localStorage.setItem('schedula_db', JSON.stringify(db))
}

const generateId = () => Math.random().toString(36).substr(2, 9)

const mockResponse = async (data, shouldFail = false, errorMessage = 'Error') => {
  await delay(300) // Simulate network delay
  if (shouldFail) {
    return Promise.reject({ response: { data: { error: errorMessage } } })
  }
  return Promise.resolve({ data })
}

// ---------------------------
// AUTH
// ---------------------------
export const authAPI = {
  signup: async (userData) => {
    const db = getDB()
    if (db.users.find(u => u.email === userData.email)) {
      return mockResponse(null, true, 'User with this email already exists')
    }
    if (db.users.find(u => u.slug === userData.slug)) {
      return mockResponse(null, true, 'This booking link is already taken')
    }
    
    const newUser = { ...userData, id: generateId() }
    db.users.push(newUser)
    saveDB(db)
    
    // Auto login
    const token = newUser.id // mock token
    return mockResponse({
      message: 'Account created successfully',
      session: { access_token: token },
      user: { id: newUser.id, name: newUser.name, email: newUser.email, slug: newUser.slug }
    })
  },
  
  login: async (credentials) => {
    const db = getDB()
    const user = db.users.find(u => u.email === credentials.email && u.password === credentials.password)
    if (!user) {
      return mockResponse(null, true, 'Invalid email or password')
    }
    
    const token = user.id
    return mockResponse({
      session: { access_token: token },
      user: { id: user.id, name: user.name, email: user.email, slug: user.slug }
    })
  },
  
  me: async () => {
    const token = localStorage.getItem('token')
    if (!token) return mockResponse(null, true, 'No token')
    
    const db = getDB()
    const user = db.users.find(u => u.id === token)
    if (!user) return mockResponse(null, true, 'User not found')
      
    return mockResponse({
      user: { id: user.id, name: user.name, email: user.email, slug: user.slug }
    })
  }
}

// ---------------------------
// AVAILABILITY
// ---------------------------
export const availabilityAPI = {
  getSlots: async (slug, date) => {
    const db = getDB()
    const host = db.users.find(u => u.slug === slug)
    if (!host) return mockResponse(null, true, 'Host not found')

    if (!date) {
      return mockResponse({ host: { id: host.id, name: host.name, bio: host.bio, slug: host.slug }, slots: [] })
    }

    // Check if blocked
    const userBlocked = db.blockedDates[host.id] || []
    if (userBlocked.includes(date)) {
      return mockResponse({ host, slots: [], blocked: true })
    }

    const userAvail = db.availability[host.id] || []
    const dayOfWeek = new Date(date + 'T00:00:00').getDay()
    const dayAvail = userAvail.find(a => a.day_of_week === dayOfWeek)

    if (!dayAvail || !dayAvail.is_active) {
      return mockResponse({ host, slots: [] })
    }

    // Calculate slots (simple mock implementation)
    const existingBookings = db.bookings.filter(b => b.host_id === host.id && b.slot_date === date && b.status === 'confirmed')
    const bookedTimes = existingBookings.map(b => b.slot_time.substring(0, 5))
    
    let slots = []
    let current = new Date(`2000-01-01T${dayAvail.start_time}:00`)
    const end = new Date(`2000-01-01T${dayAvail.end_time}:00`)
    const duration = dayAvail.duration_minutes || 30
    
    while (current < end) {
      const timeStr = current.toTimeString().substring(0, 5)
      if (!bookedTimes.includes(timeStr)) {
        slots.push({ time: timeStr, available: true })
      }
      current.setMinutes(current.getMinutes() + duration)
    }

    return mockResponse({
      host: { id: host.id, name: host.name, bio: host.bio, slug: host.slug, duration_minutes: duration },
      slots
    })
  },
  
  save: async (data) => {
    const token = localStorage.getItem('token')
    const db = getDB()
    
    // Save availability replacing old
    db.availability[token] = data.schedule.map(d => ({
      ...d,
      duration_minutes: data.duration_minutes,
      buffer_minutes: data.buffer_minutes,
    }))
    saveDB(db)
    
    return mockResponse({ message: 'Availability saved successfully' })
  },
  
  blockDate: async (data) => {
    const token = localStorage.getItem('token')
    const db = getDB()
    if (!db.blockedDates[token]) db.blockedDates[token] = []
    if (!db.blockedDates[token].includes(data.date)) {
      db.blockedDates[token].push(data.date)
      saveDB(db)
    }
    return mockResponse({ message: 'Date blocked successfully' })
  },
  
  getSettings: async () => {
    const token = localStorage.getItem('token')
    const db = getDB()
    return mockResponse({ availability: db.availability[token] || [] })
  }
}

// ---------------------------
// BOOKINGS
// ---------------------------
export const bookingsAPI = {
  create: async (data) => {
    const db = getDB()
    const host = db.users.find(u => u.slug === data.slug)
    if (!host) return mockResponse(null, true, 'Host not found')

    // Check conflict
    const conflict = db.bookings.find(b => b.host_id === host.id && b.slot_date === data.slot_date && b.slot_time === `${data.slot_time}:00` && b.status === 'confirmed')
    if (conflict) {
      return mockResponse(null, true, 'This slot was just booked. Please choose another time.')
    }

    const newBooking = {
      id: generateId(),
      host_id: host.id,
      guest_name: data.guest_name,
      guest_email: data.guest_email,
      guest_phone: data.guest_phone || null,
      purpose: data.purpose || null,
      slot_date: data.slot_date,
      slot_time: `${data.slot_time}:00`,
      meet_link: `https://meet.google.com/mock-${generateId()}`,
      status: 'confirmed',
      created_at: new Date().toISOString()
    }
    
    db.bookings.push(newBooking)
    saveDB(db)
    
    return mockResponse({
      message: 'Booking confirmed!',
      booking: { ...newBooking, slot_time: data.slot_time }
    })
  },
  
  getAdmin: async () => {
    const token = localStorage.getItem('token')
    const db = getDB()
    const userBookings = db.bookings.filter(b => b.host_id === token)
    return mockResponse({ bookings: userBookings })
  },
  
  cancel: async (id) => {
    const db = getDB()
    const booking = db.bookings.find(b => b.id === id)
    if (booking) {
      booking.status = 'cancelled'
      saveDB(db)
    }
    return mockResponse({ message: 'Booking cancelled successfully' })
  }
}

// ---------------------------
// CHAT
// ---------------------------
export const chatAPI = {
  send: async (messages, mode, context) => {
    const fallbackReplies = {
      guest: "I'm a mock AI here to help you book a meeting! Please pick a date from the calendar. 📅",
      admin: "I'm your mock admin assistant. Your settings and bookings are saved in your browser's local storage!",
    }
    return mockResponse({ reply: fallbackReplies[mode] || "I'm a local mock AI!" })
  }
}

// Keep export default api for anything else (unused now)
export default {}
