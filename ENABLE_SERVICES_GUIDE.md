# Enable Required Services for Trigger Email Extension

## Services Needed

The Trigger Email extension requires these Google Cloud services:
1. **Artifact Registry** - Stores container images
2. **Secret Manager** - Stores sensitive data (like SMTP passwords)
3. **Compute Engine** - Runs the extension functions

## Quick Enable Method (Recommended)

### Option 1: Enable via Firebase Console (Easiest)

1. **In the Trigger Email installation screen**, you should see a button or link that says:
   - **"Enable required APIs"** or
   - **"Enable services"** or
   - **"Set up required services"**

2. **Click that button** - Firebase will automatically enable all required services for you.

3. **Wait 1-2 minutes** for services to enable.

4. **Try installing again** - Click "Install" or "Continue" again.

---

### Option 2: Enable via Google Cloud Console

If the automatic enable button doesn't work, enable manually:

#### Step 1: Go to Google Cloud Console

1. **Open**: https://console.cloud.google.com/
2. **Select your project**: `bible-community-b5afa`
   - If you don't see it, click the project dropdown at the top
   - Search for "bible-community-b5afa"

#### Step 2: Enable Artifact Registry

1. **Go to**: https://console.cloud.google.com/artifacts
2. **Click "Enable API"** button (if shown)
3. **Or search**: In the top search bar, type "Artifact Registry API"
4. **Click "Enable"**

#### Step 3: Enable Secret Manager

1. **Go to**: https://console.cloud.google.com/security/secret-manager
2. **Click "Enable API"** button (if shown)
3. **Or search**: In the top search bar, type "Secret Manager API"
4. **Click "Enable"**

#### Step 4: Enable Compute Engine

1. **Go to**: https://console.cloud.google.com/compute
2. **Click "Enable API"** button (if shown)
3. **Or search**: In the top search bar, type "Compute Engine API"
4. **Click "Enable"**

#### Step 5: Wait and Retry

1. **Wait 2-3 minutes** for all APIs to enable
2. **Go back to Firebase Console**
3. **Try installing Trigger Email extension again**

---

### Option 3: Enable via Firebase CLI

Open PowerShell/Terminal and run:

```bash
# Enable Artifact Registry API
gcloud services enable artifactregistry.googleapis.com --project=bible-community-b5afa

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com --project=bible-community-b5afa

# Enable Compute Engine API
gcloud services enable compute.googleapis.com --project=bible-community-b5afa
```

**Note**: This requires Google Cloud SDK (`gcloud`) to be installed.

---

## Verify Services Are Enabled

### Check in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/library?project=bible-community-b5afa
2. Search for each service:
   - **Artifact Registry API** - Should show "Enabled"
   - **Secret Manager API** - Should show "Enabled"
   - **Compute Engine API** - Should show "Enabled"

---

## Common Issues

### "Permission Denied" Error

- Make sure you're logged in with an account that has **Owner** or **Editor** permissions
- Check: https://console.cloud.google.com/iam-admin/iam?project=bible-community-b5afa

### Services Not Showing as Enabled

- **Wait a few minutes** - Sometimes there's a delay
- **Refresh the page**
- **Try again** - Sometimes you need to retry the enable action

### Billing Required

Some services might require billing to be enabled:
1. Go to: https://console.cloud.google.com/billing?project=bible-community-b5afa
2. Link a billing account (if not already linked)
3. **Note**: Firebase free tier includes these services, so you shouldn't be charged for basic usage

---

## After Enabling Services

1. ✅ **Go back to Firebase Console**
2. ✅ **Navigate to Extensions → Trigger Email**
3. ✅ **Click "Install" again**
4. ✅ **You should now be able to configure SMTP settings**
5. ✅ **Complete the installation**

---

## Quick Checklist

- [ ] Enable Artifact Registry API
- [ ] Enable Secret Manager API
- [ ] Enable Compute Engine API
- [ ] Wait 2-3 minutes
- [ ] Go back to Firebase Console
- [ ] Try installing Trigger Email extension again
- [ ] Configure SMTP settings
- [ ] Complete installation

---

## Need Help?

If you're still having issues:
1. Check Firebase Console → Extensions → Trigger Email for error messages
2. Verify your Google Cloud project has billing enabled (free tier is fine)
3. Make sure you have Owner/Editor permissions on the project

