import AsyncStorage from "@react-native-async-storage/async-storage";

const DARK_MODE_KEY = "@BibleCommunity:darkMode";

class DarkModeService {
  /**
   * Get dark mode preference
   * @returns {Promise<boolean>} true if dark mode is enabled
   */
  static async isDarkMode() {
    try {
      const value = await AsyncStorage.getItem(DARK_MODE_KEY);
      return value === "true";
    } catch (error) {
      console.error("Error reading dark mode preference:", error);
      return false; // Default to light mode
    }
  }

  /**
   * Set dark mode preference
   * @param {boolean} enabled - true to enable dark mode, false to disable
   */
  static async setDarkMode(enabled) {
    try {
      await AsyncStorage.setItem(DARK_MODE_KEY, enabled ? "true" : "false");
    } catch (error) {
      console.error("Error saving dark mode preference:", error);
    }
  }

  /**
   * Toggle dark mode
   * @returns {Promise<boolean>} new dark mode state
   */
  static async toggleDarkMode() {
    const current = await this.isDarkMode();
    const newState = !current;
    await this.setDarkMode(newState);
    return newState;
  }
}

export default DarkModeService;




