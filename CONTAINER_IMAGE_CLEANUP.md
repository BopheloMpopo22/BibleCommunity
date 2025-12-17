# Container Image Cleanup Policy

## Question Asked

Firebase is asking how many days to keep container images before deleting them.

## Recommendation

**Enter: `7` or `14` days**

### Why?

- **7 days**: Good for most apps - keeps recent versions for rollbacks
- **14 days**: More conservative - gives more time for troubleshooting
- **30 days**: Maximum recommended - only if you need extended rollback capability

### What This Means

- Firebase stores container images (Docker images) for your functions
- Old images accumulate over time and can cost money
- This policy automatically deletes images older than your chosen days
- You can always redeploy if you need an older version

## For Your App

**I recommend: `7` days**

This is:
- ✅ Enough time for rollbacks if something breaks
- ✅ Prevents unnecessary storage costs
- ✅ Standard for most production apps

## After Answering

The deployment will continue. You can change this later in:
- Google Cloud Console → Artifact Registry → Settings

---

**Just type `7` and press Enter!**

