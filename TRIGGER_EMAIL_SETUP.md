# Trigger Email Extension - Step-by-Step Configuration Guide

## Step 5: Configure SMTP Connection

After clicking "Install" on the Trigger Email extension, you'll see a configuration screen. Here's how to fill it out:

### Configuration Options Explained

#### 1. **SMTP Connection URI** (REQUIRED)

This is the connection string that tells Firebase how to connect to your email service.

**Choose ONE option below:**

---

### Option A: Gmail (Easiest for Testing)

#### Step 1: Get Gmail App Password

1. **Go to Google Account**: https://myaccount.google.com/
2. **Click "Security"** in the left sidebar
3. **Enable 2-Step Verification** (if not already enabled):
   - Click "2-Step Verification"
   - Follow the setup wizard
   - You'll need your phone for verification
4. **Go to App Passwords**:
   - After enabling 2-Step Verification, go back to Security
   - Click "App Passwords" (or go directly to: https://myaccount.google.com/apppasswords)
   - If you don't see "App Passwords", make sure 2-Step Verification is enabled
5. **Generate App Password**:
   - Select "Mail" as the app
   - Select "Other (Custom name)" as device
   - Type: "Firebase Trigger Email"
   - Click "Generate"
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

#### Step 2: Build SMTP URI

Format:

```
smtps://your-email@gmail.com:your-app-password@smtp.gmail.com:465
```

**Example** (replace with your actual email and password):

```
smtps://john.doe@gmail.com:abcd efgh ijkl mnop@smtp.gmail.com:465
```

**Important**: Remove spaces from the app password when putting it in the URI:

```
smtps://john.doe@gmail.com:abcdefghijklmnop@smtp.gmail.com:465
```

#### Step 3: Enter in Firebase

1. In the Trigger Email configuration screen
2. Find **"SMTP connection URI"** field
3. Paste your SMTP URI
4. Example: `smtps://your-email@gmail.com:abcdefghijklmnop@smtp.gmail.com:465`

---

### Option B: SendGrid (Recommended for Production)

#### Step 1: Sign Up for SendGrid

1. **Go to SendGrid**: https://sendgrid.com/
2. **Click "Start for Free"**
3. **Fill out the signup form**:
   - Email address
   - Password
   - Company name (can be your app name)
4. **Verify your email** (check your inbox)
5. **Complete setup** (they'll ask a few questions)

#### Step 2: Create API Key

1. **Login to SendGrid Dashboard**
2. **Go to Settings** → **API Keys** (left sidebar)
3. **Click "Create API Key"**
4. **Name it**: "Firebase Trigger Email"
5. **Select permissions**: "Full Access" (or "Mail Send" if you want restricted)
6. **Click "Create & View"**
7. **COPY THE API KEY** (you'll only see it once!)
   - It will look like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### Step 3: Build SMTP URI

Format:

```
smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465
```

**Example** (replace with your actual API key):

```
smtps://apikey:SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@smtp.sendgrid.net:465
```

#### Step 4: Enter in Firebase

1. In the Trigger Email configuration screen
2. Find **"SMTP connection URI"** field
3. Paste your SMTP URI
4. Example: `smtps://apikey:SG.your-actual-api-key@smtp.sendgrid.net:465`

---

### 2. **Email Documents** (Optional - Leave Defaults)

These settings are usually fine as default:

- **Location**: `mail` (default collection name)
- **SMTP password**: Leave empty (password is in URI)
- **Default from address**: Your email address (e.g., `noreply@yourdomain.com` or your Gmail)
- **Default reply-to address**: Your email address
- **Default from name**: "Bible Community" (or your app name)

### 3. **Complete Installation**

1. **Review all settings**
2. **Click "Install"** or "Continue" button
3. **Wait for installation** (takes 1-2 minutes)
4. **You'll see "Installation complete"** message

---

## Verification Steps

After installation:

### 1. Check Extension Status

1. Go to Firebase Console → **Extensions**
2. Find **"Trigger Email"** in the list
3. Status should be **"Active"** (green)

### 2. Test Email Sending

You can test by creating a document in Firestore:

1. Go to Firebase Console → **Firestore Database**
2. Click **"Start collection"** (if no collections exist)
3. **Collection ID**: `mail`
4. **Document ID**: Auto-generate
5. **Add fields**:
   - Field: `to` | Type: `string` | Value: `your-email@gmail.com`
   - Field: `message` | Type: `map`
     - Inside `message`:
       - Field: `subject` | Type: `string` | Value: `Test Email`
       - Field: `html` | Type: `string` | Value: `<p>This is a test email!</p>`
6. **Save**
7. **Check your email inbox** - you should receive the email within seconds!

### 3. Check Logs

1. Go to Firebase Console → **Extensions** → **Trigger Email**
2. Click **"View logs"**
3. You should see successful email sends

---

## Troubleshooting

### "Invalid SMTP credentials" Error

- **Check your SMTP URI format** - make sure it's exactly right
- **For Gmail**: Make sure you're using App Password, not your regular password
- **For SendGrid**: Make sure API key is correct (copy-paste, no spaces)
- **Remove spaces** from passwords/keys in the URI

### "Connection timeout" Error

- **Check your internet connection**
- **Verify SMTP server addresses**:
  - Gmail: `smtp.gmail.com:465`
  - SendGrid: `smtp.sendgrid.net:465`
- **Try port 587** instead of 465 (change `:465` to `:587` in URI)

### Emails Not Arriving

- **Check spam folder**
- **Verify email address** in Firestore document
- **Check Extension logs** for errors
- **Wait a few minutes** - sometimes there's a delay

### Gmail App Password Not Showing

- **Make sure 2-Step Verification is enabled**
- **Wait a few minutes** after enabling 2-Step Verification
- **Try refreshing** the App Passwords page
- **Use a different browser** if still not showing

---

## Quick Reference: SMTP URI Formats

### Gmail

```
smtps://your-email@gmail.com:your-16-char-app-password@smtp.gmail.com:465
```

### SendGrid

```
smtps://apikey:your-sendgrid-api-key@smtp.sendgrid.net:465
```

### Gmail Alternative (Port 587)

```
smtps://your-email@gmail.com:your-app-password@smtp.gmail.com:587
```

---

## Next Steps After Configuration

1. ✅ **Extension installed and configured**
2. ✅ **Test email sent successfully**
3. 🚀 **Deploy Firebase Functions**: `firebase deploy --only functions`
4. 🧪 **Test prayer reminder** in your app
5. 📧 **Check email inbox** for reminder

---

## Need Help?

If you're stuck:

1. Check Firebase Console → Extensions → Trigger Email → Logs
2. Verify SMTP URI format matches examples above
3. Try sending a test email via Firestore (see Verification Steps above)
4. Check your email spam folder
