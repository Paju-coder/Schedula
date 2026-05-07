import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { bookingsAPI } from '../lib/api'
import SideNav from '../components/SideNav'
import ChatBot from '../components/ChatBot'

const DEFAULT_EVENT = {
  id: 'default',
  name: '30 Minute Meeting',
  duration: 30,
  location: 'Google Meet',
  type: 'One-on-One',
  schedule: 'Weekdays, 9 am - 5 pm',
  color: '#8b5cf6',
}

export default function Dashboard({ session, setSession }) {
  const [copied, setCopied] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [eventTypes, setEventTypes] = useState([])
  const [recentBookings, setRecentBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const userName = session?.user?.name || 'Guest User'
  const userSlug = session?.user?.slug || ''

  // Load event types from localStorage
  useEffect(() => {
    const loadEvents = () => {
      const raw = localStorage.getItem('schedula_event_types')
      if (raw === null && !initialized) {
        // First time ever — show default event and save it
        setEventTypes([DEFAULT_EVENT])
        localStorage.setItem('schedula_event_types', JSON.stringify([DEFAULT_EVENT]))
      } else {
        setEventTypes(JSON.parse(raw || '[]'))
      }
      setInitialized(true)
    }
    loadEvents()

    // Listen for storage changes (from chatbot saving)
    const handler = () => loadEvents()
    window.addEventListener('storage', handler)
    // Also poll every 2s to catch same-tab changes
    const interval = setInterval(loadEvents, 2000)
    return () => {
      window.removeEventListener('storage', handler)
      clearInterval(interval)
    }
  }, [initialized])

  // Load recent bookings
  const fetchRecent = async () => {
    try {
      const { data } = await bookingsAPI.getAdmin()
      const sorted = (data.bookings || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
      setRecentBookings(sorted)
    } catch (err) {
      console.error('Failed to fetch recent bookings:', err)
    } finally {
      setBookingsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecent()
  }, [])

  const handleDeleteBooking = async (id) => {
    if (!confirm('Are you sure you want to delete this booking permanently?')) return
    try {
      await bookingsAPI.delete(id)
      setRecentBookings(prev => prev.filter(b => b._id !== id))
    } catch (err) {
      alert('Failed to delete booking')
      console.error(err)
    }
  }

  const copyLink = () => {
    let origin = window.location.origin
    if (origin.includes('localhost')) {
      origin = origin.replace('localhost', '10.85.163.205')
    }
    const link = `${origin}/${userSlug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-surface flex font-sans">
      <SideNav active="dashboard" userSlug={userSlug} setSession={setSession} />

      <main className="flex-1 ml-0 md:ml-64 bg-[#f8f9fa] min-h-screen">
        <header className="bg-white border-b border-outline-variant/20 px-8 py-4 flex justify-end items-center h-16">
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                 <span className="material-symbols-outlined text-on-surface-variant text-[18px]">person_add</span>
              </div>
              <div className="flex items-center gap-2 border border-outline-variant/30 rounded-full px-1 py-1 pr-3 cursor-pointer hover:bg-surface-container-lowest">
                 <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    {userName.charAt(0).toUpperCase()}
                 </div>
                 <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
              </div>
           </div>
        </header>

        <div className="p-8 max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-[28px] font-normal text-on-surface flex items-center gap-2">
                Scheduling
              </h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      await fetch('http://localhost:5000/api/notifications/whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          phone: '+917498453394',
                          data: {
                            guest_name: '(DEMO) Test User',
                            slot_date: new Date().toISOString().split('T')[0],
                            slot_time: 'Now',
                            meet_link: 'meet.google.com/demo'
                          }
                        })
                      });
                      alert('✅ Test WhatsApp sent!');
                    } catch (err) {
                      alert('Error sending test.');
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  Test WhatsApp
                </button>
                <Link to="/setup" className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Create
                </Link>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="mb-10 bg-white rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-on-surface flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-secondary text-[20px]">notifications_active</span>
                    Recent Bookings
                  </h3>
                  <div className="flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">Live</span>
                  </div>
                </div>
                <Link to="/bookings" className="text-primary text-xs font-bold hover:underline">View all</Link>
              </div>
              <div className="p-2">
                {bookingsLoading ? (
                  <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : recentBookings.length === 0 ? (
                  <p className="p-8 text-center text-on-surface-variant text-sm">No recent bookings yet.</p>
                ) : (
                  <div className="divide-y divide-outline-variant/10">
                    {recentBookings.map(b => {
                      const isNew = (new Date() - new Date(b.createdAt)) < 24 * 60 * 60 * 1000
                      return (
                        <div key={b._id} className="p-4 flex items-center justify-between hover:bg-surface-container-lowest transition-colors group rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold">
                              {b.guest_name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-on-surface text-sm">{b.guest_name}</span>
                                {isNew && <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">New</span>}
                              </div>
                              <p className="text-xs text-on-surface-variant">
                                {new Date(b.slot_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {b.slot_time.substring(0, 5)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md">
                              {b.meeting_type || 'Google Meet'}
                            </span>
                            <button 
                              onClick={() => handleDeleteBooking(b._id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete booking"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Event Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventTypes.map(evt => (
                <div key={evt.id} className="bg-white rounded-xl shadow-sm border border-outline-variant/10 p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: evt.color || '#8b5cf6' }}></div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="font-bold text-on-surface text-lg">{evt.name}</h2>
                      <p className="text-sm text-on-surface-variant">{evt.duration} min, {evt.location}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <button 
                       onClick={() => { copyLink(); setCopiedId(evt.id); setTimeout(() => setCopiedId(null), 2000); }}
                       className="text-primary text-sm font-bold flex items-center gap-1.5 hover:underline"
                    >
                      <span className="material-symbols-outlined text-[18px]">link</span>
                      {copiedId === evt.id ? 'Copied' : 'Copy link'}
                    </button>
                    <button 
                       onClick={() => {
                         if (confirm('Delete this event type?')) {
                           const updated = eventTypes.filter(e => e.id !== evt.id);
                           setEventTypes(updated);
                           localStorage.setItem('schedula_event_types', JSON.stringify(updated));
                         }
                       }}
                       className="text-on-surface-variant hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="w-full lg:w-[320px] flex-shrink-0">
            <div className="bg-white border border-outline-variant/10 rounded-2xl p-6 shadow-sm">
               <h3 className="font-bold text-on-surface mb-4">Account Overview</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">Active Events</span>
                    <span className="font-bold">{eventTypes.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">Total Bookings</span>
                    <span className="font-bold">{recentBookings.length}+</span>
                  </div>
               </div>
            </div>
          </aside>
        </div>
      </main>
      <ChatBot mode="admin" context={{ userName }} />
    </div>
  )
}
