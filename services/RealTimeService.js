import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationService from "./NotificationService";

class RealTimeService {
  static listeners = new Map();
  static intervals = new Map();
  static isActive = false;

  // Start real-time updates
  static start() {
    if (this.isActive) return;

    this.isActive = true;
    console.log("Real-time service started");

    // Start various real-time features
    this.startLiveComments();
    this.startActivityFeed();
    this.startNotificationSimulation();
    this.startDailyScripture();
  }

  // Stop real-time updates
  static stop() {
    if (!this.isActive) return;

    this.isActive = false;
    console.log("Real-time service stopped");

    // Clear all intervals
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
  }

  // Add event listener
  static addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  static removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to all listeners
  static emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Simulate live comments
  static startLiveComments() {
    const intervalId = setInterval(async () => {
      if (!this.isActive) return;

      // Simulate new comments on random posts
      const shouldAddComment = Math.random() < 0.1; // 10% chance every 30 seconds

      if (shouldAddComment) {
        const sampleComments = [
          "Amen! God is so good! 🙏",
          "This really touched my heart. Thank you for sharing!",
          "Praying for you and your family",
          "What a powerful testimony! God's grace is amazing",
          "I needed to hear this today. Thank you!",
          "Praise God for His faithfulness!",
          "This gives me hope. Thank you for your encouragement",
          "God's timing is always perfect!",
          "I'm praying for your situation",
          "What a beautiful reminder of God's love",
        ];

        const randomComment =
          sampleComments[Math.floor(Math.random() * sampleComments.length)];
        const randomAuthors = [
          "Sarah M.",
          "Michael C.",
          "Emily R.",
          "David L.",
          "Lisa T.",
          "John P.",
          "Maria S.",
          "Robert K.",
        ];
        const randomAuthor =
          randomAuthors[Math.floor(Math.random() * randomAuthors.length)];

        const newComment = {
          id: Date.now().toString(),
          text: randomComment,
          author: randomAuthor,
          createdAt: new Date().toISOString(),
          likes: 0,
          postId: `post_${Math.floor(Math.random() * 10) + 1}`,
        };

        // Emit live comment event
        this.emit("liveComment", newComment);

        // Create notification for post author
        await NotificationService.createNotification({
          type: NotificationService.getNotificationTypes().COMMENT,
          title: "New comment on your post",
          message: `${randomAuthor} commented: "${randomComment.substring(
            0,
            50
          )}${randomComment.length > 50 ? "..." : ""}"`,
          data: {
            postId: newComment.postId,
            commentId: newComment.id,
            userId: randomAuthor,
          },
          icon: "chatbubble",
          color: "#1a365d",
        });
      }
    }, 30000); // Every 30 seconds

    this.intervals.set("liveComments", intervalId);
  }

  // Simulate activity feed updates
  static startActivityFeed() {
    const intervalId = setInterval(async () => {
      if (!this.isActive) return;

      // Simulate various activities
      const activities = [
        {
          type: "like",
          action: "liked",
          target: "your testimony",
          user: "Sarah Johnson",
          time: new Date().toISOString(),
        },
        {
          type: "share",
          action: "shared",
          target: "your post",
          user: "Michael Chen",
          time: new Date().toISOString(),
        },
        {
          type: "follow",
          action: "started following you",
          target: "",
          user: "Emily Rodriguez",
          time: new Date().toISOString(),
        },
        {
          type: "prayer_request",
          action: "shared a prayer request",
          target: "in Bible Study Group",
          user: "David Rodriguez",
          time: new Date().toISOString(),
        },
      ];

      const shouldAddActivity = Math.random() < 0.15; // 15% chance every 45 seconds

      if (shouldAddActivity) {
        const randomActivity =
          activities[Math.floor(Math.random() * activities.length)];

        // Emit activity feed event
        this.emit("activityUpdate", randomActivity);

        // Create notification
        const notificationType =
          NotificationService.getNotificationTypes()[
            randomActivity.type.toUpperCase()
          ];
        await NotificationService.createNotification({
          type: notificationType,
          title: `${randomActivity.user} ${randomActivity.action} ${randomActivity.target}`,
          message: `Check out the latest activity in your community`,
          data: {
            userId: randomActivity.user,
            activityType: randomActivity.type,
          },
          icon: this.getActivityIcon(randomActivity.type),
          color: this.getActivityColor(randomActivity.type),
        });
      }
    }, 45000); // Every 45 seconds

    this.intervals.set("activityFeed", intervalId);
  }

