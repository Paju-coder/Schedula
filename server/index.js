require('dotenv').config({ override: true })
const express = require('express')
const cors = require('cors')

// ============================================================
// MINIMAL Schedula Server — No MongoDB
// Only handles: Groq AI Chat, WhatsApp (Twilio), Email (Nodemailer)
// All data storage is handled client-side via localStorage
// ============================================================

const app = express()

app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(express.json())

// ─── GROQ AI CHAT ───────────────────────────────────────────
const Groq = require('groq-sdk')

let groqClient = null
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here') {
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  console.log('✅ Groq AI configured')
} else {
  console.warn('⚠️  GROQ_API_KEY not set — AI chat will use fallback replies')
}

app.post('/api/chat', async (req, res) => {
  const { messages, mode, context } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array required' })
  }

  if (!groqClient) {
    return res.json({
      reply: "AI is not configured. Please add GROQ_API_KEY to the server .env file. 🔑",
      error: "API_KEY_MISSING"
    })
  }

  // Filter to only valid message roles
  const validMessages = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }))

  const systemPrompt = `You are Schedula AI — a smart, interactive scheduling assistant. 
Your goal is to be as helpful and efficient as a high-end human assistant.

BEHAVIORAL RULES:
1. DIRECT ACTION: If the user provides details for an action, perform it IMMEDIATELY by including the action tag.
2. CONCISE: Keep responses to 1-2 sentences. 
3. ACTION PROTOCOL: Include the action tag on a NEW LINE at the VERY END of your message.

${mode === 'guest' ? `
GUEST MODE - Assisting a visitor booking with ${context?.hostName || 'a host'}.
` : `
ADMIN MODE - Assisting the host (${context?.userName || 'Admin'}).
- To Save Schedule: need Days, Time Range, Duration.
- To Reschedule: find the booking, cancel it, and suggest rebooking.
- To Cancel: find the booking and cancel it.
${context?.bookings ? `\nCURRENT BOOKINGS:\n${context.bookings}` : ''}
`}

ACTION TAGS (include on a NEW LINE at the END):
- Save Schedule: [[ACTION:save_schedule:{"name":"Quick Chat","days":[1,2,3,4,5],"start":"09:00","end":"17:00","duration":30,"buffer":0}]]
  (days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
- Block Date: [[ACTION:block_date:{"date":"2026-05-25","reason":"Personal"}]]
- Cancel Booking: [[ACTION:cancel_booking:{"booking_id":"abc123","guest_name":"John"}]]
- Reschedule Booking: [[ACTION:reschedule_booking:{"booking_id":"abc123","guest_name":"John","new_date":"2026-05-28","new_time":"14:00"}]]

Keep it snappy. No bullet points unless listing bookings.`

  try {
    const response = await groqClient.chat.completions.create({
      model: 'qwen/qwen3-32b',
      messages: [
        { role: 'system', content: systemPrompt },
        ...validMessages
      ],
      temperature: 0.6,
      max_completion_tokens: 4096,
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

    return res.json({ reply, action })
  } catch (err) {
    console.error('Groq API Error:', err.message)

    const fallbackReplies = {
      guest: "I'm here to help you book a meeting! Please pick a date from the calendar. 📅",
      admin: "I'm your Schedula assistant. Check your dashboard for today's bookings! 📊",
    }
    return res.json({ reply: fallbackReplies[mode] || "I'm here to help with scheduling!" })
  }
})

// ─── WHATSAPP (TWILIO) ──────────────────────────────────────
const twilio = require('twilio')

let twilioClient = null
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  console.log('✅ Twilio WhatsApp configured')
} else {
  console.warn('⚠️  Twilio not configured — WhatsApp will be skipped')
}

