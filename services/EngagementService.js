import AsyncStorage from "@react-native-async-storage/async-storage";

class EngagementService {
  static LIKES_KEY = "post_likes";
  static COMMENTS_KEY = "post_comments";
  static REACTIONS_KEY = "post_reactions";

  // Like/Unlike functionality
  static async toggleLike(postId) {
    try {
      const likes = await this.getLikes();
      const isLiked = likes.includes(postId);

      if (isLiked) {
        const updatedLikes = likes.filter((id) => id !== postId);
        await AsyncStorage.setItem(
          this.LIKES_KEY,
          JSON.stringify(updatedLikes)
        );
        return { liked: false, count: updatedLikes.length };
      } else {
        const updatedLikes = [...likes, postId];
        await AsyncStorage.setItem(
          this.LIKES_KEY,
          JSON.stringify(updatedLikes)
        );
        return { liked: true, count: updatedLikes.length };
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      return { liked: false, count: 0 };
    }
  }

  static async getLikes() {
    try {
      const likes = await AsyncStorage.getItem(this.LIKES_KEY);
      return likes ? JSON.parse(likes) : [];
    } catch (error) {
      console.error("Error getting likes:", error);
      return [];
    }
  }

  static async isLiked(postId) {
    try {
      const likes = await this.getLikes();
      return likes.includes(postId);
    } catch (error) {
      console.error("Error checking like status:", error);
      return false;
    }
  }

  // Comments functionality
  static async addComment(postId, comment) {
    try {
      const comments = await this.getComments();
      const postComments = comments[postId] || [];

      const newComment = {
        id: Date.now().toString(),
        text: comment,
        author: "You",
        timeAgo: "now",
        likes: 0,
        replies: [],
        timestamp: Date.now(),
      };

      postComments.unshift(newComment);
      comments[postId] = postComments;

      await AsyncStorage.setItem(this.COMMENTS_KEY, JSON.stringify(comments));
      return newComment;
    } catch (error) {
      console.error("Error adding comment:", error);
      return null;
    }
  }

  static async getComments(postId = null) {
    try {
      const comments = await AsyncStorage.getItem(this.COMMENTS_KEY);
      const allComments = comments ? JSON.parse(comments) : {};

      if (postId) {
        return allComments[postId] || [];
      }

      return allComments;
    } catch (error) {
      console.error("Error getting comments:", error);
      return postId ? [] : {};
    }
  }

  static async likeComment(postId, commentId) {
    try {
      const comments = await this.getComments();
      const postComments = comments[postId] || [];

      const commentIndex = postComments.findIndex((c) => c.id === commentId);
      if (commentIndex !== -1) {
        postComments[commentIndex].likes += 1;
        comments[postId] = postComments;
        await AsyncStorage.setItem(this.COMMENTS_KEY, JSON.stringify(comments));
        return postComments[commentIndex].likes;
      }

      return 0;
    } catch (error) {
      console.error("Error liking comment:", error);
      return 0;
    }
  }

  // Reactions functionality
  static async addReaction(postId, reactionType) {
    try {
      const reactions = await this.getReactions();
      const postReactions = reactions[postId] || {
        heart: 0,
        prayer: 0,
        amen: 0,
      };

      postReactions[reactionType] = (postReactions[reactionType] || 0) + 1;
      reactions[postId] = postReactions;

      await AsyncStorage.setItem(this.REACTIONS_KEY, JSON.stringify(reactions));
      return postReactions;
    } catch (error) {
      console.error("Error adding reaction:", error);
      return { heart: 0, prayer: 0, amen: 0 };
    }
  }

  static async getReactions(postId = null) {
    try {
      const reactions = await AsyncStorage.getItem(this.REACTIONS_KEY);
      const allReactions = reactions ? JSON.parse(reactions) : {};

      if (postId) {
        return allReactions[postId] || { heart: 0, prayer: 0, amen: 0 };
      }

      return allReactions;
    } catch (error) {
      console.error("Error getting reactions:", error);
      return postId ? { heart: 0, prayer: 0, amen: 0 } : {};
    }
  }

  // Share functionality
  static async sharePost(post) {
    try {
      const shareData = {
        title: post.title,
        message: `Check out this post: "${post.title}"\n\n${post.content}\n\nShared from Bible Community App`,
        url: `biblecommunity://post/${post.id}`,
      };

      return shareData;
    } catch (error) {
      console.error("Error preparing share data:", error);
      return null;
    }
  }

  // Get engagement stats for a post
  static async getPostEngagement(postId) {
    try {
      const [likes, comments, reactions] = await Promise.all([
        this.getLikes(),
        this.getComments(postId),
        this.getReactions(postId),
      ]);

      return {
        isLiked: likes.includes(postId),
        likeCount: likes.filter((id) => id === postId).length,
        commentCount: comments.length,
        reactions: reactions,
      };
    } catch (error) {
      console.error("Error getting post engagement:", error);
      return {
        isLiked: false,
        likeCount: 0,
        commentCount: 0,
        reactions: { heart: 0, prayer: 0, amen: 0 },
      };
    }
  }
}

export default EngagementService;





