import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import WorkingAuthService from "./WorkingAuthService";
import CommunityService from "./CommunityService";

class NotificationFirebaseService {
  // Create a notification for a specific user
  static async createNotification(userId, notificationData) {
    try {
      const notification = {
        ...notificationData,
        userId: userId,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Store in Firestore under users/{userId}/notifications
      const notificationsRef = collection(db, "users", userId, "notifications");
      const docRef = await addDoc(notificationsRef, notification);
      
      console.log("✅ Notification created:", docRef.id);
      return { id: docRef.id, ...notification };
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Get all notifications for the current user
  static async getUserNotifications(userId, limitCount = 50) {
    try {
      if (!userId) {
        return []; // Silently return empty array - user not logged in
      }
      
      // Verify user is authenticated before attempting to fetch
      const WorkingAuthService = (await import("./WorkingAuthService")).default;
      const currentUser = await WorkingAuthService.getCurrentUser();
      
      if (!currentUser || !currentUser.uid || currentUser.uid !== userId) {
        return []; // Silently return empty array - user not authenticated
      }
      
      const notificationsRef = collection(db, "users", userId, "notifications");
      const q = query(
        notificationsRef,
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];
      
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return notifications;
    } catch (error) {
      // Silently handle all errors - user may not be authenticated
      // This is expected behavior, no need to log errors
      return []; // Return empty array for any errors
    }
  }

  // Get unread count for the current user
  static async getUnreadCount(userId) {
    try {
      if (!userId) {
        return 0; // Silently return 0 - user not logged in
      }
      
      // Verify user is authenticated before attempting to fetch
      const WorkingAuthService = (await import("./WorkingAuthService")).default;
      const currentUser = await WorkingAuthService.getCurrentUser();
      
      if (!currentUser || !currentUser.uid || currentUser.uid !== userId) {
        return 0; // Silently return 0 - user not authenticated
      }
      
      const notificationsRef = collection(db, "users", userId, "notifications");
      const q = query(
        notificationsRef,
        where("isRead", "==", false)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      // Silently handle all errors - user may not be authenticated
      // This is expected behavior, no need to log errors
      return 0;
    }
  }

  // Mark notification as read
  static async markAsRead(userId, notificationId) {
    try {
      const notificationRef = doc(db, "users", userId, "notifications", notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId) {
    try {
      const notificationsRef = collection(db, "users", userId, "notifications");
      const q = query(notificationsRef, where("isRead", "==", false));
      const querySnapshot = await getDocs(q);

      const updatePromises = [];
      querySnapshot.forEach((doc) => {
        updatePromises.push(
          updateDoc(doc.ref, {
            isRead: true,
            updatedAt: serverTimestamp(),
          })
        );
      });

      await Promise.all(updatePromises);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(userId, notificationId) {
    try {
      const notificationRef = doc(db, "users", userId, "notifications", notificationId);
      await deleteDoc(notificationRef);
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  // Clear all notifications
  static async clearAllNotifications(userId) {
    try {
      const notificationsRef = collection(db, "users", userId, "notifications");
      const querySnapshot = await getDocs(notificationsRef);

      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      throw error;
    }
  }

  // Notify community members about a new post
  static async notifyNewPost(postData) {
    try {
      const { communityId, authorId, title, id: postId } = postData;
      
      if (!communityId) return;

      // Get all members of the community
      const community = await CommunityService.getCommunity(communityId);
      if (!community) return;

      const members = community.members || [];
      const creatorId = community.creatorId;

      // Notify all members except the post author
      const notificationPromises = [];
      
      for (const memberId of members) {
        if (memberId !== authorId) {
          notificationPromises.push(
            this.createNotification(memberId, {
              type: "new_post",
              title: "New post in community",
              message: `${postData.author || "Someone"} posted in ${community.name || "the community"}`,
              data: {
                postId: postId,
                communityId: communityId,
                authorId: authorId,
              },
            })
          );
        }
      }

      // Also notify the creator if they're not already a member or the author
      if (creatorId && creatorId !== authorId && !members.includes(creatorId)) {
        notificationPromises.push(
          this.createNotification(creatorId, {
            type: "new_post",
            title: "New post in your community",
            message: `${postData.author || "Someone"} posted in ${community.name || "your community"}`,
            data: {
              postId: postId,
              communityId: communityId,
              authorId: authorId,
            },
          })
        );
      }

      await Promise.all(notificationPromises);
      console.log(`✅ Notified ${notificationPromises.length} users about new post`);
    } catch (error) {
      console.error("Error notifying about new post:", error);
      // Don't throw - notifications are non-critical
    }
  }

  // Notify post author and community members about a new comment
  static async notifyNewComment(commentData) {
    try {
      const { postId, authorId, postAuthorId, communityId } = commentData;
      
      if (!postId || !authorId) return;

      // Notify the post author (if comment is not from them)
      if (postAuthorId && postAuthorId !== authorId) {
        await this.createNotification(postAuthorId, {
          type: "new_comment",
          title: "New comment on your post",
          message: `${commentData.author || "Someone"} commented on your post`,
          data: {
            postId: postId,
            commentId: commentData.id,
            authorId: authorId,
            communityId: communityId,
          },
        });
      }

      // Get community members to notify (excluding post author and comment author)
      if (communityId) {
        try {
          const CommunityService = (await import("./CommunityService")).default;
          const community = await CommunityService.getCommunity(communityId);
          if (community) {
            const members = community.members || [];
            const creatorId = community.creatorId;

            // Notify members who are not the post author or comment author
            const notificationPromises = [];
            const notifiedUsers = new Set([postAuthorId, authorId].filter(Boolean)); // Filter out null/undefined

            for (const memberId of members) {
              if (memberId && !notifiedUsers.has(memberId)) {
                notificationPromises.push(
                  this.createNotification(memberId, {
                    type: "new_comment",
                    title: "New comment in community",
                    message: `${commentData.author || "Someone"} commented on a post in ${community.name || "the community"}`,
                    data: {
                      postId: postId,
                      commentId: commentData.id,
                      authorId: authorId,
                      communityId: communityId,
                    },
                  })
                );
                notifiedUsers.add(memberId);
              }
            }

            // Notify creator if not already notified
            if (creatorId && !notifiedUsers.has(creatorId)) {
              notificationPromises.push(
                this.createNotification(creatorId, {
                  type: "new_comment",
                  title: "New comment in your community",
                  message: `${commentData.author || "Someone"} commented on a post in ${community.name || "your community"}`,
                  data: {
                    postId: postId,
                    commentId: commentData.id,
                    authorId: authorId,
                    communityId: communityId,
                  },
                })
              );
            }

            if (notificationPromises.length > 0) {
              await Promise.all(notificationPromises);
              console.log(`✅ Notified ${notificationPromises.length} users about new comment`);
            }
          }
        } catch (communityError) {
          console.log("⚠️ Error fetching community for notifications:", communityError.message);
        }
      }
    } catch (error) {
      console.log("⚠️ Error in notifyNewComment:", error.message);
      // Don't throw - notifications are non-critical
    }
  }

  // Set up real-time listener for notifications
  static subscribeToNotifications(userId, callback, onError = () => {}) {
    try {
      if (!userId) {
        return null; // Silently return null - user not logged in
      }

      const notificationsRef = collection(db, "users", userId, "notifications");
      const q = query(notificationsRef, orderBy("createdAt", "desc"), limit(50));

      return onSnapshot(
        q,
        (querySnapshot) => {
          const notifications = [];
          querySnapshot.forEach((doc) => {
            notifications.push({
              id: doc.id,
              ...doc.data(),
            });
          });
          callback(notifications);
        },
        (error) => {
          // Silently handle all errors - user may not be authenticated
          // This is expected behavior, no need to log errors
          callback([]); // Return empty array on any error
          onError(error); // Call the error handler (which is a no-op by default)
        }
      );
    } catch (error) {
      // Silently handle errors
      return null;
    }
  }
}

export default NotificationFirebaseService;

