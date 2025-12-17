import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PrayerReminderService from "../services/PrayerReminderService";
import { auth } from "../config/firebase";

const PrayerTimeScreen = ({ navigation }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedRecurrence, setSelectedRecurrence] = useState("daily");
  const [reminderTitle, setReminderTitle] = useState("Prayer Reminder");

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const userReminders = await PrayerReminderService.getAllReminders();
      setReminders(userReminders);
    } catch (error) {
      console.error("Error loading reminders:", error);
      Alert.alert("Error", "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async () => {
    if (!auth.currentUser) {
      Alert.alert("Sign In Required", "Please sign in to create prayer reminders.");
      navigation.navigate("PrayerAuth");
      return;
    }

    try {
      const reminderData = {
        title: reminderTitle,
        time: selectedTime,
        recurrence: selectedRecurrence,
        isActive: true,
      };

      await PrayerReminderService.createReminder(reminderData);
      Alert.alert("Success", "Prayer reminder created!");
      setShowAddModal(false);
      setReminderTitle("Prayer Reminder");
      setSelectedTime("09:00");
      setSelectedRecurrence("daily");
      loadReminders();
    } catch (error) {
      console.error("Error creating reminder:", error);
      Alert.alert("Error", error.message || "Failed to create reminder");
    }
  };

  const handleToggleReminder = async (reminderId) => {
    try {
      await PrayerReminderService.toggleReminder(reminderId);
      loadReminders();
    } catch (error) {
      console.error("Error toggling reminder:", error);
      Alert.alert("Error", "Failed to update reminder");
    }
  };

  const handleDeleteReminder = (reminderId) => {
    Alert.alert(
      "Delete Reminder",
      "Are you sure you want to delete this reminder?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await PrayerReminderService.deleteReminder(reminderId);
              loadReminders();
            } catch (error) {
              console.error("Error deleting reminder:", error);
              Alert.alert("Error", "Failed to delete reminder");
            }
          },
        },
      ]
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getRecurrenceText = (recurrence) => {
    switch (recurrence) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "custom":
        return "Custom";
      default:
        return "One-time";
    }
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
        <Text style={styles.headerTitle}>Prayer Time</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (!auth.currentUser) {
              Alert.alert("Sign In Required", "Please sign in to create prayer reminders.");
              navigation.navigate("PrayerAuth");
              return;
            }
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#1a365d" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!auth.currentUser ? (
          <View style={styles.signInPrompt}>
            <Ionicons name="time-outline" size={64} color="#ccc" />
            <Text style={styles.signInTitle}>Sign In to Set Reminders</Text>
            <Text style={styles.signInText}>
              Create prayer reminders to help you stay consistent in your prayer life.
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => navigation.navigate("PrayerAuth")}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reminders...</Text>
          </View>
        ) : reminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Reminders Yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to create your first prayer reminder
            </Text>
          </View>
        ) : (
          <View style={styles.remindersList}>
            {reminders.map((reminder) => (
              <View key={reminder.id} style={styles.reminderCard}>
                <View style={styles.reminderContent}>
                  <View style={styles.reminderHeader}>
                    <Text style={styles.reminderTitle}>
                      {reminder.title || "Prayer Reminder"}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleToggleReminder(reminder.id)}
                      style={styles.toggleButton}
                    >
                      <Ionicons
                        name={reminder.isActive ? "notifications" : "notifications-off"}
                        size={24}
                        color={reminder.isActive ? "#1a365d" : "#ccc"}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.reminderDetails}>
                    <View style={styles.reminderDetailRow}>
                      <Ionicons name="time" size={16} color="#666" />
                      <Text style={styles.reminderDetailText}>
                        {formatTime(reminder.time)}
                      </Text>
                    </View>
                    <View style={styles.reminderDetailRow}>
                      <Ionicons name="repeat" size={16} color="#666" />
                      <Text style={styles.reminderDetailText}>
                        {getRecurrenceText(reminder.recurrence)}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteReminder(reminder.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Prayer Reminder</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Prayer Reminder"
                  value={reminderTitle}
                  onChangeText={setReminderTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:00"
                  value={selectedTime}
                  onChangeText={setSelectedTime}
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>Format: HH:MM (24-hour)</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Repeat</Text>
                <View style={styles.recurrenceButtons}>
                  {["daily", "weekly", "none"].map((recurrence) => (
                    <TouchableOpacity
                      key={recurrence}
                      style={[
                        styles.recurrenceButton,
                        selectedRecurrence === recurrence &&
                          styles.recurrenceButtonActive,
                      ]}
                      onPress={() => setSelectedRecurrence(recurrence)}
                    >
                      <Text
                        style={[
                          styles.recurrenceButtonText,
                          selectedRecurrence === recurrence &&
                            styles.recurrenceButtonTextActive,
                        ]}
                      >
                        {recurrence.charAt(0).toUpperCase() + recurrence.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateReminder}
              >
                <Text style={styles.createButtonText}>Create Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  signInPrompt: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 100,
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a365d",
    marginTop: 20,
    marginBottom: 12,
  },
  signInText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  signInButton: {
    backgroundColor: "#1a365d",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  remindersList: {
    padding: 16,
  },
  reminderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a365d",
    flex: 1,
  },
  toggleButton: {
    padding: 4,
  },
  reminderDetails: {
    flexDirection: "row",
    gap: 16,
  },
  reminderDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reminderDetailText: {
    fontSize: 14,
    color: "#666",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  recurrenceButtons: {
    flexDirection: "row",
    gap: 8,
  },
  recurrenceButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  recurrenceButtonActive: {
    backgroundColor: "#1a365d",
    borderColor: "#1a365d",
  },
  recurrenceButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  recurrenceButtonTextActive: {
    color: "#fff",
  },
  createButton: {
    backgroundColor: "#1a365d",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PrayerTimeScreen;

