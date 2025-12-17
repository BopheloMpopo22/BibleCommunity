import EmailNotificationService from "./EmailNotificationService";

/**
 * PrayerReminderService - Wrapper service for prayer reminders
 * Uses EmailNotificationService to save reminders to Firestore
 * for email notifications via Cloud Functions
 */
class PrayerReminderService {
  /**
   * Get all reminders for the current user
   */
  static async getAllReminders() {
    return await EmailNotificationService.getAllReminders();
  }

  /**
   * Get active reminders for the current user
   */
  static async getActiveReminders() {
    return await EmailNotificationService.getActiveReminders();
  }

  /**
   * Create a new prayer reminder
   * @param {Object} reminderData - Reminder data
   * @param {string} reminderData.title - Reminder title (optional)
   * @param {string} reminderData.time - Time in HH:MM format
   * @param {string} reminderData.date - Date in YYYY-MM-DD format (for one-time reminders)
   * @param {string} reminderData.recurrence - "none", "daily", "weekly", "custom"
   * @param {Array<number>} reminderData.daysOfWeek - Array of day numbers [0-6] for custom recurrence
   * @param {boolean} reminderData.isActive - Whether reminder is active
   */
  static async createReminder(reminderData) {
    return await EmailNotificationService.createReminder(reminderData);
  }

  /**
   * Update a reminder
   * @param {string} reminderId - Reminder ID
   * @param {Object} updates - Fields to update
   */
  static async updateReminder(reminderId, updates) {
    return await EmailNotificationService.updateReminder(reminderId, updates);
  }

  /**
   * Delete a reminder
   * @param {string} reminderId - Reminder ID
   */
  static async deleteReminder(reminderId) {
    return await EmailNotificationService.deleteReminder(reminderId);
  }

  /**
   * Toggle reminder active status
   * @param {string} reminderId - Reminder ID
   */
  static async toggleReminder(reminderId) {
    return await EmailNotificationService.toggleReminder(reminderId);
  }

  /**
   * Get reminders for a specific date
   * @param {Date} date - Date to get reminders for
   */
  static async getRemindersForDate(date) {
    return await EmailNotificationService.getRemindersForDate(date);
  }

  /**
   * Format time for display
   * @param {string} timeString - Time in HH:MM format
   */
  static formatTime(timeString) {
    return EmailNotificationService.formatTime(timeString);
  }

  /**
   * Format date for display
   * @param {string} dateString - Date in YYYY-MM-DD format
   */
  static formatDate(dateString) {
    return EmailNotificationService.formatDate(dateString);
  }

  /**
   * Get recurrence display text
   * @param {Object} reminder - Reminder object
   */
  static getRecurrenceText(reminder) {
    return EmailNotificationService.getRecurrenceText(reminder);
  }
}

export default PrayerReminderService;
