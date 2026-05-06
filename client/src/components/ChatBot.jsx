import { useState, useRef, useEffect } from 'react'
import { chatAPI } from '../lib/api'

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

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hi! I'm Schedula AI. How can I help you today? 😊",
  time: Date.now(),
}

export default function ChatBot({ mode = 'guest', context = {} }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || typing) return
    setInput('')

    const userMsg = { role: 'user', content: text, time: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const res = await chatAPI.send(history, mode, context)
      const reply = res.data.reply || 'Sorry, I had trouble with that. Please try again!'
      setMessages(prev => [...prev, { role: 'assistant', content: reply, time: Date.now() }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again!',
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
    : ["Today's bookings", 'Block a date', 'Show stats']

  return (
    <>
      {/* Chat window */}
      {open && (
        <div
          id="chatbot-window"
          className="fixed bottom-24 right-6 z-[100] w-[340px] h-[480px] flex flex-col bg-white rounded-2xl shadow-float overflow-hidden border border-outline-variant/20 animate-slide-up"
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
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
                  onClick={() => { setInput(q); setTimeout(sendMessage, 50) }}
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
            <p className="text-[10px] text-on-surface-variant/30 text-center mt-2 font-mono">SECURE · POWERED BY GROQ LLAMA3</p>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        id="chatbot-toggle"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[99] w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-float hover:scale-110 active:scale-90 transition-all group"
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
