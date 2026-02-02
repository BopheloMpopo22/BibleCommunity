# 📊 All Data Types - Complete Answers for Google Play Console

## ✅ Answers for Each Data Type

---

## 1. 📸 **Photos**

### Collected?
✅ **Yes** - Users upload photos for profile pictures and posts

### Shared?
✅ **Yes** - Shared with Firebase Storage (Google)

### Processed ephemerally?
❌ **No** - Photos are stored in Firebase Storage permanently

### Required or Optional?
✅ **Users can choose whether this data is collected**
- Profile pictures are optional
- Post images are optional (users choose to upload)

### Why collected?
✅ **App functionality** - Photos are needed for profile pictures and post content

### Why shared?
✅ **App functionality** - Photos are stored in Firebase Storage to enable app features

---

## 2. 🎥 **Videos**

### Collected?
✅ **Yes** - Users upload videos in posts

### Shared?
✅ **Yes** - Shared with Firebase Storage (Google)

### Processed ephemerally?
❌ **No** - Videos are stored in Firebase Storage permanently

### Required or Optional?
✅ **Users can choose whether this data is collected**
- Videos are optional (users choose to upload)

### Why collected?
✅ **App functionality** - Videos are needed for post content

### Why shared?
✅ **App functionality** - Videos are stored in Firebase Storage to enable app features

---

## 3. 📋 **Crash Logs**

### Collected?
✅ **Yes** - Firebase automatically collects crash logs

### Shared?
✅ **Yes** - Shared with Firebase Crashlytics (Google)

### Processed ephemerally?
❌ **No** - Crash logs are stored for analysis and debugging

### Required or Optional?
✅ **Data collection is required (users can't turn off this data collection)**
- Crash logs are automatically collected
- Users cannot disable this

### Why collected?
✅ **Analytics** - Used to diagnose and fix bugs/crashes
✅ **App functionality** - Helps improve app stability

### Why shared?
✅ **Analytics** - Shared with Firebase for crash analysis and app improvement

---

## 4. 📊 **Other App Performance Data**

### Collected?
✅ **Yes** - Firebase Analytics collects app performance data

### Shared?
✅ **Yes** - Shared with Firebase Analytics (Google)

### Processed ephemerally?
❌ **No** - Performance data is stored for analysis

### Required or Optional?
✅ **Data collection is required (users can't turn off this data collection)**
- Performance data is automatically collected
- Users cannot disable this

### Why collected?
✅ **Analytics** - Used to monitor app health and performance
✅ **App functionality** - Helps improve app performance

### Why shared?
✅ **Analytics** - Shared with Firebase for performance monitoring and improvements

---

## 5. 🖱️ **App Interactions**

### Collected?
✅ **Yes** - Firebase Analytics collects user interactions (clicks, views, features used)

### Shared?
✅ **Yes** - Shared with Firebase Analytics (Google)

### Processed ephemerally?
❌ **No** - Interaction data is stored for analysis

### Required or Optional?
✅ **Data collection is required (users can't turn off this data collection)**
- Interaction data is automatically collected
- Users cannot disable this

### Why collected?
✅ **Analytics** - Used to understand how users interact with the app
✅ **App functionality** - Helps improve user experience

### Why shared?
✅ **Analytics** - Shared with Firebase for usage analysis and app improvements

---

## 6. ✍️ **Other User-Generated Content**

### Collected?
✅ **Yes** - Users create posts, prayers, comments, testimonies

### Shared?
✅ **Yes** - Shared with Firebase Firestore (Google)

### Processed ephemerally?
❌ **No** - User content is stored in Firestore permanently

### Required or Optional?
✅ **Users can choose whether this data is collected**
- Users choose what content to post
- All content is optional

### Why collected?
✅ **App functionality** - Content is needed for community features, posts, prayers

### Why shared?
✅ **App functionality** - Content is stored in Firebase to enable sharing and community features

---

## 7. 🆔 **Device or Other IDs**

### Collected?
✅ **Yes** - Firebase collects device IDs, installation IDs

### Shared?
✅ **Yes** - Shared with Firebase (Google)

### Processed ephemerally?
❌ **No** - Device IDs are stored for authentication and analytics

### Required or Optional?
✅ **Data collection is required (users can't turn off this data collection)**
- Device IDs are automatically collected
- Required for authentication and app functionality
- Users cannot disable this

### Why collected?
✅ **App functionality** - Needed for authentication and app features
✅ **Account management** - Used to identify devices and manage user accounts
✅ **Analytics** - Used for app analytics and performance monitoring

### Why shared?
✅ **App functionality** - Shared with Firebase for authentication and app features
✅ **Account management** - Shared with Firebase for user account management
✅ **Analytics** - Shared with Firebase for analytics

---

## 📋 Quick Reference Table

| Data Type | Collected | Shared | Ephemeral | Required/Optional | Why Collected | Why Shared |
|-----------|-----------|--------|-----------|-------------------|---------------|------------|
| **Photos** | ✅ Yes | ✅ Yes | ❌ No | ✅ Optional | App functionality | App functionality |
| **Videos** | ✅ Yes | ✅ Yes | ❌ No | ✅ Optional | App functionality | App functionality |
| **Crash Logs** | ✅ Yes | ✅ Yes | ❌ No | ✅ Required | Analytics, App functionality | Analytics |
| **Performance Data** | ✅ Yes | ✅ Yes | ❌ No | ✅ Required | Analytics, App functionality | Analytics |
| **App Interactions** | ✅ Yes | ✅ Yes | ❌ No | ✅ Required | Analytics, App functionality | Analytics |
| **User Content** | ✅ Yes | ✅ Yes | ❌ No | ✅ Optional | App functionality | App functionality |
| **Device IDs** | ✅ Yes | ✅ Yes | ❌ No | ✅ Required | App functionality, Account management, Analytics | App functionality, Account management, Analytics |

---

## ✅ Summary

### All Data Types:
- ✅ **Collected:** Yes (for all)
- ✅ **Shared:** Yes (all shared with Firebase/Google)
- ❌ **Ephemeral:** No (all stored, not just in memory)
- **Required/Optional:**
  - ✅ **Optional:** Photos, Videos, User Content (users choose)
  - ✅ **Required:** Crash Logs, Performance Data, App Interactions, Device IDs (automatic)

### Why Collected/Shared:
- ✅ **App functionality** - For photos, videos, content, device IDs
- ✅ **Analytics** - For crash logs, performance, interactions, device IDs
- ✅ **Account management** - For device IDs

**All answers are accurate and safe!** ✅

