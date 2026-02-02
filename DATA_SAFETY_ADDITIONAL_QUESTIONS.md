# 📊 Data Safety Additional Questions - Answers

## ✅ Question 1: Data Encryption

**Question:** "Is all of the user data collected by your app encrypted in transit?"

**Answer:** ✅ **Yes**

**Why:**
- Your app uses Firebase (Google's service)
- Firebase automatically encrypts all data in transit using HTTPS/TLS
- All data sent between the app and Firebase servers is encrypted
- This is standard for Firebase - you don't need to do anything extra

---

## ✅ Question 2: Account Creation Methods

**Question:** "Which of the following methods of account creation does your app support?"

**Answer:** Select **BOTH**:

1. ✅ **Username and password**
   - Users can create accounts with email and password
   - This is your primary authentication method

2. ✅ **OAuth**
   - Users can sign in with Google
   - This is your Google OAuth authentication

**Do NOT select:**
- ❌ "Username and other authentication" (unless you have biometric/2FA)
- ❌ "Username, password and other authentication" (unless you have biometric/2FA)
- ❌ "Other" (you don't have other methods)
- ❌ "My app does not allow users to create an account" (this is false)

---

## ✅ Question 3: Delete Account URL

**Question:** "Add a link that users can use to request that their account and associated data be deleted"

**Answer:** You need to create a page or use your existing Privacy Policy page.

### Option A: Use Your Privacy Policy Page (Easiest)

**URL:** 
```
https://bophelompopo22.github.io/BibleCommunity/privacy-policy.html
```

**Then add a section to your Privacy Policy** explaining how to delete accounts:

1. Go to your `docs/privacy-policy.html` file
2. Add a section about account deletion with clear steps
3. Update the page on GitHub

### Option B: Create a Dedicated Delete Account Page (Recommended)

**Create:** `docs/delete-account.html`

**URL:**
```
https://bophelompopo22.github.io/BibleCommunity/delete-account.html
```

**What to include:**
- Steps to delete account (through app settings or email)
- What data gets deleted
- What data is kept (if any)
- How long deletion takes
- Contact information

### Quick Solution: Use Privacy Policy URL

**For now, you can use:**
```
https://bophelompopo22.github.io/BibleCommunity/privacy-policy.html
```

**Then update your Privacy Policy** to include a clear "Account Deletion" section with:
- How to delete account (Settings → Delete Account, or email support)
- What data is deleted
- Contact email: `bophelompopo22@gmail.com`

---

## ✅ Question 4: Partial Data Deletion (Optional)

**Question:** "Do you provide a way for users to request that some or all of their data be deleted, without requiring them to delete their account?"

**Answer:** ✅ **No** (or skip this - it's optional)

**Why:**
- Currently, users can delete their own posts/content
- But there's no formal "partial data deletion" feature
- Users would need to delete their account to delete all data
- This is **optional** - you can answer "No" or skip it

**If you want to answer "Yes" later:**
- Add a feature where users can request deletion of specific data types
- For now, "No" is fine

---

## 📋 Complete Answer Summary

| Question | Your Answer |
|----------|-------------|
| **Data encrypted in transit?** | ✅ **Yes** |
| **Account creation methods?** | ✅ **Username and password**<br>✅ **OAuth** |
| **Delete account URL?** | `https://bophelompopo22.github.io/BibleCommunity/privacy-policy.html`<br>(Update Privacy Policy to include deletion steps) |
| **Partial data deletion?** | ✅ **No** (optional - can skip) |

---

## 🎯 Action Items

### 1. Update Privacy Policy (5 minutes)

Add this section to your `docs/privacy-policy.html`:

```html
<h2>9. Account Deletion</h2>
<h3>9.1 How to Delete Your Account</h3>
<p>You can delete your account and all associated data in the following ways:</p>
<ul>
    <li><strong>Through the app:</strong> Go to Settings → Account → Delete Account</li>
    <li><strong>By email:</strong> Send a deletion request to bophelompopo22@gmail.com with the subject "Account Deletion Request"</li>
</ul>

<h3>9.2 What Gets Deleted</h3>
<p>When you delete your account, we will delete:</p>
<ul>
    <li>Your personal information (email, name, profile picture)</li>
    <li>Your account credentials</li>
    <li>Your posts, prayers, and comments</li>
    <li>Your saved content and preferences</li>
    <li>All associated data stored in our systems</li>
</ul>

<h3>9.3 Data Retention</h3>
<p>We will delete your data within 30 days of your deletion request. Some data may be retained for legal or security purposes as required by law, but will not be used for any other purpose.</p>

<h3>9.4 Contact</h3>
<p>If you have questions about account deletion, contact us at: <strong>bophelompopo22@gmail.com</strong></p>
```

### 2. Commit and Push to GitHub

After updating, commit and push so the page is live.

---

## ✅ Summary

1. **Encryption:** ✅ Yes (Firebase encrypts automatically)
2. **Account creation:** ✅ Username/password + OAuth (Google)
3. **Delete URL:** Use Privacy Policy URL (update it first)
4. **Partial deletion:** ✅ No (optional question)

**All safe answers!** ✅

