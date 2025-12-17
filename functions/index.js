/**
 * Firebase Cloud Functions for Prayer Reminder Email Notifications
 *
 * This function sends email notifications for prayer reminders at scheduled times.
 *
 * SETUP INSTRUCTIONS:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Initialize functions: firebase init functions
 * 4. Install dependencies: cd functions && npm install
 * 5. Deploy: firebase deploy --only functions
 *
 * EMAIL SERVICE SETUP:
 * You need to configure an email service. Options:
 * - SendGrid (recommended): https://sendgrid.com
 * - Mailgun: https://www.mailgun.com
 * - Nodemailer with Gmail/SMTP
 *
 * For SendGrid:
 * 1. Sign up at sendgrid.com
 * 2. Create API key
 * 3. Set environment variable: firebase functions:config:set sendgrid.key="YOUR_API_KEY"
 * 4. Update sendEmail function below to use SendGrid
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onSchedule } = require("firebase-functions/v2/scheduler");

admin.initializeApp();

/**
 * Scheduled function that runs every minute to check for prayer reminders
 * and send email notifications
 */
exports.sendPrayerReminderEmails = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "UTC",
  },
  async (event) => {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentDayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const currentDateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    console.log(
      `Checking reminders at ${currentHour}:${currentMinute} UTC, Day: ${currentDayOfWeek}, Date: ${currentDateStr}`
    );

    try {
      const db = admin.firestore();
      const remindersRef = db.collection("prayer_reminders");

      // Get all active reminders
      const activeRemindersSnapshot = await remindersRef
        .where("isActive", "==", true)
        .get();

      if (activeRemindersSnapshot.empty) {
        console.log("No active reminders found");
        return;
      }

      const remindersToSend = [];

      activeRemindersSnapshot.forEach((doc) => {
        const reminder = { id: doc.id, ...doc.data() };
        const [reminderHour, reminderMinute] = reminder.time
          .split(":")
          .map(Number);

        // Convert reminder time to UTC based on user's timezone
        // Note: This is a simplified conversion. For production, use a proper timezone library
        const reminderTimeUTC = convertToUTC(
          reminderHour,
          reminderMinute,
          reminder.timezone || "UTC"
        );

        // Check if this reminder should be sent now
        if (
          reminderTimeUTC.hour === currentHour &&
          reminderTimeUTC.minute === currentMinute
        ) {
          // Check recurrence
          let shouldSend = false;

          if (reminder.recurrence === "daily") {
            shouldSend = true;
          } else if (reminder.recurrence === "weekly") {
            // Weekdays only (Monday-Friday = 1-5)
            shouldSend = currentDayOfWeek >= 1 && currentDayOfWeek <= 5;
          } else if (reminder.recurrence === "custom") {
            // Check if today is in the selected days
            // Convert: Firebase uses 0-6 (Sunday-Saturday), our app uses 0-6 (Sunday-Saturday)
            shouldSend =
              reminder.daysOfWeek?.includes(currentDayOfWeek) || false;
          } else if (reminder.recurrence === "none") {
            // One-time reminder - check if date matches
            shouldSend = reminder.date === currentDateStr;
          }

          // Check if we've already sent this reminder today
          const lastTriggered = reminder.lastTriggered?.toDate?.();
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (shouldSend && (!lastTriggered || lastTriggered < today)) {
            remindersToSend.push(reminder);
          }
        }
      });

      // Send emails for all matching reminders
      for (const reminder of remindersToSend) {
        try {
          await sendEmail(reminder);

          // Update lastTriggered timestamp
          await remindersRef.doc(reminder.id).update({
            lastTriggered: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(
            `Email sent for reminder ${reminder.id} to ${reminder.email}`
          );
        } catch (error) {
          console.error(
            `Error sending email for reminder ${reminder.id}:`,
            error
          );
        }
      }

      if (remindersToSend.length > 0) {
        console.log(`Sent ${remindersToSend.length} reminder email(s)`);
      }
    } catch (error) {
      console.error("Error processing reminders:", error);
      throw error;
    }
  }
);

/**
 * Convert local time to UTC
 * Simplified version - for production, use a library like 'date-fns-tz' or 'moment-timezone'
 */
function convertToUTC(hour, minute, timezone) {
  // This is a simplified conversion
  // For production, use: const { zonedTimeToUtc } = require('date-fns-tz');
  // For now, we'll assume reminders are stored in user's local timezone
  // and convert based on common timezone offsets

  // Get current date in the specified timezone
  const now = new Date();
  const localDate = new Date(
    now.toLocaleString("en-US", { timeZone: timezone })
  );
  const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));

  const offsetHours =
    (localDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);

  // Create a date object for the reminder time today in the user's timezone
  const reminderDate = new Date();
  reminderDate.setHours(hour, minute, 0, 0);

  // Adjust for timezone offset
  const utcTime = new Date(
    reminderDate.getTime() - offsetHours * 60 * 60 * 1000
  );

  return {
    hour: utcTime.getUTCHours(),
    minute: utcTime.getUTCMinutes(),
  };
}

/**
 * Send email notification
 *
 * OPTION 1: Using SendGrid (Recommended)
 * Install: npm install @sendgrid/mail
 * Configure: firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
 */
async function sendEmail(reminder) {
  // OPTION 1: SendGrid (Uncomment and configure)
  /*
  const sgMail = require('@sendgrid/mail');
  const sendgridKey = functions.config().sendgrid?.key;
  
  if (!sendgridKey) {
    throw new Error('SendGrid API key not configured');
  }
  
  sgMail.setApiKey(sendgridKey);
  
  const msg = {
    to: reminder.email,
    from: 'noreply@yourdomain.com', // Change to your verified sender email
    subject: reminder.title || 'Prayer Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">${reminder.title || 'Prayer Reminder'}</h2>
        <p style="font-size: 16px; color: #333;">
          It's time for your prayer reminder at ${reminder.time}.
        </p>
        <p style="font-size: 14px; color: #666;">
          Take a moment to connect with God and reflect on His word.
        </p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
          <p style="font-size: 12px; color: #999;">
            This is an automated reminder from Bible Community App.
          </p>
        </div>
      </div>
    `,
  };
  
  await sgMail.send(msg);
  */

  // Using Nodemailer with Gmail SMTP (Direct email sending - more reliable)
  const nodemailer = require('nodemailer');
  
  // Gmail SMTP configuration
  // Using environment variables for security (set via Firebase Functions config)
  const emailUser = process.env.EMAIL_USER || 'bophelompopo22@gmail.com';
  const emailPassword = process.env.EMAIL_PASSWORD || 'nornokvwdbeektpa';
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL for port 465
    auth: {
      user: emailUser,
      pass: emailPassword, // Gmail App Password
    },
  });
  
  const mailOptions = {
    from: `"Bible Community" <${emailUser}>`,
    to: reminder.email,
    subject: reminder.title || 'Prayer Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a365d; margin-bottom: 20px;">${reminder.title || 'Prayer Reminder'}</h2>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          It's time for your prayer reminder at <strong>${reminder.time}</strong>.
        </p>
        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          Take a moment to connect with God and reflect on His word.
        </p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
          <p style="font-size: 12px; color: #999;">
            This is an automated reminder from Bible Community App.
          </p>
        </div>
      </div>
    `,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
