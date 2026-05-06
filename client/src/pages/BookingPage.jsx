import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns'
import { availabilityAPI, bookingsAPI } from '../lib/api'
import ChatBot from '../components/ChatBot'
import SuccessScreen from '../components/SuccessScreen'

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function initials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export default function BookingPage() {
  const { slug } = useParams()

  const [hostInfo, setHostInfo] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', purpose: '' })
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState(null) // success state

  // Load host info
  useEffect(() => {
    const loadHost = async () => {
      try {
        const res = await availabilityAPI.getSlots(slug, format(new Date(), 'yyyy-MM-dd'))
        setHostInfo(res.data.host)
      } catch (err) {
        setError('This booking page does not exist.')
      }
      setLoading(false)
    }
    loadHost()
  }, [slug])

  // Load slots when date selected
  useEffect(() => {
    if (!selectedDate) return
    const loadSlots = async () => {
      setSlotsLoading(true)
      try {
        const res = await availabilityAPI.getSlots(slug, format(selectedDate, 'yyyy-MM-dd'))
        setSlots(res.data.slots || [])
        setSelectedSlot(null)
      } catch {
        setSlots([])
      }
      setSlotsLoading(false)
    }
    loadSlots()
  }, [selectedDate, slug])

  const calDays = (() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })
    const startPad = start.getDay()
    const padded = Array(startPad).fill(null).concat(days)
    return padded
  })()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedDate || !selectedSlot) return
    setSubmitting(true)
    setError('')

    try {
      const res = await bookingsAPI.create({
        slug,
        guest_name: form.name,
        guest_email: form.email,
        guest_phone: form.phone,
        purpose: form.purpose,
        slot_date: format(selectedDate, 'yyyy-MM-dd'),
        slot_time: selectedSlot,
      })
      setBooking(res.data.booking)
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
          <span className="text-on-surface-variant text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  if (error && !hostInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">calendar_off</span>
          <h2 className="text-2xl font-bold text-primary mt-4">Page Not Found</h2>
          <p className="text-on-surface-variant mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (booking) {
    return <SuccessScreen booking={booking} host={hostInfo} />
  }

  return (
    <div className="min-h-screen bg-surface font-sans">
      {/* Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-surface-container sticky top-0 z-40">
        <div className="max-w-container mx-auto px-gutter flex items-center justify-between h-14">
          <span className="text-lg font-black text-primary tracking-tighter">Schedula</span>
        </div>
      </header>

      <main className="max-w-container mx-auto px-gutter py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left: Host Profile */}
          <aside className="md:col-span-4 flex flex-col gap-5">
            {/* Profile card */}
            <div className="card p-8 rounded-2xl flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-white text-3xl font-black mb-5 shadow-lg">
                {initials(hostInfo?.name)}
              </div>
              <h1 className="text-2xl font-black text-on-surface tracking-tight">{hostInfo?.name}</h1>
              {hostInfo?.bio && (
                <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">{hostInfo.bio}</p>
              )}
              <div className="flex flex-col gap-3 w-full mt-6">
                <div className="bg-surface-container-low border border-surface-container px-4 py-3 rounded-xl flex items-center gap-3 text-sm text-on-surface font-medium">
                  <span className="material-symbols-outlined text-secondary text-base">schedule</span>
                  {hostInfo?.duration_minutes || 30} min meeting
                </div>
                <div className="bg-surface-container-low border border-surface-container px-4 py-3 rounded-xl flex items-center gap-3 text-sm text-on-surface font-medium">
                  <span className="material-symbols-outlined text-secondary text-base">videocam</span>
                  Google Meet
                </div>
                <div className="bg-surface-container-low border border-surface-container px-4 py-3 rounded-xl flex items-center gap-3 text-sm text-on-surface font-medium">
                  <span className="material-symbols-outlined text-secondary text-base">public</span>
                  IST Timezone
                </div>
              </div>
            </div>

            {/* Availability note */}
            <div className="bg-accent-mint border border-outline-variant/10 rounded-2xl p-5">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Availability</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Select a date from the calendar to see available time slots.
              </p>
            </div>
          </aside>

          {/* Right: Calendar + Slots + Form */}
          <section className="md:col-span-8 flex flex-col gap-6">
            {/* Calendar */}
            <div className="card p-8 rounded-2xl">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-on-surface">{format(currentMonth, 'MMMM yyyy')}</h2>
                <div className="flex gap-1">
                  <button
                    id="cal-prev"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 rounded-xl hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary">chevron_left</span>
                  </button>
                  <button
                    id="cal-next"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 rounded-xl hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Day labels */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS_SHORT.map(d => (
                  <div key={d} className="text-center text-xs font-bold text-on-surface-variant uppercase py-1">{d}</div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((day, i) => {
                  if (!day) return <div key={`pad-${i}`} />
                  const isDisabled = isBefore(startOfDay(day), startOfDay(new Date())) || !isSameMonth(day, currentMonth)
                  const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  const today = isToday(day)

                  return (
                    <button
                      key={day.toISOString()}
                      id={`cal-day-${format(day, 'yyyy-MM-dd')}`}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setSelectedDate(day)}
                      className={`cal-day mx-auto ${isSelected ? 'selected' : ''} ${today && !isSelected ? 'today' : ''} ${isDisabled ? 'disabled' : ''}`}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="animate-fade-in">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                  Available Times — {format(selectedDate, 'EEEE, MMMM d')}
                </h3>
                {slotsLoading ? (
                  <div className="flex items-center gap-3 py-4 text-on-surface-variant text-sm">
                    <div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                    Loading slots...
                  </div>
                ) : slots.length === 0 ? (
                  <div className="card p-6 rounded-2xl text-center text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">event_busy</span>
                    <p>No available slots for this date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {slots.map(slot => (
                      <button
                        key={slot}
                        id={`slot-${slot}`}
                        onClick={() => setSelectedSlot(slot)}
                        className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Booking form */}
            {selectedSlot && (
              <div className="card p-8 rounded-2xl animate-slide-up">
                <h3 className="text-xl font-bold text-on-surface mb-6">Enter Your Details</h3>
                {error && (
                  <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 mb-5">
                    <span className="material-symbols-outlined text-base">error</span>
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Name *</label>
                      <input
                        id="booking-name"
                        type="text"
                        required
                        className="input"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email *</label>
                      <input
                        id="booking-email"
                        type="email"
                        required
                        className="input"
                        placeholder="john@company.com"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Phone Number</label>
                    <input
                      id="booking-phone"
                      type="tel"
                      className="input"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Meeting Purpose</label>
                    <textarea
                      id="booking-purpose"
                      rows={3}
                      className="input resize-none"
                      placeholder="What would you like to discuss?"
                      value={form.purpose}
                      onChange={e => setForm({ ...form, purpose: e.target.value })}
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-accent-mint rounded-2xl p-4 flex items-center gap-4 text-sm">
                    <span className="material-symbols-outlined text-secondary">event_available</span>
                    <div>
                      <p className="font-bold text-on-surface">{format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedSlot}</p>
                      <p className="text-on-surface-variant">{hostInfo?.duration_minutes || 30} minute meeting with {hostInfo?.name}</p>
                    </div>
                  </div>

                  <button
                    id="confirm-booking"
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-full bg-secondary text-white font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 shadow-lg"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Confirm Booking
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </section>
        </div>
      </main>

      <ChatBot mode="guest" context={{ slug, hostName: hostInfo?.name }} />
    </div>
  )
}
