# How to Delete Communities from Firebase

## Problem

You created multiple test communities (e.g., 4 communities named "poems") and some don't show the delete button even though you created them. This happens when:

1. The `creatorId` field doesn't match your current user ID
2. You were logged in with a different account when creating them
3. There was an authentication issue during creation

## Solution 1: Use the Admin Button in the App (Easiest)

1. Go to the **Communities** tab
2. Look for the **trash icon** (🗑️) in the top-right corner of the header
3. Tap it to see options:
   - **Preview First**: See all communities named "poems" before deleting
   - **Delete All 'Poems'**: Delete all communities with that name

This will delete all communities named "poems" regardless of who created them.

## Solution 2: Delete via Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** in the left sidebar
4. Click on the **communities** collection
5. Find communities named "poems" (you can search by name)
6. Click on each community document
7. Click the **Delete** button (trash icon) at the top
8. Confirm deletion

**Note**: You can delete multiple communities at once by:

- Selecting multiple documents (checkboxes)
- Clicking the delete button

## Solution 3: Fix Creator ID (If You Want to Keep Them)

If you want to keep a community but fix the creator ID so you can delete it later:

1. In the app, go to the community detail page
2. Check the console logs - you'll see:
   ```
   👤 Creator check for community [id]: {
     communityCreatorId: "...",
     firebaseCreatorId: "...",
     currentUserId: "...",
     isCreator: false/true
   }
   ```

If `isCreator` is `false` but you created it, you can fix it:

```javascript
// In React Native Debugger or console:
import CommunityAdminService from "./services/CommunityAdminService";

// Fix the creatorId for a specific community
await CommunityAdminService.fixCreatorId("community-id-here");
```

## Solution 4: Use the Admin Service Directly

You can also use the admin service programmatically:

```javascript
import CommunityAdminService from "./services/CommunityAdminService";

// Preview communities before deleting
const communities = await CommunityAdminService.getCommunitiesByName("poems");
console.log("Found communities:", communities);

// Delete all communities named "poems"
const result = await CommunityAdminService.deleteCommunitiesByName("poems");
console.log("Deleted:", result.deleted, "communities");
console.log("Errors:", result.errors);
```

## Why One Community Doesn't Show Delete Button

The delete button only shows if:

- `communityData.creatorId === currentUser.uid` (from Firebase)
- OR `community?.creatorId === currentUser.uid` (from route params)

If neither matches, you won't see the delete button. This can happen if:

- You created it while logged in with a different account
- The `creatorId` wasn't set correctly during creation
- You're viewing it on a different device/account

**Fix**: Use Solution 1 (Admin Button) to delete it, or Solution 3 to fix the creatorId.

## Security Note

The admin service bypasses normal security rules for cleanup purposes. In production, you might want to:

- Remove the admin button from the header
- Add additional authentication checks
- Restrict admin functions to specific user roles

For now, it's useful for cleaning up test data!
