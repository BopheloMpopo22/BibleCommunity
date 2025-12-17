import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import PostService from "./PostService";
import CommunityService from "./CommunityService";

export class SearchService {
  static SEARCH_HISTORY_KEY = "search_history";
  static MAX_HISTORY_ITEMS = 10;

  // Search across all content types
  static async search(query, filters = {}) {
    try {
      const results = {
        posts: [],
        users: [],
        communities: [],
      };

      // Get all data from Firebase
      const [posts, users, communities] = await Promise.all([
        this.getFirebasePosts(),
        this.getFirebaseUsers(),
        this.getFirebaseCommunities(),
      ]);

      // Search posts
      if (filters.postType === "all" || !filters.postType) {
        results.posts = posts.filter(
          (post) =>
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            post.content.toLowerCase().includes(query.toLowerCase()) ||
            post.community.toLowerCase().includes(query.toLowerCase())
        );
      } else {
        results.posts = posts.filter(
          (post) =>
            post.type === filters.postType &&
            (post.title.toLowerCase().includes(query.toLowerCase()) ||
              post.content.toLowerCase().includes(query.toLowerCase()) ||
              post.community.toLowerCase().includes(query.toLowerCase()))
        );
      }

      // Search users
      results.users = users.filter(
        (user) =>
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.bio.toLowerCase().includes(query.toLowerCase())
      );

      // Search communities
      results.communities = communities.filter(
        (community) =>
          community.name.toLowerCase().includes(query.toLowerCase()) ||
          community.description.toLowerCase().includes(query.toLowerCase()) ||
          community.category.toLowerCase().includes(query.toLowerCase())
      );

      // Apply sorting
      if (filters.sortBy === "newest") {
        results.posts.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      } else if (filters.sortBy === "oldest") {
        results.posts.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      } else if (filters.sortBy === "popular") {
        results.posts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      }

      return results;
    } catch (error) {
      console.error("Error searching:", error);
      return { posts: [], users: [], communities: [] };
    }
  }

  // Get posts from Firebase
  static async getFirebasePosts() {
    try {
      const postService = new PostService();
      const allPosts = await postService.getAllPosts(1000); // Get all posts for search
      
      // Format posts for search
      return allPosts.map(post => ({
        id: post.id,
        title: post.title || "",
        content: post.content || "",
        community: post.community || post.communityName || "",
        type: post.type || "discussion",
        author: post.author || "Anonymous",
        authorId: post.authorId,
        likes: post.likes || 0,
        comments: post.comments || 0,
        createdAt: post.createdAt?.toDate?.() || new Date(post.createdAt || Date.now()),
        timeAgo: post.timeAgo || "Unknown",
      }));
    } catch (error) {
      console.error("Error getting posts from Firebase:", error);
      return [];
    }
  }

