# 🔧 Firebase Troubleshooting Guide

## ❌ Problem: Collections Don't Appear in Firebase Console

**Firestore collections are created automatically when you add the first document.** They won't appear in the Firebase Console until you create a prayer or prayer request in the app.

## 🔍 Common Issues & Solutions

### Issue 1: "Missing or insufficient permissions" Error

**Cause:** You're not signed in, but Firestore rules require authentication to create prayers/requests.

**Solution:**
1. **Sign in to the app:**
   - Go to the Auth/Sign In screen
   - Sign in with email/password or Google
   - Make sure you see your profile/name in the app

2. **Then try creating a prayer:**
   - Go to Prayer tab → Community Prayers
   - Click "New Prayer" tab
   - Fill in title and content
   - Click "Submit Prayer"

3. **Check Firebase Console:**
   - Go to Firestore Database
   - You should now see the `prayers` collection

### Issue 2: "The query requires an index" Error

**Cause:** Firestore needs a composite index for queries with `where` + `orderBy`.

**Solution:**
1. **Click the error link in the console** - Firebase will create the index automatically
2. **Or create manually:**
   - Go to Firebase Console → Firestore Database → Indexes
   - Click "Create Index"
   - Collection: `prayers`
   - Fields: `isActive` (Ascending), `createdAt` (Descending)
   - Click "Create"

3. **Wait 1-2 minutes** for the index to build, then try again

### Issue 3: Collections Still Don't Appear

**Check these:**

1. **Are you signed in?**
   - Check if you see your name/profile in the app
   - If not, sign in first

2. **Check the console logs:**
   - Look for messages like:
     - `"Error saving prayer to Firebase (using local storage): ..."`
     - `"Missing or insufficient permissions"`
   - These tell you what went wrong

3. **Verify Firestore rules are published:**
   - Go to Firebase Console → Firestore Database → Rules
   - Make sure you clicked "Publish" after updating rules
   - Rules should include:
     ```javascript
     match /prayers/{prayerId} {
       allow read: if true;
       allow create: if request.auth != null;
     }
     ```

4. **Try creating a prayer while signed in:**
   - The collections will appear automatically after the first document is created

## ✅ Step-by-Step Test

1. **Sign in to the app** (if not already signed in)
2. **Go to:** Prayer tab → Community Prayers → New Prayer tab
3. **Fill in:**
   - Title: "Test Prayer"
   - Content: "This is a test"
4. **Click:** "Submit Prayer"
5. **Check console:** Should see "Post created in Firebase" (no errors)
6. **Check Firebase Console:** Go to Firestore Database → You should see `prayers` collection with your test prayer

## 📊 Expected Firebase Collections (5 total)

After creating prayers and requests, you should see:

1. ✅ `communities` - Community data
2. ✅ `posts` - Community posts  
3. ✅ `users` - User profiles
4. ✅ `prayers` - **Appears after creating first prayer**
5. ✅ `prayer_requests` - **Appears after creating first request**

## 🚨 Error Messages Explained

### "Missing or insufficient permissions"
- **Meaning:** You're not signed in, or rules don't allow the operation
- **Fix:** Sign in to the app first

### "The query requires an index"
- **Meaning:** Firestore needs an index for your query
- **Fix:** Click the error link to create it automatically

### "Error saving prayer to Firebase (using local storage)"
- **Meaning:** Firebase save failed, but app saved locally as backup
- **Fix:** Check if you're signed in, check rules are published

## 💡 Pro Tip

**Collections are created automatically** - you don't need to create them manually. Just:
1. Sign in
2. Create a prayer/request in the app
3. Collections appear in Firebase Console automatically

---

**Still having issues?** Check the console logs for the exact error message and share it!

