const twilio = require('twilio');

/**
 * Internal helper to get Twilio client and config
 */
function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;
  const smsFrom = process.env.TWILIO_PHONE_NUMBER;

  let client;
  if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
  }
  
  return { client, whatsappFrom, smsFrom };
}

/**
 * Sends a WhatsApp notification for a booking
 * @param {string} to - Recipient phone number (e.g. '+1234567890')
 * @param {object} data - Booking data (guest_name, slot_date, slot_time, meet_link)
 * @param {string} type - Notification type ('confirmation' or 'reminder')
 */
async function sendWhatsAppNotification(to, data, type = 'confirmation') {
  const { client, whatsappFrom } = getTwilioConfig();

  if (!client || !whatsappFrom) {
    console.warn('WhatsApp service not configured (missing SID, Token, or Number). Skipping.');
    return;
  }

  if (!to) {
    console.warn('No recipient phone number provided. Skipping WhatsApp notification.');
    return;
  }

  // Ensure 'to' is in 'whatsapp:+1234567890' format
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  let body;
  if (type === 'reminder') {
    body = `⏰ *Reminder:* Your Schedula booking is starting in 5 minutes!\n\n👤 Guest: ${data.guest_name}\n📅 Date: ${data.slot_date}\n🕒 Time: ${data.slot_time}\n💻 Platform: ${data.meeting_type || 'Google Meet'}\n🔗 Join: ${data.meet_link}\n\nSee you soon!`;
  } else {
    body = `✅ *Confirmed:* Your Schedula booking is set.\n\n👤 Guest: ${data.guest_name}\n📅 Date: ${data.slot_date}\n🕒 Time: ${data.slot_time}\n💻 Platform: ${data.meeting_type || 'Google Meet'}\n🔗 Meeting Link: ${data.meet_link}\n\nThank you for using Schedula!`;
  }

  try {
    const message = await client.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      body: body,
    });

    console.log(`WhatsApp ${type} notification sent: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`Failed to send WhatsApp ${type} notification:`, error);
    // Optional: could fallback to SMS here if needed
    throw error;
  }
}

/**
 * Sends a standard SMS notification (Alternative to WhatsApp)
 */
async function sendSMSNotification(to, body) {
  const { client, smsFrom } = getTwilioConfig();

  if (!client || !smsFrom) {
    console.warn('SMS service not configured (missing TWILIO_PHONE_NUMBER). Skipping.');
    return;
  }

  try {
    const message = await client.messages.create({
      from: smsFrom,
      to: to,
      body: body,
    });
    console.log(`SMS notification sent: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Failed to send SMS notification:', error);
    throw error;
  }
}

module.exports = { 
  sendWhatsAppNotification,
  sendSMSNotification 
};
