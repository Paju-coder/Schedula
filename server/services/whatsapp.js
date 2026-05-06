const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. 'whatsapp:+14155238886'

let client;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

/**
 * Sends a WhatsApp notification for a booking
 * @param {string} to - Recipient phone number (e.g. '+1234567890')
 * @param {object} data - Booking data (guest_name, slot_date, slot_time, meet_link)
 */
async function sendWhatsAppNotification(to, data) {
  if (!client || !whatsappFrom) {
    console.warn('WhatsApp service not configured. Skipping notification.');
    return;
  }

  if (!to) {
    console.warn('No recipient phone number provided. Skipping WhatsApp notification.');
    return;
  }

  // Ensure 'to' is in 'whatsapp:+1234567890' format
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  try {
    const message = await client.messages.create({
      from: whatsappFrom,
      to: formattedTo,
      body: `Hello! Your Schedula booking is confirmed.\n\n👤 Guest: ${data.guest_name}\n📅 Date: ${data.slot_date}\n🕒 Time: ${data.slot_time}\n🔗 Meeting: ${data.meet_link}\n\nThank you for using Schedula!`,
    });

    console.log(`WhatsApp notification sent: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
    throw error;
  }
}

module.exports = { sendWhatsAppNotification };