  // Get users from Firebase
  static async getFirebaseUsers() {
    try {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);
      const users = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          name: data.displayName || data.name || "Anonymous",
          bio: data.bio || "",
          email: data.email || "",
          photoURL: data.photoURL || null,
          posts: 0, // TODO: Calculate actual post count
          followers: 0, // TODO: Implement followers system
        });
      });

      return users;
    } catch (error) {
      console.error("Error getting users from Firebase:", error);
      return this.getSampleUsers(); // Fallback to sample data
    }
  }

  // Get communities from Firebase
  static async getFirebaseCommunities() {
    try {
      const communities = await CommunityService.getAllCommunities();
      
      // Format communities for search
      return communities.map(community => ({
        id: community.id,
        name: community.name || "",
        description: community.description || "",
        category: community.category || "General",
        members: community.memberCount || (Array.isArray(community.members) ? community.members.length : 0),
        privacy: community.privacy || "Public",
        color: community.color || "#1a365d",
        icon: community.icon || "people",
        bannerImage: community.bannerImage,
        profilePicture: community.profilePicture,
      }));
    } catch (error) {
      console.error("Error getting communities from Firebase:", error);
      return this.getSampleCommunities(); // Fallback to sample data
    }
  }

  // Search history management
  static async addToHistory(query) {
    try {
      const history = await this.getSearchHistory();
      const newHistory = [
        query,
        ...history.filter((item) => item !== query),
      ].slice(0, this.MAX_HISTORY_ITEMS);
      await AsyncStorage.setItem(
        this.SEARCH_HISTORY_KEY,
        JSON.stringify(newHistory)
      );
    } catch (error) {
      console.error("Error adding to search history:", error);
    }
  }

  static async getSearchHistory() {
    try {
      const historyData = await AsyncStorage.getItem(this.SEARCH_HISTORY_KEY);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error("Error getting search history:", error);
      return [];
    }
  }

  static async clearSearchHistory() {
    try {
      await AsyncStorage.removeItem(this.SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error("Error clearing search history:", error);
    }
  }

  // Sample data for testing
  static getSampleUsers() {
    return [
      {
        id: "1",
        name: "Sarah Johnson",
        bio: "Bible study leader and prayer warrior",
        posts: 45,
        followers: 120,
        avatar: null,
      },
      {
        id: "2",
        name: "Michael Chen",
        bio: "Youth pastor passionate about discipleship",
        posts: 32,
        followers: 89,
        avatar: null,
      },
      {
        id: "3",
        name: "Rebecca Williams",
        bio: "Worship leader and songwriter",
        posts: 28,
        followers: 156,
        avatar: null,
      },
      {
        id: "4",
        name: "David Thompson",
        bio: "Missionary serving in Africa",
        posts: 67,
        followers: 234,
        avatar: null,
      },
      {
        id: "5",
        name: "Lisa Martinez",
        bio: "Children's ministry coordinator",
        posts: 19,
        followers: 78,
        avatar: null,
      },
    ];
  }

  static getSampleCommunities() {
    return [
      {
        id: "1",
        name: "Bible Study Fellowship",
        description: "Deep dive into God's word together",
        category: "Bible Study",
        members: 245,
        privacy: "Public",
        color: "#1a365d",
        icon: "book",
      },
      {
        id: "2",
        name: "Prayer Warriors",
        description: "Join us in powerful prayer sessions",
        category: "Prayer",
        members: 189,
        privacy: "Public",
        color: "#8B4513",
        icon: "heart",
      },
      {
        id: "3",
        name: "Youth Ministry",
        description: "Engaging young people in faith",
        category: "Youth",
        members: 156,
        privacy: "Public",
        color: "#FF6B6B",
        icon: "people",
      },
      {
        id: "4",
        name: "Worship Leaders",
        description: "Resources and fellowship for worship teams",
        category: "Worship",
        members: 98,
        privacy: "Private",
        color: "#4ECDC4",
        icon: "musical-notes",
      },
      {
        id: "5",
        name: "Mission Trips",
        description: "Sharing experiences from mission work",
        category: "Missions",
        members: 134,
        privacy: "Public",
        color: "#45B7D1",
        icon: "airplane",
      },
    ];
  }

  // Advanced search with filters
  static async advancedSearch(query, filters) {
    try {
      const results = await this.search(query, filters);

      // Apply additional filters
      if (filters.dateRange && filters.dateRange !== "all") {
        const now = new Date();
        let cutoffDate;

        switch (filters.dateRange) {
          case "today":
            cutoffDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case "week":
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case "year":
            cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        }

        if (cutoffDate) {
          results.posts = results.posts.filter(
            (post) => new Date(post.createdAt) >= cutoffDate
          );
        }
      }

      return results;
    } catch (error) {
      console.error("Error in advanced search:", error);
      return { posts: [], users: [], communities: [] };
    }
  }

  // Get trending searches
  static async getTrendingSearches() {
    try {
      const history = await this.getSearchHistory();
      const searchCounts = {};

      history.forEach((query) => {
        searchCounts[query] = (searchCounts[query] || 0) + 1;
      });

      return Object.entries(searchCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([query]) => query);
    } catch (error) {
      console.error("Error getting trending searches:", error);
      return [];
    }
  }

  // Save search results for offline access
  static async saveSearchResults(query, results) {
    try {
      const searchData = {
        query,
        results,
        timestamp: new Date().toISOString(),
      };

      const existingSearches = await AsyncStorage.getItem("saved_searches");
      const searches = existingSearches ? JSON.parse(existingSearches) : [];
      searches.unshift(searchData);

      // Keep only last 20 searches
      const limitedSearches = searches.slice(0, 20);
      await AsyncStorage.setItem(
        "saved_searches",
        JSON.stringify(limitedSearches)
      );
    } catch (error) {
      console.error("Error saving search results:", error);
    }
  }

  // Get saved search results
  static async getSavedSearchResults(query) {
    try {
      const searchesData = await AsyncStorage.getItem("saved_searches");
      const searches = searchesData ? JSON.parse(searchesData) : [];

      return searches.find((search) => search.query === query);
    } catch (error) {
      console.error("Error getting saved search results:", error);
      return null;
    }
  }
}













