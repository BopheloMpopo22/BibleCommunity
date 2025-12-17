# Fix Existing Eventarc Service Account

## Issue Found

The service account `service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com` exists but might not have the right role, or it's hidden from the list.

Also, I see `ext-firestore-send-email@bible-community-b5afa.iam.gserviceaccount.com` - this is from the partially installed extension and might be causing conflicts.

## Solution: Edit Existing Service Account

### Step 1: Search for Eventarc Service Account

1. **Go to**: https://console.cloud.google.com/iam-admin/iam?project=bible-community-b5afa

2. **In the search/filter box**, try searching for:
   - `gcp-sa-eventarc`
   - `eventarc`
   - `256389727019`

3. **Look for**: `service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com`

### Step 2: If You Find It - Edit It

1. **Click the pencil icon** (✏️) next to `service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com`

2. **Click "Add Another Role"**

3. **Select**: `Eventarc Service Agent`

4. **Click "Save"**

### Step 3: If You DON'T Find It - Try This

The service account might exist but be hidden. Try adding the role via gcloud CLI or wait for it to appear.

---

## Better Solution: Uninstall Extension First

Since the extension partially installed, let's clean it up first:

### Step 1: Uninstall Partially Installed Extension

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select project**: `bible-community-b5afa`
3. **Click "Extensions"** in left sidebar
4. **Find "Trigger Email"** extension
5. **Click the "..." menu** → **"Uninstall"**
6. **Wait for uninstall to complete** (may take 1-2 minutes)

### Step 2: Wait for Cleanup

1. **Wait 5-10 minutes** for all resources to be cleaned up
2. This will remove the `ext-firestore-send-email` service account

### Step 3: Grant Eventarc Service Agent Role (Try Again)

After uninstalling, try granting the role again:

1. **Go to**: https://console.cloud.google.com/iam-admin/iam?project=bible-community-b5afa

2. **Click "Grant Access"**

3. **Paste**: `service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com`

4. **Select role**: `Eventarc Service Agent`

5. **Click "Save"**

### Step 4: Reinstall Extension

1. **Go to Firebase Console** → **Extensions**
2. **Click "Trigger Email"** → **"Install"**
3. **Use same configuration**:
   - Firestore Location: `africa-south1`
   - SMTP URI: Your Gmail SMTP URI
   - Default FROM: `bophelompopo22@gmail.com`
4. **Click "Install"**

---

## Alternative: Use gcloud CLI

If you have `gcloud` CLI, try this command:

```bash
# Grant Eventarc Service Agent role
gcloud projects add-iam-policy-binding bible-community-b5afa \
  --member="serviceAccount:service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com" \
  --role="roles/eventarc.serviceAgent" \
  --condition=None
```

---

## Why This Happens

- The service account exists but might not have any roles assigned
- The partially installed extension might be blocking proper installation
- Google Cloud sometimes hides service accounts that have no roles

---

## Recommended Approach

**I recommend uninstalling the extension first**, then:
1. Wait 5-10 minutes
2. Grant the Eventarc Service Agent role
3. Reinstall the extension

This should resolve the conflict with the partially installed extension.

