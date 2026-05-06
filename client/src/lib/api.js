import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the auth token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------
// AUTH
// ---------------------------
export const authAPI = {
  signup: async (userData) => {
    try {
      const response = await apiClient.post('/auth/signup', userData);
      return { data: response.data };
    } catch (error) {
      return Promise.reject(error);
    }
  },
  
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return { data: response.data };
    } catch (error) {
      return Promise.reject(error);
    }
  },
  
  me: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return { data: response.data };
    } catch (error) {
      return Promise.reject(error);
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await apiClient.put('/auth/profile', data);
      return { data: response.data };
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

// ---------------------------
// AVAILABILITY
// ---------------------------
export const availabilityAPI = {
  getSlots: async (slug, date) => {
    try {
      const response = await apiClient.get(`/availability/${slug}${date ? `?date=${date}` : ''}`);
      return { data: response.data };
    } catch (error) {
      return Promise.reject(error);
    }
  },
  
  save: async (data) => {
    try {
      const response = await apiClient.post('/availability', data);
      return { data: response.data };
    } catch (error) {
      return Promise.reject(error);
    }
  },
  
  blockDate: async (data) => {
    try {
      const response = await apiClient.post('/availability/block', data);
      return { data: response.data };
    } catch (error) {
      return Promise.reject(error);
    }
  },
  
  getSettings: async () => {
    try {
      const response = await apiClient.get('/availability/settings');
      return { data: response.data };
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

// ---------------------------
// BOOKINGS
// ---------------------------
export const bookingsAPI = {
  create: async (data) => {
    try {
      const response = await apiClient.post('/bookings', data);
      return { data: response.data };
    } catch (error) {
      return Promise.reject(error);
    }
  },
  
  getAdmin: async () => {
    try {
      const response = await apiClient.get('/bookings/admin');
      return { data: response.data };
    } catch (error) {
      return Promise.reject(error);
    }
  },
  
  cancel: async (id) => {
    try {
      const response = await apiClient.put(`/bookings/${id}/cancel`);
      return { data: response.data };
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

// ---------------------------
// CHAT
// ---------------------------
export const chatAPI = {
  send: async (messages, mode, context) => {
    try {
      const response = await apiClient.post('/chat', { messages, mode, context });
      return { data: response.data };
    } catch (error) {
      console.error('Chat API Error:', error);
      // Fallback
      const fallbackReplies = {
        guest: "I'm having trouble connecting to my brain right now! Please pick a date from the calendar. 📅",
        admin: "Connection error. Make sure the backend server (port 5000) is running and your API key is set!",
      };
      return { data: { reply: fallbackReplies[mode] || "Error connecting to AI." } };
    }
  }
}

export default apiClient;
