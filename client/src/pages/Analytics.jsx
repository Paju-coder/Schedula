import { useState, useEffect, useRef } from 'react'
import SideNav from '../components/SideNav'
import ChatBot from '../components/ChatBot'

// Simple bar chart component (no external lib needed)
function BarChart({ data, maxVal, color = '#0069ff' }) {
  return (
    <div className="flex items-end gap-1.5 h-40">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md transition-all duration-500 min-h-[4px]"
            style={{
              height: `${maxVal ? (item.value / maxVal) * 100 : 0}%`,
              background: `linear-gradient(to top, ${color}, ${color}88)`,
            }}
          />
          <span className="text-[10px] text-on-surface-variant font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// Heatmap component
function HeatMap({ data }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7am to 6pm

  const maxVal = Math.max(...Object.values(data), 1)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(${hours.length}, 1fr)` }}>
          <div />
          {hours.map(h => (
            <div key={h} className="text-[10px] text-on-surface-variant text-center font-mono">
              {h > 12 ? `${h - 12}p` : h === 12 ? '12p' : `${h}a`}
            </div>
          ))}
          {days.map((day, dayIdx) => (
            <>
              <div key={`label-${day}`} className="text-xs text-on-surface-variant font-medium flex items-center">{day}</div>
              {hours.map(hour => {
                const key = `${dayIdx}-${hour}`
                const val = data[key] || 0
                const intensity = maxVal ? val / maxVal : 0
                return (
                  <div
                    key={key}
                    className="aspect-square rounded-sm transition-colors cursor-default group relative"
                    style={{
                      background: intensity > 0
                        ? `rgba(0, 105, 255, ${0.1 + intensity * 0.8})`
                        : '#f3f5f9',
                    }}
                    title={`${day} ${hour}:00 — ${val} booking${val !== 1 ? 's' : ''}`}
                  />
                )
              })}
            </>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 mt-3">
          <span className="text-[10px] text-on-surface-variant">Less</span>
          {[0.1, 0.3, 0.5, 0.7, 1].map((o, i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(0, 105, 255, ${o})` }} />
          ))}
          <span className="text-[10px] text-on-surface-variant">More</span>
        </div>
      </div>
    </div>
  )
}

export default function Analytics({ session, setSession }) {
  const userSlug = session?.user?.slug || ''
  const userId = session?.user?.id || session?.user?._id
  const [bookings, setBookings] = useState([])
  const [period, setPeriod] = useState('all') // 'week', 'month', 'all'

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('schedula_bookings') || '[]')
    const mine = all.filter(b => b.host_id === userId)
    setBookings(mine)
  }, [userId])

  // Filter by period
  const filtered = bookings.filter(b => {
    if (period === 'all') return true
    const d = new Date(b.createdAt || b.slot_date)
    const now = new Date()
    if (period === 'week') return (now - d) < 7 * 86400000
    if (period === 'month') return (now - d) < 30 * 86400000
    return true
  })

  const confirmed = filtered.filter(b => b.status === 'confirmed').length
  const cancelled = filtered.filter(b => b.status === 'cancelled').length
  const total = filtered.length
  const conversionRate = total > 0 ? Math.round((confirmed / total) * 100) : 0

  // Bookings per day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const perDay = dayNames.map((label, i) => ({
    label,
    value: filtered.filter(b => new Date(b.slot_date + 'T00:00:00').getDay() === i).length,
  }))
  const maxPerDay = Math.max(...perDay.map(d => d.value), 1)

  // Bookings over last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    return {
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      value: filtered.filter(b => b.slot_date === dateStr).length,
    }
  })
  const maxLast7 = Math.max(...last7.map(d => d.value), 1)

  // Heatmap data
  const heatData = {}
  filtered.forEach(b => {
    if (!b.slot_time || !b.slot_date) return
    const dayIdx = new Date(b.slot_date + 'T00:00:00').getDay()
    const hour = parseInt(b.slot_time.split(':')[0], 10)
    const key = `${dayIdx}-${hour}`
    heatData[key] = (heatData[key] || 0) + 1
  })

  // Meeting type breakdown
  const typeCount = {}
  filtered.forEach(b => {
    const t = b.meeting_type || 'Google Meet'
    typeCount[t] = (typeCount[t] || 0) + 1
  })

  // Top guests
  const guestCount = {}
  filtered.forEach(b => {
    if (b.guest_name) guestCount[b.guest_name] = (guestCount[b.guest_name] || 0) + 1
  })
  const topGuests = Object.entries(guestCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-surface flex font-sans">
      <SideNav active="analytics" userSlug={userSlug} setSession={setSession} />

      <main className="flex-1 ml-0 md:ml-64 p-6 md:p-10 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-primary tracking-tight">Analytics</h1>
              <p className="text-on-surface-variant mt-1">Booking insights & patterns</p>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    period === p.id
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </header>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Bookings', value: total, icon: 'event', color: 'bg-accent-lavender', iconColor: 'text-primary' },
              { label: 'Confirmed', value: confirmed, icon: 'check_circle', color: 'bg-accent-mint', iconColor: 'text-green-600' },
              { label: 'Cancelled', value: cancelled, icon: 'cancel', color: 'bg-red-50', iconColor: 'text-red-500' },
              { label: 'Confirmation Rate', value: `${conversionRate}%`, icon: 'trending_up', color: 'bg-accent-peach', iconColor: 'text-amber-600' },
            ].map((s, i) => (
              <div key={i} className="card p-5 rounded-2xl flex flex-col gap-3">
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${s.iconColor}`}>{s.icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-black text-on-surface">{s.value}</p>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Bookings by Day */}
            <div className="card p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">bar_chart</span>
                Bookings by Day of Week
              </h3>
              <BarChart data={perDay} maxVal={maxPerDay} color="#0069ff" />
            </div>

            {/* Last 7 Days Trend */}
            <div className="card p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">trending_up</span>
                Last 7 Days
              </h3>
              <BarChart data={last7} maxVal={maxLast7} color="#0051cc" />
            </div>
          </div>

          {/* Heatmap */}
          <div className="card p-6 rounded-2xl mb-8">
            <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">grid_on</span>
              Booking Heatmap — When are you busiest?
            </h3>
            <HeatMap data={heatData} />
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meeting Types */}
            <div className="card p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">videocam</span>
                Meeting Types
              </h3>
              <div className="space-y-3">
                {Object.entries(typeCount).length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No bookings yet.</p>
                ) : (
                  Object.entries(typeCount).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-lg">
                          {type === 'Google Meet' ? 'videocam' : type === 'Zoom' ? 'video_chat' : 'call'}
                        </span>
                        <span className="text-sm font-medium text-on-surface">{type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Guests */}
            <div className="card p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">group</span>
                Top Guests
              </h3>
              <div className="space-y-3">
                {topGuests.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No bookings yet.</p>
                ) : (
                  topGuests.map(([name, count], i) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {i + 1}
                      </div>
                      <span className="text-sm font-medium text-on-surface flex-1">{name}</span>
                      <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                        {count} booking{count > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ChatBot mode="admin" context={{ userName: session?.user?.name }} />
    </div>
  )
}
