Bhai here's the full 24hr Hackathon PRD! 🔥

---

# 📋 SCHEDULA — 24HR HACKATHON PRD

**Name:** Schedula
**Tagline:** *One link. Zero back-and-forth.*
**Time:** 24 Hours
**Team:** 2 People

---

## ⚡ Hackathon Strategy

```
Don't build everything.
Build what JUDGES CAN SEE and DEMO well.

Priority = Working Demo > Perfect Code
```

---

## 👥 Team Split

| Person | Work |
|---|---|
| **You (Tanish)** | Frontend — React pages + UI + Chatbot |
| **Partner** | Backend — Node.js + Supabase + APIs |

---

## ⏱️ 24 Hour Timeline

```
Hour 0-2   → Setup everything (both)
Hour 2-6   → Core backend + Core frontend (parallel)
Hour 6-10  → Booking flow working end to end
Hour 10-14 → Notifications + Calendar + Meet link
Hour 14-18 → AI Chatbot + Dashboard + Polish
Hour 18-22 → Testing + Bug fixes + Demo prep
Hour 22-24 → PPT + Pitch practice + Final touches
```

---

## 🎯 What to Build (Priority Order)

### 🔴 P0 — Must Work (Hours 0-10)
```
1. Admin signup / login
2. Admin sets availability
3. Unique booking link generated
4. Guest opens link → sees slots
5. Guest books a slot
6. Booking saved in database
7. Admin dashboard shows bookings
```

### 🟡 P1 — Should Work (Hours 10-18)
```
8. Email confirmation on booking
9. Google Meet link auto-generated
10. WhatsApp notification (Twilio)
11. AI Chatbot widget (guest + admin)
12. Cancel booking from dashboard
```

### 🟢 P2 — If Time Allows (Hours 18-22)
```
13. Razorpay payment
14. AI pre-meeting brief
15. Reminder notifications
16. Analytics stats on dashboard
```

---

## 🛠️ Tech Stack (Minimal + Fast)

```
Frontend    →  React + Vite (fastest setup)
Styling     →  Tailwind CSS
Backend     →  Node.js + Express
Database    →  Supabase (instant setup)
Auth        →  Supabase Auth
Video       →  Google Meet link (hardcode format)
Calendar    →  Google Calendar API
WhatsApp    →  Twilio
Email       →  Nodemailer + Gmail SMTP
AI Chatbot  →  Groq API (llama3-8b)
Hosting     →  Vercel (frontend) + Railway (backend)
```

---

## 🗄️ Database — Only 4 Tables

```sql
-- Table 1: Users (Admin)
users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  phone text,
  slug text unique not null,
  bio text,
  created_at timestamp default now()
)

-- Table 2: Availability
availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  day_of_week integer,   -- 0=Sun to 6=Sat
  start_time time,
  end_time time,
  duration_minutes integer default 30,
  buffer_minutes integer default 0,
  is_active boolean default true
)

-- Table 3: Bookings
bookings (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references users(id),
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  purpose text,
  slot_date date not null,
  slot_time time not null,
  meet_link text,
  status text default 'confirmed',
  created_at timestamp default now()
)

-- Table 4: Blocked Dates
blocked_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  blocked_date date not null
)
```

---

## 📁 Folder Structure

```
schedula/
├── client/                      (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx      ← home page
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx    ← admin
│   │   │   ├── Availability.jsx ← admin settings
│   │   │   └── BookingPage.jsx  ← guest page
│   │   ├── components/
│   │   │   ├── ChatBot.jsx      ← AI widget
│   │   │   ├── SlotPicker.jsx
│   │   │   ├── BookingCard.jsx
│   │   │   └── Navbar.jsx
│   │   ├── lib/
│   │   │   ├── supabase.js
│   │   │   └── api.js
│   │   └── App.jsx
│
├── server/                      (Node.js)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── availability.js
│   │   ├── bookings.js
│   │   └── chat.js
│   ├── services/
│   │   ├── groq.js
│   │   ├── twilio.js
│   │   ├── mailer.js
│   │   └── calendar.js
│   ├── middleware/
│   │   └── auth.js
│   └── index.js
│
├── .env
└── README.md
```

---

## 🔌 API Routes

```
AUTH
POST   /api/auth/signup
POST   /api/auth/login

AVAILABILITY
GET    /api/availability/:slug     ← guest fetches free slots
POST   /api/availability           ← admin saves availability
POST   /api/availability/block     ← admin blocks a date

BOOKINGS
POST   /api/bookings               ← guest creates booking
GET    /api/bookings/admin         ← admin sees all bookings
PUT    /api/bookings/:id/cancel    ← cancel booking

CHATBOT
POST   /api/chat                   ← Groq chatbot
```

---

## 📄 Page by Page Breakdown

### Page 1 — Landing (/)
```
- Navbar: Logo left + Login/Signup right
- Hero: Big headline + subheading + CTA button
- 3 feature cards below
- Footer
- Simple, fast to build
```

### Page 2 — Signup (/signup)
```
- Name, Email, Password, Phone fields
- Slug auto-generated from name
  (e.g. "Tanish Bhatt" → "tanish-bhatt")
- Slug editable by user
- On submit → create user in Supabase
- Redirect to Availability setup
```

### Page 3 — Availability Setup (/availability)
```
- 7 day toggles (Mon-Sun)
- Each active day shows:
  → Start time input
  → End time input
- Meeting duration: 15/30/45/60 min pills
- Buffer time: 0/5/10/15 min pills
- Save button
- After save → show booking link with copy button
```

