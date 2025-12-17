# Verify Eventarc Permissions Are Correct

## "Principal Already Exists" Message

This means the service account is already in your IAM policy, but we need to verify it has the right role.

## Step 1: Check Current Roles

1. **Go to**: https://console.cloud.google.com/iam-admin/iam?project=bible-community-b5afa

2. **Search for**: `eventarc` in the filter box

3. **Find the service account**: `service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com`

4. **Check what roles it has**:
   - Look at the "Role" column
   - It should show: **"Eventarc Service Agent"**
   - If it shows a different role or no role, that's the problem

## Step 2: If Role is Missing or Wrong

If the service account doesn't have "Eventarc Service Agent" role:

1. **Click the pencil icon** (✏️) next to the service account
2. **Click "Add Another Role"**
3. **Select**: `Eventarc Service Agent`
4. **Click "Save"**

## Step 3: Enable Eventarc API

Make sure Eventarc API is enabled:

1. **Go to**: https://console.cloud.google.com/apis/library?project=bible-community-b5afa
2. **Search for**: "Eventarc API"
3. **Check if it says "Enabled"** (green checkmark)
4. **If not enabled**, click "Enable"
5. **Wait 1-2 minutes**

## Step 4: Wait for Permissions to Propagate

Even if permissions are correct, they can take a few minutes to propagate:

1. **Wait 5-10 minutes** after granting permissions
2. **This is important** - Google Cloud needs time to sync permissions

## Step 5: Uninstall and Reinstall Extension

Since the extension partially installed, it might be in a bad state:

1. **Go to Firebase Console** → **Extensions**
2. **Find "Trigger Email"** extension
3. **Click the "..." menu** → **"Uninstall"**
4. **Wait for uninstall to complete** (may take 1-2 minutes)
5. **Wait another 5 minutes** for everything to clear
6. **Reinstall** the extension with the same configuration

## Step 6: Alternative - Grant Additional Roles

Sometimes you need additional roles. Try granting these:

### Grant Pub/Sub Service Agent Role:

1. **Go to**: https://console.cloud.google.com/iam-admin/iam?project=bible-community-b5afa
2. **Click "Grant Access"**
3. **Paste**: `service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com`
4. **Select role**: `Pub/Sub Service Agent`
5. **Click "Save"**

### Grant Service Account User Role:

1. **Click "Grant Access"** again
2. **Paste**: `service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com`
3. **Select role**: `Service Account User`
4. **Click "Save"**

## Step 7: Verify All APIs Are Enabled

Make sure these APIs are enabled:

1. **Go to**: https://console.cloud.google.com/apis/library?project=bible-community-b5afa
2. **Search and enable** (if not already enabled):
   - ✅ **Eventarc API**
   - ✅ **Cloud Functions API**
   - ✅ **Cloud Build API**
   - ✅ **Pub/Sub API**
   - ✅ **Artifact Registry API**
   - ✅ **Secret Manager API**
   - ✅ **Compute Engine API**

## Step 8: Retry Installation

After all the above:

1. **Wait 5-10 minutes** for everything to propagate
2. **Go to Firebase Console** → **Extensions**
3. **Click "Trigger Email"** → **"Install"**
4. **Use same configuration**:
   - Firestore Location: `africa-south1`
   - SMTP URI: Your Gmail SMTP URI
   - Default FROM: `bophelompopo22@gmail.com`
5. **Click "Install"**

---

## Quick Checklist

- [ ] Check service account has "Eventarc Service Agent" role
- [ ] Enable Eventarc API
- [ ] Grant "Pub/Sub Service Agent" role (optional but helpful)
- [ ] Grant "Service Account User" role (optional but helpful)
- [ ] Enable all required APIs
- [ ] Uninstall partially installed extension
- [ ] Wait 5-10 minutes
- [ ] Reinstall extension

---

## What to Check Right Now

1. **Go to IAM page**: https://console.cloud.google.com/iam-admin/iam?project=bible-community-b5afa
2. **Search for**: `eventarc`
3. **Tell me**: What role(s) does the service account have?

This will help me give you more specific guidance!




