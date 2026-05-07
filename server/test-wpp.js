require('dotenv').config();
const { sendWhatsAppNotification } = require('./services/twilio');

const testPhone = process.argv[2];

if (!testPhone) {
  console.error('Please provide a phone number as an argument. Example: node test-wpp.js +919876543210');
  process.exit(1);
}

const testData = {
  guest_name: 'Test User',
  slot_date: '2026-05-07',
  slot_time: '10:00 AM',
  meet_link: 'https://meet.google.com/abc-defg-hij'
};

console.log(`🚀 Sending test WhatsApp notification to ${testPhone}...`);

sendWhatsAppNotification(testPhone, testData)
  .then(() => {
    console.log('✅ Test message triggered successfully! Check your phone.');
  })
  .catch((err) => {
    console.error('❌ Failed to send test message:', err.message);
  });
