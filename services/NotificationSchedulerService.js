import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationSchedulerService {
  // Request notification permissions
  static async requestPermissions() {
    try {
      if (!Notifications || !Device) {
        console.warn("expo-notifications or expo-device not available");
        return { status: "denied" };
      }

      if (!Device.isDevice) {
        console.warn("Must use physical device for Push Notifications");
        return { status: "denied" };
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Only request permissions if they haven't been granted or denied yet
      // If already granted, return immediately
      if (existingStatus === "granted") {
        return { status: "granted" };
      }

      // If denied, don't ask again (user would need to go to settings)
      if (existingStatus === "denied") {
        return { status: "denied" };
      }

      // Only request if status is "undetermined" (first time)
      if (existingStatus === "undetermined") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Failed to get push token for push notification!");
        return { status: finalStatus };
      }

      // Configure notification channel for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("prayer-reminders", {
          name: "Prayer Reminders",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#1a365d",
          sound: "default",
          enableVibrate: true,
          showBadge: true,
        });
      }

      return { status: finalStatus };
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return { status: "denied" };
    }
  }

  // Schedule a notification for a reminder
  static async scheduleNotification(reminder) {
    try {
      if (!reminder.isActive) {
        return null;
      }

      const [hours, minutes] = reminder.time.split(":").map(Number);
      const notificationId = reminder.id;

      // Cancel any existing notifications for this reminder
      await this.cancelNotification(notificationId);

      let notificationIds = [];

      if (reminder.recurrence === "none") {
        // One-time notification
        if (reminder.date) {
          const notificationDate = new Date(reminder.date);
          notificationDate.setHours(hours, minutes, 0, 0);

          // Only schedule if the date is in the future
          if (notificationDate > new Date()) {
            const id = await Notifications.scheduleNotificationAsync({
              content: {
                title: reminder.title || "Prayer Reminder",
                body: "Time for your prayer. Take a moment to connect with God.",
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: { reminderId: reminder.id, type: "prayer_reminder" },
              },
              trigger: notificationDate,
              identifier: notificationId,
            });
            notificationIds.push(id);
          }
        }
      } else if (reminder.recurrence === "daily") {
        // Daily notification - schedule for every day
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.title || "Prayer Reminder",
            body: "Time for your prayer. Take a moment to connect with God.",
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { reminderId: reminder.id, type: "prayer_reminder" },
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          },
          identifier: notificationId,
        });
        notificationIds.push(id);
      } else if (reminder.recurrence === "weekly") {
        // Weekly notification - schedule for weekdays (Monday-Friday)
        // daysOfWeek: [1, 2, 3, 4, 5] = Monday to Friday
        const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday
        for (const weekday of weekdays) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: reminder.title || "Prayer Reminder",
              body: "Time for your prayer. Take a moment to connect with God.",
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: { reminderId: reminder.id, type: "prayer_reminder" },
            },
            trigger: {
              weekday: weekday,
              hour: hours,
              minute: minutes,
              repeats: true,
            },
            identifier: `${notificationId}_${weekday}`,
          });
          notificationIds.push(id);
        }
      } else if (reminder.recurrence === "custom" && reminder.daysOfWeek) {
        // Custom weekly - schedule for selected days
        // expo-notifications uses 1-7 (Monday-Sunday), our app uses 0-6 (Sunday-Saturday)
        for (const weekday of reminder.daysOfWeek) {
          // Convert: 0 (Sunday) -> 7, 1 (Monday) -> 1, ..., 6 (Saturday) -> 6
          const expoWeekday = weekday === 0 ? 7 : weekday;
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: reminder.title || "Prayer Reminder",
              body: "Time for your prayer. Take a moment to connect with God.",
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: { reminderId: reminder.id, type: "prayer_reminder" },
            },
            trigger: {
              weekday: expoWeekday,
              hour: hours,
              minute: minutes,
              repeats: true,
            },
            identifier: `${notificationId}_${weekday}`,
          });
          notificationIds.push(id);
        }
      }

      return notificationIds;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      return null;
    }
  }

  // Cancel all notifications for a reminder
  static async cancelNotification(reminderId) {
    try {
      // Get all scheduled notifications
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();

      // Find and cancel all notifications related to this reminder
      const notificationsToCancel = scheduledNotifications.filter(
        (notification) => {
          const identifier = notification.identifier;
          // Check if it's the main notification or a recurring one
          return (
            identifier === reminderId ||
            identifier.startsWith(`${reminderId}_`)
          );
        }
      );

      // Cancel each notification
      for (const notification of notificationsToCancel) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }

      return true;
    } catch (error) {
      console.error("Error canceling notification:", error);
      return false;
    }
  }

  // Reschedule all active reminders
  static async rescheduleAllReminders(reminders) {
    try {
      // Cancel all existing notifications first
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduledNotifications) {
        if (notification.content?.data?.type === "prayer_reminder") {
          await Notifications.cancelScheduledNotificationAsync(
            notification.identifier
          );
        }
      }

      // Schedule all active reminders
      for (const reminder of reminders) {
        if (reminder.isActive) {
          await this.scheduleNotification(reminder);
        }
      }

      return true;
    } catch (error) {
      console.error("Error rescheduling all reminders:", error);
      return false;
    }
  }

  // Get all scheduled notifications
  static async getAllScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error getting scheduled notifications:", error);
      return [];
    }
  }

  // Cancel all prayer reminder notifications
  static async cancelAllReminders() {
    try {
      if (!Notifications) {
        console.warn("expo-notifications not available, cannot cancel reminders");
        return false;
      }
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduledNotifications) {
        if (notification.content?.data?.type === "prayer_reminder") {
          await Notifications.cancelScheduledNotificationAsync(
            notification.identifier
          );
        }
      }
      return true;
    } catch (error) {
      console.error("Error canceling all reminders:", error);
      return false;
    }
  }
}

export default NotificationSchedulerService;

