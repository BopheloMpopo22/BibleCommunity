# Fix Eventarc Permission Error

## The Error Explained

The error says:

> **"Permission denied while using the Eventarc Service Agent"**

This means the Eventarc Service Agent doesn't have the right permissions to create triggers for the extension.

## Solution: Grant Eventarc Service Agent Permissions

### Step 1: Enable Eventarc API

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select project**: `bible-community-b5afa`
3. **Go to APIs & Services**: https://console.cloud.google.com/apis/library?project=bible-community-b5afa
4. **Search for**: "Eventarc API"
5. **Click "Enable"**
6. **Wait 1-2 minutes** for it to enable

### Step 2: Grant Eventarc Service Agent Role

1. **Go to IAM & Admin**: https://console.cloud.google.com/iam-admin/iam?project=bible-community-b5afa

2. **Find the Eventarc Service Agent**:

   - Look for an account that looks like: `service-XXXXXXXXX@gcp-sa-eventarc.iam.gserviceaccount.com`
   - Or search for "eventarc" in the filter box
   - If you don't see it, proceed to Step 3 to add it

3. **Grant Eventarc Service Agent Role**:
   - Click **"Grant Access"** or **"Add"** button (top of page)
   - In "New principals" field, enter:
     ```
     service-PROJECT_NUMBER@gcp-sa-eventarc.iam.gserviceaccount.com
     ```
   - Replace `PROJECT_NUMBER` with your project number (see below how to find it)
   - In "Select a role" dropdown, search for and select:
     ```
     Eventarc Service Agent
     ```
   - Click **"Save"**

### Step 3: Find Your Project Number

**Option A: From Firebase Console**

1. Go to Firebase Console → Project Settings (gear icon)
2. Look for "Project number" - it's a long number like `256389727019`

**Option B: From Google Cloud Console**

1. Go to: https://console.cloud.google.com/home/dashboard?project=bible-community-b5afa
2. Look at the project info card - Project number is shown there

**Option C: From Your Firebase Config**
Looking at your `config/firebase.js`, your project number might be: `256389727019`

### Step 4: Alternative - Use Firebase CLI (Easier)

If the above is confusing, use this command:

```bash
# Get your project number first
firebase projects:list

# Then grant the role (replace PROJECT_NUMBER with actual number)
gcloud projects add-iam-policy-binding bible-community-b5afa \
  --member="serviceAccount:service-PROJECT_NUMBER@gcp-sa-eventarc.iam.gserviceaccount.com" \
  --role="roles/eventarc.serviceAgent"
```

**Or use this simpler approach:**

```bash
# This will automatically grant the role
gcloud projects add-iam-policy-binding bible-community-b5afa \
  --member="serviceAccount:service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com" \
  --role="roles/eventarc.serviceAgent"
```

### Step 5: Wait and Retry

1. **Wait 2-3 minutes** for permissions to propagate
2. **Go back to Firebase Console** → **Extensions**
3. **Click "Trigger Email"** extension
4. **Click "Install"** again
5. **Use the same configuration**:
   - Firestore Location: `africa-south1`
   - SMTP URI: Your Gmail SMTP URI
   - Default FROM: `bophelompopo22@gmail.com`
6. **Click "Install"**

---

## Quick Fix Using Firebase Console (Easiest)

### Method 1: Automatic Fix via Firebase

Sometimes Firebase can fix this automatically:

1. **Go to Firebase Console** → **Extensions**
2. **Click on "Trigger Email"** (if it shows as partially installed)
3. **Look for a button** that says "Fix permissions" or "Grant permissions"
4. **Click it** - Firebase will automatically grant the needed permissions
5. **Wait 2-3 minutes**
6. **Retry installation**

### Method 2: Uninstall and Reinstall

If the extension is partially installed:

1. **Go to Firebase Console** → **Extensions**
2. **Find "Trigger Email"** extension
3. **Click the "..." menu** → **"Uninstall"**
4. **Wait for uninstall to complete**
5. **Follow the permission steps above**
6. **Reinstall** the extension

---

## Step-by-Step: Grant Permissions via Google Cloud Console

### Detailed Steps:

1. **Go to**: https://console.cloud.google.com/iam-admin/iam?project=bible-community-b5afa

2. **Click "Grant Access"** button (top of page)

3. **In "New principals" field**, enter:

   ```
   service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com
   ```

   (Replace `256389727019` with your actual project number if different)

4. **Click "Select a role"** dropdown

5. **Type**: `Eventarc Service Agent`

6. **Select**: `Eventarc Service Agent` role

7. **Click "Save"**

8. **Wait 2-3 minutes**

9. **Retry installation** in Firebase Console

---

## Verify Permissions Were Granted

1. Go to: https://console.cloud.google.com/iam-admin/iam?project=bible-community-b5afa
2. Search for "eventarc" in the filter
3. You should see the service account with "Eventarc Service Agent" role
4. If you see it, permissions are granted!

---

## After Fixing Permissions

1. ✅ **Wait 2-3 minutes** for permissions to propagate
2. ✅ **Go to Firebase Console** → **Extensions**
3. ✅ **Click "Trigger Email"** → **"Install"**
4. ✅ **Fill in configuration** (same as before)
5. ✅ **Click "Install"**
6. ✅ **Should work now!**

---

## Still Having Issues?

If it still doesn't work:

1. **Uninstall** the extension completely
2. **Wait 5 minutes**
3. **Enable Eventarc API** (if not already enabled)
4. **Grant Eventarc Service Agent role** (follow steps above)
5. **Wait 5 minutes** for everything to propagate
6. **Reinstall** the extension

---

## Quick Command Summary

If you have `gcloud` CLI installed:

```bash
# Enable Eventarc API
gcloud services enable eventarc.googleapis.com --project=bible-community-b5afa

# Grant Eventarc Service Agent role (replace PROJECT_NUMBER)
gcloud projects add-iam-policy-binding bible-community-b5afa \
  --member="serviceAccount:service-PROJECT_NUMBER@gcp-sa-eventarc.iam.gserviceaccount.com" \
  --role="roles/eventarc.serviceAgent"
```
