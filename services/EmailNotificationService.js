import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "../config/firebase";

class EmailNotificationService {
  static COLLECTION_NAME = "prayer_reminders";

  // Get current user's email from Firebase Auth
  static getCurrentUserEmail() {
    const user = auth.currentUser;
    return user?.email || null;
  }

  // Create a new prayer reminder in Firestore
  static async createReminder(reminderData) {
    try {
      const userEmail = this.getCurrentUserEmail();
      if (!userEmail) {
        throw new Error("User must be logged in to create reminders");
      }

      const reminder = {
        userId: auth.currentUser.uid,
        email: userEmail,
        title: reminderData.title || "Prayer Reminder",
        time: reminderData.time, // HH:MM format
        date: reminderData.date || null, // YYYY-MM-DD format (for one-time reminders)
        recurrence: reminderData.recurrence || "none", // "none", "daily", "weekly", "custom"
        daysOfWeek: reminderData.daysOfWeek || [], // [0,1,2,3,4,5,6] for custom weekly (0=Sunday)
        isActive: reminderData.isActive !== false,
        createdAt: serverTimestamp(),
        lastTriggered: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Store user's timezone
      };

      const docRef = await addDoc(
        collection(db, this.COLLECTION_NAME),
        reminder
      );

      return {
        id: docRef.id,
        ...reminder,
      };
    } catch (error) {
      console.error("Error creating reminder:", error);
      throw error;
    }
  }

  // Get all reminders for the current user
  static async getAllReminders() {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        return [];
      }

      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      const reminders = [];

      querySnapshot.forEach((doc) => {
        reminders.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort by creation date (newest first)
      reminders.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      return reminders;
    } catch (error) {
      console.error("Error getting reminders:", error);
      return [];
    }
  }

  // Get active reminders for the current user
  static async getActiveReminders() {
    try {
      const reminders = await this.getAllReminders();
      return reminders.filter((r) => r.isActive);
    } catch (error) {
      console.error("Error getting active reminders:", error);
      return [];
    }
  }

  // Update a reminder
  static async updateReminder(reminderId, updates) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User must be logged in to update reminders");
      }

      const reminderRef = doc(db, this.COLLECTION_NAME, reminderId);

      // Verify the reminder belongs to the current user
      const reminders = await this.getAllReminders();
      const reminder = reminders.find((r) => r.id === reminderId);

      if (!reminder || reminder.userId !== userId) {
        throw new Error("Reminder not found or access denied");
      }

      await updateDoc(reminderRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return { id: reminderId, ...reminder, ...updates };
    } catch (error) {
      console.error("Error updating reminder:", error);
      throw error;
    }
  }

  // Delete a reminder
  static async deleteReminder(reminderId) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User must be logged in to delete reminders");
      }

      // Verify the reminder belongs to the current user
      const reminders = await this.getAllReminders();
      const reminder = reminders.find((r) => r.id === reminderId);

      if (!reminder || reminder.userId !== userId) {
        throw new Error("Reminder not found or access denied");
      }

      await deleteDoc(doc(db, this.COLLECTION_NAME, reminderId));
      return true;
    } catch (error) {
      console.error("Error deleting reminder:", error);
      throw error;
    }
  }

  // Toggle reminder active status
  static async toggleReminder(reminderId) {
    try {
      const reminders = await this.getAllReminders();
      const reminder = reminders.find((r) => r.id === reminderId);

      if (!reminder) {
        throw new Error("Reminder not found");
      }

      return await this.updateReminder(reminderId, {
        isActive: !reminder.isActive,
      });
    } catch (error) {
      console.error("Error toggling reminder:", error);
      throw error;
    }
  }

  // Get reminders for a specific date
  static async getRemindersForDate(date) {
    try {
      const reminders = await this.getActiveReminders();
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      return reminders.filter((reminder) => {
        // One-time reminder for this specific date
        if (reminder.recurrence === "none" && reminder.date === dateStr) {
          return true;
        }

        // Daily reminder
        if (reminder.recurrence === "daily") {
          return true;
        }

        // Weekly reminder (same day of week)
        if (reminder.recurrence === "weekly") {
          // For weekly, we'll check if it's the same day of week
          // This is a simple implementation - you might want to track which day was originally set
          return true; // Simplified - shows all weekly reminders
        }

        // Custom weekly (specific days)
        if (reminder.recurrence === "custom" && reminder.daysOfWeek) {
          return reminder.daysOfWeek.includes(dayOfWeek);
        }

        return false;
      });
    } catch (error) {
      console.error("Error getting reminders for date:", error);
      return [];
    }
  }

  // Format time for display
  static formatTime(timeString) {
    // timeString is in HH:MM format
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Format date for display
  static formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Get recurrence display text
  static getRecurrenceText(reminder) {
    switch (reminder.recurrence) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "custom":
        if (reminder.daysOfWeek && reminder.daysOfWeek.length > 0) {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const days = reminder.daysOfWeek.map((d) => dayNames[d]).join(", ");
          return days;
        }
        return "Custom";
      case "none":
        return reminder.date ? this.formatDate(reminder.date) : "One-time";
      default:
        return "One-time";
    }
  }
}

export default EmailNotificationService;
