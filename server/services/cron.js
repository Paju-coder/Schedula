const cron = require('node-cron');
const Booking = require('../models/Booking');
const { sendWhatsAppNotification } = require('./whatsapp');

/**
 * Start the cron scheduler to send meeting reminders exactly at the meeting time.
 */
function startCronScheduler() {
  console.log('⏰ Starting Cron Scheduler for meeting notifications...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // 1. Get current date strings
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const currentDateStr = `${year}-${month}-${day}`;

      // 2. Find ALL confirmed bookings for today that haven't had a reminder sent
      const todaysBookings = await Booking.find({
        slot_date: currentDateStr,
        status: 'confirmed',
        reminder_sent: { $ne: true }
      }).populate('host_id', 'name email slug phone');

      if (todaysBookings.length > 0) {
        for (const booking of todaysBookings) {
          // 3. Check if the meeting is within the next 15 minutes
          const [bHours, bMinutes] = booking.slot_time.split(':').map(Number);
          const bookingTimeInMins = bHours * 60 + bMinutes;
          const currentTimeInMins = now.getHours() * 60 + now.getMinutes();
          
          const minutesUntilMeeting = bookingTimeInMins - currentTimeInMins;

          // If the meeting is happening within the next 15 minutes, SEND IT!
          if (minutesUntilMeeting >= 0 && minutesUntilMeeting <= 15) {
            console.log(`[CRON] Meeting found in ${minutesUntilMeeting} mins. Sending automated reminders!`);
            
            booking.reminder_sent = true;
            await booking.save(); // Mark as sent so we don't spam!

            const clientData = {
              guest_name: booking.guest_name,
              slot_date: booking.slot_date,
              slot_time: booking.slot_time,
              meet_link: booking.meet_link
            };

            const adminData = {
              guest_name: `(ADMIN ALERT) ${booking.guest_name}`,
              slot_date: booking.slot_date,
              slot_time: booking.slot_time,
              meet_link: booking.meet_link
            };

          // 1. Send to Client/Guest
          if (booking.guest_phone) {
            console.log(`[CRON] Sending Client WhatsApp reminder to ${booking.guest_phone}`);
            sendWhatsAppNotification(booking.guest_phone, clientData).catch(err => {
              console.error(`[CRON] Failed to send Client WhatsApp:`, err.message);
            });
          }

          // 2. Send to Admin/Host
          // We use the host's phone from DB, or fallback to your hardcoded number for the presentation
          const adminPhone = booking.host_id.phone || '+917498453394';
          console.log(`[CRON] Sending Admin WhatsApp reminder to ${adminPhone}`);
          sendWhatsAppNotification(adminPhone, adminData).catch(err => {
            console.error(`[CRON] Failed to send Admin WhatsApp:`, err.message);
          });
        } // closes if(minutesUntilMeeting <= 15)
        } // closes for loop
      } // closes if(todaysBookings.length > 0)
    } catch (error) {
      console.error('[CRON] Error checking for upcoming meetings:', error);
    }
  });
}

module.exports = { startCronScheduler };
