const Groq = require('groq-sdk')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const chat = async (messages, mode, context) => {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY is missing or invalid in your .env file')
  }

  const systemPrompt = `You are Schedula AI — a smart, interactive scheduling assistant. 
Your goal is to be as helpful and efficient as a high-end human assistant.

BEHAVIORAL RULES:
1. DIRECT ACTION: If the user provides details for an action (setting a schedule or blocking a date), perform it IMMEDIATELY by including the action tag.
2. CONCISE: Keep responses to 1-2 sentences. 
3. ACTION PROTOCOL: Include the action tag on a NEW LINE at the VERY END of your message.

${mode === 'guest' ? `
GUEST MODE - Assisting a visitor booking with ${context?.hostName || 'a host'}.
` : `
ADMIN MODE - Assisting the host (${context?.userName || 'Admin'}).
- To Save Schedule, I need: Days, Time Range, Duration.
`}

ACTION TAGS:
- Save Schedule: [[ACTION:save_schedule:{"name":"Quick Chat","days":[1,2,3,4,5],"start":"09:00","end":"17:00","duration":30,"buffer":0}]]
  (days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
- Block Date: [[ACTION:block_date:{"date":"2026-05-25","reason":"Personal"}]]

Keep it snappy. No bullet points.`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // This is the most reliable model on Groq currently
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.6,
      max_tokens: 1024,
      top_p: 0.95,
    })

    let reply = response.choices[0].message.content || ''
    reply = reply.replace(/<think>[\s\S]*?<\/think>\s*/gi, '').trim()

    let action = null
    const actionMatch = reply.match(/\[\[ACTION:(\w+):(.*?)\]\]/s)
    if (actionMatch) {
      try {
        action = {
          type: actionMatch[1],
          data: JSON.parse(actionMatch[2])
        }
      } catch (e) {
        console.error('Action parse error:', e)
      }
      reply = reply.replace(/\[\[ACTION:.*?\]\]/s, '').trim()
    }

    return { reply, action }
  } catch (err) {
    console.error('Groq API Error:', err.message)
    throw err // Let the route handle it
  }
}

module.exports = { chat }
