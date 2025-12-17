import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TestimoniesService from "../services/TestimoniesService";

const TestimonyDetailScreen = ({ navigation, route }) => {
  const { testimony: initialTestimony, focusComment = false } = route.params;
  const [testimony, setTestimony] = useState(initialTestimony);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(testimony.likes || 0);

  useEffect(() => {
    // Increment view count when screen loads
    incrementViews();
  }, []);

  const incrementViews = async () => {
    try {
      await TestimoniesService.incrementViews(testimony.id);
      setTestimony((prev) => ({ ...prev, views: (prev.views || 0) + 1 }));
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const handleLike = async () => {
    try {
      if (!isLiked) {
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        await TestimoniesService.likeTestimony(testimony.id);
        setTestimony((prev) => ({ ...prev, likes: prev.likes + 1 }));
      }
    } catch (error) {
      console.error("Error liking testimony:", error);
      setIsLiked(false);
      setLikeCount(testimony.likes || 0);
    }
  };

  const handleShare = async () => {
    try {
      const shareMessage = `Check out this powerful testimony: "${
        testimony.title
      }"\n\n${testimony.content}\n\n${
        testimony.scripture ? `Scripture: ${testimony.scripture}\n\n` : ""
      }Shared from Bible Community App`;

      await Share.share({
        message: shareMessage,
        title: testimony.title,
      });

      await TestimoniesService.shareTestimony(testimony.id);
      setTestimony((prev) => ({ ...prev, shares: prev.shares + 1 }));
    } catch (error) {
      console.error("Error sharing testimony:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    try {
      await TestimoniesService.addComment(testimony.id, newComment);
      setTestimony((prev) => ({
        ...prev,
        comments: [
          {
            id: Date.now().toString(),
            text: newComment,
            author: "You",
            createdAt: new Date().toISOString(),
            likes: 0,
          },
          ...prev.comments,
        ],
      }));
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const categories = TestimoniesService.getTestimonyCategories();
  const category = categories.find((cat) => cat.id === testimony.category);

  const getCategoryIcon = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.icon : "star";
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.color : "#1a365d";
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a365d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Testimony</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#1a365d" />
          </TouchableOpacity>
        </View>

        {/* Testimony Content */}
        <View style={styles.testimonyCard}>
          {/* Category Header */}
          <View style={styles.categoryHeader}>
            <View style={styles.categoryContainer}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: getCategoryColor(testimony.category) },
                ]}
              >
                <Ionicons
                  name={getCategoryIcon(testimony.category)}
                  size={20}
                  color="#fff"
                />
              </View>
              <Text style={styles.categoryText}>
                {category?.name || "Testimony"}
              </Text>
              {testimony.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              )}
            </View>
            <Text style={styles.timeAgo}>
              {formatTimeAgo(testimony.createdAt)}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{testimony.title}</Text>

          {/* Content */}
          <Text style={styles.content}>{testimony.content}</Text>

          {/* Scripture */}
          {testimony.scripture && (
            <View style={styles.scriptureContainer}>
              <View style={styles.scriptureHeader}>
                <Ionicons name="book" size={16} color="#1a365d" />
                <Text style={styles.scriptureLabel}>Scripture</Text>
              </View>
              <Text style={styles.scriptureText}>{testimony.scripture}</Text>
            </View>
          )}

          {/* Prayer Points */}
          {testimony.prayerPoints && testimony.prayerPoints.length > 0 && (
            <View style={styles.prayerPointsContainer}>
              <View style={styles.prayerPointsHeader}>
                <Ionicons name="heart" size={16} color="#E91E63" />
                <Text style={styles.prayerPointsLabel}>Prayer Points</Text>
              </View>
              {testimony.prayerPoints.map((point, index) => (
                <View key={index} style={styles.prayerPoint}>
                  <Text style={styles.prayerPointText}>• {point}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tags */}
          {testimony.tags && testimony.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsLabel}>Tags</Text>
              <View style={styles.tagsList}>
                {testimony.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Author */}
          <View style={styles.authorContainer}>
            <View style={styles.authorAvatar}>
              <Ionicons name="person" size={20} color="#666" />
            </View>
            <Text style={styles.authorText}>by {testimony.author}</Text>
          </View>
        </View>

        {/* Engagement Actions */}
        <View style={styles.engagementSection}>
          <View style={styles.engagementRow}>
            <TouchableOpacity
              style={[styles.engagementButton, isLiked && styles.likedButton]}
              onPress={handleLike}
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={24}
                color={isLiked ? "#FF6B6B" : "#666"}
              />
              <Text
                style={[styles.engagementText, isLiked && styles.likedText]}
              >
                {likeCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.engagementButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color="#666" />
              <Text style={styles.engagementText}>Share</Text>
            </TouchableOpacity>

            <View style={styles.viewsContainer}>
              <Ionicons name="eye-outline" size={24} color="#999" />
              <Text style={styles.viewsText}>{testimony.views || 0} views</Text>
            </View>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Comments ({testimony.comments?.length || 0})
          </Text>

          {testimony.comments && testimony.comments.length > 0 ? (
            testimony.comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAuthor}>
                    <View style={styles.commentAvatar}>
                      <Ionicons name="person" size={16} color="#666" />
                    </View>
                    <View>
                      <Text style={styles.commentAuthorName}>
                        {comment.author}
                      </Text>
                      <Text style={styles.commentTime}>
                        {formatTimeAgo(comment.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noCommentsContainer}>
              <Text style={styles.noCommentsText}>
                No comments yet. Be the first to share your thoughts!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          placeholderTextColor="#999"
          multiline
        />
        <TouchableOpacity
          style={styles.commentSubmitButton}
          onPress={handleAddComment}
        >
          <Ionicons name="send" size={20} color="#1a365d" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: "#1a365d",
    padding: 20,
    paddingTop: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  shareButton: {
    padding: 8,
  },
  testimonyCard: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
    marginRight: 8,
  },
  timeAgo: {
    fontSize: 14,
    color: "#999",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    lineHeight: 32,
  },
  content: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 20,
  },
  scriptureContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#1a365d",
  },
  scriptureHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  scriptureLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a365d",
    marginLeft: 8,
  },
  scriptureText: {
    fontSize: 15,
    color: "#1a365d",
    fontStyle: "italic",
    lineHeight: 22,
  },
  prayerPointsContainer: {
    backgroundColor: "#fff5f5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#E91E63",
  },
  prayerPointsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  prayerPointsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E91E63",
    marginLeft: 8,
  },
  prayerPoint: {
    marginBottom: 8,
  },
  prayerPointText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#1a365d",
    fontWeight: "500",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  authorText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  engagementSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  engagementRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  engagementButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  likedButton: {
    backgroundColor: "#FFE5E5",
  },
  engagementText: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
    fontWeight: "500",
  },
  likedText: {
    color: "#FF6B6B",
  },
  viewsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewsText: {
    fontSize: 14,
    color: "#999",
    marginLeft: 8,
  },
  commentsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  commentCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  commentTime: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  noCommentsContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noCommentsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  commentInputContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
    color: "#333",
  },
  commentSubmitButton: {
    backgroundColor: "#1a365d",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TestimonyDetailScreen;














