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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import PrayerService from "../services/PrayerService";
import PrayerFirebaseService from "../services/PrayerFirebaseService";
import MediaService from "../services/MediaService";
import MediaPreview from "../components/MediaPreview";
import MediaPostCard from "../components/MediaPostCard";
import PrayerEngagementService from "../services/PrayerEngagementService";
import WorkingAuthService from "../services/WorkingAuthService";

const { width: screenWidth } = Dimensions.get("window");

const CommunityPrayersHubScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("feed");
  const [feedData, setFeedData] = useState([]);
  const [prayerRequests, setPrayerRequests] = useState([]);
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

  // New Prayer Form State
  const [newPrayerTitle, setNewPrayerTitle] = useState("");
  const [newPrayerContent, setNewPrayerContent] = useState("");
  const [newPrayerAuthor, setNewPrayerAuthor] = useState("");
  const [newPrayerCategory, setNewPrayerCategory] = useState("General");
  const [newPrayerImages, setNewPrayerImages] = useState([]);
  const [newPrayerVideos, setNewPrayerVideos] = useState([]);
  const [isSubmittingPrayer, setIsSubmittingPrayer] = useState(false);

  // Prayer Request Form State
  const [requestTitle, setRequestTitle] = useState("");
  const [requestContent, setRequestContent] = useState("");
  const [requestAuthor, setRequestAuthor] = useState("");
  const [requestCategory, setRequestCategory] = useState("General");
  const [requestImages, setRequestImages] = useState([]);
  const [requestVideos, setRequestVideos] = useState([]);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const categories = [
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

  // New Prayer Form - Custom Category State
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  // Prayer Request Form - Custom Category State
  const [showCustomCategoryInputRequest, setShowCustomCategoryInputRequest] = useState(false);
  const [customCategoryRequest, setCustomCategoryRequest] = useState("");

  useEffect(() => {
    loadFeedData();
  }, []);

  const loadFeedData = async () => {
    try {
      // Don't show loading spinner - show local data immediately
      // Load both prayers and prayer requests (local first, then Firebase syncs in background)
      const [prayers, requests] = await Promise.all([
        PrayerFirebaseService.getAllPrayers(),
        PrayerFirebaseService.getAllPrayerRequests(),
      ]);

      setPrayerRequests(requests);

      // Combine and sort by timestamp (newest first)
      const combined = [
        ...prayers.map((p) => ({ ...p, itemType: "prayer" })),
        ...requests.map((r) => ({ ...r, itemType: "request" })),
      ].sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0);
        const dateB = new Date(b.timestamp || b.createdAt || 0);
        return dateB - dateA;
      });

      // Load comment counts for all prayers (async, non-blocking)
      Promise.all(
        combined.map(async (prayer) => {
          const prayerId = PrayerEngagementService.getPrayerId(prayer);
          const comments = await PrayerEngagementService.getComments(prayerId);
          return {
            ...prayer,
            comments: comments.length,
          };
        })
      ).then((prayersWithComments) => {
        setFeedData(prayersWithComments);
        loadLikedPrayers(prayersWithComments);
      });
      
      // Show data immediately (even without comment counts)
      setFeedData(combined);
      loadLikedPrayers(combined);
    } catch (error) {
      console.error("Error loading feed data:", error);
    } finally {
      setLoading(false);
    }
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeedData();
    setRefreshing(false);
  };

  // Media picker functions for New Prayer
  const pickImageForPrayer = async () => {
    try {
      const images = await MediaService.pickImage();
      if (images.length > 0) {
        setNewPrayerImages([...newPrayerImages, ...images]);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick images");
    }
  };

  const takePhotoForPrayer = async () => {
    try {
      const photos = await MediaService.takePhoto();
      if (photos.length > 0) {
        setNewPrayerImages([...newPrayerImages, ...photos]);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to take photo");
    }
  };

  const pickVideoForPrayer = async () => {
    try {
      const videos = await MediaService.pickVideo();
      if (videos.length > 0) {
        navigation.navigate("VideoPreview", {
          videoUri: videos[0].uri,
          onVideoConfirmed: (videoData) => {
            setNewPrayerVideos([...newPrayerVideos, videoData]);
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick video");
    }
  };

  const recordVideoForPrayer = async () => {
    try {
      const videos = await MediaService.recordVideo();
      if (videos.length > 0) {
        navigation.navigate("VideoPreview", {
          videoUri: videos[0].uri,
          onVideoConfirmed: (videoData) => {
            setNewPrayerVideos([...newPrayerVideos, videoData]);
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to record video");
    }
  };

  const removeImageFromPrayer = (imageId) => {
    setNewPrayerImages(newPrayerImages.filter((img) => img.id !== imageId));
  };

  const removeVideoFromPrayer = (videoId) => {
    setNewPrayerVideos(newPrayerVideos.filter((video) => video.id !== videoId));
  };

  // Media picker functions for Prayer Request
  const pickImageForRequest = async () => {
    try {
      const images = await MediaService.pickImage();
      if (images.length > 0) {
        setRequestImages([...requestImages, ...images]);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick images");
    }
  };

  const takePhotoForRequest = async () => {
    try {
      const photos = await MediaService.takePhoto();
      if (photos.length > 0) {
        setRequestImages([...requestImages, ...photos]);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to take photo");
    }
  };

  const pickVideoForRequest = async () => {
    try {
      const videos = await MediaService.pickVideo();
      if (videos.length > 0) {
        navigation.navigate("VideoPreview", {
          videoUri: videos[0].uri,
          onVideoConfirmed: (videoData) => {
            setRequestVideos([...requestVideos, videoData]);
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick video");
    }
  };

  const recordVideoForRequest = async () => {
    try {
      const videos = await MediaService.recordVideo();
      if (videos.length > 0) {
        navigation.navigate("VideoPreview", {
          videoUri: videos[0].uri,
          onVideoConfirmed: (videoData) => {
            setRequestVideos([...requestVideos, videoData]);
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to record video");
    }
  };

  const removeImageFromRequest = (imageId) => {
    setRequestImages(requestImages.filter((img) => img.id !== imageId));
  };

  const removeVideoFromRequest = (videoId) => {
    setRequestVideos(requestVideos.filter((video) => video.id !== videoId));
  };

  const handleSubmitNewPrayer = async () => {
    if (!newPrayerTitle.trim() || !newPrayerContent.trim()) {
      Alert.alert("Missing Information", "Please fill in both title and prayer content.");
      return;
    }

    try {
      setIsSubmittingPrayer(true);
      // Determine media (prioritize first video, then first image)
      let media = null;
      if (newPrayerVideos.length > 0) {
        media = {
          type: "video",
          uri: newPrayerVideos[0].uri,
          thumbnail: newPrayerVideos[0].thumbnail,
          duration: newPrayerVideos[0].duration,
        };
      } else if (newPrayerImages.length > 0) {
        media = {
          type: "image",
          uri: newPrayerImages[0].uri,
        };
      }

      const finalCategory = showCustomCategoryInput && customCategory.trim() 
        ? customCategory.trim() 
        : newPrayerCategory;

      const newPrayer = {
        id: Date.now().toString(),
        title: newPrayerTitle.trim(),
        body: newPrayerContent.trim(),
        content: newPrayerContent.trim(),
        category: finalCategory,
        author: newPrayerAuthor.trim() || "Anonymous",
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
        media: media,
        images: newPrayerImages,
        videos: newPrayerVideos,
      };

      await PrayerFirebaseService.savePrayer(newPrayer);
      Alert.alert("Success", "Your prayer has been shared with the community!", [
        {
          text: "OK",
          onPress: () => {
            setNewPrayerTitle("");
            setNewPrayerContent("");
            setNewPrayerAuthor("");
            setNewPrayerImages([]);
            setNewPrayerVideos([]);
            setNewPrayerCategory("General");
            setShowCustomCategoryInput(false);
            setCustomCategory("");
            setActiveTab("feed");
            loadFeedData();
          },
        },
      ]);
    } catch (error) {
      console.error("Error submitting prayer:", error);
      Alert.alert("Error", "Failed to submit prayer. Please try again.");
    } finally {
      setIsSubmittingPrayer(false);
    }
  };

  const handleSubmitPrayerRequest = async () => {
    if (!requestTitle.trim() || !requestContent.trim()) {
      Alert.alert("Missing Information", "Please fill in both title and prayer request.");
      return;
    }

    try {
      setIsSubmittingRequest(true);
      // Determine media (prioritize first video, then first image)
      let media = null;
      if (requestVideos.length > 0) {
        media = {
          type: "video",
          uri: requestVideos[0].uri,
          thumbnail: requestVideos[0].thumbnail,
          duration: requestVideos[0].duration,
        };
      } else if (requestImages.length > 0) {
        media = {
          type: "image",
          uri: requestImages[0].uri,
        };
      }

      const finalCategoryRequest = showCustomCategoryInputRequest && customCategoryRequest.trim() 
        ? customCategoryRequest.trim() 
        : requestCategory;

      const prayerRequest = {
        id: Date.now().toString(),
        title: requestTitle.trim(),
        content: requestContent.trim(),
        category: finalCategoryRequest,
        author: requestAuthor.trim() || "Anonymous",
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
        type: "request",
        media: media,
        images: requestImages,
        videos: requestVideos,
      };

      await PrayerFirebaseService.savePrayerRequest(prayerRequest);
      Alert.alert("Success", "Your prayer request has been shared with the community!", [
        {
          text: "OK",
          onPress: () => {
            setRequestTitle("");
            setRequestContent("");
            setRequestAuthor("");
            setRequestImages([]);
            setRequestVideos([]);
            setRequestCategory("General");
            setShowCustomCategoryInputRequest(false);
            setCustomCategoryRequest("");
            setActiveTab("feed");
            loadFeedData();
          },
        },
      ]);
    } catch (error) {
      console.error("Error submitting prayer request:", error);
      Alert.alert("Error", "Failed to submit prayer request. Please try again.");
    } finally {
      setIsSubmittingRequest(false);
    }
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
      // Generate a consistent color for custom categories
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
      
      // Update feed data immediately
      setFeedData((prevData) =>
        prevData.map((p) => {
          const pid = PrayerEngagementService.getPrayerId(p);
          if (pid === prayerId) {
            return { ...p, likes: Math.max(0, (p.likes || 0) + increment) };
          }
          return p;
        })
      );
      
      // Update prayer requests if applicable
      setPrayerRequests((prevData) =>
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
      setFeedData((prevData) =>
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

  const renderFeedItem = ({ item }) => {
    // Check for prayer request - check multiple possible fields
    const isRequest = 
      item.itemType === "request" || 
      item.type === "request" ||
      (item.title && item.title.toLowerCase().includes("prayer request")) ||
      (item.content && item.content.toLowerCase().includes("prayer request"));
    
    // Use MediaPostCard if item has media
    if (item.media && (item.media.type === "image" || item.media.type === "video")) {
      // Transform item to match MediaPostCard format
      const postForMediaCard = {
        ...item,
        timeAgo: formatTimestamp(item.timestamp),
        authorPhoto: item.authorPhoto || null,
        authorId: item.authorId || item.author_id || null, // Keep actual authorId
        views: 0,
      };

      const categoryColor = getCategoryColor(item.category);

      const handleDeletePrayer = async () => {
        try {
          // Update UI immediately (optimistic update)
          setFeedData((prev) => prev.filter((feedItem) => {
            const feedItemId = feedItem.id || PrayerEngagementService.getPrayerId(feedItem);
            return feedItemId !== item.id;
          }));
          
          // Delete from Firebase (this also clears local cache)
          await PrayerFirebaseService.deletePrayer(item.id);
          
          // Small delay to ensure Firebase deletion completes, then refresh
          setTimeout(async () => {
            await loadFeedData();
          }, 500);
          
          Alert.alert("Success", "Prayer deleted successfully");
        } catch (error) {
          console.error("Delete prayer error:", error);
          // Revert optimistic update on error
          await loadFeedData();
          const errorMessage = error.message || "Failed to delete prayer. Please try again.";
          Alert.alert("Error", errorMessage);
        }
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
            onDelete={handleDeletePrayer}
          />
        </View>
      );
    }

    // Regular card for items without media
    const categoryColor = getCategoryColor(item.category);

    // Prayer card with delete functionality component
    const PrayerCardWithDelete = ({ prayer }) => {
      const [isAuthor, setIsAuthor] = React.useState(false);

      React.useEffect(() => {
        const checkAuthor = async () => {
          try {
            const currentUser = await WorkingAuthService.getCurrentUser();
            if (!currentUser || !currentUser.uid) {
              setIsAuthor(false);
              return;
            }

            // Check if user is the author - handle both authorId and author_id
            const prayerAuthorId = prayer.authorId || prayer.author_id;
            
            // If prayer has no authorId, allow deletion for authenticated users (legacy/test prayers)
            const userIsAuthor = prayerAuthorId 
              ? currentUser.uid === prayerAuthorId 
              : true; // Allow deletion of prayers without authorId (old test prayers)
            
            setIsAuthor(userIsAuthor);
          } catch (error) {
            console.error("Error checking author:", error);
            setIsAuthor(false);
          }
        };
        checkAuthor();
      }, [prayer.authorId, prayer.author_id]);

      const handleDelete = async () => {
        Alert.alert(
          "Delete Prayer",
          "Are you sure you want to delete this prayer? This action cannot be undone.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                try {
                  // Update UI immediately (optimistic update)
                  setFeedData((prev) => prev.filter((item) => {
                    const itemId = item.id || PrayerEngagementService.getPrayerId(item);
                    return itemId !== prayer.id;
                  }));
                  
                  // Delete from Firebase (this also clears local cache)
                  await PrayerFirebaseService.deletePrayer(prayer.id);
                  
                  // Small delay to ensure Firebase deletion completes, then refresh
                  setTimeout(async () => {
                    await loadFeedData();
                  }, 500);
                  
                  Alert.alert("Success", "Prayer deleted successfully");
                } catch (error) {
                  console.error("Delete prayer error:", error);
                  // Revert optimistic update on error
                  await loadFeedData();
                  const errorMessage = error.message || "Failed to delete prayer. Please try again.";
                  Alert.alert("Error", errorMessage);
                }
              },
            },
          ]
        );
      };

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
              <Text style={styles.feedTitle}>{prayer.title}</Text>
              {prayer.category && (
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: categoryColor },
                  ]}
                >
                  <Text style={styles.categoryText}>{prayer.category}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.timestamp}>{formatTimestamp(prayer.timestamp)}</Text>
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

          <Text style={styles.feedContent}>
            {prayer.body || prayer.content || prayer.prayer}
          </Text>

          <View style={styles.feedFooter}>
            <Text style={styles.author}>- {prayer.author || "Anonymous"}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLike(prayer)}
              >
                <Ionicons 
                  name={likedPrayers[PrayerEngagementService.getPrayerId(prayer)] ? "heart" : "heart-outline"} 
                  size={16} 
                  color={likedPrayers[PrayerEngagementService.getPrayerId(prayer)] ? "#FF6B6B" : "#1a365d"} 
                />
                <Text style={styles.actionText}>{prayer.likes || 0}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleComment(prayer)}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#1a365d" />
                <Text style={styles.actionText}>{prayer.comments || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    };

    return <PrayerCardWithDelete prayer={item} />;
  };

  const renderPrayerRequestItem = ({ item }) => {
    const categoryColor = getCategoryColor(item.category);

    // Prayer request card with delete functionality
    const PrayerRequestCardWithDelete = ({ prayer }) => {
      const [isAuthor, setIsAuthor] = React.useState(false);

      React.useEffect(() => {
        const checkAuthor = async () => {
          try {
            const currentUser = await WorkingAuthService.getCurrentUser();
            if (!currentUser || !currentUser.uid) {
              setIsAuthor(false);
              return;
            }

            // Check if user is the author - handle both authorId and author_id
            const prayerAuthorId = prayer.authorId || prayer.author_id;
            
            // If prayer has no authorId, allow deletion for authenticated users (legacy/test prayers)
            const userIsAuthor = prayerAuthorId 
              ? currentUser.uid === prayerAuthorId 
              : true; // Allow deletion of prayers without authorId (old test prayers)
            
            setIsAuthor(userIsAuthor);
          } catch (error) {
            console.error("Error checking author:", error);
            setIsAuthor(false);
          }
        };
        checkAuthor();
      }, [prayer.authorId, prayer.author_id]);

      const handleDelete = async () => {
        Alert.alert(
          "Delete Prayer Request",
          "Are you sure you want to delete this prayer request? This action cannot be undone.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                try {
                  // Update UI immediately (optimistic update)
                  setFeedData((prev) => prev.filter((item) => {
                    const itemId = item.id || PrayerEngagementService.getPrayerId(item);
                    return itemId !== prayer.id;
                  }));
                  setPrayerRequests((prev) => prev.filter((r) => r.id !== prayer.id));
                  
                  // Delete from Firebase (this also clears local cache)
                  await PrayerFirebaseService.deletePrayerRequest(prayer.id);
                  
                  // Small delay to ensure Firebase deletion completes, then refresh
                  setTimeout(async () => {
                    await loadFeedData();
                  }, 500);
                  
                  Alert.alert("Success", "Prayer request deleted successfully");
                } catch (error) {
                  console.error("Delete prayer request error:", error);
                  // Revert optimistic update on error
                  await loadFeedData();
                  const errorMessage = error.message || "Failed to delete prayer request. Please try again.";
                  Alert.alert("Error", errorMessage);
                }
              },
            },
          ]
        );
      };

      return (
        <View style={styles.feedCard}>
          <View style={styles.requestBadge}>
            <Ionicons name="heart-circle" size={16} color="#FF6B6B" />
            <Text style={styles.requestBadgeText}>Prayer Request</Text>
          </View>

          <View style={styles.feedHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.feedTitle}>{prayer.title}</Text>
              {prayer.category && (
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: categoryColor },
                  ]}
                >
                  <Text style={styles.categoryText}>{prayer.category}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.timestamp}>{formatTimestamp(prayer.timestamp)}</Text>
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

          <Text style={styles.feedContent}>{prayer.content}</Text>

          <View style={styles.feedFooter}>
            <Text style={styles.author}>- {prayer.author || "Anonymous"}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLike(prayer)}
              >
                <Ionicons 
                  name={likedPrayers[PrayerEngagementService.getPrayerId(prayer)] ? "heart" : "heart-outline"} 
                  size={16} 
                  color={likedPrayers[PrayerEngagementService.getPrayerId(prayer)] ? "#FF6B6B" : "#1a365d"} 
                />
                <Text style={styles.actionText}>{prayer.likes || 0}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleComment(prayer)}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#1a365d" />
                <Text style={styles.actionText}>{prayer.comments || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    };

    return <PrayerRequestCardWithDelete prayer={item} />;
  };

  const renderEmptyState = (message = "No content yet") => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#999" />
      <Text style={styles.emptyTitle}>{message}</Text>
      <Text style={styles.emptySubtitle}>Be the first to share a prayer with the community</Text>
    </View>
  );

  const renderFeedTab = () => (
    <FlatList
      data={feedData}
      renderItem={renderFeedItem}
      keyExtractor={(item) => `${item.itemType}-${item.id}`}
      contentContainerStyle={
        feedData.length === 0
          ? styles.emptyListContainer
          : styles.listContainer
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={() => renderEmptyState("No content yet")}
    />
  );

  const renderPrayerRequestsTab = () => (
    <View style={styles.tabContent}>
      {/* Create Prayer Request Form */}
      <ScrollView 
        style={styles.formSectionScroll}
        contentContainerStyle={styles.formSectionContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Create Prayer Request</Text>
        <TextInput
          style={styles.input}
          placeholder="Prayer Request Title *"
          value={requestTitle}
          onChangeText={setRequestTitle}
          placeholderTextColor="#999"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Share your prayer request details..."
          value={requestContent}
          onChangeText={setRequestContent}
          multiline
          numberOfLines={4}
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.input}
          placeholder="Your Name (Optional)"
          value={requestAuthor}
          onChangeText={setRequestAuthor}
          placeholderTextColor="#999"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                {
                  backgroundColor:
                    requestCategory === cat && !showCustomCategoryInputRequest ? getCategoryColor(cat) : "#f0f0f0",
                },
              ]}
              onPress={() => {
                setRequestCategory(cat);
                setShowCustomCategoryInputRequest(false);
                setCustomCategoryRequest("");
              }}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  { color: requestCategory === cat && !showCustomCategoryInputRequest ? "#fff" : "#666" },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.categoryButton,
              {
                backgroundColor: showCustomCategoryInputRequest ? "#1a365d" : "#f0f0f0",
              },
            ]}
            onPress={() => {
              setShowCustomCategoryInputRequest(!showCustomCategoryInputRequest);
              if (!showCustomCategoryInputRequest) {
                setRequestCategory("");
              }
            }}
          >
            <Ionicons 
              name="add-circle" 
              size={16} 
              color={showCustomCategoryInputRequest ? "#fff" : "#666"} 
            />
            <Text
              style={[
                styles.categoryButtonText,
                { color: showCustomCategoryInputRequest ? "#fff" : "#666", marginLeft: 4 },
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </ScrollView>
        {showCustomCategoryInputRequest && (
          <TextInput
            style={styles.input}
            placeholder="Enter custom category name"
            value={customCategoryRequest}
            onChangeText={setCustomCategoryRequest}
            placeholderTextColor="#999"
          />
        )}

        {/* Media Upload Section */}
        <View style={styles.mediaSection}>
          <Text style={styles.mediaSectionTitle}>Add Media (Optional)</Text>
          <View style={styles.mediaButtonsContainer}>
            <View style={styles.mediaButtonsRow}>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={pickImageForRequest}
              >
                <Ionicons name="image" size={20} color="#1a365d" />
                <Text style={styles.mediaButtonText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={takePhotoForRequest}
              >
                <Ionicons name="camera" size={20} color="#1a365d" />
                <Text style={styles.mediaButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={pickVideoForRequest}
              >
                <Ionicons name="videocam" size={20} color="#1a365d" />
                <Text style={styles.mediaButtonText}>Video</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.mediaButtonsRow}>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={recordVideoForRequest}
              >
                <Ionicons name="videocam-outline" size={20} color="#1a365d" />
                <Text style={styles.mediaButtonText}>Record</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Media Preview */}
          {requestImages.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={styles.mediaPreviewTitle}>
                Images ({requestImages.length})
              </Text>
              {requestImages.map((image) => (
                <MediaPreview
                  key={image.id}
                  media={image}
                  onRemove={removeImageFromRequest}
                />
              ))}
            </View>
          )}

          {requestVideos.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={styles.mediaPreviewTitle}>
                Videos ({requestVideos.length})
              </Text>
              {requestVideos.map((video) => (
                <MediaPreview
                  key={video.id}
                  media={video}
                  onRemove={removeVideoFromRequest}
                />
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmittingRequest && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitPrayerRequest}
          disabled={isSubmittingRequest}
        >
          <Text style={styles.submitButtonText}>
            {isSubmittingRequest ? "Submitting..." : "Submit Prayer Request"}
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

      {/* Prayer Requests List */}
      <View style={styles.listSection}>
        <Text style={styles.listSectionTitle}>All Prayer Requests</Text>
        <FlatList
          data={prayerRequests}
          renderItem={renderPrayerRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            prayerRequests.length === 0
              ? styles.emptyListContainer
              : styles.listContainer
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => renderEmptyState("No prayer requests yet")}
        />
      </View>
    </View>
  );

  const renderNewPrayerTab = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.tabContent}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        style={styles.formContainer} 
        contentContainerStyle={styles.formContainerContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Create New Prayer</Text>
        <Text style={styles.sectionSubtitle}>
          Share a prayer with the community
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Prayer Title *"
          value={newPrayerTitle}
          onChangeText={setNewPrayerTitle}
          placeholderTextColor="#999"
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write your prayer here..."
          value={newPrayerContent}
          onChangeText={setNewPrayerContent}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Your Name (Optional)"
          value={newPrayerAuthor}
          onChangeText={setNewPrayerAuthor}
          placeholderTextColor="#999"
        />

        <Text style={styles.inputLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                {
                  backgroundColor:
                    newPrayerCategory === cat && !showCustomCategoryInput ? getCategoryColor(cat) : "#f0f0f0",
                },
              ]}
              onPress={() => {
                setNewPrayerCategory(cat);
                setShowCustomCategoryInput(false);
                setCustomCategory("");
              }}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  { color: newPrayerCategory === cat && !showCustomCategoryInput ? "#fff" : "#666" },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.categoryButton,
              {
                backgroundColor: showCustomCategoryInput ? "#1a365d" : "#f0f0f0",
              },
            ]}
            onPress={() => {
              setShowCustomCategoryInput(!showCustomCategoryInput);
              if (!showCustomCategoryInput) {
                setNewPrayerCategory("");
              }
            }}
          >
            <Ionicons 
              name="add-circle" 
              size={16} 
              color={showCustomCategoryInput ? "#fff" : "#666"} 
            />
            <Text
              style={[
                styles.categoryButtonText,
                { color: showCustomCategoryInput ? "#fff" : "#666", marginLeft: 4 },
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </ScrollView>
        {showCustomCategoryInput && (
          <TextInput
            style={styles.input}
            placeholder="Enter custom category name"
            value={customCategory}
            onChangeText={setCustomCategory}
            placeholderTextColor="#999"
          />
        )}

        {/* Media Upload Section */}
        <View style={styles.mediaSection}>
          <Text style={styles.mediaSectionTitle}>Add Media (Optional)</Text>
          <View style={styles.mediaButtonsContainer}>
            <View style={styles.mediaButtonsRow}>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={pickImageForPrayer}
              >
                <Ionicons name="image" size={20} color="#1a365d" />
                <Text style={styles.mediaButtonText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={takePhotoForPrayer}
              >
                <Ionicons name="camera" size={20} color="#1a365d" />
                <Text style={styles.mediaButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={pickVideoForPrayer}
              >
                <Ionicons name="videocam" size={20} color="#1a365d" />
                <Text style={styles.mediaButtonText}>Video</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.mediaButtonsRow}>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={recordVideoForPrayer}
              >
                <Ionicons name="videocam-outline" size={20} color="#1a365d" />
                <Text style={styles.mediaButtonText}>Record</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Media Preview */}
          {newPrayerImages.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={styles.mediaPreviewTitle}>
                Images ({newPrayerImages.length})
              </Text>
              {newPrayerImages.map((image) => (
                <MediaPreview
                  key={image.id}
                  media={image}
                  onRemove={removeImageFromPrayer}
                />
              ))}
            </View>
          )}

          {newPrayerVideos.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={styles.mediaPreviewTitle}>
                Videos ({newPrayerVideos.length})
              </Text>
              {newPrayerVideos.map((video) => (
                <MediaPreview
                  key={video.id}
                  media={video}
                  onRemove={removeVideoFromPrayer}
                />
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmittingPrayer && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitNewPrayer}
          disabled={isSubmittingPrayer}
        >
          <Text style={styles.submitButtonText}>
            {isSubmittingPrayer ? "Submitting..." : "Submit Prayer"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderCategoriesTab = () => {
    // This will be handled by the tab press handler
    return renderFeedTab(); // Fallback
  };

  const tabs = [
    { id: "feed", label: "Feed", icon: "home" },
    { id: "requests", label: "Prayer Requests", icon: "heart-circle" },
    { id: "new", label: "New Prayer", icon: "add-circle" },
    { id: "categories", label: "Categories", icon: "grid" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "feed":
        return renderFeedTab();
      case "requests":
        return renderPrayerRequestsTab();
      case "new":
        return renderNewPrayerTab();
      case "categories":
        // Navigate to categories screen
        navigation.navigate("PrayerCategories");
        return renderFeedTab(); // Fallback
      default:
        return renderFeedTab();
    }
  };

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
        <Text style={styles.headerTitle}>Community Prayers</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
            ]}
            onPress={() => {
              if (tab.id === "categories") {
                navigation.navigate("PrayerCategories");
              } else {
                setActiveTab(tab.id);
              }
            }}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.id ? "#1a365d" : "#666"}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.id && styles.activeTabLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>{renderTabContent()}</View>

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
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#1a365d",
  },
  tabLabel: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
    fontWeight: "500",
  },
  activeTabLabel: {
    color: "#1a365d",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moreButton: {
    padding: 4,
    marginLeft: 8,
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
  formSectionScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  formSectionContent: {
    paddingBottom: 20,
  },
  formSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  listSection: {
    flex: 1,
  },
  listSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  formContainer: {
    flex: 1,
  },
  formContainerContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
  },
  textArea: {
    height: 150,
    textAlignVertical: "top",
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#1a365d",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
  mediaSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  mediaSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  mediaButtonsContainer: {
    marginBottom: 16,
  },
  mediaButtonsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  mediaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  mediaButtonText: {
    fontSize: 14,
    color: "#1a365d",
    marginLeft: 6,
    fontWeight: "500",
  },
  mediaPreviewContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  mediaPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
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

export default CommunityPrayersHubScreen;
