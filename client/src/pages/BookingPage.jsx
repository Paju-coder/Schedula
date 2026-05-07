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
  const [meetingType, setMeetingType] = useState('Google Meet')
  const [form, setForm] = useState({ name: '', email: '', phone: '', purpose: '' })
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [booking, setBooking] = useState(null) // success state
  const [branding, setBranding] = useState(null)

  // Load host info
  useEffect(() => {
    const loadHost = async () => {
      try {
        const res = await availabilityAPI.getSlots(slug, format(new Date(), 'yyyy-MM-dd'))
        setHostInfo(res.data.host)
        // Load branding for this host
        if (res.data.host?.id) {
          const brandingData = JSON.parse(localStorage.getItem(`schedula_branding_${res.data.host.id}`) || '{}')
          if (brandingData.accentColor) setBranding(brandingData)
        }
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
        meeting_type: meetingType,
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
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center py-10 px-4 font-sans">
      {/* Unified Card Container */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-w-[1060px] w-full min-h-[550px] flex flex-col md:flex-row border border-outline-variant/20 relative">
        
        {/* Left: Host Info (Hidden on mobile when form is open to save space) */}
        <aside className={`p-8 md:w-[35%] border-b md:border-b-0 md:border-r border-outline-variant/20 flex flex-col items-start bg-white z-10 ${selectedSlot ? 'hidden md:flex' : 'flex'}`}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-black mb-4 shadow-sm"
            style={{ background: branding?.accentColor || '#0051cc' }}
          >
            {initials(hostInfo?.name)}
          </div>
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-1">{hostInfo?.name}</p>
          <h1 className="text-2xl font-black text-on-surface tracking-tight mb-2">Discovery Call</h1>
          {branding?.welcomeMsg && (
            <p className="text-sm text-on-surface-variant mb-2">{branding.welcomeMsg}</p>
          )}
          
          <div className="flex flex-col gap-3 w-full mt-2">
            <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-xl">schedule</span>
              {hostInfo?.duration_minutes || 30} min
            </div>
            <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-xl">videocam</span>
              Google Meet details provided upon confirmation
            </div>
            {selectedDate && selectedSlot && (
               <div className="flex items-start gap-3 text-sm text-on-surface font-semibold text-secondary mt-2 animate-fade-in">
                 <span className="material-symbols-outlined text-xl">event_available</span>
                 <span>
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}<br/>
                    {(() => {
                      const [h, m] = selectedSlot.split(':')
                      const hour = parseInt(h, 10)
                      const istTime = `${hour % 12 || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`
                      
                      // Smart timezone conversion
                      const guestTz = Intl.DateTimeFormat().resolvedOptions().timeZone
                      const isIST = guestTz === 'Asia/Kolkata' || guestTz === 'Asia/Calcutta'
                      
                      if (isIST) return `${istTime} (IST)`
                      
                      // Convert IST to guest's timezone
                      try {
                        const dateStr = format(selectedDate, 'yyyy-MM-dd')
                        const istDate = new Date(`${dateStr}T${selectedSlot}:00+05:30`) // IST is UTC+5:30
                        const guestTime = istDate.toLocaleTimeString('en-US', { 
                          hour: 'numeric', minute: '2-digit', hour12: true, timeZone: guestTz 
                        })
                        const tzAbbr = guestTz.split('/').pop().replace(/_/g, ' ')
                        return `${istTime} IST → ${guestTime} (${tzAbbr})`
                      } catch {
                        return `${istTime} (IST)`
                      }
                    })()}
                 </span>
               </div>
            )}
            <div className="flex items-center gap-3 text-sm text-on-surface-variant font-medium mt-4">
              <span className="material-symbols-outlined text-xl">public</span>
              {(() => {
                const guestTz = Intl.DateTimeFormat().resolvedOptions().timeZone
                const isIST = guestTz === 'Asia/Kolkata' || guestTz === 'Asia/Calcutta'
                const tzLabel = guestTz.split('/').pop().replace(/_/g, ' ')
                return isIST
                  ? 'Indian Standard Time'
                  : `Your timezone: ${tzLabel} · Host: IST`
              })()}
            </div>
          </div>
          
          {hostInfo?.bio && (
            <p className="text-on-surface-variant text-sm mt-6 leading-relaxed border-t border-outline-variant/20 pt-4 w-full">
              {hostInfo.bio}
            </p>
          )}
        </aside>

        {/* Right: Interactive Area */}
        <section className="flex-1 bg-white relative flex flex-col h-full min-h-[500px]">
          {selectedSlot ? (
            // Form Step
            <div className="absolute inset-0 bg-white p-8 animate-fade-in flex flex-col overflow-y-auto custom-scrollbar">
              <button 
                onClick={() => setSelectedSlot(null)}
                className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors mb-6 self-start active:scale-95"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
              
              <h2 className="text-xl font-bold text-on-surface mb-6">Enter Details</h2>
              
              {error && (
                <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 mb-5">
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-5 max-w-[450px]">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-on-surface">Name *</label>
                  <input
                    id="booking-name"
                    type="text"
                    required
                    className="w-full border border-outline-variant/40 rounded-lg px-4 py-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-on-surface">Email *</label>
                  <input
                    id="booking-email"
                    type="email"
                    required
                    className="w-full border border-outline-variant/40 rounded-lg px-4 py-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-on-surface flex justify-between">
                    <span>Phone Number (for WhatsApp)</span>
                    <span className="text-on-surface-variant font-normal text-xs">Optional</span>
                  </label>
                  <input
                    id="booking-phone"
                    type="tel"
                    placeholder="+919876543210"
                    className="w-full border border-outline-variant/40 rounded-lg px-4 py-3 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2.5 pt-2">
                  <label className="text-sm font-semibold text-on-surface">Choose Meeting Platform</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Google Meet', icon: 'videocam' },
                      { id: 'Zoom', icon: 'video_chat' },
                      { id: 'Phone call', icon: 'call' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setMeetingType(type.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          meetingType === type.id 
                            ? 'border-secondary bg-secondary/5 text-secondary' 
                            : 'border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{type.icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">{type.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  id="confirm-booking"
                  type="submit"
                  disabled={submitting}
                  className="w-fit px-6 py-3 rounded-full bg-secondary text-white font-bold hover:bg-secondary/90 transition-all disabled:opacity-50 mt-4"
                >
                  {submitting ? 'Confirming...' : 'Schedule Event'}
                </button>
              </form>
            </div>
          ) : (
            // Calendar & Slots Step
            <div className="flex flex-col md:flex-row flex-1 h-full relative p-6 md:p-8">
              {/* Calendar Container */}
              <div className={`transition-all duration-300 ease-out flex flex-col items-center ${selectedDate ? 'md:w-[55%] md:pr-6 md:border-r border-outline-variant/20' : 'w-full'}`}>
                <h2 className="text-xl font-bold text-on-surface mb-6 self-start">Select a Date & Time</h2>
                
                <div className="w-full max-w-[380px]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors text-primary bg-surface-container-low/50">
                        <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
                      </button>
                      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors text-primary bg-surface-container-low/50">
                        <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 mb-2">
                    {DAYS_SHORT.map(d => (
                      <div key={d} className="text-center text-xs font-bold text-on-surface-variant uppercase py-2">{d[0]}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                    {calDays.map((day, i) => {
                      if (!day) return <div key={`pad-${i}`} />
                      const isDisabled = isBefore(startOfDay(day), startOfDay(new Date())) || !isSameMonth(day, currentMonth)
                      const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                      const today = isToday(day)
                      const accentCol = branding?.accentColor || undefined

                      return (
                        <button
                          key={day.toISOString()}
                          disabled={isDisabled}
                          onClick={() => !isDisabled && setSelectedDate(day)}
                          className={`w-10 h-10 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                            isSelected 
                              ? 'text-white font-bold shadow-md transform scale-105' 
                              : isDisabled 
                                ? 'text-on-surface-variant/30 cursor-not-allowed' 
                                : today 
                                  ? 'font-bold hover:bg-secondary/20' 
                                  : 'text-primary hover:bg-surface-container-low'
                          }`}
                          style={isSelected ? { background: accentCol || '#0051cc' } : today ? { color: accentCol || '#0051cc', background: `${accentCol || '#0051cc'}15` } : {}}
                        >
                          {format(day, 'd')}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Time Slots Container */}
              {selectedDate && (
                <div className="md:w-[45%] md:pl-6 mt-8 md:mt-0 animate-slide-left flex flex-col h-[400px]">
                  <p className="text-on-surface mb-6 mt-[2px]">{format(selectedDate, 'EEEE, MMMM d')}</p>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {slotsLoading ? (
                       <div className="flex justify-center py-10">
                         <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                       </div>
                    ) : slots.length === 0 ? (
                       <p className="text-on-surface-variant text-sm mt-4">No available times.</p>
                    ) : (
                      slots.map(slot => {
                        const [h, m] = slot.split(':')
                        const hour = parseInt(h, 10)
                        const ampm = hour >= 12 ? 'pm' : 'am'
                        const formattedTime = `${hour % 12 || 12}:${m}${ampm}`

                        return (
                          <div key={slot} className="flex gap-2">
                             <button
                               onClick={() => setSelectedSlot(slot)}
                               className="flex-1 border border-secondary text-secondary font-bold py-3.5 rounded-lg hover:border-2 hover:bg-secondary hover:text-white transition-all text-center"
                             >
                               {formattedTime}
                             </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <ChatBot mode="guest" context={{ slug, hostName: hostInfo?.name }} />
    </div>
  )
}