app.post('/api/notifications/whatsapp', async (req, res) => {
  const { phone, data, type } = req.body

  if (!phone || !data) {
    return res.status(400).json({ error: 'Phone and data are required' })
  }

  if (!twilioClient || !whatsappFrom) {
    return res.status(200).json({ message: 'WhatsApp not configured — skipped', skipped: true })
  }

  const formattedTo = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`

  let body
  if (type === 'reminder') {
    body = `⏰ *Reminder:* Your Schedula booking is starting soon!\n\n👤 Guest: ${data.guest_name}\n📅 Date: ${data.slot_date}\n🕒 Time: ${data.slot_time}\n💻 Platform: ${data.meeting_type || 'Google Meet'}\n🔗 Join: ${data.meet_link}\n\nSee you soon!`
  } else {
    body = `✅ *Confirmed:* Your Schedula booking is set.\n\n👤 Guest: ${data.guest_name}\n📅 Date: ${data.slot_date}\n🕒 Time: ${data.slot_time}\n💻 Platform: ${data.meeting_type || 'Google Meet'}\n🔗 Meeting Link: ${data.meet_link}\n\nThank you for using Schedula!`
  }

  try {
    const message = await twilioClient.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      body: body,
    })
    console.log(`WhatsApp sent: ${message.sid}`)
    return res.status(200).json({ message: 'WhatsApp notification sent successfully', sid: message.sid })
  } catch (err) {
    console.error('WhatsApp error:', err.message)
    return res.status(500).json({ error: 'Failed to send WhatsApp notification', detail: err.message })
  }
})

// ─── EMAIL (NODEMAILER) ─────────────────────────────────────
const nodemailer = require('nodemailer')

let emailTransporter = null

if (process.env.SMTP_USER && process.env.SMTP_USER !== 'yourgmail@gmail.com' &&
    process.env.SMTP_PASS && process.env.SMTP_PASS !== 'your_gmail_app_password') {
  emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  console.log('✅ Email (Nodemailer) configured')
} else {
  console.warn('⚠️  SMTP not configured — emails will be skipped')
}

app.post('/api/notifications/email', async (req, res) => {
  const { to, data } = req.body

  if (!to || !data) {
    return res.status(400).json({ error: 'To email and data are required' })
  }

  if (!emailTransporter) {
    return res.status(200).json({ message: 'Email not configured — skipped', skipped: true })
  }

  const html = `
    <div style="font-family: Inter, sans-serif; background: #ffffff; color: #1b1b1b; max-width: 560px; margin: 0 auto; padding: 40px; border-radius: 16px; border: 1px solid #eeeeee;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.02em; margin: 0;">Schedula</h1>
        <p style="color: #4c4546; margin: 4px 0 0;">One link. Zero back-and-forth.</p>
      </div>
      
      <div style="background: #E8F5E9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 8px;">✅</div>
        <h2 style="font-size: 24px; font-weight: 800; margin: 0 0 4px; color: #000;">Meeting Confirmed!</h2>
        <p style="color: #4c4546; margin: 0;">Your meeting has been successfully booked.</p>
      </div>
      
      <div style="margin-bottom: 32px;">
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9f9f9; border-radius: 12px; margin-bottom: 12px;">
          <span style="font-size: 20px;">👤</span>
          <div>
            <p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #4c4546; margin: 0 0 2px;">Guest</p>
            <p style="font-weight: 700; margin: 0; color: #000;">${data.guest_name}</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9f9f9; border-radius: 12px; margin-bottom: 12px;">
          <span style="font-size: 20px;">📅</span>
          <div>
            <p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #4c4546; margin: 0 0 2px;">Date</p>
            <p style="font-weight: 700; margin: 0; color: #000;">${data.slot_date}</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9f9f9; border-radius: 12px; margin-bottom: 12px;">
          <span style="font-size: 20px;">⏰</span>
          <div>
            <p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #4c4546; margin: 0 0 2px;">Time</p>
            <p style="font-weight: 700; margin: 0; color: #000;">${data.slot_time}</p>
          </div>
        </div>
        ${data.purpose ? `
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9f9f9; border-radius: 12px; margin-bottom: 12px;">
          <span style="font-size: 20px;">💬</span>
          <div>
            <p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #4c4546; margin: 0 0 2px;">Purpose</p>
            <p style="font-weight: 700; margin: 0; color: #000;">${data.purpose}</p>
          </div>
        </div>
        ` : ''}
      </div>
      
      ${data.meet_link ? `
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${data.meet_link}" style="background: #0069ff; color: white; text-decoration: none; font-weight: 700; padding: 16px 32px; border-radius: 100px; display: inline-block; font-size: 16px;">
          🎥 Join Meeting
        </a>
        <p style="font-size: 12px; color: #7e7576; margin-top: 12px; word-break: break-all;">${data.meet_link}</p>
      </div>
      ` : ''}
      
      <div style="border-top: 1px solid #eeeeee; padding-top: 24px; text-align: center;">
        <p style="font-size: 12px; color: #7e7576; margin: 0;">Powered by <strong>Schedula</strong> · One link. Zero back-and-forth.</p>
      </div>
    </div>
  `

  try {
    await emailTransporter.sendMail({
      from: `"Schedula" <${process.env.SMTP_USER}>`,
      to,
      subject: `✅ Meeting Confirmed — ${data.slot_date} at ${data.slot_time}`,
      html,
    })
    console.log(`Email sent to ${to}`)
    return res.status(200).json({ message: 'Email sent successfully' })
  } catch (err) {
    console.error('Email error:', err.message)
    return res.status(500).json({ error: 'Failed to send email', detail: err.message })
  }
})

// ─── AI MEETING PREP ────────────────────────────────────────
app.post('/api/meeting-prep', async (req, res) => {
  const { booking } = req.body

  if (!booking) {
    return res.status(400).json({ error: 'Booking data required' })
  }

  if (!groqClient) {
    return res.json({
      prep: {
        agenda: ['Introductions & rapport building', 'Discuss main topic', 'Next steps & action items'],
        questions: ['What are your key goals?', 'What challenges are you facing?', 'What timeline are you working with?'],
        tips: 'Be prepared, listen actively, and take notes.',
        duration_suggestion: '5 min intro → 20 min discussion → 5 min wrap-up'
      }
    })
  }

  try {
    const response = await groqClient.chat.completions.create({
      model: 'qwen/qwen3-32b',
      messages: [
        {
          role: 'system',
          content: `You are a meeting preparation assistant. Given booking details, generate a concise meeting prep briefing. Return ONLY valid JSON with this exact structure:
{
  "agenda": ["item1", "item2", "item3", "item4"],
  "questions": ["question1", "question2", "question3"],
  "tips": "One paragraph of tips",
  "duration_suggestion": "Time breakdown suggestion"
}
Keep each item to one sentence. Be practical and specific based on the purpose.`
        },
        {
          role: 'user',
          content: `Prepare a meeting briefing for:
- Guest: ${booking.guest_name}
- Purpose: ${booking.purpose || 'General meeting'}
- Duration: ${booking.duration || 30} minutes
- Date: ${booking.slot_date}
- Time: ${booking.slot_time}
- Platform: ${booking.meeting_type || 'Google Meet'}`
        }
      ],
      temperature: 0.5,
      max_completion_tokens: 1024,
      top_p: 0.9,
    })

    let content = response.choices[0].message.content || ''
    content = content.replace(/<think>[\s\S]*?<\/think>\s*/gi, '').trim()

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const prep = JSON.parse(jsonMatch[0])
      return res.json({ prep })
    }

    return res.json({
      prep: {
        agenda: ['Introductions', 'Discuss agenda', 'Q&A', 'Next steps'],
        questions: ['What are your priorities?', 'Any blockers?', 'Timeline expectations?'],
        tips: 'Stay focused and keep the conversation productive.',
        duration_suggestion: `${Math.round((booking.duration || 30) * 0.15)} min intro → ${Math.round((booking.duration || 30) * 0.7)} min core → ${Math.round((booking.duration || 30) * 0.15)} min wrap`
      }
    })
  } catch (err) {
    console.error('Meeting prep error:', err.message)
    return res.json({
      prep: {
        agenda: ['Introductions & context', 'Main discussion points', 'Action items & follow-ups'],
        questions: ['What outcome do you want?', 'Any preparation needed?', 'What are the next steps?'],
        tips: 'Be punctual, have your notes ready, and actively listen.',
        duration_suggestion: '5 min intro → 20 min discussion → 5 min wrap-up'
      }
    })
  }
})

// ─── POST-MEETING AI FOLLOW-UP ──────────────────────────────
app.post('/api/follow-up', async (req, res) => {
  const { booking } = req.body

  if (!booking) {
    return res.status(400).json({ error: 'Booking data required' })
  }

  const fallback = {
    subject: `Follow-up: Meeting with ${booking.guest_name}`,
    body: `Hi ${booking.guest_name},\n\nThank you for taking the time to meet today. It was great connecting with you.\n\nHere's a quick summary of what we discussed:\n• [Key point 1]\n• [Key point 2]\n• [Key point 3]\n\nNext Steps:\n1. [Action item 1]\n2. [Action item 2]\n\nPlease don't hesitate to reach out if you have any questions.\n\nBest regards`,
    action_items: ['Follow up on discussed topics', 'Share relevant documents', 'Schedule next meeting if needed']
  }

  if (!groqClient) {
    return res.json({ followUp: fallback })
  }

  try {
    const response = await groqClient.chat.completions.create({
      model: 'qwen/qwen3-32b',
      messages: [
        {
          role: 'system',
          content: `You are a professional email writer. Generate a follow-up email after a meeting. Return ONLY valid JSON:
{
  "subject": "Email subject line",
  "body": "Full email body with line breaks using \\n",
  "action_items": ["item1", "item2", "item3"]
}
Be professional, warm, and concise. Use the meeting purpose to make it specific.`
        },
        {
          role: 'user',
          content: `Generate a follow-up email for a meeting that just ended:
- Guest: ${booking.guest_name}
- Email: ${booking.guest_email || 'N/A'}
- Purpose: ${booking.purpose || 'General discussion'}
- Duration: ${booking.duration || 30} minutes
- Platform: ${booking.meeting_type || 'Google Meet'}`
        }
      ],
      temperature: 0.5,
      max_completion_tokens: 1024,
      top_p: 0.9,
    })

    let content = response.choices[0].message.content || ''
    content = content.replace(/<think>[\s\S]*?<\/think>\s*/gi, '').trim()

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const followUp = JSON.parse(jsonMatch[0])
      return res.json({ followUp })
    }

    return res.json({ followUp: fallback })
  } catch (err) {
    console.error('Follow-up error:', err.message)
    return res.json({ followUp: fallback })
  }
})

// ─── HEALTH CHECK ────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  app: 'Schedula API (No MongoDB)',
  services: {
    groq: !!groqClient,
    whatsapp: !!twilioClient,
    email: !!emailTransporter,
  }
}))

// ─── START ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Schedula API running on port ${PORT} (No MongoDB!)`)
  console.log(`   Health: http://localhost:${PORT}/health\n`)
})
