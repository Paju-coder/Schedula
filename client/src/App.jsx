import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { authAPI } from './lib/api'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Availability from './pages/Availability'
import BookingPage from './pages/BookingPage'
import './index.css'

function ProtectedRoute({ children, session }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setSession(null)
        setLoading(false)
        return
      }
      try {
        const { data } = await authAPI.me()
        setSession({ user: data.user, access_token: token })
      } catch (err) {
        console.error('Session expired or invalid')
        localStorage.removeItem('token')
        setSession(null)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-on-surface-variant text-sm font-medium">Loading Schedula...</span>
        </div>
      </div>
    )
  }

  // Inject setSession globally for easy login/logout without Context API overhead for now
  const handleSetSession = (newSession) => {
    if (newSession) {
      localStorage.setItem('token', newSession.access_token || newSession.session?.access_token)
      setSession(newSession)
    } else {
      localStorage.removeItem('token')
      setSession(null)
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing session={session} />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login setSession={handleSetSession} />} />
        <Route path="/signup" element={session ? <Navigate to="/availability" /> : <Signup setSession={handleSetSession} />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute session={session}>
              <Dashboard session={session} setSession={handleSetSession} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedRoute session={session}>
              <Availability session={session} setSession={handleSetSession} />
            </ProtectedRoute>
          }
        />
        <Route path="/:slug" element={<BookingPage />} />
      </Routes>
    </BrowserRouter>
  )
}
