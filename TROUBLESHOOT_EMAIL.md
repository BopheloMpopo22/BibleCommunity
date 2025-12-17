# Troubleshoot Email Not Sending

## Step 1: Check Trigger Email Extension Logs

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select project**: `bible-community-b5afa`
3. **Click "Extensions"** in left sidebar
4. **Click on "Trigger Email"** extension
5. **Click "View logs"** or **"Logs"** tab
6. **Look for**:
   - Any error messages
   - SMTP connection errors
   - Email processing status

**What to look for:**
- ✅ Success messages: "Email sent successfully"
- ❌ Error messages: "SMTP connection failed", "Authentication failed", etc.

---

## Step 2: Verify SMTP Configuration

1. **In Extensions page**, click on **"Trigger Email"**
2. **Click "..." menu** → **"Configure"** or **"View in Cloud Console"**
3. **Check these settings**:
   - **SMTP Connection URI**: Should be filled in
     - Format: `smtps://USERNAME:PASSWORD@smtp.gmail.com:465`
     - Example: `smtps://bophelompopo22@gmail.com:YOUR_APP_PASSWORD@smtp.gmail.com:465`
   - **Default FROM address**: `bophelompopo22@gmail.com`

**If SMTP URI is empty or incorrect:**
- You need to configure it with your Gmail App Password

---

## Step 3: Verify Document Structure

Go back to Firestore and check your document:

1. **Go to Firestore Database** → **`mail` collection**
2. **Click on your document**
3. **Verify it has**:
   - `to` field (string): `bophelompopo22@gmail.com`
   - `message` field (map) with:
     - `subject` (string)
     - `html` (string)

**Common mistakes:**
- ❌ Field name is `email` instead of `to`
- ❌ `message` is not a map (it's a string)
- ❌ Missing `subject` or `html` inside `message`

---

## Step 4: Check Gmail App Password

If SMTP is not configured, you need to create a Gmail App Password:

1. **Go to Google Account**: https://myaccount.google.com/
2. **Click "Security"** (left sidebar)
3. **Enable 2-Step Verification** (if not already enabled)
4. **Click "App passwords"** (under "Signing in to Google")
5. **Select app**: "Mail"
6. **Select device**: "Other (Custom name)" → Type "Firebase"
7. **Click "Generate"**
8. **Copy the 16-character password** (no spaces)
9. **Use it in SMTP URI**: `smtps://bophelompopo22@gmail.com:YOUR_16_CHAR_PASSWORD@smtp.gmail.com:465`

---

## Step 5: Check Spam Folder

Sometimes emails go to spam:
1. **Check spam/junk folder** in Gmail
2. **Mark as "Not spam"** if found there

---

## Step 6: Verify Extension is Installed

1. **Go to Extensions** page
2. **Verify "Trigger Email" shows**:
   - Status: "Installed" or "Active"
   - No error messages

**If extension shows errors:**
- Click on it to see error details
- May need to reconfigure SMTP

---

## Quick Test: Create Another Document

Try creating a simpler test document:

1. **Go to Firestore** → **`mail` collection**
2. **Click "Add document"**
3. **Document ID**: Auto-generate
4. **Add fields**:
   - `to`: `bophelompopo22@gmail.com` (string)
   - `message`: (map)
     - `subject`: `Simple Test` (string)
     - `text`: `This is a simple test email.` (string) - Use `text` instead of `html` for simplicity

**Note**: Trigger Email extension supports both `html` and `text` fields.

---

## Most Common Issues

1. **SMTP not configured** → Configure Gmail App Password
2. **Wrong document structure** → Use `to` and `message` fields
3. **Email in spam** → Check spam folder
4. **Extension not running** → Check extension logs for errors

---

## Next Steps

After checking logs and SMTP:
1. **If SMTP is missing**: Configure it with Gmail App Password
2. **If there are errors in logs**: Share the error message
3. **If everything looks correct**: Try creating another test document

Let me know what you find in the logs!

