import AsyncStorage from "@react-native-async-storage/async-storage";
import WorkingAuthService from "./WorkingAuthService";

class PrayerScriptureCommentService {
  static PRAYER_COMMENTS_KEY = "prayer_comments";
  static SCRIPTURE_COMMENTS_KEY = "scripture_comments";

  // Get a unique ID for a prayer/scripture based on its content and date
  static getItemId(item) {
    // For partner prayers/scriptures, use their ID
    if (item.id) {
      return item.id;
    }
    // For default prayers/scriptures, create a unique ID based on time and content
    const timeOfDay = item.time || "default";
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const contentHash = item.prayer 
      ? item.prayer.substring(0, 20).replace(/\s/g, "")
      : item.text 
      ? item.text.substring(0, 20).replace(/\s/g, "")
      : "";
    return `${timeOfDay}_${date}_${contentHash}`;
  }

  // Add a comment to a prayer
  static async addPrayerComment(prayer, commentText) {
    try {
      const currentUser = WorkingAuthService.getCurrentUser();
      const prayerId = this.getItemId(prayer);
      
      const comment = {
        id: Date.now().toString(),
        text: commentText.trim(),
        author: currentUser?.displayName || "Anonymous",
        authorId: currentUser?.uid || "",
        authorPhoto: currentUser?.photoURL || null,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      };

      const comments = await this.getPrayerComments(prayerId);
      comments.push(comment);

      const allComments = await AsyncStorage.getItem(this.PRAYER_COMMENTS_KEY);
      const commentsMap = allComments ? JSON.parse(allComments) : {};
      commentsMap[prayerId] = comments;
      await AsyncStorage.setItem(this.PRAYER_COMMENTS_KEY, JSON.stringify(commentsMap));

      return comment;
    } catch (error) {
      console.error("Error adding prayer comment:", error);
      throw error;
    }
  }

  // Get comments for a prayer
  static async getPrayerComments(prayerId) {
    try {
      const allComments = await AsyncStorage.getItem(this.PRAYER_COMMENTS_KEY);
      if (!allComments) return [];
      
      const commentsMap = JSON.parse(allComments);
      return commentsMap[prayerId] || [];
    } catch (error) {
      console.error("Error getting prayer comments:", error);
      return [];
    }
  }

  // Add a comment to a scripture
  static async addScriptureComment(scripture, commentText) {
    try {
      const currentUser = WorkingAuthService.getCurrentUser();
      const scriptureId = this.getItemId(scripture);
      
      const comment = {
        id: Date.now().toString(),
        text: commentText.trim(),
        author: currentUser?.displayName || "Anonymous",
        authorId: currentUser?.uid || "",
        authorPhoto: currentUser?.photoURL || null,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      };

      const comments = await this.getScriptureComments(scriptureId);
      comments.push(comment);

      const allComments = await AsyncStorage.getItem(this.SCRIPTURE_COMMENTS_KEY);
      const commentsMap = allComments ? JSON.parse(allComments) : {};
      commentsMap[scriptureId] = comments;
      await AsyncStorage.setItem(this.SCRIPTURE_COMMENTS_KEY, JSON.stringify(commentsMap));

      return comment;
    } catch (error) {
      console.error("Error adding scripture comment:", error);
      throw error;
    }
  }

  // Get comments for a scripture
  static async getScriptureComments(scriptureId) {
    try {
      const allComments = await AsyncStorage.getItem(this.SCRIPTURE_COMMENTS_KEY);
      if (!allComments) return [];
      
      const commentsMap = JSON.parse(allComments);
      return commentsMap[scriptureId] || [];
    } catch (error) {
      console.error("Error getting scripture comments:", error);
      return [];
    }
  }

  // Format time ago
  static formatTimeAgo(timestamp) {
    if (!timestamp) return "now";
    
    const now = Date.now();
    const time = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp;
    const diff = now - time;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return "now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(time).toLocaleDateString();
  }
}

export default PrayerScriptureCommentService;


