import { useState } from 'react'

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function FollowUpCard({ booking }) {
  const [followUp, setFollowUp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  // Only show for past bookings
  const isPast = new Date(`${booking.slot_date}T${booking.slot_time || '23:59'}`) < new Date()
  if (!isPast) return null

  const generateFollowUp = async () => {
    if (followUp) {
      setExpanded(!expanded)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${SERVER_URL}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking }),
      })
      const data = await response.json()
      setFollowUp(data.followUp)
      setExpanded(true)
    } catch (err) {
      console.warn('Follow-up generation failed:', err)
      setFollowUp({
        subject: `Follow-up: Meeting with ${booking.guest_name}`,
        body: `Hi ${booking.guest_name},\n\nThank you for taking the time to meet today. It was great connecting with you.\n\nI wanted to follow up on our discussion about ${booking.purpose || 'our recent meeting'}.\n\nPlease don't hesitate to reach out if you have any questions.\n\nBest regards`,
        action_items: ['Follow up on discussed topics', 'Share relevant documents', 'Schedule next meeting']
      })
      setExpanded(true)
    }
    setLoading(false)
  }

  const copyEmail = () => {
    if (!followUp) return
    const text = `Subject: ${followUp.subject}\n\n${followUp.body}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-amber-200 rounded-xl overflow-hidden transition-all bg-amber-50/30">
      <button
        onClick={generateFollowUp}
        disabled={loading}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50/60 transition-all text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          {loading ? (
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-amber-600 text-base">mail</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-700">
            {loading ? 'Generating follow-up...' : followUp ? 'AI Follow-up Email' : '📋 Generate Follow-up Email'}
          </p>
          <p className="text-[10px] text-on-surface-variant truncate">
            Meeting with {booking.guest_name} has ended
          </p>
        </div>
        {followUp && (
          <span className={`material-symbols-outlined text-on-surface-variant text-lg transition-transform ${expanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        )}
      </button>

      {expanded && followUp && (
        <div className="px-4 pb-4 pt-2 space-y-3 animate-fade-in border-t border-amber-200">
          {/* Subject */}
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Subject</p>
            <p className="text-sm font-semibold text-on-surface bg-white rounded-lg px-3 py-2 border border-amber-100">
              {followUp.subject}
            </p>
          </div>

          {/* Body */}
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Email Body</p>
            <div className="text-xs text-on-surface bg-white rounded-lg px-3 py-3 border border-amber-100 whitespace-pre-line leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar">
              {followUp.body}
            </div>
          </div>

          {/* Action Items */}
          {followUp.action_items && followUp.action_items.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Action Items</p>
              <div className="space-y-1">
                {followUp.action_items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-on-surface">
                    <span className="text-amber-500 mt-0.5">☐</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copy Button */}
          <button
            onClick={copyEmail}
            className="flex items-center gap-2 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-lg"
          >
            <span className="material-symbols-outlined text-sm">
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? 'Copied to clipboard!' : 'Copy email to clipboard'}
          </button>
        </div>
      )}
    </div>
  )
}
