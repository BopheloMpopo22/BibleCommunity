import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CommunityStatsService from "../services/CommunityStatsService";
import CommunityDataService from "../services/CommunityDataService";

// Import the default background image
const DefaultCommunityBG = require("../assets/open-bible-black-background.jpg");

const { width } = Dimensions.get("window");

const EnhancedCommunityCard = ({ community, onPress, onJoin, navigation }) => {
  const [stats, setStats] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [persistentData, setPersistentData] = useState(null);

  useEffect(() => {
    loadCommunityStats();
    loadPersistentData();
    checkMembership();
  }, [community.id, community.bannerImage, community.profilePicture]);
  
  const checkMembership = async () => {
    try {
      const CommunityService = (await import("../services/CommunityService")).default;
      const isMember = await CommunityService.isMember(community.id);
      setIsJoined(isMember);
    } catch (error) {
      console.error("Error checking membership:", error);
    }
  };

  // Reload persistent data when screen comes into focus
  useEffect(() => {
    if (navigation) {
      const unsubscribe = navigation.addListener("focus", () => {
        loadPersistentData();
      });
      return unsubscribe;
    }
  }, [navigation]);

  const loadPersistentData = async () => {
    try {
      console.log(`🖼️ Loading images for community ${community.id}:`, {
        hasBannerImage: !!community.bannerImage,
        hasProfilePicture: !!community.profilePicture,
        bannerImage: community.bannerImage?.substring(0, 50) + "...",
        profilePicture: community.profilePicture?.substring(0, 50) + "...",
      });
      
      // If community already has bannerImage/profilePicture from Firebase, use it directly
      if (community.bannerImage || community.profilePicture) {
        setPersistentData({
          profilePicture: community.profilePicture,
          headerBackground: community.bannerImage || community.headerBackground,
        });
        console.log("✅ Using images directly from community object");
        return;
      }
      
      // Otherwise, try to load from Firebase
      const CommunityService = (await import("../services/CommunityService")).default;
      const communityData = await CommunityService.getCommunity(community.id);
      
      if (communityData) {
        console.log(`✅ Loaded from Firebase:`, {
          hasBannerImage: !!communityData.bannerImage,
          hasProfilePicture: !!communityData.profilePicture,
        });
        setPersistentData({
          profilePicture: communityData.profilePicture,
          headerBackground: communityData.bannerImage || communityData.headerBackground,
        });
      } else {
        // Fallback to old method
        const result = await CommunityDataService.getCommunityData(community.id);
        if (result.success && result.data) {
          setPersistentData(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading persistent data:", error);
    }
  };

  const loadCommunityStats = async () => {
    try {
      // Get real data from Firebase
      const CommunityService = (await import("../services/CommunityService")).default;
      const PostService = (await import("../services/PostService")).default;
      
      // Get community data from Firebase
      const communityData = await CommunityService.getCommunity(community.id);
      
      // Get member count from community data
      let memberCount = 0;
      if (communityData) {
        // Use memberCount if available, otherwise count members array
        if (communityData.memberCount !== undefined) {
          memberCount = communityData.memberCount;
        } else if (Array.isArray(communityData.members)) {
          memberCount = communityData.members.length;
        } else if (community.memberCount !== undefined) {
          memberCount = community.memberCount;
        } else if (Array.isArray(community.members)) {
          memberCount = community.members.length;
        }
      } else {
        // Fallback to community prop
        if (community.memberCount !== undefined) {
          memberCount = community.memberCount;
        } else if (Array.isArray(community.members)) {
          memberCount = community.members.length;
        }
      }
      
      // Ensure at least 1 member (the creator)
      if (memberCount === 0 && (communityData?.creatorId || community?.creatorId)) {
        memberCount = 1;
      }
      
      // Get post count from Firebase
      let postCount = 0;
      let commentCount = 0;
      try {
        // PostService is exported as a singleton instance, not a class
        const posts = await PostService.getCommunityPosts(community.id, 1000); // Get all posts
        postCount = posts ? posts.length : 0;
        
        // Calculate comment count by actually counting comments from Firestore subcollections
        if (posts && Array.isArray(posts)) {
          const { collection, getDocs } = await import("firebase/firestore");
          const { db } = await import("../config/firebase");
          
          // Count comments for each post from Firestore subcollections
          const commentCountPromises = posts.map(async (post) => {
            try {
              const commentsRef = collection(db, "posts", post.id, "comments");
              const commentsSnapshot = await getDocs(commentsRef);
              return commentsSnapshot.size;
            } catch (error) {
              // If error, fall back to post.comments field
              return post.comments || 0;
            }
          });
          
          const commentCounts = await Promise.all(commentCountPromises);
          commentCount = commentCounts.reduce((sum, count) => sum + count, 0);
        }
      } catch (postError) {
        console.warn("Error getting post/comment count:", postError.message);
      }
      
      // Set stats with real data
      setStats({
        memberCount: memberCount,
        postCount: postCount,
        commentCount: commentCount,
        likeCount: 0, // Can be calculated from posts if needed
        shareCount: 0,
        totalEngagement: postCount + commentCount,
        dailyPosts: 0,
        weeklyPosts: 0,
        monthlyPosts: 0,
      });
    } catch (error) {
      console.error("Error loading community stats:", error);
      // Fallback to default stats
      setStats({
        memberCount: community.memberCount || (Array.isArray(community.members) ? community.members.length : 1),
        postCount: 0,
        commentCount: 0,
        likeCount: 0,
        shareCount: 0,
        totalEngagement: 0,
        dailyPosts: 0,
        weeklyPosts: 0,
        monthlyPosts: 0,
      });
    }
  };

  const handleJoinPress = async () => {
    try {
      const CommunityService = (await import("../services/CommunityService")).default;
      
      if (isJoined) {
        // Leave community
        await CommunityService.leaveCommunity(community.id);
        setIsJoined(false);
      } else {
        // Join community
        await CommunityService.joinCommunity(community.id);
        setIsJoined(true);
        Alert.alert("Welcome!", "You've joined the community! 🙏");
      }

      loadCommunityStats(); // Refresh stats
      checkMembership(); // Re-check membership

      if (onJoin) {
        onJoin(community.id, !isJoined);
      }
    } catch (error) {
      console.error("Error handling join/leave:", error);
      Alert.alert("Error", "Failed to update membership. Please try again.");
    }
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      "Bible Study": "book",
      Prayer: "heart",
      Worship: "musical-notes",
      Fellowship: "people",
      Ministry: "hand-left",
      Youth: "school",
      Family: "home",
      Outreach: "globe",
      General: "chatbubbles",
    };
    return categoryIcons[category] || "people";
  };

  const getCategoryColor = (category) => {
    const categoryColors = {
      "Bible Study": "#1a365d",
      Prayer: "#FF6B6B",
      Worship: "#FFD700",
      Fellowship: "#4CAF50",
      Ministry: "#9C27B0",
      Youth: "#FF9800",
      Family: "#E91E63",
      Outreach: "#2196F3",
      General: "#607D8B",
    };
    return categoryColors[category] || "#1a365d";
  };

  const formatMemberCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const getEngagementLevel = (engagementScore) => {
    if (engagementScore >= 100) return "Very Active";
    if (engagementScore >= 50) return "Active";
    if (engagementScore >= 20) return "Moderate";
    return "New";
  };

  const getEngagementColor = (engagementScore) => {
    if (engagementScore >= 100) return "#4CAF50";
    if (engagementScore >= 50) return "#FF9800";
    if (engagementScore >= 20) return "#2196F3";
    return "#9E9E9E";
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(community)}
      key={`${community.id}-${persistentData?.profilePicture || "default"}`}
    >
      {/* Background Image - Use bannerImage from Firebase */}
      <ImageBackground
        source={
          community.bannerImage
            ? { uri: community.bannerImage }
            : persistentData?.headerBackground
            ? { uri: persistentData.headerBackground }
            : community.headerBackground
            ? { uri: community.headerBackground }
            : community.coverPhoto
            ? { uri: community.coverPhoto }
            : DefaultCommunityBG
        }
        style={styles.coverContainer}
        imageStyle={styles.coverImage}
      >
        {/* Overlay for better text readability */}
        <View style={styles.overlay} />

        {/* Community Profile Picture */}
        <View style={styles.profilePictureContainer}>
          {community.profilePicture ? (
            <Image
              source={{ uri: community.profilePicture }}
              style={styles.profilePicture}
            />
          ) : persistentData?.profilePicture ? (
            <Image
              source={{ uri: persistentData.profilePicture }}
              style={styles.profilePicture}
            />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Ionicons name="people" size={14} color="#fff" />
            </View>
          )}
        </View>

        {/* Category Badge */}
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(community.category) },
          ]}
        >
          <Ionicons
            name={getCategoryIcon(community.category)}
            size={12}
            color="#fff"
          />
          <Text style={styles.categoryText}>{community.category}</Text>
        </View>

        {/* Privacy Badge */}
        <View
          style={[
            styles.privacyBadge,
            {
              backgroundColor:
                community.privacy === "Public" ? "#4CAF50" : "#FF9800",
            },
          ]}
        >
          <Ionicons
            name={community.privacy === "Public" ? "globe" : "lock-closed"}
            size={12}
            color="#fff"
          />
        </View>

        {/* Community Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {community.name}
          </Text>
        </View>
      </ImageBackground>

      {/* Content */}
      <View style={styles.content}>
        {/* Simplified Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={14} color="#666" />
              <Text style={styles.statText}>
                {formatMemberCount(stats.memberCount)}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="chatbubble" size={14} color="#666" />
              <Text style={styles.statText}>{stats.postCount}</Text>
            </View>

            <View style={styles.statItem}>
              <View
                style={[
                  styles.activityDot,
                  {
                    backgroundColor: getEngagementColor(
                      CommunityStatsService.calculateEngagementScore(stats)
                    ),
                  },
                ]}
              />
              <Text style={styles.statText}>
                {getEngagementLevel(
                  CommunityStatsService.calculateEngagementScore(stats)
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Join Button - Hide if already joined */}
        {!isJoined && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoinPress}
          >
            <Ionicons
              name="add"
              size={16}
              color="#fff"
            />
            <Text style={styles.joinButtonText}>
              Join
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    flex: 1,
    maxWidth: (width - 60) / 2, // Account for margins and padding
  },
  coverContainer: {
    height: 100,
    position: "relative",
    justifyContent: "flex-end",
    padding: 12,
  },
  coverImage: {
    borderRadius: 12,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
  },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  privacyBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 40, // More space for title since profile picture is on right
    zIndex: 1,
    marginTop: 20, // Move title down to avoid profile picture area
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a365d",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    width: "100%",
    marginTop: 4,
  },
  joinedButton: {
    backgroundColor: "#E8F5E8",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  joinedButtonText: {
    color: "#4CAF50",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 6,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 3,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  activityContainer: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  activityLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  activityItems: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activityText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  profilePictureContainer: {
    position: "absolute",
    top: 8,
    right: 8, // Move to right side to avoid title overlap
    zIndex: 2,
  },
  profilePicture: {
    width: 28, // Smaller size
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  profilePicturePlaceholder: {
    width: 28, // Smaller size
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default EnhancedCommunityCard;
