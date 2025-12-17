import AsyncStorage from "@react-native-async-storage/async-storage";

class NotificationService {
  static NOTIFICATIONS_KEY = "notifications";
  static UNREAD_COUNT_KEY = "unread_notifications_count";

  // Notification types
  static getNotificationTypes() {
    return {
      LIKE: "like",
      COMMENT: "comment",
      SHARE: "share",
      FOLLOW: "follow",
      MENTION: "mention",
      PRAYER_REQUEST: "prayer_request",
      TESTIMONY_APPROVED: "testimony_approved",
      COMMUNITY_INVITE: "community_invite",
      DAILY_SCRIPTURE: "daily_scripture",
      PRAYER_REMINDER: "prayer_reminder",
    };
  }

  // Create a notification
  static async createNotification(notification) {
    try {
      const notifications = await this.getAllNotifications();
      const newNotification = {
        id: Date.now().toString(),
        ...notification,
        createdAt: new Date().toISOString(),
        isRead: false,
        isArchived: false,
      };

      notifications.unshift(newNotification);
      await AsyncStorage.setItem(
        this.NOTIFICATIONS_KEY,
        JSON.stringify(notifications)
      );

      // Update unread count
      await this.incrementUnreadCount();

      return newNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Get all notifications
  static async getAllNotifications() {
    try {
      const notifications = await AsyncStorage.getItem(this.NOTIFICATIONS_KEY);
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
  }

  // Get unread notifications
  static async getUnreadNotifications() {
    try {
      const allNotifications = await this.getAllNotifications();
      return allNotifications.filter((notification) => !notification.isRead);
    } catch (error) {
      console.error("Error getting unread notifications:", error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId) {
    try {
      const notifications = await this.getAllNotifications();
      const notificationIndex = notifications.findIndex(
        (n) => n.id === notificationId
      );

      if (
        notificationIndex !== -1 &&
        !notifications[notificationIndex].isRead
      ) {
        notifications[notificationIndex].isRead = true;
        await AsyncStorage.setItem(
          this.NOTIFICATIONS_KEY,
          JSON.stringify(notifications)
        );
        await this.decrementUnreadCount();
        return notifications[notificationIndex];
      }

      return null;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead() {
    try {
      const notifications = await this.getAllNotifications();
      const unreadCount = notifications.filter((n) => !n.isRead).length;

      const updatedNotifications = notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }));

      await AsyncStorage.setItem(
        this.NOTIFICATIONS_KEY,
        JSON.stringify(updatedNotifications)
      );
      await this.setUnreadCount(0);

      return unreadCount;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  // Archive notification
  static async archiveNotification(notificationId) {
    try {
      const notifications = await this.getAllNotifications();
      const notificationIndex = notifications.findIndex(
        (n) => n.id === notificationId
      );

      if (notificationIndex !== -1) {
        notifications[notificationIndex].isArchived = true;
        await AsyncStorage.setItem(
          this.NOTIFICATIONS_KEY,
          JSON.stringify(notifications)
        );
        return notifications[notificationIndex];
      }

      return null;
    } catch (error) {
      console.error("Error archiving notification:", error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId) {
    try {
      const notifications = await this.getAllNotifications();
      const notification = notifications.find((n) => n.id === notificationId);
      const updatedNotifications = notifications.filter(
        (n) => n.id !== notificationId
      );

      await AsyncStorage.setItem(
        this.NOTIFICATIONS_KEY,
        JSON.stringify(updatedNotifications)
      );

      // Decrement unread count if notification was unread
      if (notification && !notification.isRead) {
        await this.decrementUnreadCount();
      }

      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  // Get unread count
  static async getUnreadCount() {
    try {
      const count = await AsyncStorage.getItem(this.UNREAD_COUNT_KEY);
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  // Set unread count
  static async setUnreadCount(count) {
    try {
      await AsyncStorage.setItem(this.UNREAD_COUNT_KEY, count.toString());
    } catch (error) {
      console.error("Error setting unread count:", error);
    }
  }

  // Increment unread count
  static async incrementUnreadCount() {
    try {
      const currentCount = await this.getUnreadCount();
      await this.setUnreadCount(currentCount + 1);
    } catch (error) {
      console.error("Error incrementing unread count:", error);
    }
  }

  // Decrement unread count
  static async decrementUnreadCount() {
    try {
      const currentCount = await this.getUnreadCount();
      await this.setUnreadCount(Math.max(0, currentCount - 1));
    } catch (error) {
      console.error("Error decrementing unread count:", error);
    }
  }

  // Get notifications by type
  static async getNotificationsByType(type) {
    try {
      const allNotifications = await this.getAllNotifications();
      return allNotifications.filter(
        (notification) => notification.type === type
      );
    } catch (error) {
      console.error("Error getting notifications by type:", error);
      return [];
    }
  }

  // Get recent notifications (last 24 hours)
  static async getRecentNotifications() {
    try {
      const allNotifications = await this.getAllNotifications();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      return allNotifications.filter(
        (notification) => new Date(notification.createdAt) > oneDayAgo
      );
    } catch (error) {
      console.error("Error getting recent notifications:", error);
      return [];
    }
  }

  // Clear all notifications
  static async clearAllNotifications() {
    try {
      await AsyncStorage.removeItem(this.NOTIFICATIONS_KEY);
      await AsyncStorage.removeItem(this.UNREAD_COUNT_KEY);
    } catch (error) {
      console.error("Error clearing notifications:", error);
      throw error;
    }
  }

  // Create sample notifications for demo
  static async createSampleNotifications() {
    try {
      const sampleNotifications = [
        {
          type: this.getNotificationTypes().LIKE,
          title: "Someone liked your testimony",
          message:
            'Sarah Johnson liked your testimony "Healed from Chronic Pain"',
          data: { testimonyId: "1", userId: "sarah123" },
          icon: "heart",
          color: "#FF6B6B",
        },
        {
          type: this.getNotificationTypes().COMMENT,
          title: "New comment on your post",
          message:
            'Michael Chen commented: "Praise God! This gives me hope for my own healing journey."',
          data: { postId: "1", commentId: "1-1", userId: "michael123" },
          icon: "chatbubble",
          color: "#1a365d",
        },
        {
          type: this.getNotificationTypes().PRAYER_REQUEST,
          title: "New prayer request",
          message:
            "David Rodriguez shared a prayer request in Bible Study Group",
          data: { prayerRequestId: "2", communityId: "1", userId: "david123" },
          icon: "heart",
          color: "#FF6B6B",
        },
        {
          type: this.getNotificationTypes().TESTIMONY_APPROVED,
          title: "Your testimony was approved",
          message:
            'Your testimony "God Provided in My Time of Need" has been verified and is now featured',
          data: { testimonyId: "2" },
          icon: "checkmark-circle",
          color: "#4CAF50",
        },
        {
          type: this.getNotificationTypes().DAILY_SCRIPTURE,
          title: "Daily Scripture",
          message:
            'Philippians 4:19 - "And my God will meet all your needs according to the riches of his glory in Christ Jesus."',
          data: { scriptureId: "phil-4-19" },
          icon: "book",
          color: "#1a365d",
        },
        {
          type: this.getNotificationTypes().COMMUNITY_INVITE,
          title: "Community invitation",
          message: 'You\'ve been invited to join "Prayer Warriors" community',
          data: { communityId: "2", inviterId: "pastor123" },
          icon: "people",
          color: "#FF9800",
        },
        {
          type: this.getNotificationTypes().FOLLOW,
          title: "New follower",
          message: "Emily Rodriguez started following you",
          data: { followerId: "emily123" },
          icon: "person-add",
          color: "#9C27B0",
        },
        {
          type: this.getNotificationTypes().SHARE,
          title: "Your post was shared",
          message:
            'Lisa Thompson shared your testimony "Delivered from Addiction"',
          data: { postId: "3", sharerId: "lisa123" },
          icon: "share",
          color: "#607D8B",
        },
      ];

      // Create notifications with different timestamps
      for (let i = 0; i < sampleNotifications.length; i++) {
        const notification = {
          ...sampleNotifications[i],
          createdAt: new Date(
            Date.now() - i * 2 * 60 * 60 * 1000
          ).toISOString(), // 2 hours apart
          isRead: i > 2, // First 3 are unread
        };

        await this.createNotification(notification);
      }
    } catch (error) {
      console.error("Error creating sample notifications:", error);
    }
  }

  // Format notification time
  static formatNotificationTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080)
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return `${Math.floor(diffInMinutes / 10080)}w ago`;
  }

  // Get notification icon and color
  static getNotificationDisplay(type) {
    const types = this.getNotificationTypes();

    switch (type) {
      case types.LIKE:
        return { icon: "heart", color: "#FF6B6B" };
      case types.COMMENT:
        return { icon: "chatbubble", color: "#1a365d" };
      case types.SHARE:
        return { icon: "share", color: "#607D8B" };
      case types.FOLLOW:
        return { icon: "person-add", color: "#9C27B0" };
      case types.MENTION:
        return { icon: "at", color: "#FF9800" };
      case types.PRAYER_REQUEST:
        return { icon: "heart", color: "#FF6B6B" };
      case types.TESTIMONY_APPROVED:
        return { icon: "checkmark-circle", color: "#4CAF50" };
      case types.COMMUNITY_INVITE:
        return { icon: "people", color: "#FF9800" };
      case types.DAILY_SCRIPTURE:
        return { icon: "book", color: "#1a365d" };
      case types.PRAYER_REMINDER:
        return { icon: "time", color: "#E91E63" };
      default:
        return { icon: "notifications", color: "#666" };
    }
  }
}

export default NotificationService;














