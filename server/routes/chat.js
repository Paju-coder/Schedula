const express = require('express')
const router = express.Router()
const { chat } = require('../services/groq')

// POST /api/chat
router.post('/', async (req, res) => {
  const { messages, mode, context } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array required' })
  }

  // Filter to only valid message roles for Groq
  const validMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }))

  try {
    const result = await chat(validMessages, mode || 'guest', context || {})
    // result is now { reply, action }
    return res.json({ reply: result.reply, action: result.action })
  } catch (err) {
    console.error('Groq chat error:', err)
    const fallbackReplies = {
      guest: "I'm here to help you book a meeting! Please pick a date from the calendar. 📅",
      admin: "I'm your Schedula assistant. Check your dashboard for today's bookings! 📊",
    }
    return res.json({ reply: fallbackReplies[mode] || "I'm here to help with scheduling!" })
  }
})

module.exports = router
