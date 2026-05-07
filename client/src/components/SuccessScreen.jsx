import { useEffect } from 'react'
import { format } from 'date-fns'

export default function SuccessScreen({ booking, host }) {
  useEffect(() => {
    // Load confetti from CDN
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'
    script.onload = () => {
      window.confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0069ff', '#00D4C8', '#8b5cf6']
      })
    }
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [])

  const copyMeetLink = () => {
    if (booking.meet_link) navigator.clipboard.writeText(booking.meet_link)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-16 font-sans">
      <div className="w-full max-w-lg animate-slide-up">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-accent-mint rounded-full flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-5xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-primary tracking-tight mb-3">You're booked! 🎉</h1>
          <p className="text-on-surface-variant text-lg">
            Your meeting with <strong>{host?.name}</strong> is confirmed.
            Check your email for details.
          </p>
        </div>

        {/* Booking card */}
        <div className="card p-8 rounded-2xl mb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-accent-mint rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary">calendar_today</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Date</p>
                <p className="font-bold text-on-surface">
                  {(() => {
                    if (!booking.slot_date) return '—'
                    try {
                      // If it's already an ISO string (from backend), new Date() handles it.
                      // If it's just YYYY-MM-DD, new Date() also handles it.
                      const date = new Date(booking.slot_date)
                      return format(date, 'EEEE, MMMM d, yyyy')
                    } catch (e) {
                      return '—'
                    }
                  })()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-accent-lavender rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">schedule</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Time</p>
                <p className="font-bold text-on-surface">{booking.slot_time?.slice(0, 5)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-accent-peach rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary">person</span>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Host</p>
                <p className="font-bold text-on-surface">{host?.name}</p>
              </div>
            </div>

            {booking.meet_link && (
              <div className="pt-4 border-t border-outline-variant/20">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-3">Google Meet Link</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-surface-container-low border border-surface-container rounded-xl px-4 py-3 font-mono text-sm text-secondary truncate">
                    {booking.meet_link}
                  </div>
                  <button
                    id="copy-meet-link"
                    onClick={copyMeetLink}
                    className="p-3 bg-primary text-white rounded-xl hover:opacity-90 active:scale-95 transition-all shrink-0"
                  >
                    <span className="material-symbols-outlined text-base">content_copy</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {booking.meet_link && (
            <a
              id="join-meeting-btn"
              href={booking.meet_link}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-secondary text-white font-bold py-4 rounded-full text-center hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">videocam</span>
              Join Meeting
            </a>
          )}
          <button
            id="book-another-btn"
            onClick={() => window.location.reload()}
            className="flex-1 btn-outline py-4 font-bold"
          >
            Book Another
          </button>
        </div>

        <p className="text-center text-xs text-on-surface-variant/50 mt-6">
          A confirmation email has been sent to your inbox. Powered by Schedula.
        </p>
      </div>
    </div>
  )
}
