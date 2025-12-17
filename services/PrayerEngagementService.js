import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../config/firebase";
import FirebaseStorageService from "./FirebaseStorageService";

class PrayerEngagementService {
  static LIKES_KEY = "prayer_likes";
  static COMMENTS_KEY = "prayer_comments";

  // Get unique prayer ID
  static getPrayerId(prayer) {
    return prayer.id || `${prayer.timestamp || Date.now()}_${prayer.title?.substring(0, 10) || "prayer"}`;
  }

  // Toggle like for a prayer (local only, no Firebase)
  static async toggleLike(prayerId) {
    try {
      const likesData = await AsyncStorage.getItem(this.LIKES_KEY);
      const likesMap = likesData ? JSON.parse(likesData) : {};
      const isLiked = !!likesMap[prayerId];

      // Toggle like
      if (isLiked) {
        delete likesMap[prayerId];
      } else {
        likesMap[prayerId] = true;
      }

      await AsyncStorage.setItem(this.LIKES_KEY, JSON.stringify(likesMap));
      return { liked: !isLiked };
    } catch (error) {
      // If there's an error, log it but don't throw
      // This ensures the UI can still update even if storage fails
      console.warn("Error toggling like (non-critical):", error.message || error);
      // Return the opposite of current state as fallback
      const likesData = await AsyncStorage.getItem(this.LIKES_KEY);
      const likesMap = likesData ? JSON.parse(likesData) : {};
      const isLiked = !!likesMap[prayerId];
      return { liked: !isLiked };
    }
  }

  // Check if prayer is liked
  static async isLiked(prayerId) {
    try {
      const likesData = await AsyncStorage.getItem(this.LIKES_KEY);
      if (!likesData) return false;
      const likesMap = JSON.parse(likesData);
      return !!likesMap[prayerId];
    } catch (error) {
      console.error("Error checking like:", error);
      return false;
    }
  }

  // Get like count for a prayer (from stored prayers)
  static async getLikeCount(prayerId, allPrayers) {
    try {
      // First check if we have a stored like count
      const prayer = allPrayers.find((p) => this.getPrayerId(p) === prayerId);
      if (prayer && prayer.likes !== undefined) {
        return prayer.likes || 0;
      }
      // Count likes from likes map
      const likesData = await AsyncStorage.getItem(this.LIKES_KEY);
      if (!likesData) return 0;
      const likesMap = JSON.parse(likesData);
      // Count how many users liked this prayer
      return Object.keys(likesMap).filter((id) => id === prayerId).length;
    } catch (error) {
      console.error("Error getting like count:", error);
      return 0;
    }
  }