### Page 4 — Guest Booking Page (/:slug)
```
- Left: Admin profile (name, bio, duration badge)
- Right:
  Step 1: Pick a date from calendar
  Step 2: Pick a time slot
  Step 3: Fill form (name, email, phone, purpose)
  Step 4: Click Confirm
- On confirm:
  → Save booking to Supabase
  → Generate Meet link
  → Send email to both
  → Send WhatsApp to both
  → Show success screen
```

### Page 5 — Admin Dashboard (/dashboard)
```
- Top: Welcome message + your booking link (copy button)
- Stats row: Today / This week / Total / Cancelled
- Bookings list:
  → Guest name + time + purpose + Meet link button
  → Cancel button
- Sidebar nav: Dashboard / Availability / Settings
```

### Page 6 — AI Chatbot Widget (all pages)
```
- Floating bubble bottom right
- Opens as chat card
- Guest mode: help book/reschedule/cancel
- Admin mode: create links/block dates/view bookings
- Powered by Groq llama3-8b
```

---

## 🤖 Chatbot Code (Groq)

```javascript
// server/services/groq.js

import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const chat = async (messages, mode, context) => {
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
  `;

  const response = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages
    ],
    max_tokens: 200,
  });

  return response.choices[0].message.content;
};
```

---

## 🔔 Notifications Code

```javascript
// server/services/twilio.js
import twilio from "twilio";
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendWhatsApp = async (to, message) => {
  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`,
    body: message,
  });
};

// Booking confirmation message
export const bookingMessage = (guestName, date, time, meetLink) => `
✅ *Schedula — Booking Confirmed!*

Hey ${guestName}!
Your meeting is confirmed.

📅 Date: ${date}
⏰ Time: ${time}
🎥 Join: ${meetLink}

See you there! — Schedula
`;
```

---

## 📧 Email Template

```javascript
// server/services/mailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendBookingEmail = async (to, booking) => {
  await transporter.sendMail({
    from: `"Schedula" <${process.env.SMTP_USER}>`,
    to,
    subject: `✅ Meeting Confirmed — ${booking.slot_date} at ${booking.slot_time}`,
    html: `
      <div style="font-family: DM Sans, sans-serif; 
                  background: #0A0F1E; color: white; 
                  padding: 40px; border-radius: 12px;">
        <h2 style="color: #00D4C8;">Meeting Confirmed! ✅</h2>
        <p>Hey ${booking.guest_name},</p>
        <p>Your meeting is booked successfully.</p>
        <p>📅 <strong>Date:</strong> ${booking.slot_date}</p>
        <p>⏰ <strong>Time:</strong> ${booking.slot_time}</p>
        <p>🎥 <strong>Join Meeting:</strong> 
           <a href="${booking.meet_link}" 
              style="color: #00D4C8;">Click Here</a></p>
        <br/>
        <p style="color: #888;">Powered by Schedula</p>
      </div>
    `,
  });
};
```

---

## 🔑 Environment Variables

```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Groq
GROQ_API_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_app_password

# Razorpay (P2 only)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# App
PORT=5000
CLIENT_URL=http://localhost:5173
```

---

## 🎯 Slot Generation Logic

```javascript
// How to generate available slots from availability settings

export const generateSlots = (availability, existingBookings, date) => {
  const dayOfWeek = new Date(date).getDay();
  const dayAvailability = availability.find(
    a => a.day_of_week === dayOfWeek && a.is_active
  );

  if (!dayAvailability) return [];

  const slots = [];
  const { start_time, end_time,
          duration_minutes, buffer_minutes } = dayAvailability;

  let current = parseTime(start_time);
  const end = parseTime(end_time);
  const step = duration_minutes + buffer_minutes;

  while (current + duration_minutes <= end) {
    const timeStr = formatTime(current);
    const isBooked = existingBookings.some(
      b => b.slot_date === date && b.slot_time === timeStr
    );
    if (!isBooked) slots.push(timeStr);
    current += step;
  }

  return slots;
};
```

---

## 🎤 Demo Script (For Judges)

```
1. Open schedula.app
   → "This is Schedula — one link, zero back-and-forth"

2. Show signup → set availability → copy link
   → "Admin sets up in 2 minutes"

3. Open booking link in incognito
   → "This is what your client sees"

4. Pick a slot → fill form → confirm
   → "30 seconds to book a meeting"

5. Show WhatsApp notification received
   → "Both get instant WhatsApp confirmation"

6. Show Google Meet link in booking
   → "Video meeting auto-created, no Zoom needed"

7. Show admin dashboard — booking appears
   → "Admin sees everything in real time"

8. Open AI chatbot → type "book a meeting Friday 3pm"
   → "Guest can even book just by chatting"

9. Admin chatbot → "show me today's bookings"
   → "Admin manages everything by typing"

Total demo time: 3-4 minutes MAX
```

---

## ✅ Checklist Before Submission

```
□ Signup + Login works
□ Availability can be set
□ Booking link works
□ Guest can book a slot
□ Email confirmation sent
□ WhatsApp notification sent
□ Google Meet link generated
□ Admin dashboard shows bookings
□ AI Chatbot works (guest + admin)
□ Cancel booking works
□ Deployed on Vercel + Railway
□ Demo works on mobile
□ PPT ready
```

---

Bhai bas itka copy karo Antigravity mein aur shuru ho jao! 🚀

