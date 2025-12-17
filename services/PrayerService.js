import AsyncStorage from "@react-native-async-storage/async-storage";

class PrayerService {
  static STORAGE_KEY = "community_prayers";
  static PRAYER_REQUESTS_KEY = "prayer_requests";

  // Get all prayers
  static async getAllPrayers() {
    try {
      const prayersJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      return prayersJson ? JSON.parse(prayersJson) : [];
    } catch (error) {
      console.error("Error getting prayers:", error);
      return [];
    }
  }

  // Save a new prayer
  static async savePrayer(prayer) {
    try {
      const prayers = await this.getAllPrayers();
      prayers.unshift(prayer); // Add to beginning of array
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(prayers));
      return true;
    } catch (error) {
      console.error("Error saving prayer:", error);
      return false;
    }
  }

  // Get prayers by category
  static async getPrayersByCategory(category) {
    try {
      const prayers = await this.getAllPrayers();
      return prayers.filter((prayer) => prayer.category === category);
    } catch (error) {
      console.error("Error getting prayers by category:", error);
      return [];
    }
  }

  // Get prayers by author
  static async getPrayersByAuthor(author) {
    try {
      const prayers = await this.getAllPrayers();
      return prayers.filter((prayer) => prayer.author === author);
    } catch (error) {
      console.error("Error getting prayers by author:", error);
      return [];
    }
  }

  // Search prayers by text
  static async searchPrayers(searchTerm) {
    try {
      const prayers = await this.getAllPrayers();
      const lowerSearchTerm = searchTerm.toLowerCase();
      return prayers.filter(
        (prayer) =>
          prayer.title.toLowerCase().includes(lowerSearchTerm) ||
          prayer.body.toLowerCase().includes(lowerSearchTerm) ||
          prayer.tags.some((tag) => tag.toLowerCase().includes(lowerSearchTerm))
      );
    } catch (error) {
      console.error("Error searching prayers:", error);
      return [];
    }
  }

  // Delete a prayer
  static async deletePrayer(prayerId) {
    try {
      const prayers = await this.getAllPrayers();
      const filteredPrayers = prayers.filter(
        (prayer) => prayer.id !== prayerId
      );
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(filteredPrayers)
      );
      return true;
    } catch (error) {
      console.error("Error deleting prayer:", error);
      return false;
    }
  }

  // Update a prayer
  static async updatePrayer(prayerId, updates) {
    try {
      const prayers = await this.getAllPrayers();
      const prayerIndex = prayers.findIndex((prayer) => prayer.id === prayerId);

      if (prayerIndex !== -1) {
        prayers[prayerIndex] = { ...prayers[prayerIndex], ...updates };
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(prayers));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating prayer:", error);
      return false;
    }
  }

  // Get prayer statistics
  static async getPrayerStats() {
    try {
      const prayers = await this.getAllPrayers();
      const stats = {
        total: prayers.length,
        byCategory: {},
        byAuthor: {},
        recent: prayers.slice(0, 5), // Last 5 prayers
      };

      // Count by category
      prayers.forEach((prayer) => {
        stats.byCategory[prayer.category] =
          (stats.byCategory[prayer.category] || 0) + 1;
        stats.byAuthor[prayer.author] =
          (stats.byAuthor[prayer.author] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error("Error getting prayer stats:", error);
      return { total: 0, byCategory: {}, byAuthor: {}, recent: [] };
    }
  }

  // Clear all prayers (for testing/reset)
  static async clearAllPrayers() {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing prayers:", error);
      return false;
    }
  }

  // ===== PRAYER REQUESTS METHODS =====

  // Get all prayer requests
  static async getAllPrayerRequests() {
    try {
      const requestsJson = await AsyncStorage.getItem(this.PRAYER_REQUESTS_KEY);
      return requestsJson ? JSON.parse(requestsJson) : [];
    } catch (error) {
      console.error("Error getting prayer requests:", error);
      return [];
    }
  }

  // Save a new prayer request
  static async savePrayerRequest(request) {
    try {
      const requests = await this.getAllPrayerRequests();
      requests.unshift(request); // Add to beginning of array (most recent first)
      await AsyncStorage.setItem(
        this.PRAYER_REQUESTS_KEY,
        JSON.stringify(requests)
      );
      return true;
    } catch (error) {
      console.error("Error saving prayer request:", error);
      return false;
    }
  }

  // Get prayer requests by category
  static async getPrayerRequestsByCategory(category) {
    try {
      const requests = await this.getAllPrayerRequests();
      return requests.filter((request) => request.category === category);
    } catch (error) {
      console.error("Error getting prayer requests by category:", error);
      return [];
    }
  }

  // Delete a prayer request
  static async deletePrayerRequest(requestId) {
    try {
      const requests = await this.getAllPrayerRequests();
      const filteredRequests = requests.filter(
        (request) => request.id !== requestId
      );
      await AsyncStorage.setItem(
        this.PRAYER_REQUESTS_KEY,
        JSON.stringify(filteredRequests)
      );
      return true;
    } catch (error) {
      console.error("Error deleting prayer request:", error);
      return false;
    }
  }

  // Clear all prayer requests (for testing/reset)
  static async clearAllPrayerRequests() {
    try {
      await AsyncStorage.removeItem(this.PRAYER_REQUESTS_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing prayer requests:", error);
      return false;
    }
  }
}

export default PrayerService;