  // Add comment to a prayer (with optional media)
  static async addComment(prayerId, commentData) {
    try {
      const { text, author = "Anonymous", media = null } = commentData;
      
      // Get current user
      const currentUser = auth.currentUser;
      const userId = currentUser?.uid || "anonymous";
      const userName = currentUser?.displayName || author;
      
      // Upload comment media to Firebase Storage if present
      let uploadedMedia = media;
      if (media && media.uri && !media.uri.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          console.log("Uploading comment media to Firebase Storage...");
          if (media.type === "image") {
            const uploadResult = await FirebaseStorageService.uploadImage(
              media.uri,
              "comments/images"
            );
            uploadedMedia = {
              type: "image",
              uri: uploadResult.url,
              url: uploadResult.url,
            };
          } else if (media.type === "video") {
            const uploadResult = await FirebaseStorageService.uploadVideo(
              media.uri,
              "comments/videos"
            );
            uploadedMedia = {
              type: "video",
              uri: uploadResult.url,
              url: uploadResult.url,
              thumbnail: uploadResult.thumbnail || media.thumbnail,
              duration: media.duration,
            };
          }
          console.log("Comment media uploaded successfully");
        } catch (uploadError) {
          console.warn("Error uploading comment media to Firebase Storage:", uploadError.message);
          // Continue with local URI if upload fails (graceful degradation)
        }
      }
      
      const commentId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const comment = {
        id: commentId,
        text: text?.trim() || "",
        author: userName,
        authorId: userId,
        media: uploadedMedia,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      };

      // Save to Firestore (for multi-user access)
      try {
        const { doc, getDoc, updateDoc, increment } = await import("firebase/firestore");
        
        // Determine which collection (prayers or prayer_requests)
        const prayerDocRef = doc(db, "prayers", prayerId);
        const requestDocRef = doc(db, "prayer_requests", prayerId);
        
        const prayerDocSnap = await getDoc(prayerDocRef);
        const requestDocSnap = await getDoc(requestDocRef);
        
        let collectionName = null;
        if (prayerDocSnap.exists()) {
          collectionName = "prayers";
        } else if (requestDocSnap.exists()) {
          collectionName = "prayer_requests";
        }
        
        // Only save to Firestore if the prayer/request exists
        if (collectionName) {
          // Add comment to Firestore subcollection
          const commentRef = collection(db, collectionName, prayerId, "comments");
          await addDoc(commentRef, {
            text: comment.text,
            author: comment.author,
            authorId: comment.authorId,
            media: comment.media,
            createdAt: serverTimestamp(),
            timestamp: Date.now(),
          });
          
          // Update comment count
          await updateDoc(doc(db, collectionName, prayerId), {
            comments: increment(1),
          });
          
          console.log("Comment saved to Firestore");
        } else {
          console.log("Prayer/request not found in Firestore, saving locally only");
        }
      } catch (firestoreError) {
        console.warn("Error saving comment to Firestore (using local storage):", firestoreError.message);
        // Continue with local storage as fallback
      }

      // Also save locally for immediate display and offline access
      const commentsData = await AsyncStorage.getItem(this.COMMENTS_KEY);
      const commentsMap = commentsData ? JSON.parse(commentsData) : {};
      
      if (!commentsMap[prayerId]) {
        commentsMap[prayerId] = [];
      }
      
      commentsMap[prayerId].push(comment);
      await AsyncStorage.setItem(this.COMMENTS_KEY, JSON.stringify(commentsMap));

      return comment;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  // Get comments for a prayer
  static async getComments(prayerId) {
    try {
      const allComments = [];
      
      // Get comments from Firestore
      try {
        // Try prayers collection first
        const prayersCommentsRef = collection(db, "prayers", prayerId, "comments");
        const prayersQuery = query(prayersCommentsRef, orderBy("createdAt", "desc"));
        const prayersSnapshot = await getDocs(prayersQuery);
        
        prayersSnapshot.forEach((doc) => {
          const data = doc.data();
          allComments.push({
            id: doc.id,
            text: data.text,
            author: data.author,
            media: data.media,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            timestamp: data.timestamp || data.createdAt?.toDate?.()?.getTime() || Date.now(),
          });
        });
        
        // If no comments in prayers, try prayer_requests
        if (allComments.length === 0) {
          const requestsCommentsRef = collection(db, "prayer_requests", prayerId, "comments");
          const requestsQuery = query(requestsCommentsRef, orderBy("createdAt", "desc"));
          const requestsSnapshot = await getDocs(requestsQuery);
          
          requestsSnapshot.forEach((doc) => {
            const data = doc.data();
            allComments.push({
              id: doc.id,
              text: data.text,
              author: data.author,
              media: data.media,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              timestamp: data.timestamp || data.createdAt?.toDate?.()?.getTime() || Date.now(),
            });
          });
        }
      } catch (firestoreError) {
        console.warn("Error getting comments from Firestore (using local storage):", firestoreError.message);
      }
      
      // Also get local comments and merge
      try {
        const commentsData = await AsyncStorage.getItem(this.COMMENTS_KEY);
        if (commentsData) {
          const commentsMap = JSON.parse(commentsData);
          const localComments = commentsMap[prayerId] || [];
          
          // Merge local comments (avoid duplicates)
          const firebaseCommentIds = new Set(allComments.map(c => c.id));
          const uniqueLocalComments = localComments.filter(c => !firebaseCommentIds.has(c.id));
          allComments.push(...uniqueLocalComments);
        }
      } catch (localError) {
        console.warn("Error getting local comments:", localError.message);
      }
      
      // Sort by timestamp (newest first)
      return allComments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (error) {
      console.error("Error getting comments:", error);
      // Fallback to local storage
      try {
        const commentsData = await AsyncStorage.getItem(this.COMMENTS_KEY);
        if (!commentsData) return [];
        const commentsMap = JSON.parse(commentsData);
        const comments = commentsMap[prayerId] || [];
        return comments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      } catch (fallbackError) {
        return [];
      }
    }
  }

  // Update prayer like count in stored prayers (local only, no Firebase)
  static async updatePrayerLikeCount(prayerId, increment) {
    try {
      // Update in community prayers
      const prayersData = await AsyncStorage.getItem("community_prayers");
      if (prayersData) {
        try {
          const prayers = JSON.parse(prayersData);
          const updated = prayers.map((p) => {
            if (this.getPrayerId(p) === prayerId) {
              return { ...p, likes: Math.max(0, (p.likes || 0) + increment) };
            }
            return p;
          });
          await AsyncStorage.setItem("community_prayers", JSON.stringify(updated));
        } catch (parseError) {
          console.error("Error parsing prayers data:", parseError);
          // Don't throw, just log
        }
      }

      // Update in prayer requests
      const requestsData = await AsyncStorage.getItem("prayer_requests");
      if (requestsData) {
        try {
          const requests = JSON.parse(requestsData);
          const updated = requests.map((r) => {
            if (this.getPrayerId(r) === prayerId) {
              return { ...r, likes: Math.max(0, (r.likes || 0) + increment) };
            }
            return r;
          });
          await AsyncStorage.setItem("prayer_requests", JSON.stringify(updated));
        } catch (parseError) {
          console.error("Error parsing requests data:", parseError);
          // Don't throw, just log
        }
      }
    } catch (error) {
      // Silently handle errors - don't break the like functionality
      // This ensures likes work even if storage update fails
      console.warn("Error updating prayer like count (non-critical):", error.message || error);
    }
  }

  // Format time ago
  static formatTimeAgo(timestamp) {
    if (!timestamp) return "now";
    
    const now = Date.now();
    const time = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
    const diff = now - time;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return "now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(time).toLocaleDateString();
  }
}

export default PrayerEngagementService;

