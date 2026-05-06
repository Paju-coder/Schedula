import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../lib/api'

function generateSlug(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', slug: '' })
  const [slugEdited, setSlugEdited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleNameChange = (e) => {
    const name = e.target.value
    setForm(f => ({
      ...f,
      name,
      slug: slugEdited ? f.slug : generateSlug(name),
    }))
  }

  const handleSlugChange = (e) => {
    setSlugEdited(true)
    setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await authAPI.signup({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        slug: form.slug,
      })
      navigate('/availability')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-gutter py-5 border-b border-outline-variant/20">
        <Link to="/" className="text-xl font-black text-primary tracking-tighter">Schedula</Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-gutter py-12">
        <div className="w-full max-w-lg animate-slide-up">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-card">
              <span className="material-symbols-outlined text-white text-3xl">person_add</span>
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tight">Create your account</h1>
            <p className="text-on-surface-variant mt-2">Get your scheduling link in 2 minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  className="input"
                  placeholder="Tanish Rahod"
                  value={form.name}
                  onChange={handleNameChange}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Phone</label>
                <input
                  id="signup-phone"
                  type="tel"
                  className="input"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Email</label>
              <input
                id="signup-email"
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Password</label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={6}
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Your Booking Link</label>
              <div className="flex items-center bg-surface-container-low border border-surface-container rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-secondary/30 focus-within:border-secondary transition-all">
                <span className="px-4 py-3 text-on-surface-variant/60 text-sm border-r border-surface-container whitespace-nowrap bg-surface-container">
                  schedula.app/
                </span>
                <input
                  id="signup-slug"
                  type="text"
                  required
                  className="flex-1 px-4 py-3 bg-transparent text-on-surface text-sm focus:outline-none font-mono"
                  placeholder="your-name"
                  value={form.slug}
                  onChange={handleSlugChange}
                />
              </div>
              <p className="text-xs text-on-surface-variant/60">This will be your public booking URL</p>
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-secondary text-white font-bold py-4 rounded-full transition-all active:scale-95 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                  Create Account & Set Availability
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-secondary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
