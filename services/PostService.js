import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  increment,
} from "firebase/firestore";
import { db } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FirebaseStorageService from "./FirebaseStorageService";

class PostService {
  // Create a new post
  async createPost(postData) {
    try {
      console.log("Creating post:", postData);

      // Get current user
      const userData = await this.getCurrentUser();
      if (!userData) {
        throw new Error("You must be signed in to create a post");
      }

      // Check if user is a member of the community (for new communities)
      if (postData.communityId) {
        try {
          const CommunityService = (await import("./CommunityService")).default;
          const isMember = await CommunityService.isMember(postData.communityId);
          
          // For new Firebase communities, require membership
          // For old sample communities (id 1-5), allow posting
          const isOldCommunity = ["1", "2", "3", "4", "5"].includes(postData.communityId);
          
          if (!isMember && !isOldCommunity) {
            throw new Error("You must join this community to post. Please join first.");
          }
        } catch (membershipError) {
          if (membershipError.message.includes("must join")) {
            throw membershipError;
          }
          console.warn("Error checking membership (allowing post):", membershipError.message);
        }
      }

      // Upload media to Firebase Storage if present
      let uploadedImages = postData.images || [];
      let uploadedVideos = postData.videos || [];
      let media = null;

      if ((postData.images && postData.images.length > 0) || (postData.videos && postData.videos.length > 0)) {
        try {
          console.log("Uploading media to Firebase Storage...");
          const uploadResult = await FirebaseStorageService.uploadMedia(
            {
              images: postData.images || [],
              videos: postData.videos || [],
            },
            "post"
          );
          uploadedImages = uploadResult.images;
          uploadedVideos = uploadResult.videos;
          media = uploadResult.media;
          console.log("Media uploaded successfully:", {
            images: uploadedImages.length,
            videos: uploadedVideos.length,
          });
        } catch (uploadError) {
          console.warn("Error uploading media to Firebase Storage:", uploadError.message);
          // Continue with local URIs if upload fails (graceful degradation)
          // User can still see their own media, but others won't
        }
      }

      // Prepare post data for Firestore
      const firestorePostData = {
        title: postData.title,
        content: postData.content,
        type: postData.type,
        community: postData.community,
        communityId: postData.communityId,
        author: userData.displayName || "Anonymous",
        authorId: userData.uid,
        authorPhoto: userData.photoURL || null,
        images: uploadedImages,
        videos: uploadedVideos,
        media: media,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      };

      // Add to Firestore (if available)
      let postId = Date.now().toString();
      try {
        const docRef = await addDoc(collection(db, "posts"), firestorePostData);
        postId = docRef.id;
        console.log("Post created in Firebase with ID:", postId);
        
        // Notify community members about the new post
        try {
          const NotificationFirebaseService = (await import("./NotificationFirebaseService")).default;
          await NotificationFirebaseService.notifyNewPost({
            ...firestorePostData,
            id: postId,
          });
        } catch (notifError) {
          console.warn("Error creating notifications:", notifError.message);
          // Non-critical, continue
        }
      } catch (firebaseError) {
        console.warn("Firebase error (using local storage):", firebaseError.message);
        // Continue with local storage
      }

      // Store locally for immediate display
      const createdAtDate = new Date();
      const localPost = {
        id: postId,
        ...firestorePostData,
        createdAt: createdAtDate.toISOString(),
        timeAgo: this.getTimeAgo(createdAtDate),
        isNew: true,
      };

      await this.storePostLocally(localPost);

      return {
        success: true,
        postId: postId,
        post: localPost,
      };
    } catch (error) {
      console.warn("Error creating post (using local storage):", error.message);
      // Fallback to local storage if Firebase fails
      const createdAtDate = new Date();
      const localPost = {
        id: Date.now().toString(),
        ...postData,
        author: (await this.getCurrentUser())?.displayName || "Anonymous",
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: createdAtDate.toISOString(),
        timeAgo: this.getTimeAgo(createdAtDate),
        isNew: true,
      };
      await this.storePostLocally(localPost);
      return {
        success: true,
        postId: localPost.id,
        post: localPost,
      };
    }
  }

