import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import SideNav from '../components/SideNav'
import { bookingsAPI } from '../lib/api'
import ChatBot from '../components/ChatBot'

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function initials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

const avatarColors = ['bg-accent-mint', 'bg-accent-lavender', 'bg-accent-peach', 'bg-secondary-fixed']

export default function Dashboard({ session, setSession }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const userName = session?.user?.name || ''
  const userSlug = session?.user?.slug || ''

  useEffect(() => {
    const loadData = async () => {
      await fetchBookings()
      setLoading(false)
    }
    loadData()
  }, [])

  const fetchBookings = async () => {
    try {
      const res = await bookingsAPI.getAdmin()
      setBookings(res.data.bookings || [])
    } catch (err) {
      setError('Failed to load bookings')
    }
  }

  const cancelBooking = async (id) => {
    if (!confirm('Cancel this booking?')) return
    setCancellingId(id)
    try {
      await bookingsAPI.cancel(id)
      setBookings(b => b.map(bk => bk.id === id ? { ...bk, status: 'cancelled' } : bk))
    } catch {
      alert('Failed to cancel booking')
    }
    setCancellingId(null)
  }

  const copyLink = () => {
    const link = `${window.location.origin}/${userSlug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Stats
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayCount = bookings.filter(b => b.slot_date === today && b.status === 'confirmed').length
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekCount = bookings.filter(b => {
    const d = new Date(b.slot_date)
    return d >= weekStart && b.status === 'confirmed'
  }).length
  const totalCount = bookings.filter(b => b.status === 'confirmed').length
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length

  const stats = [
    { label: "Today's Meetings", value: String(todayCount).padStart(2, '0'), icon: 'today', color: 'bg-accent-mint', trend: '+12%', up: true },
    { label: 'This Week', value: weekCount, icon: 'date_range', color: 'bg-accent-lavender', trend: '+5%', up: true },
    { label: 'Total Bookings', value: totalCount, icon: 'all_inbox', color: 'bg-accent-peach', trend: '+24%', up: true },
    { label: 'Cancelled', value: cancelledCount, icon: 'event_busy', color: 'bg-error/10', iconColor: 'text-error', trend: '-2%', up: false },
  ]

  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed')
    .sort((a, b) => a.slot_date.localeCompare(b.slot_date) || a.slot_time.localeCompare(b.slot_time))
    .slice(0, 10)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex font-sans">
      <SideNav active="dashboard" userSlug={userSlug} setSession={setSession} />

      <main className="flex-1 ml-0 md:ml-64 p-6 md:p-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight">
              Good {getTimeOfDay()}, {userName?.split(' ')[0]} 👋
            </h1>
            <p className="text-on-surface-variant mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-3">
            {userSlug && (
              <button
                id="copy-dashboard-link"
                onClick={copyLink}
                className="flex items-center gap-2 bg-white border border-outline-variant/30 px-4 py-2.5 rounded-xl text-sm font-semibold text-primary hover:bg-surface-container-low transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-secondary text-base">
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Stats Row */}
          <section className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-5 mb-2">
            {stats.map((s, i) => (
              <div key={i} className="stat-card">
                <div className="flex justify-between items-start">
                  <div className={`p-2 ${s.color} rounded-xl`}>
                    <span className={`material-symbols-outlined ${s.iconColor || 'text-primary'}`}>{s.icon}</span>
                  </div>
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${s.up ? 'text-primary' : 'text-error'}`}>
                    {s.trend}
                    <span className="material-symbols-outlined text-xs">{s.up ? 'trending_up' : 'trending_down'}</span>
                  </span>
                </div>
                <div className="mt-5">
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">{s.label}</p>
                  <h2 className="text-4xl font-black text-on-surface mt-1 font-mono">{s.value}</h2>
                </div>
              </div>
            ))}
          </section>

          {/* Bookings Table */}
          <section className="col-span-12 lg:col-span-8">
            <div className="card rounded-2xl p-6 h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-primary">Upcoming Bookings</h3>
                <button
                  id="refresh-bookings"
                  onClick={fetchBookings}
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">refresh</span>
                  Refresh
                </button>
              </div>

              {error && (
                <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
              )}

              {upcomingBookings.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3">calendar_month</span>
                  <p className="text-on-surface-variant font-medium">No upcoming bookings yet</p>
                  <p className="text-sm text-on-surface-variant/60 mt-1">Share your link to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs text-on-surface-variant uppercase border-b border-outline-variant/20">
                        <th className="pb-3 font-bold tracking-wider">Client</th>
                        <th className="pb-3 font-bold tracking-wider">Date & Time</th>
                        <th className="pb-3 font-bold tracking-wider hidden sm:table-cell">Purpose</th>
                        <th className="pb-3 font-bold tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {upcomingBookings.map((bk, i) => (
                        <tr key={bk.id} className="hover:bg-surface-container-low transition-colors group">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full ${avatarColors[i % 4]} flex items-center justify-center font-bold text-sm text-on-surface`}>
                                {initials(bk.guest_name)}
                              </div>
                              <div>
                                <p className="font-semibold text-on-surface text-sm">{bk.guest_name}</p>
                                <p className="text-xs text-on-surface-variant">{bk.guest_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="font-mono text-xs text-primary bg-surface-container-high px-3 py-1.5 rounded-full w-fit">
                              {format(new Date(bk.slot_date + 'T00:00:00'), 'MMM d')} · {bk.slot_time?.slice(0, 5)}
                            </div>
                          </td>
                          <td className="py-4 hidden sm:table-cell">
                            <span className="text-sm text-on-surface-variant truncate max-w-[150px] block">
                              {bk.purpose || '—'}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex justify-end gap-2">
                              {bk.meet_link && (
                                <a
                                  id={`join-${bk.id}`}
                                  href={bk.meet_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-bold hover:bg-primary/5 transition-colors"
                                >
                                  Join
                                </a>
                              )}
                              <button
                                id={`cancel-${bk.id}`}
                                onClick={() => cancelBooking(bk.id)}
                                disabled={cancellingId === bk.id}
                                className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-bold hover:bg-error/10 hover:text-error hover:border-error transition-colors disabled:opacity-50"
                              >
                                {cancellingId === bk.id ? '...' : 'Cancel'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Mini Calendar / Info */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="card rounded-2xl p-6">
              <h4 className="font-bold text-primary mb-4">{format(new Date(), 'MMMM yyyy')}</h4>

              {/* Today's bookings summary */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Today's Schedule</p>
                {bookings
                  .filter(b => b.slot_date === today && b.status === 'confirmed')
                  .slice(0, 4)
                  .map(bk => (
                    <div key={bk.id} className="flex gap-3 pl-3 border-l-2 border-primary">
                      <div>
                        <p className="font-mono text-xs text-primary">{bk.slot_time?.slice(0, 5)}</p>
                        <p className="font-semibold text-sm text-on-surface">{bk.guest_name}</p>
                      </div>
                    </div>
                  ))}
                {bookings.filter(b => b.slot_date === today && b.status === 'confirmed').length === 0 && (
                  <p className="text-sm text-on-surface-variant/60">No meetings today</p>
                )}
              </div>

              {/* Quick actions */}
              <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Quick Actions</p>
                <a
                  href={`/${userSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors text-sm font-medium text-on-surface"
                >
                  <span className="material-symbols-outlined text-secondary text-base">open_in_new</span>
                  Preview Booking Page
                </a>
                <button
                  onClick={copyLink}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors text-sm font-medium text-on-surface text-left"
                >
                  <span className="material-symbols-outlined text-secondary text-base">share</span>
                  Share Link
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <ChatBot mode="admin" context={{ bookings, userName }} />
    </div>
  )
}
