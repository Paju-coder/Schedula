import { useState, useRef, useEffect } from 'react'
import { chatAPI, availabilityAPI, bookingsAPI } from '../lib/api'

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}>
      <div className={isUser ? 'bubble-user' : 'bubble-ai'} style={{ maxWidth: '85%' }}>
        {msg.content}
      </div>
      <span className="text-[10px] text-on-surface-variant/40 font-mono px-1">
        {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-start animate-fade-in">
      <div className="bubble-ai w-fit">
        <div className="flex gap-1.5 items-center py-0.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  )
}

export default function ChatBot({ mode = 'guest', context = {} }) {
  console.log('🤖 ChatBot mounting in mode:', mode);
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hi! I'm Schedula AI. How can I help you today? 😊",
    time: Date.now(),
  }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    console.log('🤖 ChatBot open state:', open);
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const executeAction = async (action) => {
    console.log('🤖 Executing action:', action.type);
    if (!action) return

    try {
      if (action.type === 'save_schedule') {
        const { name, days, start, end, duration, buffer } = action.data
        const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        
        // Prepare schedule for API
        const schedule = DAYS.map((dayName, i) => ({
          day_of_week: i,
          day_name: dayName,
          is_active: days.includes(i),
          start_time: start || '09:00',
          end_time: end || '17:00',
        }))

        // Save availability to database
        await availabilityAPI.save({
          schedule,
          duration_minutes: duration || 30,
          buffer_minutes: buffer || 0,
        })

        // Create display labels
        const activeDays = [...days].sort((a, b) => a - b)
        const dayNames = activeDays.map(d => DAYS[d])
        let dayLabel = dayNames.join(', ')
        if (activeDays.length === 5 && activeDays.every((d, i) => d === i + 1)) dayLabel = 'Weekdays'
        if (activeDays.length === 7) dayLabel = 'Every day'

        const to12h = (t) => {
          if (!t) return ''
          const [h, m] = t.split(':').map(Number)
          const ampm = h >= 12 ? 'pm' : 'am'
          const hour = h % 12 || 12
          return `${hour}${m > 0 ? ':' + String(m).padStart(2, '0') : ''} ${ampm}`
        }

        const eventTypeName = name || `${duration || 30} Minute Meeting`
        const eventType = {
          id: Date.now().toString(),
          name: eventTypeName,
          duration: duration || 30,
          location: 'Google Meet',
          type: 'One-on-One',
          schedule: `${dayLabel}, ${to12h(start || '09:00')} - ${to12h(end || '17:00')}`,
          color: ['#8b5cf6', '#006bff', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
          createdAt: new Date().toISOString(),
        }

        // Save to local storage for Dashboard display
        const existing = JSON.parse(localStorage.getItem('schedula_event_types') || '[]')
        existing.push(eventType)
        localStorage.setItem('schedula_event_types', JSON.stringify(existing))

        // Notify user in chat
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ Saved! I've created the "${eventTypeName}" event type and updated your availability.`,
          time: Date.now()
        }])
        
      } else if (action.type === 'block_date') {
        const { date, reason } = action.data
        await availabilityAPI.blockDate({ date, reason: reason || '' })

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ Done! ${date} has been blocked on your calendar.`,
          time: Date.now()
        }])

      } else if (action.type === 'cancel_booking') {
        const { booking_id, guest_name } = action.data
        if (booking_id) {
          await bookingsAPI.cancel(booking_id)
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ Booking with ${guest_name || 'guest'} has been cancelled.`,
            time: Date.now()
          }])
        }

      } else if (action.type === 'reschedule_booking') {
        const { booking_id, guest_name, new_date, new_time } = action.data
        if (booking_id) {
          // Cancel old booking
          await bookingsAPI.cancel(booking_id)
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ Rescheduled! The old booking with ${guest_name || 'guest'} has been cancelled. They'll need to rebook at the new time (${new_date} at ${new_time}).`,
            time: Date.now()
          }])
        }
      }
    } catch (err) {
      console.error('Action execution failed:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I had some trouble saving that. Could you try doing it manually from the settings?',
        time: Date.now()
      }])
    }
  }

  const sendMessage = async (overrideText) => {
    const text = typeof overrideText === 'string' ? overrideText.trim() : input.trim()
    if (!text || typing) return
    
    if (!overrideText) setInput('')

    const userMsg = { role: 'user', content: text, time: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      
      // Inject booking context for admin mode (for reschedule/cancel actions)
      let enrichedContext = { ...context }
      if (mode === 'admin') {
        const allBookings = JSON.parse(localStorage.getItem('schedula_bookings') || '[]')
        const userId = JSON.parse(atob(localStorage.getItem('token') || 'e30='))?.id
        const myBookings = allBookings
          .filter(b => b.host_id === userId && b.status !== 'cancelled')
          .slice(0, 10)
        if (myBookings.length > 0) {
          enrichedContext.bookings = myBookings.map(b => 
            `- ID:${b._id} | ${b.guest_name} | ${b.slot_date} at ${b.slot_time} | ${b.meeting_type || 'Meet'}`
          ).join('\n')
        }
      }
      
      const res = await chatAPI.send(history, mode, enrichedContext)
      const reply = res.data.reply || 'Sorry, I had trouble with that. Please try again!'
      
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: Date.now() }])

      if (res.data.action) {
        await executeAction(res.data.action)
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please check your connection.',
        time: Date.now()
      }])
    }
    setTyping(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickReplies = mode === 'guest'
    ? ['Show available slots', 'How do I book?', 'Cancel my booking']
    : ["Today's bookings", 'Block a date', 'Reschedule a meeting', 'Show stats']

  return (
    <>
      {/* Chat window */}
      {open && (
        <div
          id="chatbot-window"
          className="fixed bottom-24 right-6 z-[9999] w-[340px] h-[480px] flex flex-col bg-white rounded-2xl shadow-float overflow-hidden border border-outline-variant/20 animate-slide-up"
        >
          {/* Header */}
          <div className="px-5 py-4 flex justify-between items-center bg-primary flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg">smart_toy</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-secondary-container rounded-full border-2 border-primary" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Schedula AI</p>
                <p className="text-white/50 text-[10px] uppercase tracking-wider font-mono">
                  {mode === 'admin' ? 'Admin Mode' : 'Guest Mode'} · Active
                </p>
              </div>
            </div>
            <button
              id="chatbot-close"
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap">
              {quickReplies.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs border border-outline-variant text-on-surface-variant rounded-full px-3 py-1.5 hover:border-secondary hover:text-secondary transition-colors whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-outline-variant/20 flex-shrink-0">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                id="chatbot-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message..."
                className="w-full bg-surface-container-low rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 text-on-surface"
              />
              <button
                id="chatbot-send"
                onClick={sendMessage}
                disabled={!input.trim() || typing}
                className="absolute right-3 text-secondary hover:scale-110 active:scale-90 transition-transform disabled:opacity-30"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              </button>
            </div>
            <p className="text-[10px] text-on-surface-variant/30 text-center mt-2 font-mono uppercase">Secure · AI Assistant</p>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        id="chatbot-toggle"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[9998] w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-float hover:scale-110 active:scale-90 transition-all group"
      >
        {open ? (
          <span className="material-symbols-outlined text-2xl">close</span>
        ) : (
          <>
            <span className="material-symbols-outlined text-2xl">chat_bubble</span>
            <span className="absolute right-full mr-3 px-3 py-1.5 bg-white text-primary border border-outline-variant/20 text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-card pointer-events-none">
              SCHEDULA AI
            </span>
          </>
        )}
      </button>
    </>
  )
}
