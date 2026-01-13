import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../config/firebase";
import WorkingAuthService from "../services/WorkingAuthService";

const SettingsScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [appVersion, setAppVersion] = useState("1.0.0");

  useEffect(() => {
    loadUserInfo();
    loadAppVersion();
  }, []);

  const loadUserInfo = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const loadAppVersion = () => {
    // Version from package.json or default
    setAppVersion("1.0.0");
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await WorkingAuthService.signOut();
              navigation.navigate("CommunityMain");
            } catch (error) {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "Email us at: support@biblecommunity.app",
      [{ text: "OK" }]
    );
  };

  const renderSettingItem = (icon, title, subtitle, onPress, showArrow = true) => {
    return (
      <TouchableOpacity style={styles.settingItem} onPress={onPress}>
        <View style={styles.settingItemLeft}>
          <Ionicons name={icon} size={24} color="#1a365d" />
          <View style={styles.settingItemText}>
            <Text style={styles.settingItemTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        {showArrow && (
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        )}
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section */}
        {user && (
          <View style={styles.section}>
            <View style={styles.userSection}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={32} color="#1a365d" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.displayName || "User"}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {user ? (
            <>
              {renderSettingItem(
                "person-outline",
                "Edit Profile",
                "Update your name and profile picture",
                () => Alert.alert("Coming Soon", "Profile editing will be available soon.")
              )}
              {renderSettingItem(
                "notifications-outline",
                "Notifications",
                "Manage notification preferences",
                () => Alert.alert("Coming Soon", "Notification settings will be available soon.")
              )}
              {renderSettingItem(
                "time-outline",
                "Prayer Reminders",
                "Manage your prayer reminders",
                () => navigation.navigate("PrayerTimeScreen")
              )}
              {renderSettingItem(
                "log-out-outline",
                "Sign Out",
                null,
                handleSignOut,
                false
              )}
            </>
          ) : (
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate("Auth")}
            >
              <Text style={styles.signInButtonText}>Sign In to Access Settings</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          {renderSettingItem(
            "shield-checkmark-outline",
            "Privacy Policy",
            "How we collect and use your data",
            () => navigation.navigate("PrivacyPolicy")
          )}
          {renderSettingItem(
            "document-text-outline",
            "Terms of Service",
            "Terms and conditions for using the app",
            () => navigation.navigate("TermsOfService")
          )}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {renderSettingItem(
            "help-circle-outline",
            "Contact Support",
            "Get help with the app",
            handleContactSupport
          )}
          {renderSettingItem(
            "information-circle-outline",
            "About",
            "Learn more about Bible Community",
            () => Alert.alert(
              "About Bible Community",
              "A Christian community app for Bible study, prayer, and fellowship.\n\nVersion " + appVersion
            )
          )}
        </View>

        {/* App Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Bible Community</Text>
          <Text style={styles.footerVersion}>Version {appVersion}</Text>
          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} Bible Community. All rights reserved.
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
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 0.5,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e8f0fe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a365d",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingItemText: {
    marginLeft: 12,
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    color: "#333",
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 13,
    color: "#999",
  },
  signInButton: {
    backgroundColor: "#1a365d",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 14,
    color: "#999",
    marginBottom: 8,
  },
  footerCopyright: {
    fontSize: 12,
    color: "#ccc",
    textAlign: "center",
  },
});

export default SettingsScreen;

