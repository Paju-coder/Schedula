import { useState, useEffect } from 'react'
import SideNav from '../components/SideNav'
import { bookingsAPI } from '../lib/api'

export default function Bookings({ session, setSession }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('upcoming') // 'upcoming' or 'past'
  const userSlug = session?.user?.slug || ''

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await bookingsAPI.getAdmin()
        setBookings(data.bookings || [])
      } catch (err) {
        console.error('Failed to load bookings:', err)
        setError('Failed to load bookings. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return
    
    try {
      await bookingsAPI.cancel(id)
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b))
    } catch (err) {
      console.error('Failed to cancel:', err)
      alert('Failed to cancel booking.')
    }
  }

  // Filter bookings
  const now = new Date()
  
  const upcomingBookings = bookings.filter(b => {
    if (b.status === 'cancelled') return false
    const dateObj = new Date(`${b.slot_date}T${b.slot_time}`)
    return dateObj >= now
  })

  const pastBookings = bookings.filter(b => {
    const dateObj = new Date(`${b.slot_date}T${b.slot_time}`)
    return dateObj < now || b.status === 'cancelled'
  })

  const displayedBookings = filter === 'upcoming' ? upcomingBookings : pastBookings

  return (
    <div className="min-h-screen bg-surface flex font-sans">
      <SideNav active="bookings" userSlug={userSlug} setSession={setSession} />

      <main className="flex-1 ml-0 md:ml-64 p-6 md:p-10 pb-32">
        <div className="max-w-container mx-auto">
          {/* Header */}
          <header className="mb-10 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black text-primary tracking-tight">Bookings</h1>
              <p className="text-on-surface-variant mt-2">Manage your upcoming and past meetings.</p>
            </div>
          </header>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-8 border-b border-outline-variant/20 pb-4">
            <button 
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${filter === 'upcoming' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button 
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${filter === 'past' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
            >
              Past & Cancelled ({pastBookings.length})
            </button>
          </div>

          {error && (
            <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayedBookings.length === 0 ? (
            <div className="card p-12 rounded-2xl flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">event_busy</span>
              <h3 className="text-xl font-bold text-on-surface mb-2">No {filter} bookings</h3>
              <p className="text-on-surface-variant text-sm">When guests book time with you, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedBookings.map(booking => (
                <div key={booking._id} className="card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-lg transition-shadow border border-outline-variant/10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-secondary text-2xl">person</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                        {booking.guest_name}
                        {booking.status === 'cancelled' && (
                          <span className="bg-error/10 text-error text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-widest">Cancelled</span>
                        )}
                      </h3>
                      <div className="text-sm text-on-surface-variant mt-1 space-y-0.5">
                        <p className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">mail</span> {booking.guest_email}</p>
                        {booking.guest_phone && <p className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">phone</span> {booking.guest_phone}</p>}
                        {booking.purpose && <p className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">chat</span> {booking.purpose}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-3 min-w-[200px] border-t sm:border-t-0 sm:border-l border-outline-variant/10 pt-4 sm:pt-0 sm:pl-6">
                    <div className="bg-surface-container-low px-4 py-2 rounded-xl text-center sm:text-right w-full sm:w-auto">
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-0.5">Scheduled For</p>
                      <p className="font-bold text-primary">{new Date(booking.slot_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      <p className="text-on-surface font-medium">{booking.slot_time.substring(0, 5)}</p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {booking.meet_link && booking.status !== 'cancelled' && (
                        <a href={booking.meet_link} target="_blank" rel="noreferrer" className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 flex-1 justify-center sm:flex-none">
                          <span className="material-symbols-outlined text-[16px]">videocam</span> Join
                        </a>
                      )}
                      {filter === 'upcoming' && booking.status !== 'cancelled' && (
                        <button 
                          onClick={() => handleCancel(booking._id)}
                          className="border border-error/30 text-error hover:bg-error/10 text-xs py-1.5 px-3 rounded-full font-bold flex items-center gap-1.5 transition-colors flex-1 justify-center sm:flex-none"
                        >
                          <span className="material-symbols-outlined text-[16px]">cancel</span> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
