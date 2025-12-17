import AsyncStorage from "@react-native-async-storage/async-storage";

class CommunityStatsService {
  static COMMUNITY_STATS_KEY = "community_stats";
  static COMMUNITY_ACTIVITY_KEY = "community_activity";

  // Get community statistics
  static async getCommunityStats(communityId) {
    try {
      const allStats = await this.getAllCommunityStats();
      return allStats[communityId] || this.getDefaultStats();
    } catch (error) {
      console.error("Error getting community stats:", error);
      return this.getDefaultStats();
    }
  }

  // Get all community statistics
  static async getAllCommunityStats() {
    try {
      const stats = await AsyncStorage.getItem(this.COMMUNITY_STATS_KEY);
      return stats ? JSON.parse(stats) : {};
    } catch (error) {
      console.error("Error getting all community stats:", error);
      return {};
    }
  }

  // Update community statistics
  static async updateCommunityStats(communityId, updates) {
    try {
      const allStats = await this.getAllCommunityStats();
      const currentStats = allStats[communityId] || this.getDefaultStats();

      const updatedStats = {
        ...currentStats,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      allStats[communityId] = updatedStats;
      await AsyncStorage.setItem(
        this.COMMUNITY_STATS_KEY,
        JSON.stringify(allStats)
      );

      return updatedStats;
    } catch (error) {
      console.error("Error updating community stats:", error);
      throw error;
    }
  }

  // Increment member count
  static async incrementMemberCount(communityId) {
    try {
      const stats = await this.getCommunityStats(communityId);
      return await this.updateCommunityStats(communityId, {
        memberCount: stats.memberCount + 1,
      });
    } catch (error) {
      console.error("Error incrementing member count:", error);
      throw error;
    }
  }

  // Decrement member count
  static async decrementMemberCount(communityId) {
    try {
      const stats = await this.getCommunityStats(communityId);
      return await this.updateCommunityStats(communityId, {
        memberCount: Math.max(0, stats.memberCount - 1),
      });
    } catch (error) {
      console.error("Error decrementing member count:", error);
      throw error;
    }
  }

  // Increment post count
  static async incrementPostCount(communityId) {
    try {
      const stats = await this.getCommunityStats(communityId);
      return await this.updateCommunityStats(communityId, {
        postCount: stats.postCount + 1,
        dailyPosts: stats.dailyPosts + 1,
      });
    } catch (error) {
      console.error("Error incrementing post count:", error);
      throw error;
    }
  }

  // Increment engagement (likes, comments, shares)
  static async incrementEngagement(communityId, type) {
    try {
      const stats = await this.getCommunityStats(communityId);
      const updates = {
        totalEngagement: stats.totalEngagement + 1,
      };

      switch (type) {
        case "like":
          updates.likeCount = stats.likeCount + 1;
          break;
        case "comment":
          updates.commentCount = stats.commentCount + 1;
          break;
        case "share":
          updates.shareCount = stats.shareCount + 1;
          break;
      }

      return await this.updateCommunityStats(communityId, updates);
    } catch (error) {
      console.error("Error incrementing engagement:", error);
      throw error;
    }
  }

  // Record community activity
  static async recordActivity(communityId, activity) {
    try {
      const activities = await this.getCommunityActivities(communityId);
      const newActivity = {
        id: Date.now().toString(),
        ...activity,
        timestamp: new Date().toISOString(),
      };

      activities.unshift(newActivity);

      // Keep only last 100 activities
      if (activities.length > 100) {
        activities.splice(100);
      }

      await AsyncStorage.setItem(
        `${this.COMMUNITY_ACTIVITY_KEY}_${communityId}`,
        JSON.stringify(activities)
      );

      return newActivity;
    } catch (error) {
      console.error("Error recording community activity:", error);
      throw error;
    }
  }

  // Get community activities
  static async getCommunityActivities(communityId, limit = 20) {
    try {
      const activities = await AsyncStorage.getItem(
        `${this.COMMUNITY_ACTIVITY_KEY}_${communityId}`
      );
      const parsedActivities = activities ? JSON.parse(activities) : [];
      return parsedActivities.slice(0, limit);
    } catch (error) {
      console.error("Error getting community activities:", error);
      return [];
    }
  }

  // Get trending communities
  static async getTrendingCommunities(limit = 10) {
    try {
      const allStats = await this.getAllCommunityStats();
      const communities = Object.entries(allStats)
        .map(([id, stats]) => ({
          id,
          ...stats,
          engagementScore: this.calculateEngagementScore(stats),
        }))
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, limit);

      return communities;
    } catch (error) {
      console.error("Error getting trending communities:", error);
      return [];
    }
  }

