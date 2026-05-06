const express = require('express')
const router = express.Router()
const { sendWhatsAppNotification } = require('../services/whatsapp')
const { sendBookingEmail } = require('../services/mailer')

// POST /api/notifications/whatsapp
router.post('/whatsapp', async (req, res) => {
  const { phone, data } = req.body

  if (!phone || !data) {
    return res.status(400).json({ error: 'Phone and data are required' })
  }

  try {
    await sendWhatsAppNotification(phone, data)
    return res.status(200).json({ message: 'WhatsApp notification sent successfully' })
  } catch (err) {
    console.error('WhatsApp trigger error:', err)
    return res.status(500).json({ error: 'Failed to send WhatsApp notification' })
  }
})

// POST /api/notifications/email
router.post('/email', async (req, res) => {
  const { to, data } = req.body
  
  if (!to || !data) {
    return res.status(400).json({ error: 'To email and data are required' })
  }

  try {
    await sendBookingEmail(to, data)
    return res.status(200).json({ message: 'Email sent successfully' })
  } catch (err) {
    console.error('Email trigger error:', err)
    return res.status(500).json({ error: 'Failed to send email notification' })
  }
})

module.exports = router
