import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../config/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import * as Notifications from "expo-notifications";

const NotificationSettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [prayerReminders, setPrayerReminders] = useState(true);
  const [communityUpdates, setCommunityUpdates] = useState(true);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const preferences = userData.preferences || {};
        
        setPushNotifications(preferences.pushNotifications !== false);
        setEmailNotifications(preferences.emailNotifications !== false);
        setPrayerReminders(preferences.prayerReminders !== false);
        setCommunityUpdates(preferences.communityUpdates !== false);
      }

      // Check actual notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        setPushNotifications(false);
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to save settings");
        return;
      }

      await updateDoc(doc(db, "users", user.uid), {
        "preferences.pushNotifications": pushNotifications,
        "preferences.emailNotifications": emailNotifications,
        "preferences.prayerReminders": prayerReminders,
        "preferences.communityUpdates": communityUpdates,
        updatedAt: serverTimestamp(),
      });

      // Request permissions if enabling push notifications
      if (pushNotifications) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to receive push notifications."
          );
        }
      }

      Alert.alert("Success", "Notification settings saved!");
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (setting, value) => {
    switch (setting) {
      case "push":
        setPushNotifications(value);
        break;
      case "email":
        setEmailNotifications(value);
        break;
      case "prayer":
        setPrayerReminders(value);
        break;
      case "community":
        setCommunityUpdates(value);
        break;
    }
    // Auto-save on toggle
    setTimeout(() => saveSettings(), 500);
  };

  const renderSettingRow = (icon, title, subtitle, value, onValueChange) => {
    return (
      <View style={styles.settingRow}>
        <View style={styles.settingRowLeft}>
          <Ionicons name={icon} size={24} color="#1a365d" />
          <View style={styles.settingRowText}>
            <Text style={styles.settingRowTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingRowSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: "#ccc", true: "#1a365d" }}
          thumbColor="#fff"
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a365d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionDescription}>
          Choose how you want to receive notifications from Bible Community.
        </Text>

        {/* Push Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          {renderSettingRow(
            "notifications-outline",
            "Push Notifications",
            "Receive notifications on your device",
            pushNotifications,
            (value) => handleToggle("push", value)
          )}
        </View>

        {/* Email Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Notifications</Text>
          {renderSettingRow(
            "mail-outline",
            "Email Updates",
            "Receive updates via email",
            emailNotifications,
            (value) => handleToggle("email", value)
          )}
        </View>

        {/* Prayer Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prayer Reminders</Text>
          {renderSettingRow(
            "time-outline",
            "Prayer Reminders",
            "Get reminded for your scheduled prayers",
            prayerReminders,
            (value) => handleToggle("prayer", value)
          )}
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => navigation.navigate("PrayerTimeScreen")}
          >
            <Text style={styles.manageButtonText}>Manage Prayer Reminders</Text>
            <Ionicons name="chevron-forward" size={20} color="#1a365d" />
          </TouchableOpacity>
        </View>

        {/* Community Updates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community</Text>
          {renderSettingRow(
            "people-outline",
            "Community Updates",
            "Notifications about your communities",
            communityUpdates,
            (value) => handleToggle("community", value)
          )}
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#1a365d" />
          <Text style={styles.infoText}>
            You can change notification permissions anytime in your device settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingRowText: {
    marginLeft: 12,
    flex: 1,
  },
  settingRowTitle: {
    fontSize: 16,
    color: "#333",
    marginBottom: 2,
  },
  settingRowSubtitle: {
    fontSize: 13,
    color: "#999",
  },
  manageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  manageButtonText: {
    fontSize: 14,
    color: "#1a365d",
    fontWeight: "500",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e8f0fe",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1a365d",
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;






