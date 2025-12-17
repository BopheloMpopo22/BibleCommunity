# Add Eventarc Service Agent Service Account

## Issue Found

You're seeing the **Compute Engine** service account, but we need the **Eventarc Service Agent** service account.

The one you see: `256389727019-compute@developer.gserviceaccount.com` (Compute Engine)
The one we need: `service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com` (Eventarc)

## Solution: Add Eventarc Service Agent Manually

### Step 1: Grant Access to Eventarc Service Agent

1. **Go to**: https://console.cloud.google.com/iam-admin/iam?project=bible-community-b5afa

2. **Click "Grant Access"** button (top of page)

3. **In "New principals" field**, paste this EXACT email:

   ```
   service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com
   ```

4. **Click "Select a role"** dropdown

5. **Type**: `Eventarc Service Agent`

6. **Select**: `Eventarc Service Agent` role

7. **Click "Save"**

### Step 2: Enable Eventarc API First (Important!)

Before the service account can work, Eventarc API must be enabled:

1. **Go to**: https://console.cloud.google.com/apis/library?project=bible-community-b5afa

2. **Search for**: "Eventarc API"

3. **If it shows "Enable"**, click it

4. **Wait 1-2 minutes** for it to enable

5. **Verify it shows "Enabled"** (green checkmark)

### Step 3: Verify Service Account Was Added

1. **Go back to**: https://console.cloud.google.com/iam-admin/iam?project=bible-community-b5afa

2. **Search for**: `gcp-sa-eventarc` in the filter

3. **You should now see**: https://console.cloud.google.com/apis/library?project=bible-community-b5afa

   - With role: **Eventarc Service Agent**

### Step 4: Wait and Retry

1. **Wait 5-10 minutes** for permissions to propagate
2. **Go to Firebase Console** → **Extensions**
3. **If Trigger Email is partially installed**, uninstall it first:
   - Click "..." menu → "Uninstall"
   - Wait for uninstall to complete
4. **Click "Trigger Email"** → **"Install"**
5. **Use same configuration**:
   - Firestore Location: `africa-south1`
   - SMTP URI: Your Gmail SMTP URI
   - Default FROM: `bophelompopo22@gmail.com`
6. **Click "Install"**

---

## Alternative: Use gcloud CLI (If Available)

If you have `gcloud` CLI installed, you can run:

```bash
# Enable Eventarc API
gcloud services enable eventarc.googleapis.com --project=bible-community-b5afa

# Grant Eventarc Service Agent role
gcloud projects add-iam-policy-binding bible-community-b5afa \
  --member="serviceAccount:service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com" \
  --role="roles/eventarc.serviceAgent"
```

---

## Important Notes

- **Eventarc API must be enabled FIRST** before the service account can work
- **The service account email is different** from Compute Engine service account
- **Wait 5-10 minutes** after granting permissions before retrying
- **Uninstall partially installed extension** before reinstalling

---

## Quick Checklist

- [ ] Enable Eventarc API
- [ ] Grant access to `service-256389727019@gcp-sa-eventarc.iam.gserviceaccount.com`
- [ ] Assign "Eventarc Service Agent" role
- [ ] Verify service account appears in IAM
- [ ] Wait 5-10 minutes
- [ ] Uninstall partially installed extension (if exists)
- [ ] Reinstall Trigger Email extension
