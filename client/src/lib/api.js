import axios from 'axios'
import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token from Supabase auth
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Auth
export const authAPI = {
  signup: (data) => api.post('/api/auth/signup', data),
  login: (data) => api.post('/api/auth/login', data),
}

// Availability
export const availabilityAPI = {
  getSlots: (slug, date) => api.get(`/api/availability/${slug}?date=${date}`),
  save: (data) => api.post('/api/availability', data),
  blockDate: (data) => api.post('/api/availability/block', data),
  getSettings: () => api.get('/api/availability/settings'),
}

// Bookings
export const bookingsAPI = {
  create: (data) => api.post('/api/bookings', data),
  getAdmin: () => api.get('/api/bookings/admin'),
  cancel: (id) => api.put(`/api/bookings/${id}/cancel`),
}

// Chat
export const chatAPI = {
  send: (messages, mode, context) => api.post('/api/chat', { messages, mode, context }),
}

export default api
