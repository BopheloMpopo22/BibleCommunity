import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PostDetail = ({ post, onClose }) => {
  const [comment, setComment] = useState("");
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [isDownvoted, setIsDownvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(post.upvotes);

  // Sample comments
  const comments = [
    {
      id: "1",
      author: "John Smith",
      content:
        "This verse has been such a comfort to me during difficult times. God truly works all things for good!",
      upvotes: 12,
      timeAgo: "1h ago",
      replies: [
        {
          id: "1-1",
          author: "Sarah Johnson",
          content: "Amen! I needed this reminder today.",
          upvotes: 5,
          timeAgo: "30m ago",
        },
      ],
    },
    {
      id: "2",
      author: "Maria Garcia",
      content:
        "I love how this verse reminds us that God is in control even when we don't understand what's happening.",
      upvotes: 8,
      timeAgo: "2h ago",
      replies: [],
    },
    {
      id: "3",
      author: "David Wilson",
      content:
        "This has been my life verse for years. It's amazing how God can turn even the worst situations into something beautiful.",
      upvotes: 15,
      timeAgo: "3h ago",
      replies: [],
    },
  ];

  const handleUpvote = () => {
    if (isUpvoted) {
      setIsUpvoted(false);
      setUpvotes(upvotes - 1);
    } else {
      setIsUpvoted(true);
      setIsDownvoted(false);
      setUpvotes(upvotes + 1);
    }
  };

  const handleDownvote = () => {
    if (isDownvoted) {
      setIsDownvoted(false);
      setUpvotes(upvotes + 1);
    } else {
      setIsDownvoted(true);
      setIsUpvoted(false);
      setUpvotes(upvotes - 1);
    }
  };

  const handleComment = () => {
    if (comment.trim()) {
      Alert.alert(
        "Comment Posted",
        "Your comment has been posted successfully!"
      );
      setComment("");
    } else {
      Alert.alert("Error", "Please enter a comment");
    }
  };

  const renderComment = (comment, isReply = false) => (
    <View
      key={comment.id}
      style={[styles.commentCard, isReply && styles.replyCard]}
    >
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{comment.author}</Text>
        <Text style={styles.commentTime}>{comment.timeAgo}</Text>
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>

      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.commentAction}>
          <Ionicons name="arrow-up-outline" size={16} color="#666" />
          <Text style={styles.commentActionText}>{comment.upvotes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.commentAction}>
          <Ionicons name="arrow-down-outline" size={16} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.commentAction}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.commentActionText}>Reply</Text>
        </TouchableOpacity>
      </View>

      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => renderComment(reply, true))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Minimal Header */}
      <View style={styles.minimalHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="bookmark-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="share-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post Content */}
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.postCommunity}>
              <Text style={styles.postCommunityIcon}>{post.communityIcon}</Text>
              <Text style={styles.postCommunityName}>{post.community}</Text>
            </View>
            <Text style={styles.postTime}>{post.timeAgo}</Text>
          </View>

          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postContent}>{post.content}</Text>

          <View style={styles.postFooter}>
            <View style={styles.postActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleUpvote}
              >
                <Ionicons
                  name={isUpvoted ? "arrow-up" : "arrow-up-outline"}
                  size={20}
                  color={isUpvoted ? "#4A90E2" : "#666"}
                />
                <Text
                  style={[styles.actionText, isUpvoted && styles.upvotedText]}
                >
                  {upvotes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDownvote}
              >
                <Ionicons
                  name={isDownvoted ? "arrow-down" : "arrow-down-outline"}
                  size={20}
                  color={isDownvoted ? "#FF6B6B" : "#666"}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={20} color="#666" />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={20} color="#666" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.postType}>
              <Text style={styles.postTypeText}>{post.type}</Text>
            </View>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>{comments.length} Comments</Text>

          {/* Add Comment */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.commentButton}
              onPress={handleComment}
            >
              <Text style={styles.commentButtonText}>Post</Text>
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <View style={styles.commentsList}>{comments.map(renderComment)}</View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  compactHeader: {
    backgroundColor: "#fff",
    padding: 15,
    paddingTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  minimalHeader: {
    padding: 10,
    paddingTop: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    color: "#4A90E2",
    marginLeft: 5,
  },
  headerActions: {
    flexDirection: "row",
  },
  headerAction: {
    marginLeft: 10,
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 15,
  },
  postCommunity: {
    flexDirection: "row",
    alignItems: "center",
  },
  postCommunityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  postCommunityName: {
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "600",
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
    color: "#333",
    lineHeight: 24,
    marginBottom: 20,
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
  upvotedText: {
    color: "#4A90E2",
    fontWeight: "bold",
  },
  postType: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postTypeText: {
    fontSize: 12,
    color: "#4A90E2",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  commentsSection: {
    marginBottom: 30,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  addCommentContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    marginBottom: 10,
  },
  commentButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-end",
  },
  commentButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  commentsList: {
    marginBottom: 20,
  },
  commentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  replyCard: {
    marginLeft: 20,
    marginTop: 10,
    backgroundColor: "#F8F9FA",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  commentTime: {
    fontSize: 12,
    color: "#999",
  },
  commentContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 10,
  },
  commentActions: {
    flexDirection: "row",
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  commentActionText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 3,
  },
  repliesContainer: {
    marginTop: 10,
  },
});

export default PostDetail;
