# How to Clear Cached Posts

## Problem
After deleting posts from Firebase Console, they may still appear in the app because posts are cached locally.

## Solution: Clear Local Cache

### Option 1: Clear Cache from App (Recommended)

Add this temporary function to clear cache, or use the method below:

### Option 2: Clear Cache Manually

1. **Close the app completely** (swipe away from recent apps)

2. **Clear app data** (Android):
   - Go to Settings → Apps → Expo Go (or your app name)
   - Tap "Storage" → "Clear Data"
   - Reopen the app

3. **Clear app data** (iOS):
   - Delete and reinstall Expo Go
   - Or use Settings → General → iPhone Storage → Expo Go → Offload App

### Option 3: Programmatic Clear (For Developers)

The `PostService` now has a `clearCachedPosts()` method you can call:

```javascript
import PostService from '../services/PostService';

// Clear all cached posts
await PostService.clearCachedPosts();
```

---

## Why This Happens

- Posts are cached locally in AsyncStorage for offline support
- When you delete posts from Firebase Console, the cache isn't automatically cleared
- The app shows cached posts until you refresh or clear cache

---

## After Clearing Cache

1. ✅ Posts will reload from Firestore
2. ✅ Only real posts will show
3. ✅ Empty collection will reappear when you create new posts
4. ✅ Everything will work normally

---

## Prevention

- Always delete posts from within the app (using the three dots menu)
- This ensures both Firestore and cache are updated
- Only use Firebase Console deletion for bulk cleanup

