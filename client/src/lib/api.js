// ============================================================
// Schedula — localStorage-powered API layer
// Data storage: localStorage (no MongoDB)
// External services: Groq AI, WhatsApp, Email via minimal server
// ============================================================

// Server URL for external services (chat, WhatsApp, email)
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --------------- HELPERS ---------------

function getCollection(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function setCollection(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Simple hash for demo password storage (NOT cryptographically secure)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

function generateToken(userId) {
  return btoa(JSON.stringify({ id: userId, ts: Date.now() }));
}

function decodeToken(token) {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

function getCurrentUserId() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const decoded = decodeToken(token);
  return decoded?.id || null;
}

function getCurrentUser() {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const users = getCollection('schedula_users');
  return users.find(u => u.id === userId) || null;
}

// Generate a fake Google Meet link
function generateMeetLink() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${rand(3)}-${rand(4)}-${rand(3)}`;
}

// --------------- SLOT GENERATION (ported from server) ---------------

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generateSlots(availability, existingBookings, date) {
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();

  const dayAvailability = availability.find(
    a => a.day_of_week === dayOfWeek && a.is_active
  );

  if (!dayAvailability) return [];

  const slots = [];
  const { start_time, end_time, duration_minutes, buffer_minutes } = dayAvailability;

  let current = parseTime(start_time.slice(0, 5));
  const end = parseTime(end_time.slice(0, 5));
  const step = (duration_minutes || 30) + (buffer_minutes || 0);

  while (current + (duration_minutes || 30) <= end) {
    const timeStr = formatTime(current);
    const isBooked = existingBookings.some(
      b => b.slot_date === date && b.slot_time?.slice(0, 5) === timeStr && b.status !== 'cancelled'
    );
    if (!isBooked) slots.push(timeStr);
    current += step;
  }

  return slots;
}

// ---------------------------
// AUTH
// ---------------------------
export const authAPI = {
  signup: async (userData) => {
    const users = getCollection('schedula_users');

    // Check for existing user
    const existingEmail = users.find(u => u.email === userData.email);
    if (existingEmail) {
      const err = new Error('User with this email already exists');
      err.response = { data: { error: 'User with this email already exists' } };
      throw err;
    }

    const existingSlug = users.find(u => u.slug === userData.slug);
    if (existingSlug) {
      const err = new Error('This booking link is already taken');
      err.response = { data: { error: 'This booking link is already taken. Choose another.' } };
      throw err;
    }

    const newUser = {
      id: generateId(),
      _id: null, // will be set below
      name: userData.name,
      email: userData.email,
      password: simpleHash(userData.password),
      phone: userData.phone || '',
      slug: userData.slug,
      bio: '',
      createdAt: new Date().toISOString(),
    };
    newUser._id = newUser.id;

    users.push(newUser);
    setCollection('schedula_users', users);

    const token = generateToken(newUser.id);

    return {
      data: {
        message: 'Account created successfully',
        session: { access_token: token },
        user: { id: newUser.id, _id: newUser.id, name: newUser.name, email: newUser.email, slug: newUser.slug },
      }
    };
  },

  login: async (credentials) => {
    const users = getCollection('schedula_users');
    const user = users.find(u => u.email === credentials.email);

    if (!user || user.password !== simpleHash(credentials.password)) {
      const err = new Error('Invalid email or password');
      err.response = { data: { error: 'Invalid email or password' } };
      throw err;
    }

    const token = generateToken(user.id);

    return {
      data: {
        session: { access_token: token },
        user: { id: user.id, _id: user.id, name: user.name, email: user.email, slug: user.slug },
      }
    };
  },

  me: async () => {
    const user = getCurrentUser();
    if (!user) {
      const err = new Error('Not authenticated');
      err.response = { status: 401, data: { error: 'Not authenticated' } };
      throw err;
    }

    return {
      data: {
        user: { id: user.id, _id: user.id, name: user.name, email: user.email, slug: user.slug },
      }
    };
  },

  updateProfile: async (data) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const users = getCollection('schedula_users');
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');

    if (data.name) users[idx].name = data.name;
    if (data.email) {
      const existing = users.find(u => u.email === data.email && u.id !== userId);
      if (existing) {
        const err = new Error('Email already taken');
        err.response = { data: { error: 'Email already taken' } };
        throw err;
      }
      users[idx].email = data.email;
    }

    setCollection('schedula_users', users);

    return {
      data: {
        user: { id: users[idx].id, _id: users[idx].id, name: users[idx].name, email: users[idx].email, slug: users[idx].slug },
        message: 'Profile updated',
      }
    };
  },
};

// ---------------------------
// AVAILABILITY
// ---------------------------
export const availabilityAPI = {
  getSlots: async (slug, date) => {
    const users = getCollection('schedula_users');
    const host = users.find(u => u.slug === slug);

    if (!host) {
      const err = new Error('Host not found');
      err.response = { status: 404, data: { error: 'Host not found' } };
      throw err;
    }

    if (!date) {
      return {
        data: {
          host: { id: host.id, _id: host.id, name: host.name, bio: host.bio, slug: host.slug },
          slots: [],
        }
      };
    }

    // Check if date is blocked
    const blockedDates = getCollection(`schedula_blocked_dates_${host.id}`);
    const isBlocked = blockedDates.some(bd => bd.blocked_date === date);
    if (isBlocked) {
      return {
        data: {
          host: { id: host.id, _id: host.id, name: host.name, bio: host.bio, slug: host.slug },
          slots: [],
          blocked: true,
        }
      };
    }

    // Get availability settings
    const availability = getCollection(`schedula_availability_${host.id}`);
    const activeAvail = availability.filter(a => a.is_active);

    if (activeAvail.length === 0) {
      return {
        data: {
          host: { id: host.id, _id: host.id, name: host.name, bio: host.bio, slug: host.slug },
          slots: [],
        }
      };
    }

    // Get existing bookings for this date
    const allBookings = getCollection('schedula_bookings');
    const existingBookings = allBookings.filter(
      b => b.host_id === host.id && b.slot_date === date && b.status !== 'cancelled'
    );

    // Generate slots
    const slots = generateSlots(activeAvail, existingBookings, date);

    // Get duration info
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const dayAvail = activeAvail.find(a => a.day_of_week === dayOfWeek);

    return {
      data: {
        host: {
          id: host.id,
          _id: host.id,
          name: host.name,
          bio: host.bio,
          slug: host.slug,
          duration_minutes: dayAvail ? dayAvail.duration_minutes : 30,
        },
        slots,
      }
    };
  },

  save: async (data) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const { schedule, duration_minutes, buffer_minutes } = data;

    const availability = schedule.map(day => ({
      id: generateId(),
      user_id: userId,
      day_of_week: day.day_of_week,
      start_time: day.is_active ? `${day.start_time}:00` : '09:00:00',
      end_time: day.is_active ? `${day.end_time}:00` : '17:00:00',
      duration_minutes: duration_minutes || 30,
      buffer_minutes: buffer_minutes || 0,
      is_active: day.is_active,
    }));

    setCollection(`schedula_availability_${userId}`, availability);

    return { data: { message: 'Availability saved successfully' } };
  },

  blockDate: async (data) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const blockedDates = getCollection(`schedula_blocked_dates_${userId}`);

    // Check if already blocked
    const existing = blockedDates.find(bd => bd.blocked_date === data.date);
    if (!existing) {
      blockedDates.push({
        id: generateId(),
        user_id: userId,
        blocked_date: data.date,
        reason: data.reason || null,
        createdAt: new Date().toISOString(),
      });
      setCollection(`schedula_blocked_dates_${userId}`, blockedDates);
    }

    return { data: { message: `Date ${data.date} blocked successfully` } };
  },

  getSettings: async () => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const availability = getCollection(`schedula_availability_${userId}`);
    return { data: { availability } };
  },
};

// ---------------------------
// BOOKINGS
// ---------------------------
export const bookingsAPI = {
  create: async (data) => {
    const users = getCollection('schedula_users');
    const host = users.find(u => u.slug === data.slug);

    if (!host) {
      const err = new Error('Host not found');
      err.response = { status: 404, data: { error: 'Host not found' } };
      throw err;
    }

    const allBookings = getCollection('schedula_bookings');

    // Check for conflicts
    const conflict = allBookings.find(
      b => b.host_id === host.id &&
           b.slot_date === data.slot_date &&
           b.slot_time === `${data.slot_time}:00` &&
           b.status !== 'cancelled'
    );

    if (conflict) {
      const err = new Error('Slot taken');
      err.response = { status: 409, data: { error: 'This slot was just booked. Please choose another time.' } };
      throw err;
    }

    const meet_link = generateMeetLink();

    const booking = {
      id: generateId(),
      _id: null,
      host_id: host.id,
      guest_name: data.guest_name,
      guest_email: data.guest_email,
      guest_phone: data.guest_phone || null,
      purpose: data.purpose || null,
      slot_date: data.slot_date,
      slot_time: `${data.slot_time}:00`,
      meet_link,
      meeting_type: data.meeting_type || 'Google Meet',
      status: 'confirmed',
      reminder_sent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    booking._id = booking.id;

    allBookings.push(booking);
    setCollection('schedula_bookings', allBookings);

    // Fire notifications in background (don't block the booking response)
    const notifData = {
      guest_name: data.guest_name,
      slot_date: data.slot_date,
      slot_time: data.slot_time,
      meet_link,
      meeting_type: data.meeting_type || 'Google Meet',
      purpose: data.purpose || '',
    };

    // WhatsApp notification to guest (if phone provided)
    if (data.guest_phone) {
      notificationsAPI.sendWhatsApp(data.guest_phone, notifData).catch(e => console.warn('WhatsApp failed:', e.message));
    }

    // Email notification to guest
    if (data.guest_email) {
      notificationsAPI.sendEmail(data.guest_email, notifData).catch(e => console.warn('Email failed:', e.message));
    }

    // Email notification to host
    if (host.email) {
      notificationsAPI.sendEmail(host.email, { ...notifData, guest_name: `${data.guest_name} (your guest)` }).catch(e => console.warn('Host email failed:', e.message));
    }

    return {
      data: {
        message: 'Booking confirmed!',
        booking: {
          ...booking,
          slot_time: data.slot_time,
        },
      }
    };
  },

  getAdmin: async () => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const allBookings = getCollection('schedula_bookings');
    const myBookings = allBookings
      .filter(b => b.host_id === userId)
      .sort((a, b) => {
        const dateA = `${a.slot_date}T${a.slot_time}`;
        const dateB = `${b.slot_date}T${b.slot_time}`;
        return dateA.localeCompare(dateB);
      });

    return { data: { bookings: myBookings } };
  },

  cancel: async (id) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const allBookings = getCollection('schedula_bookings');
    const idx = allBookings.findIndex(b => (b._id === id || b.id === id));

    if (idx === -1) {
      const err = new Error('Booking not found');
      err.response = { status: 404, data: { error: 'Booking not found' } };
      throw err;
    }

    if (allBookings[idx].host_id !== userId) {
      const err = new Error('Forbidden');
      err.response = { status: 403, data: { error: 'You can only cancel your own bookings' } };
      throw err;
    }

    allBookings[idx].status = 'cancelled';
    allBookings[idx].updatedAt = new Date().toISOString();
    setCollection('schedula_bookings', allBookings);

    return { data: { message: 'Booking cancelled successfully' } };
  },

  delete: async (id) => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const allBookings = getCollection('schedula_bookings');
    const idx = allBookings.findIndex(b => (b._id === id || b.id === id));

    if (idx === -1) {
      const err = new Error('Booking not found');
      err.response = { status: 404, data: { error: 'Booking not found' } };
      throw err;
    }

    if (allBookings[idx].host_id !== userId) {
      const err = new Error('Forbidden');
      err.response = { status: 403, data: { error: 'You can only delete your own bookings' } };
      throw err;
    }

    allBookings.splice(idx, 1);
    setCollection('schedula_bookings', allBookings);

    return { data: { message: 'Booking deleted permanently' } };
  },
};

// ---------------------------
// NOTIFICATIONS (via server)
// ---------------------------
export const notificationsAPI = {
  sendWhatsApp: async (phone, data, type = 'confirmation') => {
    try {
      const response = await fetch(`${SERVER_URL}/notifications/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, data, type }),
      });
      return await response.json();
    } catch (err) {
      console.warn('WhatsApp notification failed (server may be offline):', err.message);
      return { skipped: true };
    }
  },

  sendEmail: async (to, data) => {
    try {
      const response = await fetch(`${SERVER_URL}/notifications/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, data }),
      });
      return await response.json();
    } catch (err) {
      console.warn('Email notification failed (server may be offline):', err.message);
      return { skipped: true };
    }
  },
};

// ---------------------------
// CHAT (Groq AI via server, with local fallback)
// ---------------------------
export const chatAPI = {
  send: async (messages, mode, context) => {
    // Try the server-side Groq AI first
    try {
      const response = await fetch(`${SERVER_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, mode, context }),
      });

      if (response.ok) {
        const result = await response.json();
        return { data: result };
      }
    } catch (err) {
      console.warn('Groq AI unavailable, using local fallback:', err.message);
    }

    // ─── LOCAL FALLBACK (when server is offline) ───
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
    let reply = '';
    let action = null;

    if (mode === 'guest') {
      if (lastMsg.includes('book') || lastMsg.includes('slot') || lastMsg.includes('available')) {
        reply = "Please pick a date from the calendar to see available time slots! 📅 Then select a time that works for you.";
      } else if (lastMsg.includes('cancel')) {
        reply = "To cancel a booking, please contact the host directly. They can cancel it from their dashboard.";
      } else if (lastMsg.includes('how')) {
        reply = "It's simple! 1️⃣ Pick a date from the calendar. 2️⃣ Choose a time slot. 3️⃣ Fill in your details. Done! ✅";
      } else if (lastMsg.includes('hello') || lastMsg.includes('hi') || lastMsg.includes('hey')) {
        reply = `Hi there! 👋 I'm here to help you book a meeting${context?.hostName ? ` with ${context.hostName}` : ''}. Pick a date from the calendar to get started!`;
      } else {
        reply = "I'm here to help you schedule a meeting! Pick a date from the calendar, and I'll show you available slots. 📅";
      }
    } else {
      if (lastMsg.includes('today') || lastMsg.includes('booking')) {
        const bookings = getCollection('schedula_bookings');
        const userId = getCurrentUserId();
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter(b => b.host_id === userId && b.slot_date === today && b.status !== 'cancelled');
        reply = todayBookings.length > 0
          ? `You have ${todayBookings.length} booking${todayBookings.length > 1 ? 's' : ''} today! 📊 Check your Bookings page for details.`
          : "No bookings for today. Enjoy your free time! ☀️";
      } else if (lastMsg.includes('block')) {
        reply = "To block a date, go to your Availability page and use the 'Block Dates' section. Or tell me a specific date to block!";
        const dateMatch = lastMsg.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          action = { type: 'block_date', data: { date: dateMatch[1], reason: 'Blocked via AI' } };
          reply = `I'll block ${dateMatch[1]} for you right away! 🚫`;
        }
      } else if (lastMsg.includes('stat') || lastMsg.includes('analytics')) {
        const bookings = getCollection('schedula_bookings');
        const userId = getCurrentUserId();
        const myBookings = bookings.filter(b => b.host_id === userId);
        const confirmed = myBookings.filter(b => b.status === 'confirmed').length;
        const cancelled = myBookings.filter(b => b.status === 'cancelled').length;
        reply = `📊 Your stats: ${myBookings.length} total bookings, ${confirmed} confirmed, ${cancelled} cancelled.`;
      } else if (lastMsg.includes('hello') || lastMsg.includes('hi') || lastMsg.includes('hey')) {
        reply = `Hey${context?.userName ? ` ${context.userName}` : ''}! 👋 I'm your Schedula assistant. Ask me about today's bookings, stats, or anything else!`;
      } else {
        reply = "I'm your Schedula assistant! I can help with bookings, stats, and schedule management. What do you need? 🤖";
      }
    }

    return { data: { reply, action } };
  },
};

// Default export for backward compatibility
export default {};
