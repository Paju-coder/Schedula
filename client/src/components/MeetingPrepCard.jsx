import { useState } from 'react'

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function MeetingPrepCard({ booking }) {
  const [prep, setPrep] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const generatePrep = async () => {
    if (prep) {
      setExpanded(!expanded)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${SERVER_URL}/meeting-prep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking }),
      })
      const data = await response.json()
      setPrep(data.prep)
      setExpanded(true)
    } catch (err) {
      console.warn('Meeting prep failed:', err)
      // Fallback prep
      setPrep({
        agenda: ['Introductions & context', 'Discuss main topic', 'Q&A', 'Next steps & action items'],
        questions: ['What are the key priorities?', 'Any blockers or concerns?', 'What does success look like?'],
        tips: 'Be punctual, have your notes ready, listen actively, and summarize action items at the end.',
        duration_suggestion: '5 min intro → 20 min discussion → 5 min wrap-up'
      })
      setExpanded(true)
    }
    setLoading(false)
  }

  return (
    <div className="border border-primary/10 rounded-xl overflow-hidden transition-all">
      {/* Header bar — always visible */}
      <button
        onClick={generatePrep}
        disabled={loading}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition-all text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-primary text-base">auto_awesome</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-primary">
            {loading ? 'Generating AI Prep...' : prep ? 'AI Meeting Prep' : '✨ Generate AI Meeting Prep'}
          </p>
          <p className="text-[10px] text-on-surface-variant truncate">
            {booking.guest_name} · {booking.purpose || 'General meeting'}
          </p>
        </div>
        {prep && (
          <span className={`material-symbols-outlined text-on-surface-variant text-lg transition-transform ${expanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        )}
      </button>

      {/* Expanded prep content */}
      {expanded && prep && (
        <div className="px-4 pb-4 pt-2 space-y-4 animate-fade-in border-t border-primary/10">
          {/* Agenda */}
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">format_list_numbered</span>
              Suggested Agenda
            </p>
            <div className="space-y-1.5">
              {prep.agenda?.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-on-surface leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Questions */}
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">help</span>
              Key Questions to Ask
            </p>
            <div className="space-y-1.5">
              {prep.questions?.map((q, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-secondary text-xs mt-0.5">→</span>
                  <span className="text-xs text-on-surface leading-relaxed">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Time Breakdown */}
          <div className="bg-accent-lavender rounded-lg px-3 py-2">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">⏱ Time Breakdown</p>
            <p className="text-xs text-on-surface">{prep.duration_suggestion}</p>
          </div>

          {/* Tips */}
          <div className="bg-accent-mint rounded-lg px-3 py-2">
            <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1">💡 Pro Tips</p>
            <p className="text-xs text-on-surface leading-relaxed">{prep.tips}</p>
          </div>
        </div>
      )}
    </div>
  )
}
