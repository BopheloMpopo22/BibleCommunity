import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Share,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MediaPostCard from "../components/MediaPostCard";
import MediaPreview from "../components/MediaPreview";
import PostService from "../services/PostService";
import WorkingAuthService from "../services/WorkingAuthService";

const PostDetailScreen = ({ navigation, route }) => {
  const { post } = route.params;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reactions, setReactions] = useState({
    heart: 0,
    prayer: 0,
    amen: 0,
  });
  const [showReactions, setShowReactions] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await WorkingAuthService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadComments = async () => {
      try {
        const commentsData = await PostService.getComments(post.id);
        setComments(commentsData);
      } catch (error) {
        console.error("Error loading comments:", error);
      }
    };
    loadComments();
  }, [post.id]);

  useEffect(() => {
    const loadUserLikes = async () => {
      try {
        const likedPosts = await AsyncStorage.getItem("likedPosts");
        if (likedPosts) {
          const likedMap = JSON.parse(likedPosts);
          setIsLiked(!!likedMap[post.id]);
        }
      } catch (error) {
        console.error("Error loading user likes:", error);
      }
    };
    loadUserLikes();
  }, [post.id]);

  const handleLike = async () => {
    if (!currentUser) return;

    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((prev) => (next ? prev + 1 : prev - 1));

    try {
      await PostService.toggleLike(post.id);
    } catch (error) {
      // Revert on error
      setIsLiked(!next);
      setLikeCount((prev) => (next ? prev - 1 : prev + 1));
      Alert.alert("Error", "Failed to update like");
    }
  };

  const handleReaction = (type) => {
    setReactions((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
    setShowReactions(false);
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this post: "${post?.title}"\n\n${post?.content}\n\nShared from Bible Community App`,
        title: post?.title,
      });
    } catch (error) {
      Alert.alert("Error", "Unable to share this post");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    if (!currentUser) {
      Alert.alert("Error", "Please log in to comment");
      return;
    }

    setIsLoading(true);
    try {
      await PostService.addComment(post.id, newComment, currentUser);

      // Add to local state for immediate UI update
      const comment = {
        id: Date.now().toString(),
        text: newComment,
        author: currentUser.displayName || "You",
        timeAgo: "now",
        likes: 0,
        replies: [],
      };

      setComments((prev) => [comment, ...prev]);
      setNewComment("");

      // Reload comments to get the actual count from Firestore
      const updatedComments = await PostService.getComments(post.id);
      setComments(updatedComments);
      
      // Update post comment count
      if (post) {
        post.comments = updatedComments.length;
      }
      
      // Refresh the post data to update comment count
      navigation.setParams({ post: { ...post, comments: updatedComments.length } });
    } catch (error) {
      Alert.alert("Error", "Failed to add comment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = (commentId) => {
    if (!replyText.trim()) {
      Alert.alert("Error", "Please enter a reply");
      return;
    }

    const reply = {
      id: `${commentId}-${Date.now()}`,
      text: replyText,
      author: "You",
      timeAgo: "now",
    };

    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      )
    );

    setReplyText("");
    setReplyingTo(null);
  };

  const handleStartReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyText("");
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const handleCommentLike = (commentId) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, likes: comment.likes + 1 }
          : comment
      )
    );
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

  const renderComment = ({ item }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAuthor}>
          <View style={styles.commentAvatar}>
            <Ionicons name="person" size={16} color="#666" />
          </View>
          <View>
            <Text style={styles.commentAuthorName}>{item.author}</Text>
            <Text style={styles.commentTime}>{item.timeAgo}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.commentLikeButton}
          onPress={() => handleCommentLike(item.id)}
        >
          <Ionicons name="heart-outline" size={16} color="#666" />
          <Text style={styles.commentLikeCount}>{item.likes}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.commentText}>{item.text}</Text>

      {/* Reply Button */}
      <TouchableOpacity
        style={styles.replyButton}
        onPress={() => handleStartReply(item.id)}
      >
        <Ionicons name="chatbubble-outline" size={14} color="#666" />
        <Text style={styles.replyButtonText}>Reply</Text>
      </TouchableOpacity>

      {/* Reply Input */}
      {replyingTo === item.id && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Write a reply..."
            value={replyText}
            onChangeText={setReplyText}
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
          />
          <View style={styles.replyActions}>
            <TouchableOpacity
              style={styles.replyCancelButton}
              onPress={handleCancelReply}
            >
              <Text style={styles.replyCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.replySubmitButton}
              onPress={() => handleReply(item.id)}
            >
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {item.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {item.replies.map((reply) => (
            <View key={reply.id} style={styles.replyCard}>
              <View style={styles.replyHeader}>
                <View style={styles.replyAvatar}>
                  <Ionicons name="person" size={14} color="#666" />
                </View>
                <Text style={styles.replyAuthorName}>{reply.author}</Text>
                <Text style={styles.replyTime}>{reply.timeAgo}</Text>
              </View>
              <Text style={styles.replyText}>{reply.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const typeIcon = getPostTypeIcon(post?.type);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Minimal Header */}
        <View style={styles.minimalHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a365d" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#1a365d" />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.postTypeIcon}>
              <Ionicons name={typeIcon.name} size={16} color={typeIcon.color} />
            </View>
            <Text style={styles.postType}>{post?.type}</Text>
            <Text style={styles.postTime}>{post?.timeAgo}</Text>
          </View>

          <Text style={styles.postTitle}>{post?.title}</Text>
          <Text style={styles.postContent}>{post?.content}</Text>

          {/* Media Display */}
          {post?.images && post.images.length > 0 && (
            <View style={styles.mediaSection}>
              <Text style={styles.mediaSectionTitle}>Images</Text>
              {post.images.map((image) => (
                <MediaPreview
                  key={image.id}
                  media={image}
                  showRemoveButton={false}
                />
              ))}
            </View>
          )}

          {post?.videos && post.videos.length > 0 && (
            <View style={styles.mediaSection}>
              <Text style={styles.mediaSectionTitle}>Videos</Text>
              {post.videos.map((video) => (
                <MediaPostCard
                  key={video.id}
                  post={{
                    id: `detail-${video.id}`,
                    author: post?.author || "",
                    timeAgo: post?.timeAgo || "",
                    title: post?.title || "",
                    content: post?.content || "",
                    likes: post?.likes || 0,
                    comments: post?.comments || 0,
                    media: { type: "video", uri: video.uri },
                  }}
                  onPress={() => {}}
                  onLike={() => {}}
                  onComment={() => {}}
                  onShare={() => {}}
                />
              ))}
            </View>
          )}

          <View style={styles.postAuthor}>
            <View style={styles.authorAvatar}>
              <Ionicons name="person" size={20} color="#666" />
            </View>
            <Text style={styles.authorText}>by {post?.author}</Text>
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
                size={20}
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
              onPress={() => setShowReactions(!showReactions)}
            >
              <Ionicons name="happy-outline" size={20} color="#666" />
              <Text style={styles.engagementText}>React</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.engagementButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color="#666" />
              <Text style={styles.engagementText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Reactions */}
          {showReactions && (
            <View style={styles.reactionsContainer}>
              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleReaction("heart")}
              >
                <Ionicons name="heart" size={24} color="#FF6B6B" />
                <Text style={styles.reactionCount}>{reactions.heart}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleReaction("prayer")}
              >
                <Ionicons name="hand-left" size={24} color="#1a365d" />
                <Text style={styles.reactionCount}>{reactions.prayer}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reactionButton}
                onPress={() => handleReaction("amen")}
              >
                <Text style={styles.amenText}>Amen</Text>
                <Text style={styles.reactionCount}>{reactions.amen}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View
        style={[styles.commentInputContainer, { marginBottom: keyboardHeight }]}
      >
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[
            styles.commentSubmitButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={handleAddComment}
          disabled={isLoading}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 120, // More space for fixed comment input
  },
  header: {
    backgroundColor: "#1a365d",
    padding: 20,
    paddingTop: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactHeader: {
    backgroundColor: "#1a365d",
    padding: 15,
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  minimalHeader: {
    padding: 10,
    paddingTop: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  shareButton: {
    padding: 4,
  },
  postCard: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  postContent: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 16,
  },
  postAuthor: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  authorText: {
    fontSize: 14,
    color: "#999",
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
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
    fontWeight: "500",
  },
  likedText: {
    color: "#FF6B6B",
  },
  reactionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  reactionButton: {
    alignItems: "center",
    marginHorizontal: 16,
    padding: 8,
  },
  reactionCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  amenText: {
    fontSize: 16,
    color: "#1a365d",
    fontWeight: "600",
  },
  commentsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    paddingBottom: 40, // Extra padding at bottom of comments
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
  commentLikeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentLikeCount: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  commentText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  repliesContainer: {
    marginLeft: 16,
    marginTop: 8,
  },
  replyCard: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  replyAuthorName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  replyTime: {
    fontSize: 10,
    color: "#999",
  },
  replyText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },
  replyButtonText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  replyInputContainer: {
    marginTop: 8,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  replyInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minHeight: 36,
    maxHeight: 80,
  },
  replyActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  replyCancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  replyCancelText: {
    fontSize: 14,
    color: "#666",
  },
  replySubmitButton: {
    backgroundColor: "#1a365d",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  commentInputContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    minHeight: 60,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    minHeight: 36,
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  commentSubmitButton: {
    backgroundColor: "#1a365d",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
});

export default PostDetailScreen;
