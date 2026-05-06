const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const sendBookingEmail = async (to, booking) => {
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
      
      <div style="space-y: 16px; margin-bottom: 32px;">
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9f9f9; border-radius: 12px; margin-bottom: 12px;">
          <span style="font-size: 20px;">👤</span>
          <div>
            <p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #4c4546; margin: 0 0 2px;">Guest</p>
            <p style="font-weight: 700; margin: 0; color: #000;">${booking.guest_name}</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9f9f9; border-radius: 12px; margin-bottom: 12px;">
          <span style="font-size: 20px;">📅</span>
          <div>
            <p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #4c4546; margin: 0 0 2px;">Date</p>
            <p style="font-weight: 700; margin: 0; color: #000;">${booking.slot_date}</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9f9f9; border-radius: 12px; margin-bottom: 12px;">
          <span style="font-size: 20px;">⏰</span>
          <div>
            <p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #4c4546; margin: 0 0 2px;">Time</p>
            <p style="font-weight: 700; margin: 0; color: #000;">${booking.slot_time}</p>
          </div>
        </div>
        ${booking.purpose ? `
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #f9f9f9; border-radius: 12px; margin-bottom: 12px;">
          <span style="font-size: 20px;">💬</span>
          <div>
            <p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #4c4546; margin: 0 0 2px;">Purpose</p>
            <p style="font-weight: 700; margin: 0; color: #000;">${booking.purpose}</p>
          </div>
        </div>
        ` : ''}
      </div>
      
      ${booking.meet_link ? `
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${booking.meet_link}" style="background: #a43c12; color: white; text-decoration: none; font-weight: 700; padding: 16px 32px; border-radius: 100px; display: inline-block; font-size: 16px;">
          🎥 Join Google Meet
        </a>
        <p style="font-size: 12px; color: #7e7576; margin-top: 12px; word-break: break-all;">${booking.meet_link}</p>
      </div>
      ` : ''}
      
      <div style="border-top: 1px solid #eeeeee; padding-top: 24px; text-align: center;">
        <p style="font-size: 12px; color: #7e7576; margin: 0;">Powered by <strong>Schedula</strong> · One link. Zero back-and-forth.</p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: `"Schedula" <${process.env.SMTP_USER}>`,
    to,
    subject: `✅ Meeting Confirmed — ${booking.slot_date} at ${booking.slot_time}`,
    html,
  })
}

module.exports = { sendBookingEmail }