  // Simulate notification generation
  static startNotificationSimulation() {
    const intervalId = setInterval(async () => {
      if (!this.isActive) return;

      // Simulate various notifications
      const notifications = [
        {
          type: NotificationService.getNotificationTypes().PRAYER_REMINDER,
          title: "Prayer Reminder",
          message:
            "Time for your evening prayer. Take a moment to connect with God.",
          icon: "time",
          color: "#E91E63",
        },
        {
          type: NotificationService.getNotificationTypes().COMMUNITY_INVITE,
          title: "Community Invitation",
          message: 'You\'ve been invited to join "Christian Living" community',
          icon: "people",
          color: "#FF9800",
        },
        {
          type: NotificationService.getNotificationTypes().MENTION,
          title: "You were mentioned",
          message: "Sarah Johnson mentioned you in a comment",
          icon: "at",
          color: "#FF9800",
        },
      ];

      const shouldAddNotification = Math.random() < 0.05; // 5% chance every 2 minutes

      if (shouldAddNotification) {
        const randomNotification =
          notifications[Math.floor(Math.random() * notifications.length)];

        await NotificationService.createNotification(randomNotification);

        // Emit notification event
        this.emit("newNotification", randomNotification);
      }
    }, 120000); // Every 2 minutes

    this.intervals.set("notificationSimulation", intervalId);
  }

  // Daily scripture notification
  static startDailyScripture() {
    const intervalId = setInterval(async () => {
      if (!this.isActive) return;

      // Check if it's time for daily scripture (9 AM)
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      if (hour === 9 && minute === 0) {
        const dailyScriptures = [
          {
            reference: "Jeremiah 29:11",
            text: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future."',
          },
          {
            reference: "Philippians 4:13",
            text: "I can do all this through him who gives me strength.",
          },
          {
            reference: "Romans 8:28",
            text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
          },
          {
            reference: "Isaiah 40:31",
            text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
          },
          {
            reference: "Proverbs 3:5-6",
            text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
          },
        ];

        const randomScripture =
          dailyScriptures[Math.floor(Math.random() * dailyScriptures.length)];

        await NotificationService.createNotification({
          type: NotificationService.getNotificationTypes().DAILY_SCRIPTURE,
          title: "Daily Scripture",
          message: `${randomScripture.reference} - ${randomScripture.text}`,
          data: { scriptureId: randomScripture.reference },
          icon: "book",
          color: "#1a365d",
        });

        // Emit daily scripture event
        this.emit("dailyScripture", randomScripture);
      }
    }, 60000); // Check every minute

    this.intervals.set("dailyScripture", intervalId);
  }

  // Get activity icon
  static getActivityIcon(type) {
    switch (type) {
      case "like":
        return "heart";
      case "share":
        return "share";
      case "follow":
        return "person-add";
      case "prayer_request":
        return "heart";
      default:
        return "notifications";
    }
  }

  // Get activity color
  static getActivityColor(type) {
    switch (type) {
      case "like":
        return "#FF6B6B";
      case "share":
        return "#607D8B";
      case "follow":
        return "#9C27B0";
      case "prayer_request":
        return "#FF6B6B";
      default:
        return "#666";
    }
  }

  // Simulate real-time like updates
  static simulateLike(postId, userId) {
    const likeData = {
      postId,
      userId,
      timestamp: new Date().toISOString(),
    };

    this.emit("liveLike", likeData);
  }

  // Simulate real-time share updates
  static simulateShare(postId, userId) {
    const shareData = {
      postId,
      userId,
      timestamp: new Date().toISOString(),
    };

    this.emit("liveShare", shareData);
  }

  // Get connection status
  static getConnectionStatus() {
    return {
      isConnected: this.isActive,
      lastUpdate: new Date().toISOString(),
      activeListeners: Array.from(this.listeners.keys()),
    };
  }

  // Force update all listeners
  static forceUpdate() {
    this.emit("forceUpdate", { timestamp: new Date().toISOString() });
  }
}

export default RealTimeService;














