import AsyncStorage from "@react-native-async-storage/async-storage";

class TestimoniesService {
  static TESTIMONIES_KEY = "testimonies";
  static TESTIMONY_CATEGORIES_KEY = "testimony_categories";

  // Testimony categories
  static getTestimonyCategories() {
    return [
      {
        id: "healing",
        name: "Healing",
        icon: "medical",
        color: "#4CAF50",
        description: "Stories of physical, emotional, or spiritual healing",
      },
      {
        id: "salvation",
        name: "Salvation",
        icon: "heart",
        color: "#E91E63",
        description: "Personal salvation and conversion stories",
      },
      {
        id: "provision",
        name: "Provision",
        icon: "gift",
        color: "#FF9800",
        description: "God's provision in times of need",
      },
      {
        id: "deliverance",
        name: "Deliverance",
        icon: "shield",
        color: "#9C27B0",
        description: "Freedom from addiction, bondage, or oppression",
      },
      {
        id: "miracles",
        name: "Miracles",
        icon: "star",
        color: "#FFD700",
        description: "Supernatural interventions and miracles",
      },
      {
        id: "guidance",
        name: "Guidance",
        icon: "compass",
        color: "#2196F3",
        description: "Divine guidance and direction in life",
      },
      {
        id: "protection",
        name: "Protection",
        icon: "umbrella",
        color: "#607D8B",
        description: "God's protection in dangerous situations",
      },
      {
        id: "restoration",
        name: "Restoration",
        icon: "refresh",
        color: "#795548",
        description: "Restoration of relationships, health, or circumstances",
      },
    ];
  }

  // Save a testimony
  static async saveTestimony(testimony) {
    try {
      const testimonies = await this.getAllTestimonies();
      const newTestimony = {
        id: Date.now().toString(),
        ...testimony,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
        shares: 0,
        views: 0,
        isVerified: false, // Can be verified by moderators
        tags: testimony.tags || [],
        scripture: testimony.scripture || null,
        prayerPoints: testimony.prayerPoints || [],
      };

      testimonies.unshift(newTestimony);
      await AsyncStorage.setItem(
        this.TESTIMONIES_KEY,
        JSON.stringify(testimonies)
      );
      return newTestimony;
    } catch (error) {
      console.error("Error saving testimony:", error);
      throw error;
    }
  }

  // Get all testimonies
  static async getAllTestimonies() {
    try {
      const testimonies = await AsyncStorage.getItem(this.TESTIMONIES_KEY);
      return testimonies ? JSON.parse(testimonies) : [];
    } catch (error) {
      console.error("Error getting testimonies:", error);
      return [];
    }
  }

  // Get testimonies by category
  static async getTestimoniesByCategory(categoryId) {
    try {
      const allTestimonies = await this.getAllTestimonies();
      return allTestimonies.filter(
        (testimony) => testimony.category === categoryId
      );
    } catch (error) {
      console.error("Error getting testimonies by category:", error);
      return [];
    }
  }

  // Get featured testimonies (most liked/recent)
  static async getFeaturedTestimonies(limit = 5) {
    try {
      const allTestimonies = await this.getAllTestimonies();
      return allTestimonies
        .sort((a, b) => b.likes + b.views - (a.likes + a.views))
        .slice(0, limit);
    } catch (error) {
      console.error("Error getting featured testimonies:", error);
      return [];
    }
  }

  // Get recent testimonies
  static async getRecentTestimonies(limit = 10) {
    try {
      const allTestimonies = await this.getAllTestimonies();
      return allTestimonies
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    } catch (error) {
      console.error("Error getting recent testimonies:", error);
      return [];
    }
  }

  // Like a testimony
  static async likeTestimony(testimonyId) {
    try {
      const testimonies = await this.getAllTestimonies();
      const testimonyIndex = testimonies.findIndex((t) => t.id === testimonyId);

      if (testimonyIndex !== -1) {
        testimonies[testimonyIndex].likes += 1;
        await AsyncStorage.setItem(
          this.TESTIMONIES_KEY,
          JSON.stringify(testimonies)
        );
        return testimonies[testimonyIndex];
      }

      return null;
    } catch (error) {
      console.error("Error liking testimony:", error);
      throw error;
    }
  }

