import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TestimoniesService from "../services/TestimoniesService";

const TestimonyCard = ({ testimony, onPress, onLike, onShare, onComment }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(testimony.likes || 0);

  const categories = TestimoniesService.getTestimonyCategories();
  const category = categories.find((cat) => cat.id === testimony.category);

  const handleLike = async () => {
    try {
      if (!isLiked) {
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        await TestimoniesService.likeTestimony(testimony.id);
        if (onLike) onLike(testimony.id);
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
      }"\n\n${testimony.content.substring(
        0,
        100
      )}...\n\nShared from Bible Community App`;

      await Share.share({
        message: shareMessage,
        title: testimony.title,
      });

      await TestimoniesService.shareTestimony(testimony.id);
      if (onShare) onShare(testimony.id);
    } catch (error) {
      console.error("Error sharing testimony:", error);
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(testimony);
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

  const getCategoryIcon = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.icon : "star";
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.color : "#1a365d";
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(testimony)}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: getCategoryColor(testimony.category) },
            ]}
          >
            <Ionicons
              name={getCategoryIcon(testimony.category)}
              size={16}
              color="#fff"
            />
          </View>
          <Text style={styles.categoryText}>
            {category?.name || "Testimony"}
          </Text>
          {testimony.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          )}
        </View>
        <Text style={styles.timeAgo}>{formatTimeAgo(testimony.createdAt)}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {testimony.title}
      </Text>

      {/* Content Preview */}
      <Text style={styles.content} numberOfLines={3}>
        {testimony.content}
      </Text>

      {/* Scripture */}
      {testimony.scripture && (
        <View style={styles.scriptureContainer}>
          <Ionicons name="book" size={14} color="#1a365d" />
          <Text style={styles.scriptureText} numberOfLines={2}>
            {testimony.scripture}
          </Text>
        </View>
      )}

      {/* Tags */}
      {testimony.tags && testimony.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {testimony.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {testimony.tags.length > 3 && (
            <Text style={styles.moreTagsText}>
              +{testimony.tags.length - 3} more
            </Text>
          )}
        </View>
      )}

      {/* Author */}
      <View style={styles.authorContainer}>
        <View style={styles.authorAvatar}>
          <Ionicons name="person" size={16} color="#666" />
        </View>
        <Text style={styles.authorText}>{testimony.author}</Text>
      </View>

      {/* Engagement */}
      <View style={styles.engagementContainer}>
        <TouchableOpacity style={styles.engagementButton} onPress={handleLike}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={18}
            color={isLiked ? "#FF6B6B" : "#666"}
          />
          <Text style={[styles.engagementText, isLiked && styles.likedText]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.engagementButton}
          onPress={handleComment}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#666" />
          <Text style={styles.engagementText}>
            {testimony.comments?.length || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.engagementButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color="#666" />
          <Text style={styles.engagementText}>{testimony.shares || 0}</Text>
        </TouchableOpacity>

        <View style={styles.viewsContainer}>
          <Ionicons name="eye-outline" size={18} color="#999" />
          <Text style={styles.viewsText}>{testimony.views || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a365d",
    marginRight: 6,
  },
  timeAgo: {
    fontSize: 12,
    color: "#999",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    lineHeight: 24,
  },
  content: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  scriptureContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  scriptureText: {
    fontSize: 13,
    color: "#1a365d",
    fontStyle: "italic",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: "#1a365d",
    fontWeight: "500",
  },
  moreTagsText: {
    fontSize: 11,
    color: "#999",
    alignSelf: "center",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  authorText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  engagementContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  engagementButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  engagementText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
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
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
  },
});

export default TestimonyCard;














