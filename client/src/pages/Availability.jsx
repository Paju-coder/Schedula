import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SideNav from '../components/SideNav'
import { availabilityAPI } from '../lib/api'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DURATIONS = [15, 30, 45, 60]
const BUFFERS = [0, 5, 10, 15]

const defaultSchedule = DAYS.map((day, i) => ({
  day_of_week: i,
  day_name: day,
  is_active: i >= 1 && i <= 5, // Mon-Fri default
  start_time: '09:00',
  end_time: '17:00',
}))

export default function Availability({ session, setSession }) {
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState(defaultSchedule)
  const [duration, setDuration] = useState(30)
  const [buffer, setBuffer] = useState(0)
  const [blockDate, setBlockDate] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userSlug, setUserSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      if (session?.user?.slug) {
        setUserSlug(session.user.slug)
      }

      try {
        const { data } = await availabilityAPI.getSettings()
        const avail = data.availability || []

        if (avail.length > 0) {
          const merged = defaultSchedule.map(day => {
            const existing = avail.find(a => a.day_of_week === day.day_of_week)
            if (existing) {
              return {
                ...day,
                is_active: existing.is_active,
                start_time: existing.start_time?.slice(0, 5) || '09:00',
                end_time: existing.end_time?.slice(0, 5) || '17:00',
              }
            }
            return day
          })
          setSchedule(merged)
          const first = avail[0]
          setDuration(first.duration_minutes || 30)
          setBuffer(first.buffer_minutes || 0)
        }
      } catch (err) {
        console.error('Failed to load availability settings:', err)
      }
      setLoading(false)
    }
    loadData()
  }, [session])

  const toggleDay = (i) => {
    setSchedule(s => s.map((d, idx) => idx === i ? { ...d, is_active: !d.is_active } : d))
  }

  const updateTime = (i, field, value) => {
    setSchedule(s => s.map((d, idx) => idx === i ? { ...d, [field]: value } : d))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await availabilityAPI.save({
        schedule,
        duration_minutes: duration,
        buffer_minutes: buffer,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save. Try again.')
    }
    setSaving(false)
  }

  const handleBlockDate = async () => {
    if (!blockDate) return
    setBlocking(true)
    try {
      await availabilityAPI.blockDate({ date: blockDate, reason: blockReason })
      setBlockDate('')
      setBlockReason('')
      alert('Date blocked successfully!')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to block date.')
    }
    setBlocking(false)
  }

  let origin = window.location.origin
  const bookingLink = `${origin}/${userSlug}`

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex font-sans">
      <SideNav active="availability" userSlug={userSlug} setSession={setSession} />

      <main className="flex-1 ml-0 md:ml-64 p-6 md:p-10 pb-32">
        <div className="max-w-container mx-auto">
          {/* Header */}
          <header className="mb-10 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black text-primary tracking-tight">Availability Settings</h1>
              <p className="text-on-surface-variant mt-2">Define your scheduling windows, durations and buffers.</p>
            </div>
          </header>

          {error && (
            <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          {/* Booking link */}
          {userSlug && (
            <div className="card p-5 rounded-2xl mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Your Booking Link</p>
                <div className="booking-link-box">
                  <span className="material-symbols-outlined text-secondary text-base">link</span>
                  <span className="truncate">{bookingLink}</span>
                </div>
              </div>
              <button
                id="copy-booking-link"
                onClick={copyLink}
                className="btn-primary text-sm flex items-center gap-2 shrink-0"
              >
                <span className="material-symbols-outlined text-base">content_copy</span>
                Copy Link
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Schedule */}
            <section className="lg:col-span-8 space-y-6">
              {/* Weekly schedule */}
              <div className="card p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">calendar_month</span>
                  Weekly Schedule
                </h3>
                <div className="space-y-3">
                  {schedule.map((day, i) => (
                    <div
                      key={day.day_name}
                      className={`flex flex-wrap items-center justify-between p-4 rounded-xl border transition-all gap-4 ${
                        day.is_active
                          ? 'border-outline-variant/20 bg-surface-container-lowest'
                          : 'border-transparent opacity-50'
                      }`}
                    >
                      {/* Toggle + Day name */}
                      <div className="flex items-center gap-5 min-w-[160px]">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={day.is_active}
                            onChange={() => toggleDay(i)}
                            id={`day-toggle-${i}`}
                          />
                          <div className={`w-12 h-6 rounded-full transition-colors relative ${day.is_active ? 'bg-secondary' : 'bg-surface-variant'}`}>
                            <div className={`absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform ${day.is_active ? 'translate-x-[26px]' : 'translate-x-[3px]'}`} />
                          </div>
                        </label>
                        <span className="font-bold text-on-surface">{day.day_name}</span>
                      </div>

                      {/* Time inputs */}
                      {day.is_active ? (
                        <div className="flex items-center gap-3">
                          <input
                            type="time"
                            value={day.start_time}
                            onChange={e => updateTime(i, 'start_time', e.target.value)}
                            className="bg-surface-container-low border border-surface-container rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                          />
                          <span className="text-on-surface-variant font-bold">→</span>
                          <input
                            type="time"
                            value={day.end_time}
                            onChange={e => updateTime(i, 'end_time', e.target.value)}
                            className="bg-surface-container-low border border-surface-container rounded-lg px-3 py-2 text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-on-surface-variant italic">Unavailable</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Block dates */}
              <div className="card p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">event_busy</span>
                  Block Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Select Date</label>
                    <input
                      id="block-date-input"
                      type="date"
                      className="input"
                      value={blockDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setBlockDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Reason (Optional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Personal Holiday"
                      value={blockReason}
                      onChange={e => setBlockReason(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  id="block-date-btn"
                  onClick={handleBlockDate}
                  disabled={!blockDate || blocking}
                  className="mt-6 btn-outline flex items-center gap-2 text-sm disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-base">block</span>
                  {blocking ? 'Blocking...' : 'Block This Date'}
                </button>
              </div>
            </section>

            {/* Right: Duration + Buffer + Save */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Duration */}
              <div className="card p-6 rounded-2xl">
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Meeting Duration</h4>
                <div className="grid grid-cols-2 gap-3">
                  {DURATIONS.map(d => (
                    <button
                      key={d}
                      id={`duration-${d}`}
                      onClick={() => setDuration(d)}
                      className={`pill ${duration === d ? 'active' : ''}`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Buffer */}
              <div className="card p-6 rounded-2xl">
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Buffer Time</h4>
                <p className="text-xs text-on-surface-variant mb-4">Prevent back-to-back meetings.</p>
                <div className="grid grid-cols-2 gap-3">
                  {BUFFERS.map(b => (
                    <button
                      key={b}
                      id={`buffer-${b}`}
                      onClick={() => setBuffer(b)}
                      className={`pill ${buffer === b ? 'active' : ''}`}
                    >
                      {b === 0 ? 'None' : `${b} min`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save */}
              <button
                id="save-availability"
                onClick={handleSave}
                disabled={saving}
                className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${
                  saved
                    ? 'bg-green-600 text-white'
                    : 'bg-[#006bff] text-white hover:bg-[#005be6]'
                } disabled:opacity-50`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    Saved!
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Save Changes
                  </>
                )}
              </button>

              {/* Visual card */}
              <div className="card p-6 rounded-2xl bg-primary text-on-primary">
                <p className="text-3xl font-black tracking-tight">Engineered</p>
                <p className="text-3xl font-black tracking-tight text-secondary">Efficiency.</p>
                <p className="text-white/60 text-sm mt-3">Your availability, automated.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