  // Get posts for a specific community
  async getCommunityPosts(communityId, limit = 20) {
    try {
      // Simplified query to avoid composite index requirement
      // Filter by communityId only, then filter/sort in JavaScript
      const postsRef = collection(db, "posts");
      const q = query(
        postsRef,
        where("communityId", "==", communityId)
        // Removed isActive filter and orderBy to avoid composite index
      );

      const querySnapshot = await getDocs(q);
      const postsData = [];

      // First, collect all post data
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter active posts in JavaScript
        if (data.isActive === false) {
          return; // Skip inactive posts
        }
        
        // Convert images/videos arrays to media object for MediaPostCard
        let media = null;
        if (data.images && data.images.length > 0) {
          media = {
            type: "image",
            uri: data.images[0].uri, // Use first image
          };
        } else if (data.videos && data.videos.length > 0) {
          media = {
            type: "video",
            uri: data.videos[0].uri, // Use first video
          };
        }

        postsData.push({
          docId: doc.id,
          data: data,
          media: media,
        });
      });

      // Now fetch comment counts for all posts in parallel
      const postsWithComments = await Promise.all(
        postsData.map(async ({ docId, data, media }) => {
          // Get comment count from Firestore subcollection
          let commentCount = data.comments || 0;
          try {
            const commentsRef = collection(db, "posts", docId, "comments");
            const commentsSnapshot = await getDocs(commentsRef);
            commentCount = commentsSnapshot.size; // Use actual count from subcollection
          } catch (commentError) {
            // If error, use the comments field from the post document
            commentCount = data.comments || 0;
          }

          return {
            id: docId,
            ...data,
            media, // Add media object
            comments: commentCount, // Use actual comment count
            timeAgo: this.getTimeAgo(data.createdAt?.toDate()),
          };
        })
      );

      const posts = postsWithComments;
      
