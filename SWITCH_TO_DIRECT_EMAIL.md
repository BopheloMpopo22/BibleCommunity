# Switch to Direct Email Sending (Nodemailer)

## What Changed

I've updated your Cloud Function to send emails **directly via Gmail SMTP** instead of using the Trigger Email extension. This is more reliable and gives better error visibility.

## Benefits

✅ **More reliable** - Direct SMTP connection  
✅ **Better error visibility** - Errors show up in function logs  
✅ **No extension dependency** - Works independently  
✅ **Easier to debug** - Clear error messages

## Setup Steps

### Step 1: Install Nodemailer

```bash
cd functions
npm install nodemailer
```

### Step 2: Deploy the Function

```bash
cd ..
firebase deploy --only functions
```

**Note**: The function is already configured with your Gmail credentials. If you want to use environment variables instead (more secure), see Step 3.

### Step 3: (Optional) Use Environment Variables

For better security, you can set environment variables instead of hardcoding:

```bash
firebase functions:config:set email.user="bophelompopo22@gmail.com"
firebase functions:config:set email.password="YOUR_APP_PASSWORD"
```

Then update `functions/index.js` to use:

```javascript
const emailUser = functions.config().email?.user || "bophelompopo22@gmail.com";
const emailPassword = functions.config().email?.password || "nornokvwdbeektpa";
```

## How It Works Now

1. **Function runs every minute** → Checks for due reminders
2. **Finds matching reminders** → Based on time and recurrence
3. **Sends email directly** → Via Gmail SMTP using Nodemailer
4. **Logs results** → Success or error messages in function logs

## Testing

### Test 1: Create a Reminder

1. **Open your app** → **Prayer Time** screen
2. **Create a reminder** for **2-3 minutes from now**
3. **Set recurrence** to "Daily" or "One-time"
4. **Make sure it's Active**
5. **Save**

### Test 2: Check Function Logs

1. **Go to Firebase Console** → **Functions**
2. **Click on** `sendPrayerReminderEmails`
3. **Click "Logs" tab**
4. **Wait for the scheduled time**
5. **You should see**:
   - ✅ "Email sent successfully" - if it worked
   - ❌ Error message - if there's a problem

### Test 3: Check Your Email

- **Check inbox** for the reminder email
- **Check spam folder** if not in inbox

## Troubleshooting

### If emails don't send:

1. **Check function logs** for error messages
2. **Verify Gmail App Password** is correct
3. **Check Gmail security settings** - make sure "Less secure app access" is enabled OR use App Password
4. **Verify email address** in reminder is correct

### Common Errors:

- **"Invalid login"** → Gmail App Password is wrong
- **"Connection timeout"** → Check internet/firewall settings
- **"Authentication failed"** → Need to enable 2-Step Verification and create App Password

## What About Trigger Email Extension?

You can **keep it installed** (it won't interfere) or **uninstall it**:

1. Go to **Extensions** → **Trigger Email**
2. Click **"..."** → **"Uninstall"**

The new direct email method doesn't need it.

## Next Steps

1. **Install nodemailer**: `cd functions && npm install nodemailer`
2. **Deploy function**: `firebase deploy --only functions`
3. **Create a test reminder** in your app
4. **Check function logs** to see it working!

---

**This method is much more reliable and easier to debug!** 🎉
