import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
  Modal,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import PrayerService from "../services/PrayerService";
import PrayerFirebaseService from "../services/PrayerFirebaseService";
import MediaService from "../services/MediaService";
import MediaPostCard from "../components/MediaPostCard";
import PrayerEngagementService from "../services/PrayerEngagementService";

const { width: screenWidth } = Dimensions.get("window");

const PrayerCategoriesScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [allPrayers, setAllPrayers] = useState([]);
  const [filteredPrayers, setFilteredPrayers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Comment modal state
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPrayerForComment, setSelectedPrayerForComment] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentImages, setCommentImages] = useState([]);
  const [commentVideos, setCommentVideos] = useState([]);
  
  // Video playback state for comments
  const [playingCommentVideos, setPlayingCommentVideos] = useState({});
  const [loadedCommentVideos, setLoadedCommentVideos] = useState({});
  const commentVideoRefs = useRef({});
  
  // Like state tracking
  const [likedPrayers, setLikedPrayers] = useState({});

  // All available categories (including custom ones from prayers)
  const defaultCategories = [
    "Healing",
    "Guidance",
    "Family",
    "Financial",
    "Comfort",
    "Career",
    "Relationships",
    "Peace",
    "Gratitude",
    "Protection",
    "Strength",
    "Wisdom",
    "Forgiveness",
    "Salvation",
    "Provision",
    "Deliverance",
    "Restoration",
    "General",
  ];

  useEffect(() => {
    loadPrayers();
  }, []);

  useEffect(() => {
    filterPrayersByCategory();
  }, [selectedCategory, allPrayers]);

  const loadPrayers = async () => {
    try {
      setLoading(true);
      // Load both prayers and prayer requests
      const [prayers, requests] = await Promise.all([
        PrayerFirebaseService.getAllPrayers(),
        PrayerFirebaseService.getAllPrayerRequests(),
      ]);

      // Combine all prayers
      const combined = [
        ...prayers.map((p) => ({ ...p, itemType: "prayer" })),
        ...requests.map((r) => ({ ...r, itemType: "request" })),
      ].sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0);
        const dateB = new Date(b.timestamp || b.createdAt || 0);
        return dateB - dateA;
      });

      // Load comment counts for all prayers
      const prayersWithComments = await Promise.all(
        combined.map(async (prayer) => {
          const prayerId = PrayerEngagementService.getPrayerId(prayer);
          const comments = await PrayerEngagementService.getComments(prayerId);
          return {
            ...prayer,
            comments: comments.length,
          };
        })
      );
      
      setAllPrayers(prayersWithComments);
      
      // Load liked prayers
      await loadLikedPrayers(prayersWithComments);
      
      // Set initial category to the one with most prayers
      if (combined.length > 0 && !selectedCategory) {
        const categoryCounts = {};
        combined.forEach((prayer) => {
          if (prayer.category) {
            categoryCounts[prayer.category] = (categoryCounts[prayer.category] || 0) + 1;
          }
        });
        
        // Find category with most prayers
        let maxCount = 0;
        let categoryWithMost = "Healing"; // Default fallback
        Object.keys(categoryCounts).forEach((cat) => {
          if (categoryCounts[cat] > maxCount) {
            maxCount = categoryCounts[cat];
            categoryWithMost = cat;
          }
        });
        
        setSelectedCategory(categoryWithMost);
      } else if (combined.length === 0 && !selectedCategory) {
        setSelectedCategory("Healing"); // Default if no prayers
      }
    } catch (error) {
      console.error("Error loading prayers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPrayersByCategory = () => {
    if (!selectedCategory) {
      setFilteredPrayers([]);
      return;
    }

    const filtered = allPrayers.filter(
      (prayer) => prayer.category === selectedCategory
    );
    setFilteredPrayers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrayers();
    setRefreshing(false);
  };

  const getCategoryColor = (category) => {
    const colors = {
      Healing: "#FF6B6B",
      Guidance: "#4ECDC4",
      Family: "#45B7D1",
      Financial: "#96CEB4",
      Comfort: "#FFEAA7",
      Career: "#DDA0DD",
      Relationships: "#98D8C8",
      Peace: "#00BCD4",
      Gratitude: "#4CAF50",
      Protection: "#F44336",
      Strength: "#795548",
      Wisdom: "#9C27B0",
      Forgiveness: "#95A5A6",
      Salvation: "#E91E63",
      Provision: "#FF9800",
      Deliverance: "#673AB7",
      Restoration: "#009688",
      General: "#1a365d",
    };
    // For custom categories, generate a color based on the category name
    if (!colors[category]) {
      let hash = 0;
      for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = Math.abs(hash % 360);
      return `hsl(${hue}, 60%, 50%)`;
    }
    return colors[category] || "#1a365d";
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Recently";
    const now = new Date();
    const itemDate = new Date(timestamp);
    const diffInHours = Math.floor((now - itemDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return itemDate.toLocaleDateString();
  };

  const loadLikedPrayers = async (prayers) => {
    try {
      const likedMap = {};
      for (const prayer of prayers) {
        const prayerId = PrayerEngagementService.getPrayerId(prayer);
        const isLiked = await PrayerEngagementService.isLiked(prayerId);
        likedMap[prayerId] = isLiked;
      }
      setLikedPrayers(likedMap);
    } catch (error) {
      console.error("Error loading liked prayers:", error);
    }
  };

  const handleLike = async (item) => {
    try {
      const prayerId = PrayerEngagementService.getPrayerId(item);
      
      // Optimistically update UI first
      const currentLiked = likedPrayers[prayerId] || false;
      const newLikedState = !currentLiked;
      const increment = newLikedState ? 1 : -1;
      
      // Update UI immediately
      setLikedPrayers((prev) => ({
        ...prev,
        [prayerId]: newLikedState,
      }));
      
      // Update filtered prayers immediately
      setFilteredPrayers((prevData) =>
        prevData.map((p) => {
          const pid = PrayerEngagementService.getPrayerId(p);
          if (pid === prayerId) {
            return { ...p, likes: Math.max(0, (p.likes || 0) + increment) };
          }
          return p;
        })
      );
      
      // Update all prayers immediately
      setAllPrayers((prevData) =>
        prevData.map((p) => {
          const pid = PrayerEngagementService.getPrayerId(p);
          if (pid === prayerId) {
            return { ...p, likes: Math.max(0, (p.likes || 0) + increment) };
          }
          return p;
        })
      );
      
      // Then update storage (non-blocking)
      try {
        await PrayerEngagementService.toggleLike(prayerId);
        await PrayerEngagementService.updatePrayerLikeCount(prayerId, increment);
        await PrayerFirebaseService.updatePrayerLikeCount(prayerId, increment);
      } catch (storageError) {
        // If storage fails, revert UI (but this shouldn't happen often)
        console.warn("Storage update failed, but UI updated:", storageError.message || storageError);
        // Don't revert - keep the optimistic update since storage errors are rare
      }
    } catch (error) {
      // Only show error if it's not a Firebase permission error
      if (error?.code !== "permission-denied" && !error?.message?.includes("permissions")) {
        console.error("Error toggling like:", error);
        Alert.alert("Error", "Failed to update like");
      } else {
        // Firebase permission errors are expected if Firebase isn't configured
        // Just log it silently since we're using local storage anyway
        console.warn("Firebase permission error (ignored, using local storage):", error.message || error);
      }
    }
  };

  const handleComment = async (item) => {
    setSelectedPrayerForComment(item);
    const prayerId = PrayerEngagementService.getPrayerId(item);
    const commentsData = await PrayerEngagementService.getComments(prayerId);
    setComments(commentsData);
    setShowCommentModal(true);
  };

  const handleCloseCommentModal = () => {
    setShowCommentModal(false);
    setSelectedPrayerForComment(null);
    setNewComment("");
    setCommentImages([]);
    setCommentVideos([]);
    setComments([]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() && commentImages.length === 0 && commentVideos.length === 0) {
      Alert.alert("Error", "Please enter a comment or add media");
      return;
    }

    try {
      const prayerId = PrayerEngagementService.getPrayerId(selectedPrayerForComment);
      
      // Determine media (prioritize video, then image)
      let media = null;
      if (commentVideos.length > 0) {
        media = {
          type: "video",
          uri: commentVideos[0].uri,
          thumbnail: commentVideos[0].thumbnail,
          duration: commentVideos[0].duration,
        };
      } else if (commentImages.length > 0) {
        media = {
          type: "image",
          uri: commentImages[0].uri,
        };
      }

      await PrayerEngagementService.addComment(prayerId, {
        text: newComment.trim(),
        author: "Anonymous",
        media: media,
      });

      // Reload comments
      const updatedComments = await PrayerEngagementService.getComments(prayerId);
      setComments(updatedComments);
      
      // Update comment count
      setFilteredPrayers((prevData) =>
        prevData.map((p) => {
          const pid = PrayerEngagementService.getPrayerId(p);
          if (pid === prayerId) {
            return { ...p, comments: (p.comments || 0) + 1 };
          }
          return p;
        })
      );

      setAllPrayers((prevData) =>
        prevData.map((p) => {
          const pid = PrayerEngagementService.getPrayerId(p);
          if (pid === prayerId) {
            return { ...p, comments: (p.comments || 0) + 1 };
          }
          return p;
        })
      );

      // Clear form
      setNewComment("");
      setCommentImages([]);
      setCommentVideos([]);
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    }
  };

  // Media picker functions for comments
  const pickImageForComment = async () => {
    try {
      const images = await MediaService.pickImage();
      if (images.length > 0) {
        setCommentImages([...commentImages, ...images]);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick images");
    }
  };

  const takePhotoForComment = async () => {
    try {
      const photos = await MediaService.takePhoto();
      if (photos.length > 0) {
        setCommentImages([...commentImages, ...photos]);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to take photo");
    }
  };

  const pickVideoForComment = async () => {
    try {
      const videos = await MediaService.pickVideo();
      if (videos.length > 0) {
        navigation.navigate("VideoPreview", {
          videoUri: videos[0].uri,
          onVideoConfirmed: (videoData) => {
            setCommentVideos([...commentVideos, videoData]);
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick video");
    }
  };

  const recordVideoForComment = async () => {
    try {
      const videos = await MediaService.recordVideo();
      if (videos.length > 0) {
        navigation.navigate("VideoPreview", {
          videoUri: videos[0].uri,
          onVideoConfirmed: (videoData) => {
            setCommentVideos([...commentVideos, videoData]);
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to record video");
    }
  };

  const removeImageFromComment = (imageId) => {
    setCommentImages(commentImages.filter((img) => img.id !== imageId));
  };

  const removeVideoFromComment = (videoId) => {
    setCommentVideos(commentVideos.filter((video) => video.id !== videoId));
  };

  // Get all unique categories from prayers (including custom ones), sorted by count
  const getAllCategories = () => {
    // Count prayers per category
    const categoryCounts = {};
    
    // Initialize with default categories (count 0)
    defaultCategories.forEach((cat) => {
      categoryCounts[cat] = 0;
    });
    
    // Count prayers for each category
    allPrayers.forEach((prayer) => {
      if (prayer.category) {
        if (!categoryCounts[prayer.category]) {
          categoryCounts[prayer.category] = 0;
        }
        categoryCounts[prayer.category]++;
      }
    });
    
    // Get all categories (default + custom)
    const allCategories = Object.keys(categoryCounts);
    
    // Sort by count (descending), then alphabetically for same count
    return allCategories.sort((a, b) => {
      const countDiff = categoryCounts[b] - categoryCounts[a];
      if (countDiff !== 0) {
        return countDiff; // Sort by count first
      }
      return a.localeCompare(b); // Then alphabetically
    });
  };

  const renderFeedItem = ({ item }) => {
    // Check for prayer request - check multiple possible fields
    const isRequest = 
      item.itemType === "request" || 
      item.type === "request" ||
      (item.title && item.title.toLowerCase().includes("prayer request")) ||
      (item.content && item.content.toLowerCase().includes("prayer request"));
    const categoryColor = getCategoryColor(item.category);

    // Use MediaPostCard if item has media
    if (item.media && (item.media.type === "image" || item.media.type === "video")) {
      const postForMediaCard = {
        ...item,
        timeAgo: formatTimestamp(item.timestamp),
        authorPhoto: null,
        authorId: null,
        views: 0,
      };

      return (
        <View>
          {isRequest && (
            <View style={styles.requestBadgeContainer}>
              <View style={styles.requestBadge}>
                <Ionicons name="heart-circle" size={16} color="#FF6B6B" />
                <Text style={styles.requestBadgeText}>Prayer Request</Text>
              </View>
            </View>
          )}
          {/* Category Badge for Media Posts */}
          {item.category && (
            <View style={styles.categoryBadgeContainer}>
        <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: categoryColor },
                ]}
              >
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            </View>
          )}
          <MediaPostCard
            post={{
              ...postForMediaCard,
              comments: item.comments || 0,
            }}
            onPress={() => {}}
            onLike={() => handleLike(item)}
            onComment={() => handleComment(item)}
            onShare={null}
          />
        </View>
      );
    }

    // Regular card for items without media
    return (
      <View style={styles.feedCard}>
        {/* Prayer Request Badge */}
        {isRequest && (
          <View style={styles.requestBadge}>
            <Ionicons name="heart-circle" size={16} color="#FF6B6B" />
            <Text style={styles.requestBadgeText}>Prayer Request</Text>
          </View>
        )}

        <View style={styles.feedHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.feedTitle}>{item.title}</Text>
            {item.category && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: categoryColor },
                ]}
              >
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>

        <Text style={styles.feedContent}>
          {item.body || item.content || item.prayer}
        </Text>

        <View style={styles.feedFooter}>
          <Text style={styles.author}>- {item.author || "Anonymous"}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(item)}
            >
        <Ionicons
                name={likedPrayers[PrayerEngagementService.getPrayerId(item)] ? "heart" : "heart-outline"} 
                size={16} 
                color={likedPrayers[PrayerEngagementService.getPrayerId(item)] ? "#FF6B6B" : "#1a365d"} 
              />
              <Text style={styles.actionText}>{item.likes || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleComment(item)}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#1a365d" />
              <Text style={styles.actionText}>{item.comments || 0}</Text>
            </TouchableOpacity>
      </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Prayers in This Category</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to share a prayer in the {selectedCategory} category
      </Text>
    </View>
  );

  const categories = getAllCategories();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a365d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prayer Categories</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Category Tabs */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            const categoryColor = getCategoryColor(category);
            const count = allPrayers.filter((p) => p.category === category).length;

            // Only show categories that have prayers OR are default categories (even with 0)
            // But prioritize showing categories with prayers first
            if (count === 0 && !defaultCategories.includes(category)) {
              return null; // Don't show custom categories with 0 prayers
            }

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  {
                    backgroundColor: isSelected ? categoryColor : "#f0f0f0",
                  },
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    { color: isSelected ? "#fff" : "#666" },
                  ]}
                >
                  {category}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.categoryCountBadge,
                      {
                        backgroundColor: isSelected
                          ? "rgba(255,255,255,0.3)"
                          : "rgba(0,0,0,0.1)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryCountText,
                        { color: isSelected ? "#fff" : "#666" },
                      ]}
                    >
                      {count}
        </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Feed */}
      <FlatList
        data={filteredPrayers}
        renderItem={renderFeedItem}
        keyExtractor={(item) => `${item.itemType}-${item.id}`}
        contentContainerStyle={
          filteredPrayers.length === 0
            ? styles.emptyListContainer
            : styles.listContainer
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseCommentModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.commentModalContainer}>
            {/* Header */}
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>Comments</Text>
              <TouchableOpacity
                style={styles.commentModalCloseButton}
                onPress={handleCloseCommentModal}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item: comment }) => {
                const isVideoPlaying = playingCommentVideos[comment.id] || false;
                const videoRef = commentVideoRefs.current[comment.id];
                
                return (
                  <View style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>{comment.author}</Text>
                      <Text style={styles.commentTime}>
                        {PrayerEngagementService.formatTimeAgo(comment.timestamp)}
                      </Text>
                    </View>
                    {comment.text ? (
                      <Text style={styles.commentText}>{comment.text}</Text>
                    ) : null}
                    {comment.media && (
                      <View style={styles.commentMediaContainer}>
                        {comment.media.type === "image" ? (
                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => {
                              // Could add image viewer modal here if needed
                            }}
                          >
                            <Image
                              source={{ uri: comment.media.uri }}
                              style={styles.commentMediaImage}
                              resizeMode="contain"
                            />
                          </TouchableOpacity>
                        ) : comment.media.type === "video" ? (
                          <View style={styles.commentVideoWrapper}>
                            <TouchableWithoutFeedback
                              onPress={async () => {
                                const videoRef = commentVideoRefs.current[comment.id];
                                if (!videoRef || !loadedCommentVideos[comment.id]) return;
                                try {
                                  const status = await videoRef.getStatusAsync();
                                  if (status.isPlaying) {
                                    await videoRef.pauseAsync();
                                    setPlayingCommentVideos((prev) => ({
                                      ...prev,
                                      [comment.id]: false,
                                    }));
                                  } else {
                                    await videoRef.playAsync();
                                    setPlayingCommentVideos((prev) => ({
                                      ...prev,
                                      [comment.id]: true,
                                    }));
                                  }
                                } catch (error) {
                                  console.error("Error toggling video:", error);
                                }
                              }}
                            >
                              <View>
                                {comment.media.thumbnail && !isVideoPlaying ? (
                                  <Image
                                    source={{ uri: comment.media.thumbnail }}
                                    style={styles.commentMediaImage}
                                    resizeMode="contain"
                                  />
                                ) : null}
                                <Video
                                  ref={(ref) => {
                                    if (ref) {
                                      commentVideoRefs.current[comment.id] = ref;
                                    }
                                  }}
                                  source={{ uri: comment.media.uri }}
                                  style={[
                                    styles.commentMediaImage,
                                    !isVideoPlaying && comment.media.thumbnail && styles.hiddenVideo,
                                  ]}
                                  resizeMode="contain"
                                  shouldPlay={false}
                                  isLooping={false}
                                  useNativeControls={false}
                                  onLoad={() => {
                                    setLoadedCommentVideos((prev) => ({
                                      ...prev,
                                      [comment.id]: true,
                                    }));
                                  }}
                                  onPlaybackStatusUpdate={(status) => {
                                    if (status.isPlaying !== isVideoPlaying) {
                                      setPlayingCommentVideos((prev) => ({
                                        ...prev,
                                        [comment.id]: status.isPlaying || false,
                                      }));
                                    }
                                    if (status.didJustFinish) {
                                      setPlayingCommentVideos((prev) => ({
                                        ...prev,
                                        [comment.id]: false,
                                      }));
                                      const videoRef = commentVideoRefs.current[comment.id];
                                      if (videoRef) {
                                        videoRef.setPositionAsync(0);
                                      }
                                    }
                                  }}
                                />
                                {!isVideoPlaying && (
                                  <View style={styles.commentVideoPlayButtonOverlay}>
                                    <Ionicons name="play-circle" size={48} color="#fff" />
                                  </View>
                                )}
                                {isVideoPlaying && (
                                  <View style={styles.commentVideoPauseOverlay}>
                                    <Ionicons name="pause-circle" size={48} color="#fff" />
                                  </View>
                                )}
                              </View>
                            </TouchableWithoutFeedback>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                );
              }}
              contentContainerStyle={styles.commentsList}
              ListEmptyComponent={
                <View style={styles.emptyCommentsContainer}>
                  <Text style={styles.emptyCommentsText}>No comments yet</Text>
                  <Text style={styles.emptyCommentsSubtext}>
                    Be the first to comment
                  </Text>
                </View>
              }
            />

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.commentMediaButtonsRow}>
                  <TouchableOpacity
                    style={styles.commentMediaButton}
                    onPress={pickImageForComment}
                  >
                    <Ionicons name="image" size={18} color="#1a365d" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.commentMediaButton}
                    onPress={takePhotoForComment}
                  >
                    <Ionicons name="camera" size={18} color="#1a365d" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.commentMediaButton}
                    onPress={pickVideoForComment}
                  >
                    <Ionicons name="videocam" size={18} color="#1a365d" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.commentMediaButton}
                    onPress={recordVideoForComment}
                  >
                    <Ionicons name="videocam-outline" size={18} color="#1a365d" />
                  </TouchableOpacity>
      </View>
    </ScrollView>

              {/* Media Preview */}
              {commentImages.length > 0 && (
                <View style={styles.commentMediaPreview}>
                  {commentImages.map((image) => (
                    <View key={image.id} style={styles.commentMediaPreviewItem}>
                      <Image
                        source={{ uri: image.uri }}
                        style={styles.commentMediaPreviewImage}
                      />
                      <TouchableOpacity
                        style={styles.commentMediaRemoveButton}
                        onPress={() => removeImageFromComment(image.id)}
                      >
                        <Ionicons name="close-circle" size={20} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {commentVideos.length > 0 && (
                <View style={styles.commentMediaPreview}>
                  {commentVideos.map((video) => (
                    <View key={video.id} style={styles.commentMediaPreviewItem}>
                      {video.thumbnail ? (
                        <Image
                          source={{ uri: video.thumbnail }}
                          style={styles.commentMediaPreviewImage}
                        />
                      ) : (
                        <View style={styles.commentMediaPreviewPlaceholder}>
                          <Ionicons name="videocam" size={24} color="#666" />
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.commentMediaRemoveButton}
                        onPress={() => removeVideoFromComment(video.id)}
                      >
                        <Ionicons name="close-circle" size={20} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.commentSubmitButton}
                  onPress={handleAddComment}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  categoriesContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
    paddingVertical: 12,
  },
  categoriesScrollContent: {
    paddingHorizontal: 12,
    alignItems: "center",
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    minHeight: 36,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoryCountBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  categoryCountText: {
    fontSize: 11,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  feedCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  requestBadgeContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  categoryBadgeContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  requestBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  requestBadgeText: {
    fontSize: 11,
    color: "#FF6B6B",
    fontWeight: "600",
    marginLeft: 4,
  },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  categoryText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
  },
  feedContent: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  feedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  author: {
    fontSize: 12,
    color: "#1a365d",
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  actionText: {
    fontSize: 12,
    color: "#1a365d",
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  commentModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
  },
  commentModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  commentModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  commentModalCloseButton: {
    padding: 4,
  },
  commentsList: {
    padding: 16,
    paddingBottom: 8,
  },
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  commentTime: {
    fontSize: 12,
    color: "#666",
  },
  commentText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginTop: 4,
  },
  commentMediaContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    width: "100%",
    maxWidth: screenWidth - 64, // Account for padding
  },
  commentMediaImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
  },
  commentVideoWrapper: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
  },
  commentVideoPlayButtonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  commentVideoPauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  hiddenVideo: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  emptyCommentsContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: "#999",
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e1e5e9",
    padding: 12,
    backgroundColor: "#fff",
  },
  commentMediaButtonsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  commentMediaButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  commentMediaPreview: {
    flexDirection: "row",
    marginBottom: 8,
  },
  commentMediaPreviewItem: {
    position: "relative",
    marginRight: 8,
  },
  commentMediaPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#000",
  },
  commentMediaPreviewPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  commentMediaRemoveButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 8,
    fontSize: 14,
    color: "#333",
  },
  commentSubmitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a365d",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PrayerCategoriesScreen;