      // Sort by createdAt in JavaScript (descending)
      posts.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
      });

      // Combine Firebase posts with local posts
      const localPosts = await this.getLocalPosts(communityId);
      const firebasePostIds = new Set(posts.map(p => p.id));
      const uniqueLocalPosts = localPosts.filter(p => !firebasePostIds.has(p.id));
      
      // Merge posts (already sorted by date from above)
      const allPosts = [...posts, ...uniqueLocalPosts];
      
      // Ensure final sort by date (in case local posts weren't sorted)
      allPosts.sort((a, b) => {
        const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || a.timestamp || 0);
        const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || b.timestamp || 0);
        return dateB - dateA;
      });
      
      return allPosts.slice(0, limit);
    } catch (error) {
      console.warn("Error fetching community posts (using local storage):", error.message);
      // Fallback to local posts if Firebase fails
      return await this.getLocalPosts(communityId);
    }
  }

  // Get all posts (for trending/feed)
  async getAllPosts(limit = 50) {
    try {
      // Fetch from Firebase
      const postsRef = collection(db, "posts");
      const querySnapshot = await getDocs(postsRef);
      const postsData = [];

      // First, collect all post data
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter active posts
        if (data.isActive === false) {
          return; // Skip inactive posts
        }
        
        // Convert images/videos arrays to media object
        let media = null;
        if (data.images && data.images.length > 0) {
          media = {
            type: "image",
            uri: data.images[0].uri,
          };
        } else if (data.videos && data.videos.length > 0) {
          media = {
            type: "video",
            uri: data.videos[0].uri,
          };
        }

        postsData.push({
          docId: doc.id,
          data: data,
          media: media,
        });
      });

      // Now fetch comment counts for all posts in parallel
      const postsWithComments = await Promise.all(
        postsData.map(async ({ docId, data, media }) => {
          // Get comment count from Firestore subcollection
          let commentCount = data.comments || 0;
          try {
            const commentsRef = collection(db, "posts", docId, "comments");
            const commentsSnapshot = await getDocs(commentsRef);
            commentCount = commentsSnapshot.size; // Use actual count from subcollection
          } catch (commentError) {
            // If error, use the comments field from the post document
            commentCount = data.comments || 0;
          }

          return {
            id: docId,
            ...data,
            media,
            comments: commentCount, // Use actual comment count
            timeAgo: this.getTimeAgo(data.createdAt?.toDate()),
          };
        })
      );

      const posts = postsWithComments;
      
      // Sort by createdAt in JavaScript (descending)
      posts.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
      });

      // Combine Firebase posts with local posts
      const localPosts = await this.getLocalPosts();
      const firebasePostIds = new Set(posts.map(p => p.id));
      const uniqueLocalPosts = localPosts.filter(p => !firebasePostIds.has(p.id));
      
      // Merge and sort by date
      const allPosts = [...posts, ...uniqueLocalPosts].sort((a, b) => {
        const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || a.timestamp || 0);
        const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || b.timestamp || 0);
        return dateB - dateA;
      });

      return allPosts.slice(0, limit);
    } catch (error) {
      console.warn("Error fetching all posts (using local storage):", error.message);
      // Return local posts as fallback
      return await this.getLocalPosts();
    }
  }

  // Store post locally for immediate display
  async storePostLocally(post) {
    try {
      const existingPosts = await this.getLocalPosts();
      const updatedPosts = [post, ...existingPosts];

      // Keep only the latest 100 posts locally
      const limitedPosts = updatedPosts.slice(0, 100);

      await AsyncStorage.setItem("localPosts", JSON.stringify(limitedPosts));
    } catch (error) {
      console.error("Error storing post locally:", error);
    }
  }

  // Get posts from local storage
  async getLocalPosts(communityId = null) {
    try {
      const localPosts = await AsyncStorage.getItem("localPosts");
      if (!localPosts) return [];

      const posts = JSON.parse(localPosts);

      // Convert images/videos arrays to media object for MediaPostCard
      const convertedPosts = posts.map((post) => {
        let media = null;
        if (post.images && post.images.length > 0) {
          media = {
            type: "image",
            uri: post.images[0].uri, // Use first image
          };
        } else if (post.videos && post.videos.length > 0) {
          media = {
            type: "video",
            uri: post.videos[0].uri, // Use first video
            thumbnail: post.videos[0].thumbnail, // Include thumbnail if available
          };
        }

        return {
          ...post,
          media, // Add media object
        };
      });

      if (communityId) {
        return convertedPosts.filter(
          (post) => post.communityId === communityId
        );
      }

      return convertedPosts;
    } catch (error) {
      console.error("Error getting local posts:", error);
      return [];
    }
  }

  // Get current user from local storage
  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  // Calculate time ago
  // "Just now" for first 10 minutes, then show time, then date after a day
  getTimeAgo(date) {
    if (!date) return "Unknown time";

    // Handle Firestore Timestamp objects
    const postDate = date?.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);

    // "Just now" for first 10 minutes
    if (diffInMinutes < 10) return "Just now";
    
    // Show minutes for first hour (after 10 minutes)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    // Show hours for first day
    const diffInHours = Math.floor(diffInSeconds / 3600);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    // After a day, show the date
    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    // For older posts, show the actual date
    return postDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  // Toggle like persistently per user and increment counter
  async toggleLike(postId) {
    try {
      const likedRaw = await AsyncStorage.getItem("likedPosts");
      const likedMap = likedRaw ? JSON.parse(likedRaw) : {};
      const hasLiked = !!likedMap[postId];

      // Update Firestore aggregate count
      await updateDoc(doc(db, "posts", postId), {
        likes: increment(hasLiked ? -1 : 1),
        updatedAt: serverTimestamp(),
      });

      // Update local cache of liked posts
      const updated = { ...likedMap };
      if (hasLiked) delete updated[postId];
      else updated[postId] = true;
      await AsyncStorage.setItem("likedPosts", JSON.stringify(updated));

      // Update local post cache count for immediate UX
      const existing = await AsyncStorage.getItem("localPosts");
      if (existing) {
        const arr = JSON.parse(existing).map((p) =>
          p.id === postId
            ? { ...p, likes: Math.max(0, (p.likes || 0) + (hasLiked ? -1 : 1)) }
            : p
        );
        await AsyncStorage.setItem("localPosts", JSON.stringify(arr));
      }

      return { success: true, liked: !hasLiked };
    } catch (error) {
      console.error("Error toggling like:", error);
      throw new Error("Failed to update like");
    }
  }

  // Comment on a post (persisted)
  async addComment(postId, commentText, author) {
    try {
      // Get post data to find author and community
      let postDoc = null;
      let postData = null;
      try {
        postDoc = await getDoc(doc(db, "posts", postId));
        if (postDoc.exists()) {
          postData = postDoc.data();
        }
      } catch (postError) {
        console.warn("Error getting post data:", postError.message);
      }

      const payload = {
        text: commentText,
        author: author?.displayName || "You",
        authorId: author?.uid || "",
        createdAt: serverTimestamp(),
      };

      const commentRef = await addDoc(collection(db, "posts", postId, "comments"), payload);
      await updateDoc(doc(db, "posts", postId), {
        comments: increment(1),
        updatedAt: serverTimestamp(),
      });

      // Notify post author and community members about the new comment
      try {
        const NotificationFirebaseService = (await import("./NotificationFirebaseService")).default;
        await NotificationFirebaseService.notifyNewComment({
          id: commentRef.id,
          postId: postId,
          authorId: author?.uid || "",
          author: author?.displayName || "Someone",
          postAuthorId: postData?.authorId,
          communityId: postData?.communityId,
        });
      } catch (notifError) {
        console.warn("Error creating comment notifications:", notifError.message);
        // Non-critical, continue
      }

      // Update local cache count
      const existing = await AsyncStorage.getItem("localPosts");
      if (existing) {
        const arr = JSON.parse(existing).map((p) =>
          p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p
        );
        await AsyncStorage.setItem("localPosts", JSON.stringify(arr));
      }

      return { success: true };
    } catch (error) {
      console.error("Error adding comment:", error);
      throw new Error("Failed to add comment");
    }
  }

  // Get comments for a post
  async getComments(postId) {
    try {
      const commentsRef = collection(db, "posts", postId, "comments");
      const q = query(commentsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const comments = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        comments.push({
          id: doc.id,
          text: data.text,
          author: data.author,
          timeAgo: PostService.formatTimeAgo(
            data.createdAt?.toDate() || new Date()
          ),
          likes: 0, // TODO: implement comment likes
          replies: [], // TODO: implement replies
        });
      });

      return comments;
    } catch (error) {
      console.error("Error getting comments:", error);
      return [];
    }
  }

  // Helper function to format time ago
  // "Just now" for first 10 minutes, then show time, then date after a day
  static formatTimeAgo(date) {
    if (!date) return "Unknown time";

    // Handle Firestore Timestamp objects
    const postDate = date?.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);

    // "Just now" for first 10 minutes
    if (diffInMinutes < 10) return "Just now";
    
    // Show minutes for first hour (after 10 minutes)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    // Show hours for first day
    const diffInHours = Math.floor(diffInSeconds / 3600);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    // After a day, show the date
    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    // For older posts, show the actual date
    return postDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  // Track post view (works without authentication - views are public)
  async trackView(postId) {
    try {
      // Try to update view count in Firebase (non-blocking)
      try {
        await updateDoc(doc(db, "posts", postId), {
          views: increment(1),
          updatedAt: serverTimestamp(),
        });
      } catch (firebaseError) {
        // If permission error, that's okay - views can be tracked locally
        // This is a non-critical operation, so we continue silently
        if (firebaseError.code !== 'permission-denied') {
          console.warn("Error updating view count in Firebase:", firebaseError.message);
        }
      }

      // Always update local cache count (works offline and without auth)
      try {
        const existing = await AsyncStorage.getItem("localPosts");
        if (existing) {
          const arr = JSON.parse(existing).map((p) =>
            p.id === postId ? { ...p, views: (p.views || 0) + 1 } : p
          );
          await AsyncStorage.setItem("localPosts", JSON.stringify(arr));
        }
      } catch (localError) {
        // Even local storage errors are non-critical
        console.warn("Error updating local view count:", localError.message);
      }

      return { success: true };
    } catch (error) {
      // View tracking is non-critical - don't throw errors
      // Just log a warning and continue
      console.warn("Non-critical error tracking view:", error.message);
      return { success: false, error: error.message };
    }
  }

  // Delete a post (author only)
  async deletePost(postId) {
    try {
      // Check if post exists in Firestore before attempting deletion
      const postRef = doc(db, "posts", postId);
      
      // Try to delete from Firestore
      // If post doesn't exist, Firestore will throw an error, but we'll handle it gracefully
      try {
        await deleteDoc(postRef);
      } catch (firestoreError) {
        // If post doesn't exist in Firestore (already deleted), that's okay
        // We'll still remove it from local cache
        if (firestoreError.code !== 'not-found' && firestoreError.code !== 'permission-denied') {
          throw firestoreError;
        }
        // If it's a permission error, throw it so user knows they can't delete
        if (firestoreError.code === 'permission-denied') {
          throw new Error("You don't have permission to delete this post. Only the author can delete their own posts.");
        }
      }

      // Remove from local storage cache (always do this, even if Firestore delete failed)
      const existing = await AsyncStorage.getItem("localPosts");
      if (existing) {
        const arr = JSON.parse(existing).filter((p) => p.id !== postId);
        await AsyncStorage.setItem("localPosts", JSON.stringify(arr));
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting post:", error);
      // Return more specific error message
      if (error.message.includes("permission")) {
        throw error;
      }
      throw new Error(error.message || "Failed to delete post");
    }
  }

  // Clear all cached posts (useful for debugging/testing)
  async clearCachedPosts() {
    try {
      await AsyncStorage.removeItem("localPosts");
      return { success: true };
    } catch (error) {
      console.error("Error clearing cached posts:", error);
      throw new Error("Failed to clear cached posts");
    }
  }
}

export default new PostService();