  // Calculate engagement score
  static calculateEngagementScore(stats) {
    const {
      memberCount = 0,
      postCount = 0,
      likeCount = 0,
      commentCount = 0,
      shareCount = 0,
    } = stats;

    // Weighted engagement score
    const engagementScore =
      memberCount * 0.3 +
      postCount * 0.2 +
      likeCount * 0.2 +
      commentCount * 0.2 +
      shareCount * 0.1;

    return Math.round(engagementScore);
  }

  // Get community growth data
  static async getCommunityGrowth(communityId, days = 30) {
    try {
      const activities = await this.getCommunityActivities(communityId, 1000);
      const growthData = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const dayActivities = activities.filter(
          (activity) =>
            new Date(activity.timestamp) >= dayStart &&
            new Date(activity.timestamp) < dayEnd
        );

        growthData.push({
          date: dayStart.toISOString().split("T")[0],
          posts: dayActivities.filter((a) => a.type === "post").length,
          members: dayActivities.filter((a) => a.type === "join").length,
          engagement: dayActivities.filter((a) =>
            ["like", "comment", "share"].includes(a.type)
          ).length,
        });
      }

      return growthData;
    } catch (error) {
      console.error("Error getting community growth:", error);
      return [];
    }
  }

  // Get default stats
  static getDefaultStats() {
    return {
      memberCount: 0,
      postCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      totalEngagement: 0,
      dailyPosts: 0,
      weeklyPosts: 0,
      monthlyPosts: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  }

  // Initialize community stats
  static async initializeCommunityStats(communityId, initialData = {}) {
    try {
      const defaultStats = this.getDefaultStats();
      const stats = {
        ...defaultStats,
        ...initialData,
        createdAt: new Date().toISOString(),
      };

      return await this.updateCommunityStats(communityId, stats);
    } catch (error) {
      console.error("Error initializing community stats:", error);
      throw error;
    }
  }

  // Reset daily counters
  static async resetDailyCounters() {
    try {
      const allStats = await this.getAllCommunityStats();
      const updatedStats = {};

      for (const [communityId, stats] of Object.entries(allStats)) {
        updatedStats[communityId] = {
          ...stats,
          dailyPosts: 0,
          lastUpdated: new Date().toISOString(),
        };
      }

      await AsyncStorage.setItem(
        this.COMMUNITY_STATS_KEY,
        JSON.stringify(updatedStats)
      );
    } catch (error) {
      console.error("Error resetting daily counters:", error);
    }
  }

  // Get community leaderboard
  static async getCommunityLeaderboard(communityId, type = "engagement") {
    try {
      const activities = await this.getCommunityActivities(communityId, 1000);
      const userStats = {};

      activities.forEach((activity) => {
        if (activity.userId) {
          if (!userStats[activity.userId]) {
            userStats[activity.userId] = {
              userId: activity.userId,
              userName: activity.userName || "Anonymous",
              posts: 0,
              likes: 0,
              comments: 0,
              shares: 0,
              totalEngagement: 0,
            };
          }

          switch (activity.type) {
            case "post":
              userStats[activity.userId].posts += 1;
              break;
            case "like":
              userStats[activity.userId].likes += 1;
              break;
            case "comment":
              userStats[activity.userId].comments += 1;
              break;
            case "share":
              userStats[activity.userId].shares += 1;
              break;
          }

          userStats[activity.userId].totalEngagement =
            userStats[activity.userId].posts * 2 +
            userStats[activity.userId].likes +
            userStats[activity.userId].comments * 3 +
            userStats[activity.userId].shares * 2;
        }
      });

      const leaderboard = Object.values(userStats).sort((a, b) => {
        switch (type) {
          case "posts":
            return b.posts - a.posts;
          case "engagement":
            return b.totalEngagement - a.totalEngagement;
          default:
            return b.totalEngagement - a.totalEngagement;
        }
      });

      return leaderboard.slice(0, 10);
    } catch (error) {
      console.error("Error getting community leaderboard:", error);
      return [];
    }
  }

  // Clear all community stats
  static async clearAllCommunityStats() {
    try {
      await AsyncStorage.removeItem(this.COMMUNITY_STATS_KEY);

      // Clear all activity files
      const allStats = await this.getAllCommunityStats();
      for (const communityId of Object.keys(allStats)) {
        await AsyncStorage.removeItem(
          `${this.COMMUNITY_ACTIVITY_KEY}_${communityId}`
        );
      }
    } catch (error) {
      console.error("Error clearing community stats:", error);
      throw error;
    }
  }
}

export default CommunityStatsService;














