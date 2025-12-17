# Test Email System - Manual Test

## Step-by-Step Instructions

### Step 1: Create the Collection

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select project**: `bible-community-b5afa`
3. **Click "Firestore Database"** in left sidebar
4. **Click "Start collection"** (or "+" button if you see it)

### Step 2: Enter Collection ID

When you see **"Collection ID"** field:
- **Type exactly**: `mail`
- **Click "Next"**

### Step 3: Create the First Document

Now you'll create the first document in the `mail` collection:

#### Option A: Auto-generate Document ID (Easier)
1. **Click "Auto-ID"** button (or leave Document ID empty)
2. **Add these fields**:

   **Field 1:**
   - **Field name**: `to`
   - **Type**: `string`
   - **Value**: `bophelompopo22@gmail.com`

   **Field 2:**
   - **Field name**: `message`
   - **Type**: `map` (click the dropdown, select "map")
   - **Then click "Add field" inside the map**:
     - **Field name**: `subject`
     - **Type**: `string`
     - **Value**: `Test Prayer Reminder`
   - **Click "Add field" again inside the map**:
     - **Field name**: `html`
     - **Type**: `string`
     - **Value**: `<h1>Test Email</h1><p>This is a test email from Trigger Email extension.</p>`

3. **Click "Save"**

#### Option B: Manual Document ID
1. **Document ID**: Leave empty (auto-generate) or type something like `test-email-1`
2. **Add the same fields as Option A**

### Step 4: Check Your Email

1. **Wait 10-30 seconds**
2. **Check your email inbox**: `bophelompopo22@gmail.com`
3. **Check spam folder** if you don't see it
4. **You should receive an email** with subject "Test Prayer Reminder"

---

## Visual Guide

```
Firestore Database
└── Collections
    └── mail (Collection ID - type "mail")
        └── [auto-generated-id] (Document)
            ├── to: "bophelompopo22@gmail.com"
            └── message (map)
                ├── subject: "Test Prayer Reminder"
                └── html: "<h1>Test Email</h1><p>...</p>"
```

---

## Troubleshooting

### If you don't see the email:
1. **Check spam folder**
2. **Wait 1-2 minutes** (sometimes there's a delay)
3. **Check Trigger Email extension logs**:
   - Go to **Extensions** → **Trigger Email** → **View logs**
   - Look for any errors

### If you see an error:
- Make sure SMTP is configured in Trigger Email extension
- Check that the `mail` collection name is exactly `mail` (lowercase)
- Verify the `to` field has a valid email address

---

## Success!

If you receive the email, the Trigger Email extension is working correctly! ✅

Next step: Deploy the Cloud Function so reminders are sent automatically.




