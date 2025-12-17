import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NotificationFirebaseService from "../services/NotificationFirebaseService";
import NotificationService from "../services/NotificationService";
import WorkingAuthService from "../services/WorkingAuthService";

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserAndNotifications();

    // Set up real-time listener
    let unsubscribe = null;
    const setupListener = async () => {
      try {
        const user = await WorkingAuthService.getCurrentUser();
        if (user && user.uid) {
          setUserId(user.uid);
          try {
            // Use a no-op error handler to prevent any warnings
            unsubscribe = NotificationFirebaseService.subscribeToNotifications(
              user.uid,
              (notifications) => {
                setNotifications(notifications);
                const unread = notifications.filter((n) => !n.isRead).length;
                setUnreadCount(unread);
              },
              () => {} // No-op error handler - silently handle all errors
            );
          } catch (listenerError) {
            // Silently handle errors - user may not be logged in yet
            // This is expected behavior, no need to log errors
          }
        }
      } catch (error) {
        // Silently handle errors - user may not be logged in yet
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const loadUserAndNotifications = async () => {
    try {
      const user = await WorkingAuthService.getCurrentUser();
      if (user && user.uid) {
        setUserId(user.uid);
        try {
          const allNotifications = await NotificationFirebaseService.getUserNotifications(user.uid);
          setNotifications(allNotifications);
          const count = await NotificationFirebaseService.getUnreadCount(user.uid);
          setUnreadCount(count);
        } catch (notifError) {
          // User-friendly message instead of error
          setNotifications([]);
          setUnreadCount(0);
          // Don't show error alert - just show empty state with friendly message
        }
      } else {
        // User not logged in - show friendly message
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      // Silently handle errors
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserAndNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification) => {
    try {
      if (!userId) return;

      // Mark as read if unread
      if (!notification.isRead) {
        await NotificationFirebaseService.markAsRead(userId, notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Handle navigation based on notification type
      handleNotificationNavigation(notification);
    } catch (error) {
      console.error("Error handling notification press:", error);
    }
  };

  const handleNotificationNavigation = (notification) => {
    const { type, data } = notification;

    switch (type) {
      case "new_comment":
      case "comment":
        if (data && data.postId) {
          // Navigate to post detail
          navigation.navigate("PostDetail", { postId: data.postId });
        } else if (data && data.communityId) {
          // Navigate to community
          navigation.navigate("CommunityDetail", {
            communityId: data.communityId,
          });
        }
        break;
      case "new_post":
      case "post":
        if (data && data.postId) {
          // Navigate to post detail
          navigation.navigate("PostDetail", { postId: data.postId });
        } else if (data && data.communityId) {
          // Navigate to community
          navigation.navigate("CommunityDetail", {
            communityId: data.communityId,
          });
        }
        break;
      case "like":
        if (data && data.testimonyId) {
          // Navigate to testimony detail
          navigation.navigate("TestimonyDetail", {
            testimonyId: data.testimonyId,
          });
        }
        break;
      case "prayer_request":
        if (data && data.prayerRequestId) {
          // Navigate to prayer requests
          navigation.navigate("AllPrayerRequests");
        }
        break;
      case "testimony_approved":
        if (data && data.testimonyId) {
          // Navigate to testimonies
          navigation.navigate("Testimonies");
        }
        break;
      case "community_invite":
        if (data && data.communityId) {
          // Navigate to community detail
          navigation.navigate("CommunityDetail", {
            communityId: data.communityId,
          });
        }
        break;
      case "daily_scripture":
        // Navigate to Bible Study
        navigation.navigate("Bible Study");
        break;
      default:
        // Default action - just mark as read
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (!userId) return;
      const markedCount = await NotificationFirebaseService.markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      Alert.alert("Success", `Marked ${markedCount} notifications as read`);
    } catch (error) {
      console.error("Error marking all as read:", error);
      Alert.alert("Error", "Failed to mark all notifications as read");
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      if (!userId) return;
      await NotificationFirebaseService.deleteNotification(userId, notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

      // Update unread count
      const count = await NotificationFirebaseService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error deleting notification:", error);
      Alert.alert("Error", "Failed to delete notification");
    }
  };

  const handleClearAll = async () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              if (!userId) return;
              await NotificationFirebaseService.clearAllNotifications(userId);
              setNotifications([]);
              setUnreadCount(0);
            } catch (error) {
              console.error("Error clearing notifications:", error);
              Alert.alert("Error", "Failed to clear notifications");
            }
          },
        },
      ]
    );
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case "unread":
        return notifications.filter((n) => !n.isRead);
      case "read":
        return notifications.filter((n) => n.isRead);
      default:
        return notifications;
    }
  };

  const renderNotification = ({ item }) => {
    // Format timestamp if it's a Firestore timestamp
    let createdAt = item.createdAt;
    if (createdAt && createdAt.toDate) {
      createdAt = createdAt.toDate().toISOString();
    } else if (createdAt && typeof createdAt === "object") {
      createdAt = new Date(createdAt.seconds * 1000).toISOString();
    }

    const display = NotificationService.getNotificationDisplay(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.isRead && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationContent}>
          <View
            style={[
              styles.notificationIcon,
              { backgroundColor: display.color },
            ]}
          >
            <Ionicons name={display.icon} size={20} color="#fff" />
          </View>

          <View style={styles.notificationText}>
            <Text
              style={[
                styles.notificationTitle,
                !item.isRead && styles.unreadText,
              ]}
            >
              {item.title}
            </Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>
              {NotificationService.formatNotificationTime(createdAt || item.createdAt)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteNotification(item.id)}
          >
            <Ionicons name="close" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {!item.isRead && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const user = userId;
    const isLoggedIn = !!user;
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="notifications-outline" size={64} color="#ccc" />
        <Text style={styles.emptyStateTitle}>No Notifications</Text>
        <Text style={styles.emptyStateText}>
          {!isLoggedIn
            ? "Sign in to see your notifications. You'll be notified when people interact with your posts or when there are updates for you."
            : filter === "unread"
            ? "You're all caught up! No unread notifications."
            : filter === "read"
            ? "No read notifications yet."
            : "You'll see notifications here when people interact with your posts or when we have updates for you."}
        </Text>
      </View>
    );
  };

  const renderFilterButton = (filterType, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.activeFilterButton,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterType && styles.activeFilterButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a365d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={handleMarkAllAsRead}
              >
                <Text style={styles.markAllButtonText}>Mark All Read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearAll}
            >
              <Ionicons name="trash-outline" size={20} color="#1a365d" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {renderFilterButton("all", `All (${notifications.length})`)}
          {renderFilterButton("unread", `Unread (${unreadCount})`)}
          {renderFilterButton(
            "read",
            `Read (${notifications.length - unreadCount})`
          )}
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={getFilteredNotifications()}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#1a365d",
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  markAllButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  markAllButtonText: {
    fontSize: 12,
    color: "#1a365d",
    fontWeight: "600",
  },
  clearButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: "#fff",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  activeFilterButtonText: {
    color: "#1a365d",
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: "#1a365d",
  },
  notificationContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "flex-start",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: "bold",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  unreadIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1a365d",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default NotificationScreen;














