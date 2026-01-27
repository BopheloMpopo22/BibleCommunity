import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  FlatList,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationBadge from "../components/NotificationBadge";
import UserAvatar from "../components/UserAvatar";
import WorkingAuthService from "../services/WorkingAuthService";
import PostService from "../services/PostService";
import EnhancedCommunityCard from "../components/EnhancedCommunityCard";
import MediaPostCard from "../components/MediaPostCard";
import CommunityStatsService from "../services/CommunityStatsService";
import CommunityDataService from "../services/CommunityDataService";
import TimeBasedPrayerService from "../services/TimeBasedPrayerService";
import { useScroll } from "../services/ScrollContext";
import DarkModeService from "../services/DarkModeService";

// Import time-based images
const MorningGradient = require("../assets/morning-gradient.jpg");
const AfternoonGradient = require("../assets/afternoon-gradient.jpg");
const NightGradient = require("../assets/night-gradient.jpg");
const MorningBG = require("../assets/background-morning-picture.jpg");
const AfternoonBG = require("../assets/background-afternoon-picture.jpg");
const NightBG = require("../assets/background-night-picture.jpg");

// Import community header background
const CommunityHeaderBG = require("../assets/community-header-background.jpg");

const { width } = Dimensions.get("window");
const SIGN_IN_BANNER_DISMISSED_KEY = "community_sign_in_banner_dismissed";

const CommunityScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState("trending");
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [user, setUser] = useState(null); // Track logged-in user
  const [trendingCommunities, setTrendingCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [showSignInBanner, setShowSignInBanner] = useState(false);
  // removed Animated tabs state
  const scrollIdleTimeoutRef = React.useRef(null);
  const { setIsScrolling } = useScroll();
  const [darkMode, setDarkMode] = useState(false);

  // Track time of day and previous image to prevent black screen during transitions
  const [timeOfDay, setTimeOfDay] = useState(
    TimeBasedPrayerService.getCurrentTimeOfDay()
  );
  const [currentHeaderBG, setCurrentHeaderBG] = useState(() => {
    const currentTime = TimeBasedPrayerService.getCurrentTimeOfDay();
    switch (currentTime) {
      case "morning":
        return MorningBG;
      case "afternoon":
        return AfternoonBG;
      default:
        return NightBG;
    }
  });

  // Monitor time changes and update header smoothly
  useEffect(() => {
    const checkTimeChange = setInterval(() => {
      const newTimeOfDay = TimeBasedPrayerService.getCurrentTimeOfDay();
      if (newTimeOfDay !== timeOfDay) {
        // Time changed - update header image smoothly
        let newHeaderBG;
        switch (newTimeOfDay) {
          case "morning":
            newHeaderBG = MorningBG;
            break;
          case "afternoon":
            newHeaderBG = AfternoonBG;
            break;
          default:
            newHeaderBG = NightBG;
        }
        // Update state - ImageBackground will handle the transition
        setCurrentHeaderBG(newHeaderBG);
        setTimeOfDay(newTimeOfDay);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkTimeChange);
  }, [timeOfDay]);

  // Time-based image function (now uses state for smooth transitions)
  const getTimeBasedImages = () => {
    return {
      headerBG: currentHeaderBG,
      gradient:
        timeOfDay === "morning"
          ? MorningGradient
          : timeOfDay === "afternoon"
          ? AfternoonGradient
          : NightGradient,
    };
  };

  const getTimeBasedTextColor = () => {
    const timeOfDay = TimeBasedPrayerService.getCurrentTimeOfDay();
    return timeOfDay === "evening" ? "#fff" : "#333";
  };

  useEffect(() => {
    loadTrendingCommunities();
    initializeCommunityStats();
    loadPosts();
    checkSignInBanner();
  }, []);

  // Check if user is signed in and if banner should be shown
  const checkSignInBanner = async () => {
    try {
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        // User is not signed in - check if banner was dismissed
        const dismissed = await AsyncStorage.getItem(
          SIGN_IN_BANNER_DISMISSED_KEY
        );
        if (!dismissed) {
          setShowSignInBanner(true);
        }
      } else {
        // User is signed in - hide banner
        setShowSignInBanner(false);
      }
    } catch (error) {
      // If error checking user, assume not signed in
      try {
        const dismissed = await AsyncStorage.getItem(
          SIGN_IN_BANNER_DISMISSED_KEY
        );
        if (!dismissed) {
          setShowSignInBanner(true);
        }
      } catch (e) {
        // Silently handle
      }
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = WorkingAuthService.onAuthStateChanged((user) => {
      setUser(user);
      if (user && user.uid) {
        // User signed in - hide banner
        setShowSignInBanner(false);
      } else {
        // User signed out - check if banner should show
        checkSignInBanner();
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // Dismiss banner
  const dismissSignInBanner = async () => {
    try {
      await AsyncStorage.setItem(SIGN_IN_BANNER_DISMISSED_KEY, "true");
      setShowSignInBanner(false);
    } catch (error) {
      // Silently handle
    }
  };

  // Refresh posts and community data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadPosts();
      loadTrendingCommunities(); // Reload communities (to show newly created ones)
      loadCommunityPersistentData(); // Refresh community data including profile pictures
    });

    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await WorkingAuthService.signOut();
            // The auth state listener will handle the UI update
          } catch (error) {
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  const loadTrendingCommunities = async () => {
    try {
      console.log("🔄 Loading communities from Firebase...");
      // Load communities from Firebase
      const CommunityService = (await import("../services/CommunityService"))
        .default;
      const allCommunities = await CommunityService.getAllCommunities();
      console.log(`📋 Got ${allCommunities.length} communities from service`);

      // Merge with existing sample communities (keep them for testing)
      const sampleCommunityIds = new Set(communities.map((c) => c.id));
      const newCommunities = allCommunities.filter(
        (c) => !sampleCommunityIds.has(c.id)
      );
      console.log(
        `📋 Found ${newCommunities.length} new communities (not in sample list)`
      );

      // Combine: sample communities first, then Firebase communities
      const combined = [...communities, ...newCommunities];
      console.log(`📋 Total communities to display: ${combined.length}`);

      // Sort by member count (trending)
      combined.sort(
        (a, b) =>
          (b.memberCount || b.members || 0) - (a.memberCount || a.members || 0)
      );

      setTrendingCommunities(combined);
      console.log("✅ Communities loaded and set in state");
    } catch (error) {
      console.error("❌ Error loading communities:", error);
      // Fallback to sample communities
      setTrendingCommunities(communities);
    }
  };

  const loadTrendingCommunitiesOld = async () => {
    try {
      const trending = await CommunityStatsService.getTrendingCommunities(10);
      setTrendingCommunities(trending);
    } catch (error) {
      console.error("Error loading trending communities:", error);
    }
  };

  const initializeCommunityStats = async () => {
    try {
      // Initialize stats for sample communities
      for (const community of communities) {
        const existingStats = await CommunityStatsService.getCommunityStats(
          community.id
        );
        if (existingStats.memberCount === 0) {
          await CommunityStatsService.initializeCommunityStats(community.id, {
            memberCount: Math.floor(Math.random() * 500) + 50,
            postCount: Math.floor(Math.random() * 200) + 20,
            likeCount: Math.floor(Math.random() * 1000) + 100,
            commentCount: Math.floor(Math.random() * 500) + 50,
            shareCount: Math.floor(Math.random() * 200) + 20,
          });
        }
      }
    } catch (error) {
      console.error("Error initializing community stats:", error);
    }
  };

  const loadCommunityPersistentData = async () => {
    try {
      // Initialize and load persistent data for each community
      for (const community of communities) {
        // First initialize the community document if it doesn't exist
        await CommunityDataService.initializeCommunity(community.id, {
          name: community.name,
          members: community.members,
          description: community.description,
          icon: community.icon,
          color: community.color,
          posts: community.posts,
        });

        // Then load any existing persistent data
        const result = await CommunityDataService.getCommunityData(
          community.id
        );
        if (result.success && result.data) {
          // Update community with persistent data
          community.profilePicture = result.data.profilePicture;
          community.headerBackground = result.data.headerBackground;
        }
      }
    } catch (error) {
      console.warn(
        "Error loading community persistent data (continuing with defaults):",
        error.message
      );
      // Continue with default data if Firebase fails
    }
  };

  const loadPosts = async () => {
    try {
      const allPosts = await PostService.getAllPosts();
      setPosts(allPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  // Sample communities
  const communities = [
    {
      id: "1",
      name: "Bible Study Group",
      members: 1247,
      description: "Deep dive into scripture together",
      icon: "📖",
      color: "#1a365d",
      posts: 156,
    },
    {
      id: "2",
      name: "Prayer Warriors",
      members: 892,
      description: "Supporting each other in prayer",
      icon: "🙏",
      color: "#FF6B6B",
      posts: 89,
    },
    {
      id: "3",
      name: "Christian Living",
      members: 2156,
      description: "Practical Christian life advice",
      icon: "✝️",
      color: "#50C878",
      posts: 234,
    },
    {
      id: "4",
      name: "Worship & Music",
      members: 567,
      description: "Share worship songs and music",
      icon: "🎵",
      color: "#9B59B6",
      posts: 67,
    },
    {
      id: "5",
      name: "Testimonies",
      members: 1345,
      description: "Share your faith journey",
      icon: "🌟",
      color: "#FFD700",
      posts: 189,
    },
  ];

  // Sample posts
  const samplePosts = [
    {
      id: "1",
      community: "Bible Study Group",
      author: "Sarah Johnson",
      title: "What does Romans 8:28 mean to you?",
      content:
        'I\'ve been meditating on this verse lately. "And we know that in all things God works for the good of those who love him." How has this truth impacted your life?',
      upvotes: 24,
      comments: 8,
      timeAgo: "2h ago",
      type: "discussion",
      communityIcon: "📖",
    },
    {
      id: "2",
      community: "Prayer Warriors",
      author: "Mike Chen",
      title: "Prayer request for my family",
      content:
        "My wife is going through a difficult time with her health. Please keep us in your prayers. We trust in God's healing power.",
      upvotes: 45,
      comments: 12,
      timeAgo: "4h ago",
      type: "prayer",
      communityIcon: "🙏",
    },
    {
      id: "3",
      community: "Christian Living",
      author: "Emily Davis",
      title: "How to share faith at work?",
      content:
        "I want to be a light at my workplace but I'm not sure how to naturally share my faith. Any tips from those who have done this successfully?",
      upvotes: 31,
      comments: 15,
      timeAgo: "6h ago",
      type: "advice",
      communityIcon: "✝️",
    },
    {
      id: "4",
      community: "Worship & Music",
      author: "David Wilson",
      title: "New worship song I wrote",
      content:
        "I felt inspired to write this song during my quiet time this morning. Would love to hear your thoughts!",
      upvotes: 18,
      comments: 6,
      timeAgo: "8h ago",
      type: "music",
      communityIcon: "🎵",
    },
    {
      id: "5",
      community: "Testimonies",
      author: "Lisa Thompson",
      title: "God answered my prayer!",
      content:
        "After months of praying for a job, I finally got the perfect position! God's timing is always perfect. Thank you for your prayers!",
      upvotes: 67,
      comments: 23,
      timeAgo: "1d ago",
      type: "testimony",
      communityIcon: "🌟",
    },
    {
      id: "6",
      community: "Christian Living",
      author: "Emily Rodriguez",
      title: "Beautiful sunset from my morning walk",
      content:
        "God's creation never ceases to amaze me. This morning's walk reminded me of His faithfulness and the beauty He surrounds us with every day.",
      upvotes: 32,
      comments: 6,
      timeAgo: "6h ago",
      type: "photo",
      communityIcon: "✝️",
      media: {
        type: "image",
        uri: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
      },
      likes: 32,
      authorPhoto: null,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      id: "7",
      community: "Worship & Music",
      author: "David Thompson",
      title: "New worship song I wrote",
      content:
        "I've been working on this song for months, and I finally feel it's ready to share. It's about God's grace and mercy in our darkest moments.",
      upvotes: 45,
      comments: 18,
      timeAgo: "8h ago",
      type: "video",
      communityIcon: "🎵",
      media: {
        type: "video",
        uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      },
      likes: 45,
      authorPhoto: null,
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
  ];

  // Sample testimonies
  const testimonies = [
    {
      id: "t1",
      community: "Testimonies",
      author: "Lisa Thompson",
      authorPhoto: null,
      title: "God answered my prayer!",
      content:
        "After months of praying for a job, I finally got the perfect position! God's timing is always perfect. Thank you for your prayers!",
      upvotes: 67,
      likes: 67,
      comments: 23,
      timeAgo: "1d ago",
      type: "testimony",
      communityIcon: "🌟",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: "t2",
      community: "Testimonies",
      author: "James Rodriguez",
      authorPhoto: null,
      title: "Healing from anxiety",
      content:
        "I struggled with severe anxiety for years. Through prayer, counseling, and God's grace, I'm finally free! Philippians 4:6-7 became my lifeline.",
      upvotes: 89,
      likes: 89,
      comments: 34,
      timeAgo: "2d ago",
      type: "testimony",
      communityIcon: "🌟",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: "t3",
      community: "Testimonies",
      author: "Maria Santos",
      authorPhoto: null,
      title: "Financial breakthrough",
      content:
        "We were drowning in debt, but God provided in ways we never expected. A friend offered us a job, and we're now debt-free! God is faithful!",
      upvotes: 156,
      likes: 156,
      comments: 45,
      timeAgo: "3d ago",
      type: "testimony",
      communityIcon: "🌟",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "t4",
      community: "Testimonies",
      author: "Robert Kim",
      authorPhoto: null,
      title: "Restored marriage",
      content:
        "My wife and I were on the brink of divorce. Through prayer, counseling, and God's intervention, our marriage is stronger than ever. Don't give up!",
      upvotes: 203,
      likes: 203,
      comments: 67,
      timeAgo: "4d ago",
      type: "testimony",
      communityIcon: "🌟",
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      id: "t5",
      community: "Testimonies",
      author: "Sarah Williams",
      authorPhoto: null,
      title: "Miracle baby",
      content:
        "Doctors said we couldn't have children. After 5 years of prayer and faith, we're expecting our first baby! God's promises are true!",
      upvotes: 312,
      likes: 312,
      comments: 89,
      timeAgo: "5d ago",
      type: "testimony",
      communityIcon: "🌟",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  const getTrendingPosts = () => {
    // Combine posts from all communities and sort by engagement
    const allPosts = [];

    // Add sample posts from different communities
    allPosts.push(
      {
        id: "trending-1",
        title: "God's Grace in Difficult Times",
        content:
          "I want to share how God's grace has been evident in my life during this challenging season. Even when everything seems uncertain, His love remains constant...",
        author: "Sarah Johnson",
        community: "Bible Study Group",
        communityId: "1",
        timeAgo: "2h ago",
        likes: 45,
        comments: 12,
        shares: 8,
        type: "testimony",
        isTrending: true,
      },
      {
        id: "trending-2",
        title: "Prayer Request: Healing for My Mother",
        content:
          "Please pray for my mother who is recovering from surgery. She's been in pain and we're trusting God for complete healing...",
        author: "Michael Chen",
        community: "Prayer Warriors",
        communityId: "2",
        timeAgo: "3h ago",
        likes: 38,
        comments: 25,
        shares: 15,
        type: "prayer",
        isTrending: true,
      },
      {
        id: "trending-3",
        title: "What does 'walking by faith' mean to you?",
        content:
          "I've been thinking about this verse: 'For we walk by faith, not by sight' (2 Corinthians 5:7). How do you practically apply this in your daily life?",
        author: "Emily Rodriguez",
        community: "Christian Living",
        communityId: "3",
        timeAgo: "4h ago",
        likes: 52,
        comments: 18,
        shares: 6,
        type: "discussion",
        isTrending: true,
      },
      {
        id: "trending-4",
        title: "Worship Song Recommendation",
        content:
          "Just discovered this beautiful worship song that has been ministering to my heart. 'Goodness of God' by Bethel Music - the lyrics are so powerful!",
        author: "David Wilson",
        community: "Worship & Praise",
        communityId: "4",
        timeAgo: "5h ago",
        likes: 67,
        comments: 14,
        shares: 22,
        type: "encouragement",
        isTrending: true,
      },
      {
        id: "trending-5",
        title: "Youth Group Mission Trip Update",
        content:
          "Our youth group just returned from a mission trip to Mexico. The impact we saw God make through our team was incredible! Here are some highlights...",
        author: "Lisa Brown",
        community: "Youth Ministry",
        communityId: "5",
        timeAgo: "6h ago",
        likes: 41,
        comments: 9,
        shares: 12,
        type: "testimony",
        isTrending: true,
      }
    );

    // Sort by engagement (likes + comments + shares)
    return allPosts.sort((a, b) => {
      const engagementA = a.likes + a.comments + a.shares;
      const engagementB = b.likes + b.comments + b.shares;
      return engagementB - engagementA;
    });
  };

  const getContentData = () => {
    // Combine posts from state with sample posts that have media
    const allPosts = [...posts, ...samplePosts];
    console.log(
      "All posts:",
      allPosts.length,
      "Posts with media:",
      allPosts.filter((p) => p.media).length
    );

    switch (selectedTab) {
      case "communities":
        return trendingCommunities.length > 0
          ? trendingCommunities
          : communities;
      case "trending":
        return allPosts.length > 0 ? allPosts : getTrendingPosts();
      case "testimonies":
        return allPosts.filter((post) => post.type === "testimony").slice(0, 3);
      case "new":
        return allPosts.slice(0, 10);
      case "top":
        return allPosts
          .sort(
            (a, b) =>
              (b.likes || 0) +
              (b.comments || 0) -
              ((a.likes || 0) + (a.comments || 0))
          )
          .slice(0, 10);
      default:
        return allPosts;
    }
  };

  const renderContentItem = ({ item }) => {
    switch (selectedTab) {
      case "communities":
        return renderCommunityCard(item);
      case "testimonies":
        // Use MediaPostCard for testimonies with media, custom card for text-only
        if (
          item.media &&
          (item.media.type === "image" || item.media.type === "video")
        ) {
          return (
            <MediaPostCard
              post={item}
              onPress={async () => {
                try {
                  await PostService.trackView(item.id);
                } catch (error) {
                  console.error("Error tracking view:", error);
                }
                navigation.navigate("PostDetail", { post: item });
              }}
            />
          );
        }
        return renderTestimonyCard(item);
      default:
        // Use MediaPostCard for posts with media, regular renderPost for others
        if (
          item.media &&
          (item.media.type === "image" || item.media.type === "video")
        ) {
          console.log("Rendering MediaPostCard for post:", item.id, item.media);
          return (
            <MediaPostCard
              post={item}
              onPress={async () => {
                try {
                  await PostService.trackView(item.id);
                } catch (error) {
                  console.error("Error tracking view:", error);
                }
                navigation.navigate("PostDetail", { post: item });
              }}
              onLike={(post) => console.log("Like post:", post.id)}
              onComment={(post) =>
                navigation.navigate("PostDetail", { post: item })
              }
              onShare={(post) => console.log("Share post:", post.id)}
              onDelete={() => {
                // Refresh posts after deletion
                loadPosts();
              }}
            />
          );
        }
        return renderPost(item);
    }
  };

  const renderTestimonyCard = (testimony) => (
    <TouchableOpacity
      style={dynamicStyles.testimonyCard}
      onPress={async () => {
        try {
          await PostService.trackView(testimony.id);
        } catch (error) {
          console.error("Error tracking view:", error);
        }
        navigation.navigate("PostDetail", { post: testimony });
      }}
    >
      <View style={styles.testimonyHeader}>
        <View style={styles.testimonyAuthor}>
          <View style={styles.testimonyAvatar}>
            <Ionicons name="person" size={16} color={darkMode ? "#fff" : "#666"} />
          </View>
          <View>
            <Text style={dynamicStyles.testimonyAuthorName}>{testimony.author}</Text>
            <Text style={dynamicStyles.testimonyTime}>{testimony.timeAgo}</Text>
          </View>
        </View>
        <View style={styles.testimonyType}>
          <Ionicons name="star" size={16} color="#FFD700" />
        </View>
      </View>
      <Text style={dynamicStyles.testimonyTitle}>{testimony.title}</Text>
      <Text style={dynamicStyles.testimonyContent}>{testimony.content}</Text>
      <View style={styles.testimonyActions}>
        <TouchableOpacity style={styles.testimonyAction}>
          <Ionicons name="heart-outline" size={16} color={darkMode ? "#fff" : "#666"} />
          <Text style={dynamicStyles.testimonyActionText}>{testimony.upvotes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.testimonyAction}>
          <Ionicons name="chatbubble-outline" size={16} color={darkMode ? "#fff" : "#666"} />
          <Text style={dynamicStyles.testimonyActionText}>{testimony.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.testimonyAction}>
          <Ionicons name="share-outline" size={16} color={darkMode ? "#fff" : "#666"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.testimonyAction}>
          <Ionicons name="eye-outline" size={16} color={darkMode ? "#fff" : "#666"} />
          <Text style={dynamicStyles.testimonyActionText}>{testimony.views || 0}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCommunityCard = (community) => (
    <EnhancedCommunityCard
      key={community.id}
      community={community}
      onPress={(community) =>
        navigation.navigate("CommunityDetail", { community })
      }
      onJoin={(communityId, isJoined) => {
        console.log(`Community ${communityId} ${isJoined ? "joined" : "left"}`);
        loadTrendingCommunities(); // Refresh trending list
      }}
      navigation={navigation}
    />
  );

  // Component for posts with delete functionality
  const PostCardWithDelete = ({ post }) => {
    const [isAuthor, setIsAuthor] = useState(false);

    useEffect(() => {
      const checkAuthor = async () => {
        try {
          const currentUser = await WorkingAuthService.getCurrentUser();
          if (!currentUser || !currentUser.uid) {
            setIsAuthor(false);
            return;
          }

          // Check if user is the author
          // Handle both authorId (new format) and author_id (old format)
          const postAuthorId = post.authorId || post.author_id;
          
          const userIsAuthor = postAuthorId && currentUser.uid === postAuthorId;
          
          // Debug logging (can be removed later)
          if (postAuthorId) {
            console.log("Post author check:", {
              postId: post.id,
              postAuthorId: postAuthorId,
              currentUserId: currentUser.uid,
              isAuthor: userIsAuthor
            });
          }
          
          setIsAuthor(userIsAuthor);
        } catch (error) {
          console.error("Error checking author:", error);
          setIsAuthor(false);
        }
      };
      checkAuthor();
    }, [post.authorId, post.author_id]);

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
                await PostService.deletePost(post.id);
                loadPosts(); // Refresh posts after deletion
                Alert.alert("Success", "Post deleted successfully");
              } catch (error) {
                // Show more specific error message
                const errorMessage = error.message || "Failed to delete post. Please try again.";
                Alert.alert("Error", errorMessage);
              }
            },
          },
        ]
      );
    };

    return (
      <TouchableOpacity
        key={post.id}
        style={dynamicStyles.postCard}
        onPress={async () => {
          // Track view (non-blocking, works without auth)
          PostService.trackView(post.id).catch(() => {
            // Silently handle errors - view tracking is non-critical
          });
          navigation.navigate("PostDetail", { post });
        }}
      >
        <View style={styles.postHeader}>
          <View style={styles.postCommunity}>
            <Ionicons name="people" size={16} color={darkMode ? "#fff" : "#1a365d"} />
            <Text style={dynamicStyles.postCommunityName}>{post.community}</Text>
            {post.isTrending && (
              <View style={styles.trendingBadge}>
                <Ionicons name="trending-up" size={12} color="#fff" />
                <Text style={styles.trendingText}>Trending</Text>
              </View>
            )}
          </View>
          <View style={styles.postHeaderRight}>
            <Text style={dynamicStyles.postTime}>{post.timeAgo}</Text>
            {/* Three dots menu - only show for author */}
            {isAuthor && (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={handleDelete}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={darkMode ? "#fff" : "#666"} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={dynamicStyles.postTitle}>{post.title}</Text>
        <Text style={dynamicStyles.postContent} numberOfLines={3}>
          {post.content}
        </Text>

        <View style={styles.postFooter}>
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={20} color={darkMode ? "#fff" : "#666"} />
              <Text style={dynamicStyles.actionText}>
                {post.likes || post.upvotes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={20} color={darkMode ? "#fff" : "#666"} />
              <Text style={dynamicStyles.actionText}>{post.comments}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-outline" size={20} color={darkMode ? "#fff" : "#666"} />
              <Text style={dynamicStyles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="eye-outline" size={20} color={darkMode ? "#fff" : "#666"} />
              <Text style={dynamicStyles.actionText}>{post.views || 0}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.postType}>
            <Text style={[styles.postTypeText, { color: darkMode ? "#fff" : "#1a365d" }]}>{post.type}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPost = (post) => {
    return <PostCardWithDelete key={post.id} post={post} />;
  };

  const renderTab = (tabName, title, icon) => (
    <TouchableOpacity
      style={[styles.tab, selectedTab === tabName && styles.activeTab]}
      onPress={() => setSelectedTab(tabName)}
    >
      <View style={styles.tabIconContainer}>
        <Ionicons
          name={icon}
          size={18}
          color={selectedTab === tabName ? "#1a365d" : "#666"}
        />
      </View>
      <Text
        style={[
          styles.tabText,
          selectedTab === tabName && styles.activeTabText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (selectedCommunity) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedCommunity(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#1a365d" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedCommunity.name}</Text>
        </View>

        <ScrollView style={styles.communityContent}>
          <View style={styles.communityBanner}>
            <View
              style={[
                styles.communityBannerIcon,
                { backgroundColor: selectedCommunity.color },
              ]}
            >
              <Text style={styles.communityBannerIconText}>
                {selectedCommunity.icon}
              </Text>
            </View>
            <Text style={styles.communityBannerName}>
              {selectedCommunity.name}
            </Text>
            <Text style={styles.communityBannerDescription}>
              {selectedCommunity.description}
            </Text>
            <View style={styles.communityBannerStats}>
              <Text style={styles.communityBannerStatsText}>
                {selectedCommunity.members} members • {selectedCommunity.posts}{" "}
                posts
              </Text>
            </View>
          </View>

          <View style={styles.communityPosts}>
            <Text style={dynamicStyles.sectionTitle}>Recent Posts</Text>
            {posts
              .filter((post) => post.community === selectedCommunity.name)
              .map(renderPost)}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Load dark mode preference
  useEffect(() => {
    const loadDarkMode = async () => {
      const isDark = await DarkModeService.isDarkMode();
      setDarkMode(isDark);
    };
    loadDarkMode();
    
    // Listen for dark mode changes
    const interval = setInterval(loadDarkMode, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      await loadCommunityPersistentData();
      await loadTrendingCommunities();
      await initializeCommunityStats();
    };
    loadData();
  }, []);

  // Load posts when component mounts
  useEffect(() => {
    loadPosts();
  }, []);

  // Refresh posts when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadPosts();
      // Ensure navigation is visible when screen is focused
      setIsScrolling(false);
    });
    return unsubscribe;
  }, [navigation]);

  // Cleanup scroll state when component unmounts
  useEffect(() => {
    return () => {
      if (scrollIdleTimeoutRef.current) {
        clearTimeout(scrollIdleTimeoutRef.current);
      }
      setIsScrolling(false);
    };
  }, []);

  const dynamicStyles = getStyles(darkMode);
  
  return (
    <View style={dynamicStyles.container}>
      {/* Time-based Background Image with Content Overlay */}
      <ImageBackground
        source={getTimeBasedImages().headerBG}
        style={styles.headerImageContainer}
        imageStyle={styles.headerImage}
        defaultSource={NightBG} // Fallback to prevent black screen
      >
        <View style={styles.headerImageOverlay} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={dynamicStyles.headerTitle}>Community</Text>
              <Text style={dynamicStyles.headerSubtitle}>
                Connect with fellow believers
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => navigation.navigate("Search")}
              >
                <Ionicons name="search" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => navigation.navigate("Settings")}
              >
                <Ionicons name="settings-outline" size={24} color="#333" />
              </TouchableOpacity>
              <NotificationBadge
                onPress={() => navigation.navigate("Notifications")}
                size={24}
                color="#333"
              />
              <UserAvatar
                size={40}
                onPress={() => navigation.navigate("Auth")}
                onLongPress={handleLogout}
                style={styles.userButton}
              />
            </View>
          </View>
        </View>
      </ImageBackground>

      {/* Navigation Tabs - Fixed Position */}
      <View style={styles.fixedTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContentContainer}
        >
          {renderTab("trending", "Trending", "trending-up")}
          {renderTab("communities", "Communities", "people")}
          {renderTab("testimonies", "Testimonies", "heart")}
          {renderTab("new", "New", "time")}
          {renderTab("top", "Top", "star")}
        </ScrollView>
      </View>
      {/* Sign In Encouragement Banner - Only show if not signed in */}
      {showSignInBanner && (
        <View style={styles.signInBanner}>
          <View style={styles.signInBannerContent}>
            <Ionicons
              name="heart"
              size={16}
              color="#1a365d"
              style={styles.signInBannerIcon}
            />
            <Text style={styles.signInBannerText}>
              Sign in to create communities, post testimonies, and encourage
              believers
            </Text>
          </View>
          <TouchableOpacity
            style={styles.signInBannerClose}
            onPress={dismissSignInBanner}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={getContentData()}
        renderItem={renderContentItem}
        keyExtractor={(item) => item.id}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        numColumns={selectedTab === "communities" ? 2 : 1}
        columnWrapperStyle={selectedTab === "communities" ? styles.row : null}
        key={selectedTab} // Force re-render when tab changes
        onScrollBeginDrag={() => setIsScrolling(true)}
        onScrollEndDrag={() => {
          clearTimeout(scrollIdleTimeoutRef.current);
          scrollIdleTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
          }, 2000);
        }}
        onMomentumScrollBegin={() => setIsScrolling(true)}
        onMomentumScrollEnd={() => {
          clearTimeout(scrollIdleTimeoutRef.current);
          scrollIdleTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
          }, 2000);
        }}
        ListHeaderComponent={() => (
          <View style={styles.sectionHeader}>
            {/* Post Button - Only on Trending Page */}
            {selectedTab === "trending" && (
              <View style={styles.postButtonWrapper}>
                <TouchableOpacity
                  style={styles.postButton}
                  onPress={() => navigation.navigate("CreatePost")}
                >
                  <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
            )}
            {selectedTab === "communities" && (
              <View style={styles.communitiesHeader}>
                <Text style={dynamicStyles.sectionTitle}>Popular Communities</Text>
                <TouchableOpacity
                  style={styles.createCommunityButton}
                  onPress={() => navigation.navigate("CreateCommunity")}
                >
                  <Ionicons name="add" size={20} color="#1a365d" />
                  <Text style={styles.createCommunityText}>Create</Text>
                </TouchableOpacity>
              </View>
            )}
            {selectedTab === "trending" && (
              <Text style={dynamicStyles.sectionTitle}>Trending Posts</Text>
            )}
            {selectedTab === "testimonies" && (
              <View style={styles.testimoniesSection}>
                {/* Scripture Header */}
                <View style={styles.scriptureHeader}>
                  <Text style={styles.scriptureText}>
                    "But you will receive power when the Holy Spirit comes on
                    you; and you will be my witnesses... to the ends of the
                    earth."
                  </Text>
                  <Text style={styles.scriptureReference}>Acts 1:8</Text>
                </View>

                {/* Testimonies Header */}
                <View style={styles.testimoniesHeader}>
                  <Text style={dynamicStyles.sectionTitle}>Testimonies</Text>
                  <TouchableOpacity
                    style={styles.shareTestimonyButton}
                    onPress={() => navigation.navigate("CreateTestimony")}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.shareTestimonyButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {(selectedTab === "new" || selectedTab === "top") && (
              <Text style={dynamicStyles.sectionTitle}>
                {selectedTab === "new" ? "New Posts" : "Top Posts"}
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
};

// Helper function to get dynamic styles based on dark mode
const getStyles = (darkMode) => ({
  container: {
    flex: 1,
    backgroundColor: darkMode ? "#1a1a1a" : "#f5f5f5",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: darkMode ? "#fff" : "#333",
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: darkMode ? "#fff" : "#333",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: darkMode ? "#fff" : "#333",
    opacity: 0.9,
  },
  fixedTabsContainer: {
    backgroundColor: darkMode ? "#2a2a2a" : "#fff",
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  communityCard: {
    backgroundColor: darkMode ? "#2a2a2a" : "#fff",
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  communityName: {
    fontSize: 18,
    fontWeight: "bold",
    color: darkMode ? "#fff" : "#333",
    marginBottom: 5,
  },
  communityDescription: {
    fontSize: 14,
    color: darkMode ? "#ccc" : "#666",
    marginBottom: 8,
  },
  postCard: {
    backgroundColor: darkMode ? "#2a2a2a" : "#fff",
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  testimonyCard: {
    backgroundColor: darkMode ? "#2a2a2a" : "#fff",
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: darkMode ? "#fff" : "#333",
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: darkMode ? "#fff" : "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  postCommunityName: {
    fontSize: 14,
    color: darkMode ? "#fff" : "#1a365d",
    fontWeight: "600",
  },
  postTime: {
    fontSize: 12,
    color: darkMode ? "#ccc" : "#999",
  },
  actionText: {
    fontSize: 14,
    color: darkMode ? "#fff" : "#666",
    marginLeft: 5,
  },
  testimonyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: darkMode ? "#fff" : "#333",
    marginBottom: 10,
  },
  testimonyContent: {
    fontSize: 14,
    color: darkMode ? "#fff" : "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  testimonyAuthorName: {
    fontSize: 14,
    fontWeight: "600",
    color: darkMode ? "#fff" : "#333",
  },
  testimonyTime: {
    fontSize: 12,
    color: darkMode ? "#ccc" : "#999",
  },
  testimonyActionText: {
    fontSize: 14,
    color: darkMode ? "#fff" : "#666",
    marginLeft: 5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerImageContainer: {
    height: 50, // Much smaller like Reddit
    width: "100%",
  },
  headerImage: {
    resizeMode: "cover",
    opacity: 0.8, // Slightly more visible
  },
  headerImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.3)", // Light overlay for better text readability
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#333",
    opacity: 0.9,
  },
  searchButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
  },
  userButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 5,
  },
  fixedTabsContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  signInBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    marginHorizontal: 12,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#1a365d",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  signInBannerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  signInBannerIcon: {
    marginRight: 8,
  },
  signInBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#1a365d",
    lineHeight: 18,
  },
  signInBannerClose: {
    padding: 4,
    marginLeft: 8,
  },
  postButtonWrapper: {
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  postButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a365d",
  },
  tabsContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 6,
    padding: 4,
    maxHeight: 45,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabsContentContainer: {
    flexDirection: "row",
    paddingHorizontal: 2,
    alignItems: "center",
    height: 50,
  },
  tab: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: "#f8f9fa",
    minWidth: 50,
    height: 35,
  },
  activeTab: {
    backgroundColor: "#E3F2FD",
  },
  tabIconContainer: {
    marginBottom: 1,
  },
  tabText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  activeTabText: {
    color: "#1a365d",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 15,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  communitiesSection: {
    marginBottom: 30,
  },
  postsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  communitiesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  testimoniesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  createCommunityButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1a365d",
  },
  createCommunityText: {
    fontSize: 14,
    color: "#1a365d",
    fontWeight: "600",
    marginLeft: 4,
  },
  communityCard: {
    backgroundColor: "#fff",
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  communityHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  communityIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  communityIconText: {
    fontSize: 24,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  communityDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  communityStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  communityStatsText: {
    fontSize: 12,
    color: "#999",
    marginRight: 5,
  },
  joinButton: {
    backgroundColor: "#1a365d",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  postCard: {
    backgroundColor: "#fff",
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  postHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moreButton: {
    padding: 4,
    marginLeft: 8,
  },
  postCommunity: {
    flexDirection: "row",
    alignItems: "center",
  },
  postCommunityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  trendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  trendingText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 2,
  },
  postCommunityName: {
    fontSize: 14,
    color: "#1a365d",
    fontWeight: "600",
  },
  postTime: {
    fontSize: 12,
    color: "#999",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postActions: {
    flexDirection: "row",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  postType: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postTypeText: {
    fontSize: 12,
    color: "#1a365d",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  communityContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  communityBanner: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  communityBannerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  communityBannerIconText: {
    fontSize: 32,
  },
  communityBannerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  communityBannerDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  communityBannerStats: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  communityBannerStatsText: {
    fontSize: 14,
    color: "#666",
  },
  communityPosts: {
    marginBottom: 30,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1a365d",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  testimoniesSection: {
    marginBottom: 20,
  },
  scriptureHeader: {
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  scriptureText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
    fontStyle: "italic",
    marginBottom: 8,
  },
  scriptureReference: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  shareTestimonyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a365d",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareTestimonyButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
  },
  testimonyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  testimonyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  testimonyAuthor: {
    flexDirection: "row",
    alignItems: "center",
  },
  testimonyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  testimonyAuthorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  testimonyTime: {
    fontSize: 12,
    color: "#666",
  },
  testimonyType: {
    backgroundColor: "#FFF8DC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  testimonyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  testimonyContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  testimonyActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  testimonyAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  testimonyActionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
});

export default CommunityScreen;
