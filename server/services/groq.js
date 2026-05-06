const Groq = require('groq-sdk')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const chat = async (messages, mode, context) => {
  const systemPrompt = `
You are Schedula AI — a smart scheduling assistant.
Mode: ${mode} (guest or admin)

${mode === 'guest' ? `
GUEST MODE:
- Help user find available slots
- Help book, reschedule, cancel meetings
- Be friendly and short (1-2 lines max)
- Context: ${JSON.stringify(context)}
- When action needed, return JSON:
  {"action": "show_slots", "date": "2026-05-24"}
  {"action": "book", "time": "3:00 PM"}
  {"action": "cancel"}
` : `
ADMIN MODE:
- Help admin manage availability
- Show booking stats
- Cancel or reschedule meetings
- Context: ${JSON.stringify(context)}
- When action needed, return JSON:
  {"action": "block_date", "date": "2026-05-25"}
  {"action": "show_bookings"}
  {"action": "update_availability"}
`}

Always respond in 1-2 short lines. Be conversational. No bullet points.
  `

  const response = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    max_tokens: 200,
  })

  return response.choices[0].message.content
}

module.exports = { chat }
