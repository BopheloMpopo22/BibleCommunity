# Script to Delete Posts Without authorId

## ⚠️ Warning
This script will delete ALL posts that don't have an `authorId` field. Use with caution!

## Option 1: Firebase Console (Safest - Recommended)

**Manual deletion is safest. Follow `DELETE_OLD_TEST_POSTS.md` guide.**

## Option 2: Firebase CLI Script

If you have Firebase CLI installed and want to delete posts programmatically:

### Prerequisites
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Select your project: `firebase use <your-project-id>`

### Script (Node.js)

Create a file `deleteOldPosts.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deletePostsWithoutAuthorId() {
  try {
    const postsRef = db.collection('posts');
    const snapshot = await postsRef.get();
    
    let deletedCount = 0;
    let keptCount = 0;
    
    snapshot.forEach(async (doc) => {
      const data = doc.data();
      
      // Check if post is missing authorId
      if (!data.authorId && !data.author_id) {
        console.log(`Deleting post without authorId: ${doc.id}`);
        await doc.ref.delete();
        deletedCount++;
      } else {
        console.log(`Keeping post with authorId: ${doc.id}`);
        keptCount++;
      }
    });
    
    console.log(`\nSummary:`);
    console.log(`Deleted: ${deletedCount} posts`);
    console.log(`Kept: ${keptCount} posts`);
  } catch (error) {
    console.error('Error:', error);
  }
}

deletePostsWithoutAuthorId();
```

**⚠️ This requires a service account key. Only use if you're comfortable with Firebase Admin SDK.**

---

## Option 3: Simple Manual Check (Easiest)

**Just use Firebase Console:**
1. Go to Firestore → `posts`
2. Click each post
3. If `authorId` field is missing → Delete it
4. If `authorId` exists → Keep it

---

## Recommendation

**Use Option 3 (Manual)** - It's the safest and you can see exactly what you're deleting!

