# 📊 Firebase Storage - What's Currently Included

## ✅ What IS Currently Uploaded to Firebase Storage

### 1. **Profile Images** ✅
- **Location**: `profile-images/{userId}.jpg`
- **When**: When user updates their profile picture
- **Service**: `ProductionAuthService.uploadProfileImage()`
- **Status**: ✅ Working

### 2. **Post Media (Communities Tab)** ✅
- **Location**: 
  - `posts/images/image_xxxxx.jpg`
  - `posts/videos/video_xxxxx.mp4`
- **When**: When user creates a new post with images/videos
- **Service**: `PostService.createPost()` → `FirebaseStorageService.uploadMedia()`
- **Status**: ✅ Working (from now on)

### 3. **Prayer Media (Community Prayers)** ✅
- **Location**:
  - `prayers/images/image_xxxxx.jpg`
  - `prayers/videos/video_xxxxx.mp4`
- **When**: When user creates a new prayer with images/videos
- **Service**: `PrayerFirebaseService.savePrayer()` → `FirebaseStorageService.uploadMedia()`
- **Status**: ✅ Working (from now on)

### 4. **Prayer Request Media** ✅
- **Location**:
  - `prayers/images/image_xxxxx.jpg`
  - `prayers/videos/video_xxxxx.mp4`
- **When**: When user creates a new prayer request with images/videos
- **Service**: `PrayerFirebaseService.savePrayerRequest()` → `FirebaseStorageService.uploadMedia()`
- **Status**: ✅ Working (from now on)

---

## ❌ What is NOT Currently Uploaded to Firebase Storage

### **Comment Media (Prayers & Prayer Requests)** ❌

**Current Status:**
- ❌ Comments with images/videos are stored **locally only** (AsyncStorage)
- ❌ Comment media has **local file paths** (`file:///...`)
- ❌ **Only the user who created the comment can see the media**
- ❌ **Other users cannot see comment media**
- ❌ **Media is lost if app is reinstalled**

**Where Comments Are Stored:**
- **Storage**: AsyncStorage (local device only)
- **Service**: `PrayerEngagementService.addComment()`
- **Location**: Not in Firebase at all (neither Firestore nor Storage)

**What This Means:**
- Users can add images/videos to comments
- But the media stays on their device
- Other users won't see the comment media
- It's not synced across devices

---

## 📁 Firebase Storage Structure

```
firebase-storage/
│
├── profile-images/
│   └── {userId}.jpg
│
├── posts/
│   ├── images/
│   │   └── image_1234567890_abc123.jpg
│   └── videos/
│       └── video_1234567891_def456.mp4
│
└── prayers/
    ├── images/
    │   └── image_1234567892_ghi789.jpg
    └── videos/
        └── video_1234567893_jkl012.mp4
```

**Missing:**
- ❌ `comments/images/` - Not created yet
- ❌ `comments/videos/` - Not created yet

---

## 🎯 Summary

### ✅ Included (Uploaded to Firebase Storage):
1. ✅ Profile images
2. ✅ Post images/videos (new posts)
3. ✅ Prayer images/videos (new prayers)
4. ✅ Prayer request images/videos (new requests)

### ❌ NOT Included (Still Local Only):
1. ❌ **Comment images/videos** - Stored locally, not in Firebase Storage
2. ❌ Old posts/prayers (created before Storage setup)

---

## 🔧 What Needs to Be Added

To make comment media work like posts/prayers:

1. **Update `PrayerEngagementService.addComment()`** to:
   - Upload comment media to Firebase Storage
   - Store Firebase URLs instead of local paths
   - Save comments to Firestore (not just AsyncStorage)

2. **Add Storage paths**:
   - `comments/images/` for comment images
   - `comments/videos/` for comment videos

3. **Update Storage rules** to allow comment media uploads

4. **Update Firestore** to store comments (currently only in AsyncStorage)

---

## 📝 Current Behavior

### When User Adds Comment with Media:

**Current Flow:**
1. User picks image/video for comment
2. Gets local file URI (`file:///...`)
3. Comment saved to **AsyncStorage** (local only)
4. Media stays on device
5. ❌ Other users can't see the media

**What Should Happen:**
1. User picks image/video for comment
2. **Upload to Firebase Storage** → `comments/images/` or `comments/videos/`
3. Get Firebase Storage URL
4. Save comment to **Firestore** with Firebase URL
5. ✅ All users can see the media

---

## ✅ Next Steps

**Would you like me to:**
1. ✅ Add Firebase Storage upload for comment media?
2. ✅ Move comments from AsyncStorage to Firestore?
3. ✅ Update Storage rules to allow comment uploads?

**This will make comment media visible to all users, just like posts and prayers!**

