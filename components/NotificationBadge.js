import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NotificationFirebaseService from "../services/NotificationFirebaseService";
import WorkingAuthService from "../services/WorkingAuthService";

const NotificationBadge = ({ onPress, size = 24, color = "#1a365d" }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserAndNotifications();

    // Set up real-time listener for notifications
    let unsubscribe = null;
    const setupListener = async () => {
      try {
        const user = await WorkingAuthService.getCurrentUser();
        if (user && user.uid) {
          setUserId(user.uid);
          try {
            unsubscribe = NotificationFirebaseService.subscribeToNotifications(
              user.uid,
              async (notifications) => {
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
          const count = await NotificationFirebaseService.getUnreadCount(user.uid);
          setUnreadCount(count);
        } catch (notifError) {
          // Silently handle errors - user may not be logged in yet
          // This is expected behavior, no need to log errors
          setUnreadCount(0);
        }
      } else {
        // User not logged in - no notifications to show
        setUnreadCount(0);
      }
    } catch (error) {
      // Silently handle errors - user may not be logged in yet
      setUnreadCount(0);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default NotificationBadge;