  // Add comment to testimony
  static async addComment(testimonyId, comment) {
    try {
      const testimonies = await this.getAllTestimonies();
      const testimonyIndex = testimonies.findIndex((t) => t.id === testimonyId);

      if (testimonyIndex !== -1) {
        const newComment = {
          id: Date.now().toString(),
          text: comment,
          author: "You",
          createdAt: new Date().toISOString(),
          likes: 0,
        };

        testimonies[testimonyIndex].comments.push(newComment);
        await AsyncStorage.setItem(
          this.TESTIMONIES_KEY,
          JSON.stringify(testimonies)
        );
        return testimonies[testimonyIndex];
      }

      return null;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  // Share a testimony
  static async shareTestimony(testimonyId) {
    try {
      const testimonies = await this.getAllTestimonies();
      const testimonyIndex = testimonies.findIndex((t) => t.id === testimonyId);

      if (testimonyIndex !== -1) {
        testimonies[testimonyIndex].shares += 1;
        await AsyncStorage.setItem(
          this.TESTIMONIES_KEY,
          JSON.stringify(testimonies)
        );
        return testimonies[testimonyIndex];
      }

      return null;
    } catch (error) {
      console.error("Error sharing testimony:", error);
      throw error;
    }
  }

  // Increment view count
  static async incrementViews(testimonyId) {
    try {
      const testimonies = await this.getAllTestimonies();
      const testimonyIndex = testimonies.findIndex((t) => t.id === testimonyId);

      if (testimonyIndex !== -1) {
        testimonies[testimonyIndex].views += 1;
        await AsyncStorage.setItem(
          this.TESTIMONIES_KEY,
          JSON.stringify(testimonies)
        );
        return testimonies[testimonyIndex];
      }

      return null;
    } catch (error) {
      console.error("Error incrementing views:", error);
      throw error;
    }
  }

  // Search testimonies
  static async searchTestimonies(query) {
    try {
      const allTestimonies = await this.getAllTestimonies();
      const lowercaseQuery = query.toLowerCase();

      return allTestimonies.filter(
        (testimony) =>
          testimony.title.toLowerCase().includes(lowercaseQuery) ||
          testimony.content.toLowerCase().includes(lowercaseQuery) ||
          testimony.tags.some((tag) =>
            tag.toLowerCase().includes(lowercaseQuery)
          ) ||
          (testimony.scripture &&
            testimony.scripture.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error("Error searching testimonies:", error);
      return [];
    }
  }

  // Get testimony statistics
  static async getTestimonyStats() {
    try {
      const testimonies = await this.getAllTestimonies();
      const categories = this.getTestimonyCategories();

      const stats = {
        total: testimonies.length,
        byCategory: {},
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
      };

      categories.forEach((category) => {
        stats.byCategory[category.id] = testimonies.filter(
          (t) => t.category === category.id
        ).length;
      });

      testimonies.forEach((testimony) => {
        stats.totalLikes += testimony.likes;
        stats.totalComments += testimony.comments.length;
        stats.totalShares += testimony.shares;
        stats.totalViews += testimony.views;
      });

      return stats;
    } catch (error) {
      console.error("Error getting testimony stats:", error);
      return {
        total: 0,
        byCategory: {},
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
      };
    }
  }

  // Delete a testimony
  static async deleteTestimony(testimonyId) {
    try {
      const testimonies = await this.getAllTestimonies();
      const updatedTestimonies = testimonies.filter(
        (t) => t.id !== testimonyId
      );
      await AsyncStorage.setItem(
        this.TESTIMONIES_KEY,
        JSON.stringify(updatedTestimonies)
      );
      return true;
    } catch (error) {
      console.error("Error deleting testimony:", error);
      throw error;
    }
  }

  // Clear all testimonies
  static async clearAllTestimonies() {
    try {
      await AsyncStorage.removeItem(this.TESTIMONIES_KEY);
    } catch (error) {
      console.error("Error clearing testimonies:", error);
      throw error;
    }
  }

  // Get sample testimonies for demo
  static getSampleTestimonies() {
    return [
      {
        id: "1",
        title: "Healed from Chronic Pain",
        content:
          "After years of suffering from chronic back pain, I received prayer at our church service. The pain completely left my body and I have been pain-free for 6 months now. God is truly a healer!",
        category: "healing",
        author: "Sarah Johnson",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 24,
        comments: [
          {
            id: "1-1",
            text: "Praise God! This gives me hope for my own healing journey.",
            author: "Michael Chen",
            createdAt: new Date(
              Date.now() - 1 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likes: 3,
          },
        ],
        shares: 8,
        views: 156,
        isVerified: true,
        tags: ["healing", "chronic pain", "prayer"],
        scripture:
          'Jeremiah 30:17 - "But I will restore you to health and heal your wounds," declares the Lord.',
        prayerPoints: [
          "Physical healing",
          "Pain relief",
          "Divine intervention",
        ],
      },
      {
        id: "2",
        title: "God Provided in My Time of Need",
        content:
          "I lost my job and was struggling to pay rent. I prayed and trusted God, and within a week, I received three job offers! God not only provided but gave me something better than what I had before.",
        category: "provision",
        author: "David Rodriguez",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 18,
        comments: [],
        shares: 12,
        views: 89,
        isVerified: false,
        tags: ["provision", "job", "faith"],
        scripture:
          'Philippians 4:19 - "And my God will meet all your needs according to the riches of his glory in Christ Jesus."',
        prayerPoints: [
          "Financial provision",
          "Job opportunities",
          "Trust in God",
        ],
      },
      {
        id: "3",
        title: "Delivered from Addiction",
        content:
          "I was addicted to alcohol for 10 years. Through prayer, counseling, and the support of my church family, I have been sober for 2 years now. God's grace is sufficient!",
        category: "deliverance",
        author: "Anonymous",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        likes: 31,
        comments: [
          {
            id: "3-1",
            text: "Your story gives hope to so many. Thank you for sharing!",
            author: "Pastor Williams",
            createdAt: new Date(
              Date.now() - 6 * 24 * 60 * 60 * 1000
            ).toISOString(),
            likes: 7,
          },
        ],
        shares: 15,
        views: 203,
        isVerified: true,
        tags: ["deliverance", "addiction", "sobriety"],
        scripture:
          '2 Corinthians 12:9 - "My grace is sufficient for you, for my power is made perfect in weakness."',
        prayerPoints: [
          "Freedom from addiction",
          "Strength to overcome",
          "Divine intervention",
        ],
      },
    ];
  }
}

export default TestimoniesService;














