import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Alert,
  ImageBackground,
  Modal,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import CommunityStatsService from "../services/CommunityStatsService";
import CommunityDataService from "../services/CommunityDataService";
import PostService from "../services/PostService";
import MediaPostCard from "../components/MediaPostCard";
import { useScroll } from "../services/ScrollContext";

// Import default background images
const DefaultCommunityHeaderBG = require("../assets/open-bible-black-background.jpg");
const CommunityHeaderBG1 = require("../assets/community-header-background.jpg");
const CommunityHeaderBG2 = require("../assets/community-header-background2.jpg");

const CommunityDetailScreen = ({ navigation, route }) => {
  const { community } = route.params;
  const [activeTab, setActiveTab] = useState("posts");
  const [isJoined, setIsJoined] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [memberCount, setMemberCount] = useState(community?.memberCount || 0);
  const [posts, setPosts] = useState([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerType, setImagePickerType] = useState(null); // 'profile' or 'header'
  const [communityProfilePicture, setCommunityProfilePicture] = useState(
    community?.profilePicture
  );
  const [communityHeaderBG, setCommunityHeaderBG] = useState(
    community?.bannerImage || community?.headerBackground
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [communityInfo, setCommunityInfo] = useState(null); // Store full community data for About tab
  const { setIsScrolling } = useScroll();
  const scrollIdleTimeoutRef = React.useRef(null);
  const scrollDelayTimeoutRef = React.useRef(null); // Delay before shrinking
  const headerHeight = useRef(new Animated.Value(1)).current; // 1 = full height, 0 = collapsed

  // Generate subtle color based on community name
  const getCommunityColor = (name) => {
    const colors = [
      "#f0f8ff", // Light blue
      "#f0fff0", // Light green
      "#fff8f0", // Light orange
      "#f8f0ff", // Light purple
      "#f0f8f0", // Light mint
      "#fff0f8", // Light pink
      "#f8f8f0", // Light yellow
      "#f0f0f8", // Light lavender
    ];
    if (!name) return colors[0];
    const hash = name.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    // Initialize communityInfo from route params
    if (community) {
      setCommunityInfo(community);
    }
    loadCommunityData();
    loadCommunityImages();
    checkMembership();
    loadCommunityMembers();
    loadCommunityActivity();
  }, [community.id]);
  
  const checkMembership = async () => {
    try {
      const CommunityService = (await import("../services/CommunityService")).default;
      const WorkingAuthService = (await import("../services/WorkingAuthService")).default;
      
      const isMember = await CommunityService.isMember(community.id);
      setIsJoined(isMember);
      
      // Check if user is creator
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (currentUser && currentUser.uid) {
        const communityData = await CommunityService.getCommunity(community.id);
        if (communityData) {
          // Check both community.creatorId (from route params) and communityData.creatorId (from Firebase)
          const isUserCreator = 
            (communityData.creatorId === currentUser.uid) || 
            (community?.creatorId === currentUser.uid);
          setIsCreator(isUserCreator);
          
          console.log(`👤 Creator check for community ${community.id}:`, {
            communityCreatorId: community?.creatorId,
            firebaseCreatorId: communityData.creatorId,
            currentUserId: currentUser.uid,
            isCreator: isUserCreator,
          });
          
          if (communityData.bannerImage) {
            setCommunityHeaderBG(communityData.bannerImage);
          }
          if (communityData.profilePicture) {
            setCommunityProfilePicture(communityData.profilePicture);
          }
          setMemberCount(communityData.memberCount || 0);
          setCommunityInfo(communityData); // Store full community data for About tab
        }
      }
    } catch (error) {
      console.error("Error checking membership:", error);
    }
  };

  // Cleanup scroll state when component unmounts
  useEffect(() => {
    return () => {
      if (scrollIdleTimeoutRef.current) {
        clearTimeout(scrollIdleTimeoutRef.current);
      }
      if (scrollDelayTimeoutRef.current) {
        clearTimeout(scrollDelayTimeoutRef.current);
      }
      setIsScrolling(false);
    };
  }, []);

  const loadCommunityImages = async () => {
    try {
      const result = await CommunityDataService.getCommunityData(community.id);
      if (result.success && result.data) {
        if (result.data.profilePicture) {
          setCommunityProfilePicture(result.data.profilePicture);
        }
        if (result.data.headerBackground) {
          setCommunityHeaderBG(result.data.headerBackground);
        }
      }
    } catch (error) {
      console.error("Error loading community images:", error);
    }
  };

  const loadCommunityData = async () => {
    try {
      const CommunityService = (await import("../services/CommunityService")).default;
      const PostService = (await import("../services/PostService")).default;
      
      // Get real community data from Firebase
      const communityData = await CommunityService.getCommunity(community.id);
      
      // Get real posts from the community
      const communityPosts = await PostService.getCommunityPosts(community.id, 1000);
      
      // Calculate real stats
      const realStats = {
        memberCount: communityData?.memberCount || (Array.isArray(communityData?.members) ? communityData.members.length : 0),
        postCount: communityPosts?.length || 0,
        likeCount: 0, // Can be calculated from posts if needed
        commentCount: 0, // Will be calculated from posts
      };
      
      // Calculate total comment count from posts
      if (communityPosts && Array.isArray(communityPosts)) {
        realStats.commentCount = communityPosts.reduce((total, post) => {
          return total + (post.comments || 0);
        }, 0);
      }
      
      setStats(realStats);
      setMemberCount(realStats.memberCount);
      
      // Load activity will be handled by loadCommunityActivity
    } catch (error) {
      console.error("Error loading community data:", error);
      // Fallback to default stats
      setStats({
        memberCount: memberCount || 0,
        postCount: posts.length || 0,
        likeCount: 0,
        commentCount: 0,
      });
    }
  };

  // Load real members from Firebase
  const loadCommunityMembers = async () => {
    try {
      const CommunityService = (await import("../services/CommunityService")).default;
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../config/firebase");
      const { collection, getDocs } = await import("firebase/firestore");

      // Get community data to get member IDs
      const communityData = await CommunityService.getCommunity(community.id);
      if (!communityData || !communityData.members) {
        setMembers([]);
        return;
      }

      const memberIds = Array.isArray(communityData.members) ? communityData.members : [];
      
      // Fetch user data for each member
      const membersData = await Promise.all(
        memberIds.map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                id: userId,
                name: userData.displayName || userData.name || "Anonymous",
                role: userId === communityData.creatorId ? "Creator" : "Member",
                avatar: userData.photoURL || null,
                email: userData.email || "",
              };
            } else {
              // User document doesn't exist, return basic info
              return {
                id: userId,
                name: "Unknown User",
                role: userId === communityData.creatorId ? "Creator" : "Member",
                avatar: null,
                email: "",
              };
            }
          } catch (error) {
            console.warn(`Error loading user ${userId}:`, error);
            return {
              id: userId,
              name: "Unknown User",
              role: userId === communityData.creatorId ? "Creator" : "Member",
              avatar: null,
              email: "",
            };
          }
        })
      );

      setMembers(membersData);
    } catch (error) {
      console.error("Error loading community members:", error);
      setMembers([]);
    }
  };

  // Load real activity from posts and comments
  const loadCommunityActivity = async () => {
    try {
      const PostService = (await import("../services/PostService")).default;
      
      // Get recent posts from the community
      const posts = await PostService.getCommunityPosts(community.id, 20);
      
      // Format posts as activity items
      const activityItems = posts.slice(0, 10).map((post) => ({
        id: `post-${post.id}`,
        type: "post",
        userName: post.author || "Anonymous",
        description: `created a new post: "${post.title}"`,
        timestamp: post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt || post.timestamp || Date.now()),
      }));

      // Sort by timestamp (newest first)
      activityItems.sort((a, b) => b.timestamp - a.timestamp);

      setRecentActivity(activityItems);
    } catch (error) {
      console.error("Error loading community activity:", error);
      setRecentActivity([]);
    }
  };

  const pickImage = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Removed cropping - use full image
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUrl = result.assets[0].uri;

        // Update local state immediately
        if (type === "profile") {
          setCommunityProfilePicture(imageUrl);
        } else {
          setCommunityHeaderBG(imageUrl);
        }

        // Save to Firebase
        let saveResult;
        if (type === "profile") {
          saveResult = await CommunityDataService.updateCommunityProfilePicture(
            community.id,
            imageUrl
          );
        } else {
          saveResult =
            await CommunityDataService.updateCommunityHeaderBackground(
              community.id,
              imageUrl
            );
        }

        if (saveResult.success) {
          Alert.alert(
            "Success",
            `${
              type === "profile" ? "Profile picture" : "Header background"
            } updated and saved!`
          );
        } else {
          Alert.alert("Error", "Failed to save changes. Please try again.");
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
    setShowImagePicker(false);
  };

  const showImagePickerModal = (type) => {
    setImagePickerType(type);
    setShowImagePicker(true);
  };

  // Load community-specific posts
  const loadCommunityPosts = async () => {
    try {
      // Use getCommunityPosts to get posts for this specific community
      const communityPosts = await PostService.getCommunityPosts(community.id, 100);
      setPosts(communityPosts);
    } catch (error) {
      console.error("Error loading community posts:", error);
      // Fallback to sample data if loading fails
      setPosts([
        {
          id: "1",
          title: "Weekly Bible Study Discussion",
          content:
            "Let's discuss this week's passage from Romans 8:28. What does this verse mean to you?",
          author: "Sarah Johnson",
          timeAgo: "2 hours ago",
          likes: 12,
          comments: 8,
          type: "discussion",
        },
        {
          id: "2",
          title: "Prayer Request",
          content:
            "Please pray for my family as we navigate a difficult season. We need God's strength and guidance.",
          author: "Michael Chen",
          timeAgo: "5 hours ago",
          likes: 24,
          comments: 15,
          type: "prayer",
        },
        {
          id: "3",
          title: "Testimony: God's Faithfulness",
          content:
            "I want to share how God answered my prayers this week. His timing is always perfect!",
          author: "Emily Rodriguez",
          timeAgo: "1 day ago",
          likes: 18,
          comments: 6,
          type: "testimony",
        },
      ]);
    }
  };

  // Load posts when component mounts
  useEffect(() => {
    loadCommunityPosts();
  }, []);

  // Reload posts when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadCommunityPosts();
    });
    return unsubscribe;
  }, [navigation]);

  // Real members from Firebase
  const [members, setMembers] = useState([]);

  const handleJoinLeave = async () => {
    try {
      const CommunityService = (await import("../services/CommunityService")).default;
      
      if (isJoined) {
        Alert.alert(
          "Leave Community",
          "Are you sure you want to leave this community?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Leave",
              style: "destructive",
              onPress: async () => {
                try {
                  await CommunityService.leaveCommunity(community.id);
                  setIsJoined(false);
                  const communityData = await CommunityService.getCommunity(community.id);
                  if (communityData) {
                    setMemberCount(communityData.memberCount || 0);
                  }
                  loadCommunityData(); // Refresh data
                } catch (error) {
                  console.error("Error leaving community:", error);
                  Alert.alert("Error", "Failed to leave community. Please try again.");
                }
              },
            },
          ]
        );
      } else {
        const result = await CommunityService.joinCommunity(community.id);
        if (result.success) {
          setIsJoined(true);
          const communityData = await CommunityService.getCommunity(community.id);
          if (communityData) {
            setMemberCount(communityData.memberCount || 0);
          }
          loadCommunityData(); // Refresh data
          Alert.alert("Welcome!", "You've joined the community! 🙏");
        }
      }
    } catch (error) {
      console.error("Error handling join/leave:", error);
      Alert.alert("Error", "Failed to update membership. Please try again.");
    }
  };

  const getPostTypeIcon = (type) => {
    switch (type) {
      case "prayer":
        return { name: "heart", color: "#FF6B6B" };
      case "testimony":
        return { name: "star", color: "#FFD700" };
      case "discussion":
        return { name: "chatbubbles", color: "#1a365d" };
      default:
        return { name: "chatbubbles", color: "#1a365d" };
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "join":
        return "person-add";
      case "leave":
        return "person-remove";
      case "post":
        return "create";
      case "like":
        return "heart";
      case "comment":
        return "chatbubble";
      case "share":
        return "share";
      default:
        return "notifications";
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "join":
        return "#4CAF50";
      case "leave":
        return "#FF6B6B";
      case "post":
        return "#1a365d";
      case "like":
        return "#FF6B6B";
      case "comment":
        return "#2196F3";
      case "share":
        return "#607D8B";
      default:
        return "#666";
    }
  };

  const renderPost = ({ item }) => {
    // Use MediaPostCard for posts with media, regular post card for others
    if (
      item.media &&
      (item.media.type === "image" || item.media.type === "video")
    ) {
      return (
        <MediaPostCard
          post={item}
          onPress={() => navigation.navigate("PostDetail", { post: item })}
          onLike={(post) => console.log("Like post:", post.id)}
          onComment={(post) =>
            navigation.navigate("PostDetail", { post: item })
          }
          onShare={(post) => console.log("Share post:", post.id)}
        />
      );
    }

    // Regular post card for posts without media
    const typeIcon = getPostTypeIcon(item.type);
    
    // Component to check author status and show delete button
    const PostCardContent = ({ item }) => {
      const [isAuthor, setIsAuthor] = useState(false);
      
      useEffect(() => {
        const checkAuthor = async () => {
          try {
            const WorkingAuthService = (await import("../services/WorkingAuthService")).default;
            const currentUser = await WorkingAuthService.getCurrentUser();
            const userIsAuthor =
              currentUser &&
              currentUser.uid &&
              item.authorId &&
              currentUser.uid === item.authorId;
            setIsAuthor(userIsAuthor);
          } catch (error) {
            setIsAuthor(false);
          }
        };
        checkAuthor();
      }, [item.authorId]);

      const handleDelete = async () => {
        Alert.alert(
          "Delete Post",
          "Are you sure you want to delete this post? This action cannot be undone.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                try {
                  const PostService = (await import("../services/PostService")).default;
                  await PostService.deletePost(item.id);
                  loadCommunityPosts(); // Refresh posts after deletion
                  Alert.alert("Success", "Post deleted successfully");
                } catch (error) {
                  Alert.alert("Error", "Failed to delete post. Please try again.");
                }
              },
            },
          ]
        );
      };

      return (
        <TouchableOpacity
          style={styles.postCard}
          onPress={() => navigation.navigate("PostDetail", { post: item })}
        >
          <View style={styles.postHeader}>
            <View style={styles.postTypeIcon}>
              <Ionicons name={typeIcon.name} size={16} color={typeIcon.color} />
            </View>
            <Text style={styles.postType}>{item.type}</Text>
            <View style={styles.postHeaderRight}>
              <Text style={styles.postTime}>{item.timeAgo}</Text>
              {/* Three dots menu - only show for author */}
              {isAuthor && (
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postContent} numberOfLines={3}>
            {item.content}
          </Text>

          <View style={styles.postAuthor}>
            <Text style={styles.authorText}>by {item.author}</Text>
          </View>

          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={18} color="#666" />
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={18} color="#666" />
              <Text style={styles.actionText}>{item.comments}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-outline" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    };

    return <PostCardContent item={item} />;
  };

  const renderMember = ({ item }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberAvatar}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.memberAvatarImage} />
        ) : (
          <Ionicons name="person" size={24} color="#666" />
        )}
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRole}>{item.role}</Text>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "posts":
        return (
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.tabFlatList}
            contentContainerStyle={styles.tabFlatListContent}
            onScroll={(event) => {
              const scrollY = event.nativeEvent.contentOffset.y;
              const shouldBeScrolled = scrollY > 10;
              
              // If scrolling back to top, immediately expand and clear delay
              if (!shouldBeScrolled) {
                if (scrollDelayTimeoutRef.current) {
                  clearTimeout(scrollDelayTimeoutRef.current);
                  scrollDelayTimeoutRef.current = null;
                }
                if (isScrolled) {
                  setIsScrolled(false);
                  // Animate header expand
                  Animated.timing(headerHeight, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                  }).start();
                }
                return; // Don't process further if at top
              }
              
              // If scrolling down and not already scrolled, start delay timer
              if (shouldBeScrolled && !isScrolled) {
                // Only start delay if not already started
                if (!scrollDelayTimeoutRef.current) {
                  // Set delay before shrinking (2.5 seconds)
                  scrollDelayTimeoutRef.current = setTimeout(() => {
                    setIsScrolled(true);
                    // Animate header collapse
                    Animated.timing(headerHeight, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: false,
                    }).start();
                    scrollDelayTimeoutRef.current = null;
                  }, 2500); // 2.5 seconds delay
                }
              }
            }}
            onScrollBeginDrag={() => {
              setIsScrolling(true);
              // Don't clear delay timeout here - let it continue if already started
              // This allows the delay to complete even during active scrolling
            }}
            onScrollEndDrag={() => {
              clearTimeout(scrollIdleTimeoutRef.current);
              scrollIdleTimeoutRef.current = setTimeout(() => {
                setIsScrolling(false);
                // Expand header after 15 seconds of no scrolling
                setIsScrolled((prevScrolled) => {
                  if (prevScrolled) {
                    Animated.timing(headerHeight, {
                      toValue: 1,
                      duration: 300,
                      useNativeDriver: false,
                    }).start();
                  }
                  return false;
                });
              }, 15000); // 15 seconds
            }}
            onMomentumScrollBegin={() => setIsScrolling(true)}
            onMomentumScrollEnd={() => {
              clearTimeout(scrollIdleTimeoutRef.current);
              scrollIdleTimeoutRef.current = setTimeout(() => {
                setIsScrolling(false);
                // Expand header after 15 seconds of no scrolling
                setIsScrolled((prevScrolled) => {
                  if (prevScrolled) {
                    Animated.timing(headerHeight, {
                      toValue: 1,
                      duration: 300,
                      useNativeDriver: false,
                    }).start();
                  }
                  return false;
                });
              }, 15000); // 15 seconds
            }}
          />
        );
      case "members":
        return (
          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.tabFlatList}
            contentContainerStyle={styles.tabFlatListContent}
          />
        );
      case "activity":
        return (
          <ScrollView 
            style={styles.tabFlatList}
            contentContainerStyle={styles.tabFlatListContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.activityContent}>
              {stats && (
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{stats.memberCount || memberCount || 0}</Text>
                    <Text style={styles.statLabel}>Members</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{stats.postCount || posts.length || 0}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{stats.likeCount || 0}</Text>
                    <Text style={styles.statLabel}>Likes</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{stats.commentCount || 0}</Text>
                    <Text style={styles.statLabel}>Comments</Text>
                  </View>
                </View>
              )}

              <Text style={styles.activityTitle}>Recent Activity</Text>
              {recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <View key={item.id} style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <Ionicons
                        name={getActivityIcon(item.type)}
                        size={16}
                        color={getActivityColor(item.type)}
                      />
                    </View>
                    <View style={styles.activityItemTextContainer}>
                      <Text style={styles.activityText}>
                        <Text style={styles.activityUser}>{item.userName}</Text>{" "}
                        {item.description}
                      </Text>
                      <Text style={styles.activityTime}>
                        {item.timestamp instanceof Date 
                          ? item.timestamp.toLocaleDateString()
                          : new Date(item.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noActivityText}>No recent activity</Text>
              )}
            </View>
          </ScrollView>
        );
      case "about":
        return (
          <ScrollView 
            style={styles.tabFlatList}
            contentContainerStyle={styles.tabFlatListContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.aboutContent}>
              <Text style={styles.aboutDescription}>
                {communityInfo?.description || community?.description ||
                  "A welcoming community focused on Bible study and spiritual growth."}
              </Text>

              {communityInfo?.rules && communityInfo.rules.trim() && (
                <View style={styles.aboutSection}>
                  <Text style={styles.aboutSectionTitle}>Community Rules</Text>
                  {communityInfo.rules.split('\n').map((rule, index) => {
                    // If rule doesn't start with bullet, add one
                    const formattedRule = rule.trim().startsWith('•') || rule.trim().startsWith('-') 
                      ? rule.trim() 
                      : `• ${rule.trim()}`;
                    return (
                      <Text key={index} style={styles.aboutSectionText}>
                        {formattedRule}
                      </Text>
                    );
                  })}
                </View>
              )}

              {(!communityInfo?.rules || !communityInfo.rules.trim()) && (
                <View style={styles.aboutSection}>
                  <Text style={styles.aboutSectionTitle}>Community Guidelines</Text>
                  <Text style={styles.aboutSectionText}>
                    • Keep discussions respectful and Christ-centered
                  </Text>
                  <Text style={styles.aboutSectionText}>
                    • No spam, harassment, or inappropriate content
                  </Text>
                  <Text style={styles.aboutSectionText}>
                    • Encourage and support fellow believers
                  </Text>
                  <Text style={styles.aboutSectionText}>
                    • Share prayer requests and testimonies
                  </Text>
                </View>
              )}

              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>Community Info</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Category:</Text>
                  <Text style={styles.infoValue}>
                    {communityInfo?.category || community?.category || "Bible Study"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Privacy:</Text>
                  <Text style={styles.infoValue}>
                    {communityInfo?.privacy || community?.privacy || "Public"}
                  </Text>
                </View>
                {communityInfo?.createdAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Created:</Text>
                    <Text style={styles.infoValue}>
                      {communityInfo.createdAt.toDate 
                        ? communityInfo.createdAt.toDate().toLocaleDateString()
                        : new Date(communityInfo.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {(communityHeaderBG || community?.bannerImage) ? (
        <Animated.View
          style={[
            styles.headerContainer,
            {
              height: headerHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [60, 200], // 60px when scrolled, 200px when expanded
              }),
            },
          ]}
        >
          <ImageBackground
            source={{ uri: community?.bannerImage || communityHeaderBG }}
            style={styles.header}
            imageStyle={[
              styles.headerImage,
              { opacity: isScrolled ? 0.3 : 0.7 }
            ]}
          >
            <View
              style={[
                styles.headerOverlay,
                {
                  opacity: isScrolled ? 0.5 : 0.3,
                },
              ]}
            />
            <View
              style={[
                styles.headerContent,
                {
                  paddingTop: 50,
                  padding: isScrolled ? 8 : 12,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons
                  name="arrow-back"
                  size={isScrolled ? 20 : 24}
                  color="#fff"
                />
              </TouchableOpacity>
              <Text
                style={[
                  styles.headerTitle,
                  {
                    fontSize: isScrolled ? 16 : 20,
                  },
                ]}
              >
                {community?.name || "Community"}
              </Text>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => showImagePickerModal("header")}
              >
                <Ionicons
                  name="camera"
                  size={isScrolled ? 20 : 24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </Animated.View>
      ) : (
        <View
          style={[
            isScrolled ? styles.headerMinimalScrolled : styles.headerMinimal,
            { backgroundColor: getCommunityColor(community?.name) },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => showImagePickerModal("header")}
          >
            <Ionicons name="camera" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.scrollContainer}>
        {/* Community Info */}
        <View
          style={
            isScrolled ? styles.communityInfoScrolled : styles.communityInfo
          }
        >
          <View
            style={
              isScrolled
                ? styles.communityHeaderScrolled
                : styles.communityHeader
            }
          >
            <TouchableOpacity
              style={[
                isScrolled
                  ? styles.communityIconScrolled
                  : styles.communityIcon,
                { backgroundColor: community?.color || "#1a365d" },
              ]}
              onPress={() => showImagePickerModal("profile")}
            >
              {(communityProfilePicture || community?.profilePicture) ? (
                <Image
                  source={{ uri: community?.profilePicture || communityProfilePicture }}
                  style={
                    isScrolled
                      ? styles.communityProfileImageScrolled
                      : styles.communityProfileImage
                  }
                />
              ) : (
                <Ionicons
                  name={community?.icon || "people"}
                  size={isScrolled ? 12 : 32}
                  color="#fff"
                />
              )}
            </TouchableOpacity>
            <View style={styles.communityDetails}>
              <Text
                style={
                  isScrolled
                    ? styles.communityNameScrolled
                    : styles.communityName
                }
              >
                {community?.name || "Community Name"}
              </Text>
              <Text
                style={
                  isScrolled
                    ? styles.communityStatsScrolled
                    : styles.communityStats
                }
              >
                {memberCount} members • {community?.privacy || "Public"}
              </Text>
            </View>
          </View>

          {/* Community Description */}
          {community?.description && !isScrolled && (
            <Text style={styles.communityDescription}>
              {community.description}
            </Text>
          )}

          <View style={isScrolled ? styles.actionButtonsContainerScrolled : styles.actionButtonsContainer}>
            {isCreator && (
              <TouchableOpacity
                style={isScrolled ? styles.deleteButtonScrolled : styles.deleteButton}
                onPress={async () => {
                  Alert.alert(
                    "Delete Community",
                    "Are you sure you want to delete this community? This action cannot be undone and will remove all posts and members.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            const CommunityService = (await import("../services/CommunityService")).default;
                            await CommunityService.deleteCommunity(community.id);
                            Alert.alert(
                              "Success",
                              "Community deleted successfully",
                              [{ text: "OK", onPress: () => navigation.goBack() }]
                            );
                          } catch (error) {
                            Alert.alert("Error", error.message || "Failed to delete community");
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="trash" size={isScrolled ? 12 : 20} color="#fff" />
                <Text style={isScrolled ? styles.deleteButtonTextScrolled : styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
            {!isJoined && (
              <TouchableOpacity
                style={[
                  isScrolled ? styles.joinButtonScrolled : styles.joinButton,
                ]}
                onPress={handleJoinLeave}
              >
                <Ionicons
                  name="add"
                  size={isScrolled ? 12 : 20}
                  color="#fff"
                />
                <Text
                  style={
                    isScrolled
                      ? styles.joinButtonTextScrolled
                      : styles.joinButtonText
                  }
                >
                  Join Community
                </Text>
              </TouchableOpacity>
            )}
            {isJoined && !isCreator && (
              <TouchableOpacity
                style={[
                  isScrolled ? styles.joinButtonScrolled : styles.joinButton,
                  styles.leaveButton,
                ]}
                onPress={handleJoinLeave}
              >
                <Ionicons
                  name="checkmark"
                  size={isScrolled ? 12 : 20}
                  color="#4CAF50"
                />
                <Text
                  style={[
                    isScrolled
                      ? styles.joinButtonTextScrolled
                      : styles.joinButtonText,
                    styles.leaveButtonText,
                  ]}
                >
                  Joined
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "posts" && styles.activeTab]}
            onPress={() => setActiveTab("posts")}
          >
            <Ionicons
              name="chatbubbles"
              size={20}
              color={activeTab === "posts" ? "#1a365d" : "#666"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "posts" && styles.activeTabText,
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "members" && styles.activeTab]}
            onPress={() => setActiveTab("members")}
          >
            <Ionicons
              name="people"
              size={20}
              color={activeTab === "members" ? "#1a365d" : "#666"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "members" && styles.activeTabText,
              ]}
            >
              Members
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "activity" && styles.activeTab]}
            onPress={() => setActiveTab("activity")}
          >
            <Ionicons
              name="pulse"
              size={20}
              color={activeTab === "activity" ? "#1a365d" : "#666"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "activity" && styles.activeTabText,
              ]}
            >
              Activity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "about" && styles.activeTab]}
            onPress={() => setActiveTab("about")}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={activeTab === "about" ? "#1a365d" : "#666"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "about" && styles.activeTabText,
              ]}
            >
              About
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>{renderTabContent()}</View>
      </View>

      {/* Floating Action Button for Creating Posts - Only show if member */}
      {isJoined && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            navigation.navigate("CreatePost", {
              selectedCommunity: community,
            })
          }
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Choose{" "}
              {imagePickerType === "profile"
                ? "Profile Picture"
                : "Header Background"}
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => pickImage(imagePickerType)}
            >
              <Ionicons name="image" size={24} color="#1a365d" />
              <Text style={styles.modalButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>

            {imagePickerType === "header" && (
              <>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={async () => {
                    setCommunityHeaderBG(CommunityHeaderBG1);
                    const saveResult =
                      await CommunityDataService.updateCommunityHeaderBackground(
                        community.id,
                        CommunityHeaderBG1
                      );
                    setShowImagePicker(false);
                    if (saveResult.success) {
                      Alert.alert(
                        "Success",
                        "Header background updated and saved!"
                      );
                    } else {
                      Alert.alert(
                        "Error",
                        "Failed to save changes. Please try again."
                      );
                    }
                  }}
                >
                  <Ionicons name="color-palette" size={24} color="#1a365d" />
                  <Text style={styles.modalButtonText}>Use Gradient 1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={async () => {
                    setCommunityHeaderBG(CommunityHeaderBG2);
                    const saveResult =
                      await CommunityDataService.updateCommunityHeaderBackground(
                        community.id,
                        CommunityHeaderBG2
                      );
                    setShowImagePicker(false);
                    if (saveResult.success) {
                      Alert.alert(
                        "Success",
                        "Header background updated and saved!"
                      );
                    } else {
                      Alert.alert(
                        "Error",
                        "Failed to save changes. Please try again."
                      );
                    }
                  }}
                >
                  <Ionicons name="color-palette" size={24} color="#1a365d" />
                  <Text style={styles.modalButtonText}>Use Gradient 2</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={async () => {
                    setCommunityHeaderBG(null);
                    const saveResult =
                      await CommunityDataService.updateCommunityHeaderBackground(
                        community.id,
                        null
                      );
                    setShowImagePicker(false);
                    if (saveResult.success) {
                      Alert.alert(
                        "Success",
                        "Header background removed! Using subtle color."
                      );
                    } else {
                      Alert.alert(
                        "Error",
                        "Failed to save changes. Please try again."
                      );
                    }
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#1a365d" />
                  <Text style={styles.modalButtonText}>
                    Remove Image (Use Color)
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowImagePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    overflow: "hidden",
  },
  header: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa", // Subtle background color
  },
  headerMinimal: {
    padding: 12,
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 70, // Enough space for content
    backgroundColor: "#f8f9fa", // Subtle background color
  },
  headerMinimalScrolled: {
    padding: 8,
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 50, // Smaller when scrolled
    backgroundColor: "#f8f9fa", // Subtle background color
  },
  headerImage: {
    opacity: 0.7, // Make background more transparent
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Dark overlay for text readability
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    paddingTop: 50,
    zIndex: 1, // Ensure content is above overlay
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  moreButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  communityInfo: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 6,
  },
  communityInfoScrolled: {
    backgroundColor: "#fff",
    padding: 4,
    marginBottom: 2,
    maxHeight: 50, // Very small when scrolled
    overflow: "hidden",
  },
  communityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  communityHeaderScrolled: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  communityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  communityIconScrolled: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  communityProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  communityProfileImageScrolled: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  communityDetails: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  communityNameScrolled: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 0,
  },
  communityStats: {
    fontSize: 12,
    color: "#666",
  },
  communityStatsScrolled: {
    fontSize: 8,
    color: "#666",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionButtonsContainerScrolled: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#ff4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deleteButtonScrolled: {
    backgroundColor: "#ff4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  deleteButtonTextScrolled: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "600",
    marginLeft: 2,
  },
  joinButton: {
    backgroundColor: "#1a365d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  joinButtonScrolled: {
    backgroundColor: "#1a365d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  leaveButton: {
    backgroundColor: "#666",
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  joinButtonTextScrolled: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "600",
    marginLeft: 2,
  },
  communityDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  communityDescriptionScrolled: {
    display: "none", // Hide description when scrolled
  },
  tabsContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
    position: "sticky",
    top: 0,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    borderRadius: 4,
    backgroundColor: "#f8f9fa",
  },
  activeTab: {
    backgroundColor: "#E3F2FD",
    borderBottomWidth: 0,
  },
  tabText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#1a365d",
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  postHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  postTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  postType: {
    fontSize: 12,
    color: "#666",
    textTransform: "capitalize",
    flex: 1,
  },
  postTime: {
    fontSize: 12,
    color: "#999",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  postAuthor: {
    marginBottom: 12,
  },
  authorText: {
    fontSize: 12,
    color: "#999",
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  memberAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: "#666",
  },
  aboutContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  aboutDescription: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 20,
  },
  aboutSection: {
    marginBottom: 20,
  },
  aboutSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  aboutSectionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  activityContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    width: "48%",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityItemTextContainer: {
    flex: 1,
    marginLeft: 0,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  activityUser: {
    fontWeight: "600",
    color: "#1a365d",
  },
  activityTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  noActivityText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 20,
  },
  tabFlatList: {
    flex: 1,
  },
  tabFlatListContent: {
    paddingBottom: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 12,
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "#e9ecef",
    marginBottom: 0,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1a365d",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
});

export default CommunityDetailScreen;
