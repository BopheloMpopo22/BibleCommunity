# Check Trigger Email Extension Logs

## How to View Logs

The Trigger Email extension logs are in **Cloud Logging**, not in the extension UI.

### Method 1: Via Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select project**: `bible-community-b5afa`
3. **Click "Functions"** in left sidebar
4. **Look for functions starting with** `ext-firestore-send-email-`
5. **Click on one** → **"Logs"** tab

### Method 2: Via Google Cloud Console (Better)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select project**: `bible-community-b5afa`
3. **Click "Logging"** in left sidebar (or search "Logging")
4. **In the filter/search box**, type:
   ```
   resource.type="cloud_function"
   ```
5. **Or search for**: `ext-firestore-send-email`
6. **Look for recent logs** (last 5-10 minutes)

### Method 3: Direct Link

Try this direct link to Cloud Logging:
https://console.cloud.google.com/logs/query?project=bible-community-b5afa

Then search for: `ext-firestore-send-email`

---

## What to Look For in Logs

**Success indicators:**
- ✅ "Email sent successfully"
- ✅ "Processing email document"
- ✅ "SMTP connection established"

**Error indicators:**
- ❌ "SMTP connection failed"
- ❌ "Authentication failed"
- ❌ "Invalid email format"
- ❌ "Permission denied"

---

## Your Configuration Looks Good!

Based on what you shared:
- ✅ SMTP URI is configured: `smtps://bophelompopo22@gmail.com:nornokvwdbeektpa@smtp.gmail.com:465`
- ✅ Default FROM address: `bophelompopo22@gmail.com`
- ✅ Email collection: `mail`
- ✅ Document structure is correct

---

## Try This: Create a New Test Document

Sometimes the extension needs a fresh document to process:

1. **Go to Firestore** → **`mail` collection**
2. **Delete the old test document** (if you want)
3. **Create a NEW document**:
   - Click "Add document"
   - Document ID: Auto-generate
   - Add fields:
     - `to`: `bophelompopo22@gmail.com` (string)
     - `message`: (map)
       - `subject`: `New Test Email` (string)
       - `html`: `<h1>New Test</h1><p>Testing again.</p>` (string)
4. **Click "Save"**
5. **Wait 30-60 seconds**
6. **Check email inbox**

---

## Alternative: Check Extension Status

1. **Go to Extensions** → **Trigger Email**
2. **Look at the top** - does it show:
   - ✅ "Installed" or "Active"?
   - ❌ Any error messages?

---

## If Still Not Working

The issue might be:
1. **Gmail App Password expired** - Create a new one
2. **SMTP connection blocked** - Check Gmail security settings
3. **Extension not processing** - Check Cloud Logging for errors

Let me know what you see in the logs!

