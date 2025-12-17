import React, { useState, useEffect } from "react";
import { View, Image, TouchableOpacity, StyleSheet, Alert, AppState } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WorkingAuthService from "../services/WorkingAuthService";

const LOGIN_REMINDER_DISMISSED_KEY = "login_reminder_dismissed";

const UserAvatar = ({
  size = 40,
  onPress,
  onLongPress,
  style,
  showBorder = true,
}) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageKey, setImageKey] = useState(0); // Key to force image refresh when photoURL changes
  const [showLoginReminder, setShowLoginReminder] = useState(false);

  useEffect(() => {
    loadUserData();
    // Check login reminder after a small delay to ensure auth state is checked
    setTimeout(() => {
      checkLoginReminder();
    }, 1000);

    // Listen for auth state changes to update avatar
    const unsubscribe = WorkingAuthService.onAuthStateChanged((user) => {
      if (user) {
        // Add a small delay to ensure Firebase Auth has updated
        setTimeout(() => {
          loadUserData();
        }, 500);
        // Hide login reminder if user logs in
        setShowLoginReminder(false);
      } else {
        setUserData(null);
        setLoading(false);
        // Show login reminder if user logs out
        setTimeout(() => {
          checkLoginReminder();
        }, 500);
      }
    });

    // Listen for app state changes (when app comes to foreground)
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // Check reminder when app comes to foreground
        setTimeout(() => {
          checkLoginReminder();
        }, 500);
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const checkLoginReminder = async () => {
    try {
      const user = await WorkingAuthService.getCurrentUser();
      // Check Firebase Auth directly as well
      const { auth } = await import("../config/firebase");
      const firebaseUser = auth.currentUser;
      
      // User is not logged in if both are null/undefined
      if ((!user || !user.uid) && !firebaseUser) {
        // Check if reminder was dismissed
        const dismissed = await AsyncStorage.getItem(LOGIN_REMINDER_DISMISSED_KEY);
        if (!dismissed) {
          setShowLoginReminder(true);
        } else {
          setShowLoginReminder(false);
        }
      } else {
        // User is logged in - hide reminder
        setShowLoginReminder(false);
      }
    } catch (error) {
      // Silently handle errors - if there's an error, assume not logged in
      try {
        const dismissed = await AsyncStorage.getItem(LOGIN_REMINDER_DISMISSED_KEY);
        if (!dismissed) {
          setShowLoginReminder(true);
        }
      } catch (e) {
        // Silently handle
      }
    }
  };

  const handleReminderPress = () => {
    Alert.alert(
      "Sign In Required",
      "Please sign in to like posts, comment, create communities, and access all features.",
      [
        { text: "Dismiss", style: "cancel", onPress: dismissReminder },
        { 
          text: "Sign In", 
          onPress: () => {
            dismissReminder();
            if (onPress) onPress();
          }
        }
      ]
    );
  };

  const dismissReminder = async () => {
    try {
      await AsyncStorage.setItem(LOGIN_REMINDER_DISMISSED_KEY, "true");
      setShowLoginReminder(false);
    } catch (error) {
      // Silently handle errors
    }
  };

  const loadUserData = async () => {
    try {
      const user = await WorkingAuthService.getCurrentUser();
      // If photoURL changed, update the image key to force refresh
      if (user && user.photoURL) {
        if (!userData || userData.photoURL !== user.photoURL) {
          console.log("Profile picture changed, forcing refresh");
          setImageKey(prev => prev + 1);
        }
      }
      setUserData(user);
    } catch (error) {
      console.log("No user data found");
    } finally {
      setLoading(false);
    }
  };

  const avatarSize = size;
  const borderWidth = showBorder ? 2 : 0;

  if (loading) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderWidth,
          },
          style,
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <Ionicons name="person-outline" size={avatarSize * 0.6} color="#fff" />
      </TouchableOpacity>
    );
  }

  const renderAvatar = () => {
    if (userData && userData.photoURL) {
      return (
        <Image
          source={{ 
            uri: userData.photoURL,
            cache: 'reload' // Force reload to avoid caching old images
          }}
          key={`avatar-${userData.photoURL}-${imageKey}`} // Force re-render when URL or key changes
          style={[
            styles.avatarImage,
            {
              width: avatarSize - borderWidth * 2,
              height: avatarSize - borderWidth * 2,
              borderRadius: (avatarSize - borderWidth * 2) / 2,
            },
          ]}
          resizeMode="cover"
          onError={(error) => {
            console.log("Error loading avatar image:", error);
          }}
        />
      );
    }

    return (
      <Ionicons name="person-outline" size={avatarSize * 0.6} color="#fff" />
    );
  };

  return (
    <View style={styles.avatarWrapper}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderWidth,
          },
          style,
        ]}
        onPress={showLoginReminder ? handleReminderPress : onPress}
        onLongPress={onLongPress}
      >
        {renderAvatar()}
      </TouchableOpacity>
      {showLoginReminder && (
        <TouchableOpacity
          style={styles.loginReminder}
          onPress={handleReminderPress}
        >
          <View style={styles.loginReminderDot} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatarWrapper: {
    position: "relative",
  },
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#fff",
  },
  avatarImage: {
    backgroundColor: "#f0f0f0",
  },
  loginReminder: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  loginReminderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF6B6B",
    borderWidth: 2,
    borderColor: "#fff",
  },
});

export default UserAvatar;
