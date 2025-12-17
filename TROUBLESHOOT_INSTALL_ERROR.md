# Troubleshooting Trigger Email Installation Error

## Your Configuration Looks Good

I can see your settings:
- ✅ Firestore Location: `africa-south1`
- ✅ SMTP URI: Configured correctly
- ✅ Default FROM: `bophelompopo22@gmail.com`
- ✅ Collection: `mail`

## Step 1: View Error Details

The error message says "View the error details above" - you need to see the actual error:

### How to Find Error Details:

1. **In the Firebase Console**, look **above** the configuration summary
2. **Scroll up** on the installation page
3. **Look for red error messages** or error details
4. **Check the browser console**:
   - Press `F12` or `Ctrl+Shift+I` (Windows)
   - Click "Console" tab
   - Look for red error messages

### Common Error Messages:

- **"SMTP connection failed"** - SMTP credentials issue
- **"Permission denied"** - Missing permissions
- **"API not enabled"** - Services not enabled
- **"Billing required"** - Billing account needed
- **"Invalid region"** - Location mismatch

---

## Step 2: Common Fixes

### Fix 1: Verify SMTP Connection

Your SMTP URI looks correct, but let's verify:

**Current SMTP URI:**
```
smtps://bophelompopo22@gmail.com:nornokvwdbeektpa@smtp.gmail.com:465
```

**Try these alternatives:**

#### Option A: Try Port 587 Instead of 465
```
smtps://bophelompopo22@gmail.com:nornokvwdbeektpa@smtp.gmail.com:587
```

#### Option B: Verify App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Make sure the app password `nornokvwdbeektpa` is still active
3. If not, generate a new one and update the SMTP URI

#### Option C: Try Without "smtps://" Prefix
```
smtp://bophelompopo22@gmail.com:nornokvwdbeektpa@smtp.gmail.com:465
```

---

### Fix 2: Check Firestore Location Match

Your Firestore is in `africa-south1`, but Cloud Functions might be in `us-central1`.

**Try this:**
1. **Change Cloud Functions location** to match Firestore:
   - In the installation screen, look for "Cloud Functions location"
   - Change from `us-central1` to `africa-south1`
   - Or try `us-central1` if that's where your functions should be

**Note**: Cloud Functions and Firestore don't have to be in the same region, but sometimes it helps.

---

### Fix 3: Enable Required APIs Again

Make sure all APIs are enabled:

1. Go to: https://console.cloud.google.com/apis/library?project=bible-community-b5afa
2. Search and enable:
   - **Artifact Registry API** - Should be enabled
   - **Secret Manager API** - Should be enabled
   - **Compute Engine API** - Should be enabled
   - **Cloud Functions API** - Enable this too
   - **Cloud Build API** - Enable this too

---

### Fix 4: Check Billing

Some services require billing to be enabled (even on free tier):

1. Go to: https://console.cloud.google.com/billing?project=bible-community-b5afa
2. Make sure a billing account is linked
3. **Note**: Free tier is fine - you won't be charged for basic usage

---

### Fix 5: Check Permissions

Make sure you have the right permissions:

1. Go to: https://console.cloud.google.com/iam-admin/iam?project=bible-community-b5afa
2. Find your email address
3. Make sure you have **Owner** or **Editor** role
4. If not, ask someone with Owner access to grant you permissions

---

## Step 3: Retry Installation

After trying fixes above:

1. **Go back to Firebase Console** → **Extensions**
2. **Click "Trigger Email"** extension
3. **Click "Install"** again
4. **Fill in the same configuration**:
   - Firestore Location: `africa-south1`
   - SMTP URI: Your Gmail SMTP URI
   - Default FROM: `bophelompopo22@gmail.com`
5. **Try changing Cloud Functions location** to `africa-south1` (to match Firestore)
6. **Click "Install"**

---

## Step 4: Alternative - Try Different SMTP Format

If Gmail continues to fail, try this format:

```
smtps://bophelompopo22@gmail.com:nornokvwdbeektpa@smtp.gmail.com:465
```

Or try with explicit TLS:
```
smtp://bophelompopo22@gmail.com:nornokvwdbeektpa@smtp.gmail.com:587
```

---

## Step 5: Check Extension Logs

After retrying, check logs:

1. Go to Firebase Console → **Extensions**
2. Click **"Trigger Email"** extension
3. Click **"View logs"** or **"Logs"** tab
4. Look for error messages

---

## What Error Details Did You See?

**Please share:**
1. The **exact error message** (scroll up on the installation page)
2. Any **red error text** above the configuration summary
3. Browser console errors (F12 → Console tab)

This will help me give you more specific guidance!

---

## Quick Checklist

- [ ] Check error details above configuration summary
- [ ] Verify SMTP app password is correct
- [ ] Try port 587 instead of 465
- [ ] Match Cloud Functions location to Firestore (`africa-south1`)
- [ ] Enable Cloud Functions API and Cloud Build API
- [ ] Check billing is enabled
- [ ] Verify you have Owner/Editor permissions
- [ ] Retry installation
- [ ] Check extension logs after retry

