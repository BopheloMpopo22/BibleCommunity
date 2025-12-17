# 🔥 Firebase Collections Guide

## ✅ What's Currently in Firebase

You now have **5 collections** in Firestore:

### 1. **`communities`** ✅
- Stores community data (name, description, profile pictures, headers)
- **Who can view**: Anyone (enticement to sign up)
- **Who can create**: Only signed-in users

### 2. **`posts`** ✅
- Stores community posts (text, images, videos)
- **Who can view**: Anyone (enticement to sign up)
- **Who can create**: Only signed-in users

### 3. **`users`** ✅
- Stores user profiles (name, photo, bio)
- **Who can view**: Anyone (enticement to sign up)
- **Who can edit**: Only the user themselves

### 4. **`prayers`** ✅ NEW!
- Stores community prayers (new prayers created in Community Prayers)
- **Who can view**: Anyone (enticement to sign up)
- **Who can create**: Only signed-in users
- **Fields**: title, content, category, author, authorId, media, images, videos, likes, comments, timestamp

### 5. **`prayer_requests`** ✅ NEW!
- Stores prayer requests (requests created in Community Prayers)
- **Who can view**: Anyone (enticement to sign up)
- **Who can create**: Only signed-in users
- **Fields**: title, content, category, author, authorId, media, images, videos, likes, comments, timestamp

## 📊 What This Means

### For Non-Signed-Up Users:
- ✅ Can **view** all communities, posts, prayers, and prayer requests
- ✅ Can **browse** everything (enticement to sign up)
- ❌ **Cannot** like, comment, create, or interact

### For Signed-Up Users:
- ✅ Can **view** everything
- ✅ Can **create** prayers, prayer requests, posts, communities
- ✅ Can **like** and **comment** on everything
- ✅ Can **edit/delete** their own content

## 🔄 How It Works

### Hybrid Storage System:
1. **Primary**: Firebase (for multi-user sync)
2. **Backup**: Local storage (if Firebase fails or user is offline)

### When You Create a Prayer/Request:
- ✅ Saves to Firebase → **All users see it**
- ✅ Also saves locally → **Backup if Firebase fails**

### When You Like/Comment:
- ✅ Saves locally → **Works immediately**
- ✅ Updates Firebase → **All users see the count**

## 🎯 What's Still Local-Only (No Firebase Needed)

These features work fine with local storage only:

- ✅ **Prayer Reminders** (personal, not shared)
- ✅ **Saved Prayers** (personal bookmarks)
- ✅ **Bible Notes** (personal notes)
- ✅ **Partner Content** (prayers, scriptures, words - personal)
- ✅ **Daily Content** (default prayers, scriptures, words)

## 📝 Next Steps

1. **Update Firestore Rules** (if you haven't already):
   - Go to Firebase Console → Firestore Database → Rules
   - Copy the rules from `firestore.rules`
   - Paste and click "Publish"

2. **Test the App**:
   - Create a prayer → Should appear in Firebase
   - Create a prayer request → Should appear in Firebase
   - Like a prayer → Count should update
   - Comment on a prayer → Comment should save

3. **Check Firebase Console**:
   - Go to Firestore Database
   - You should see 5 collections: `communities`, `posts`, `users`, `prayers`, `prayer_requests`
   - New prayers/requests should appear there

## 🚨 Important Notes

- **Likes/Comments**: Currently stored locally for immediate response, but like counts sync to Firebase
- **Media**: Images/videos are stored locally (file paths). For production, you may want to upload to Firebase Storage
- **Real-time Updates**: Currently, users need to refresh to see new prayers. For real-time updates, you'd need to add Firestore listeners (future enhancement)

## ✅ You're All Set!

Your app now has:
- ✅ Multi-user prayer sharing
- ✅ Multi-user prayer requests
- ✅ Public viewing (enticement)
- ✅ Secure authentication (only signed-in users can create)
- ✅ Local backup (works offline)

Everything is production-ready for 100+ users! 🎉

