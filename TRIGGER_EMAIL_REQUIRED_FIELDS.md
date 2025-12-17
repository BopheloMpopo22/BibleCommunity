# Trigger Email Extension - Required Fields Guide

## Required Fields to Fill

When installing Trigger Email extension, you need to fill these fields:

---

## 1. Firestore Instance Location (DATABASE_REGION)

### What is this?
This is the region where your Firestore database is located.

### How to Find Your Firestore Location:

#### Option A: Check in Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `bible-community-b5afa`
3. **Click "Firestore Database"** in left sidebar
4. **Look at the top** - you'll see your database location
5. **Common locations**:
   - `us-central` (United States - Central)
   - `us-east1` (United States - East)
   - `us-west1` (United States - West)
   - `europe-west1` (Europe - West)
   - `asia-southeast1` (Asia - Southeast)

#### Option B: Check Firestore Settings

1. In Firestore Database page
2. Click **"Settings"** (gear icon) or **"..."** menu
3. Look for **"Location"** or **"Region"**
4. Copy the location name

### What to Enter:

Enter the **location ID** (not the full region name). Common values:

- **If your location is "United States (us-central)":** Enter `us-central`
- **If your location is "United States (us-east1)":** Enter `us-east1`
- **If your location is "United States (us-west1)":** Enter `us-west1`
- **If your location is "Europe (europe-west1)":** Enter `europe-west1`
- **If you're not sure:** Use `us-central` (most common default)

### Example:
```
us-central
```

---

## 2. DEFAULT_FROM (Default From Address)

### What is this?
This is the email address that will appear as the "From" address in prayer reminder emails.

### What to Enter:

**Enter your Gmail address** (the same one you used in the SMTP URI):

```
your-email@gmail.com
```

**Example:**
```
john.doe@gmail.com
```

### Important Notes:

- ✅ **Must match** the email in your SMTP URI
- ✅ **Use the same Gmail** you used for the app password
- ✅ **Must be a valid email** address
- ✅ **Can be the same** as your Gmail account

### Example:
If your SMTP URI is:
```
smtps://john.doe@gmail.com:abcdefghijklmnop@smtp.gmail.com:465
```

Then DEFAULT_FROM should be:
```
john.doe@gmail.com
```

---

## Complete Example Configuration

Here's what your configuration should look like:

### SMTP Connection URI:
```
smtps://john.doe@gmail.com:abcdefghijklmnop@smtp.gmail.com:465
```

### Firestore Instance Location (DATABASE_REGION):
```
us-central
```

### DEFAULT_FROM:
```
john.doe@gmail.com
```

### Other Fields (usually optional/defaults):
- **Collection path**: `mail` (default - leave as is)
- **Default reply-to**: `john.doe@gmail.com` (optional - can leave empty)
- **Default from name**: `Bible Community` (optional - can leave empty)

---

## Step-by-Step Fill Out

1. ✅ **SMTP Connection URI**: Already filled (your Gmail SMTP URI)
2. ✅ **Firestore Instance Location**: 
   - Check Firebase Console → Firestore Database → Location
   - Enter location ID (e.g., `us-central`)
3. ✅ **DEFAULT_FROM**: 
   - Enter your Gmail address (same as in SMTP URI)
   - Example: `your-email@gmail.com`
4. ✅ **Click "Install"** or "Continue"

---

## Troubleshooting

### "Invalid region" Error

- Make sure you're using the **location ID**, not full name
- Common IDs: `us-central`, `us-east1`, `us-west1`, `europe-west1`
- If unsure, try `us-central` first

### "Invalid email" Error for DEFAULT_FROM

- Make sure it's a **valid email format**
- Must match the email in your SMTP URI
- Use the same Gmail address you used for app password

### Can't Find Firestore Location

1. Go to Firebase Console
2. Click **Firestore Database**
3. Look at the **top of the page** - location is usually displayed there
4. If not visible, check **Settings** → **General** tab
5. Or check **Firestore** → **Rules** tab (location sometimes shown there)

---

## Quick Reference

| Field | What to Enter | Example |
|-------|---------------|---------|
| **SMTP Connection URI** | Your Gmail SMTP URI | `smtps://email@gmail.com:password@smtp.gmail.com:465` |
| **Firestore Instance Location** | Your Firestore region ID | `us-central` |
| **DEFAULT_FROM** | Your Gmail address | `your-email@gmail.com` |

---

## After Filling All Fields

1. ✅ **Review all settings**
2. ✅ **Click "Install"** or "Continue"
3. ✅ **Wait 1-2 minutes** for installation
4. ✅ **You should see "Installation complete"**
5. ✅ **Proceed to deploy functions**: `firebase deploy --only functions`

