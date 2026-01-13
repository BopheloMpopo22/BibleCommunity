# How to Host Privacy Policy and Terms of Service

## Overview

App stores require a publicly accessible URL for your Privacy Policy. This guide shows you how to host your Privacy Policy and Terms of Service using GitHub Pages (free and easy).

---

## Option 1: GitHub Pages (Recommended - Free)

### Step 1: Create a `docs` folder in your repository

The HTML files are already created in the `docs` folder:

- `docs/privacy-policy.html`
- `docs/terms-of-service.html`

### Step 2: Enable GitHub Pages

1. Go to your GitHub repository: `https://github.com/BopheloMpopo22/BibleCommunity`

2. Click on **Settings** (top right of repository)

3. Scroll down to **Pages** (left sidebar)

4. Under **Source**, select:

   - **Branch**: `main` (or `master`)
   - **Folder**: `/docs`
   - Click **Save**

5. Wait 1-2 minutes for GitHub to build your site

6. Your URLs will be:
   - **Privacy Policy**: `https://bophelompopo22.github.io/BibleCommunity/privacy-policy.html`
   - **Terms of Service**: `https://bophelompopo22.github.io/BibleCommunity/terms-of-service.html`

### Step 3: Test Your URLs

1. Open a browser
2. Visit: `https://bophelompopo22.github.io/BibleCommunity/privacy-policy.html`
3. You should see your Privacy Policy page

### Step 4: Update App Store Description

Update `APP_STORE_DESCRIPTION.md` with your actual URLs:

- Privacy Policy URL: `https://bophelompopo22.github.io/BibleCommunity/privacy-policy.html`
- Terms of Service URL: `https://bophelompopo22.github.io/BibleCommunity/terms-of-service.html`

---

## Option 2: Firebase Hosting (Alternative)

If you prefer Firebase Hosting:

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Initialize Firebase Hosting

```bash
firebase init hosting
```

### Step 3: Copy HTML files

Copy `docs/privacy-policy.html` and `docs/terms-of-service.html` to your hosting `public` folder

### Step 4: Deploy

```bash
firebase deploy --only hosting
```

Your URLs will be:

- `https://YOUR-PROJECT-ID.web.app/privacy-policy.html`
- `https://YOUR-PROJECT-ID.web.app/terms-of-service.html`

---

## Option 3: Custom Domain (Optional)

If you have a custom domain (e.g., `biblecommunity.app`):

1. Set up DNS records pointing to GitHub Pages or Firebase
2. Configure custom domain in GitHub Pages Settings or Firebase Hosting
3. Your URLs will be:
   - `https://biblecommunity.app/privacy-policy.html`
   - `https://biblecommunity.app/terms-of-service.html`

---

## Quick Checklist

- [ ] HTML files created in `docs/` folder ✅
- [ ] GitHub Pages enabled with `/docs` folder
- [ ] URLs tested and working
- [ ] URLs added to App Store description
- [ ] URLs added to app settings (if needed)

---

## Troubleshooting

### GitHub Pages not showing?

- Wait 2-3 minutes after enabling
- Check that files are in the `docs` folder
- Verify branch is set to `main` or `master`
- Check repository is public (required for free GitHub Pages)

### 404 Error?

- Make sure file names match exactly: `privacy-policy.html` (lowercase, with hyphens)
- Check the URL path is correct
- Clear browser cache

### Need to update content?

1. Edit the HTML files
2. Commit and push to GitHub
3. Changes appear within 1-2 minutes

---

## For App Store Submission

When submitting to App Store, you'll need:

- **Privacy Policy URL**: `https://bophelompopo22.github.io/BibleCommunity/privacy-policy.html`
- **Support URL**: Can be the same or a contact page
- **Website URL** (optional): Same as Privacy Policy or your main site

---

## Notes

- GitHub Pages is free and reliable
- No server maintenance required
- Automatic HTTPS (secure)
- Easy to update - just edit and push
- Works great for legal documents

Your Privacy Policy and Terms are now ready to be hosted! 🎉
