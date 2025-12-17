import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import WorkingAuthService from "../services/WorkingAuthService";
import PostService from "../services/PostService";
import MediaService from "../services/MediaService";

const CreateTestimonyScreen = ({ navigation, route }) => {
  const [testimonyData, setTestimonyData] = useState({
    title: "",
    content: "",
    type: "testimony",
  });
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);

  // Media picker functions - using same MediaService as posts
  const pickImages = async () => {
    try {
      const result = await MediaService.pickImage();
      if (result.length > 0) {
        setImages((prev) => [...prev, ...result]);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick images");
    }
  };

  const takePhoto = async () => {
    try {
      const result = await MediaService.takePhoto();
      if (result.length > 0) {
        setImages((prev) => [...prev, ...result]);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to take photo");
    }
  };

  const pickVideo = async () => {
    try {
      const result = await MediaService.pickVideo();
      if (result.length > 0) {
        // Navigate to video preview screen for the first video
        navigation.navigate("VideoPreview", {
          videoUri: result[0].uri,
          onVideoConfirmed: (videoData) => {
            setVideos((prev) => [...prev, videoData]);
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick video");
    }
  };

  const recordVideo = async () => {
    try {
      const result = await MediaService.recordVideo();
      if (result.length > 0) {
        // Navigate to video preview screen for the recorded video
        navigation.navigate("VideoPreview", {
          videoUri: result[0].uri,
          onVideoConfirmed: (videoData) => {
            setVideos((prev) => [...prev, videoData]);
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to record video");
    }
  };

  const removeImage = (imageId) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const removeVideo = (videoId) => {
    setVideos((prev) => prev.filter((vid) => vid.id !== videoId));
  };

  const handleSubmit = async () => {
    if (!testimonyData.title.trim() || !testimonyData.content.trim()) {
      Alert.alert("Error", "Please fill in both title and content");
      return;
    }

    setLoading(true);
    try {
      const currentUser = WorkingAuthService.getCurrentUser();
      if (!currentUser) {
        Alert.alert("Error", "Please sign in to share a testimony");
        return;
      }

      const testimonyWithUser = {
        ...testimonyData,
        author: currentUser.displayName || "Anonymous",
        authorId: currentUser.uid,
        authorPhoto: currentUser.photoURL || null,
        community: "Testimonies",
        communityId: "testimonies",
        timestamp: new Date(),
        likes: 0,
        comments: 0,
        upvotes: 0,
        timeAgo: "Just now",
        images: images,
        videos: videos,
      };

      await PostService.createPost(testimonyWithUser);

      Alert.alert("Success", "Your testimony has been shared!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error creating testimony:", error);
      Alert.alert("Error", "Failed to share testimony. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Minimal Header */}
      <View style={styles.minimalHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Testimony</Text>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!testimonyData.title.trim() ||
              !testimonyData.content.trim() ||
              loading) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            !testimonyData.title.trim() ||
            !testimonyData.content.trim() ||
            loading
          }
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Sharing..." : "Share"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Scripture Inspiration */}
        <View style={styles.scriptureContainer}>
          <Text style={styles.scriptureText}>
            "But you will receive power when the Holy Spirit comes on you; and
            you will be my witnesses... to the ends of the earth."
          </Text>
          <Text style={styles.scriptureReference}>Acts 1:8</Text>
        </View>

        {/* Inspiring Testimony Form */}
        <View style={styles.inspiringForm}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <TextInput
              style={styles.inspiringTitle}
              placeholder="What has God done in your life?"
              value={testimonyData.title}
              onChangeText={(text) =>
                setTestimonyData({ ...testimonyData, title: text })
              }
              placeholderTextColor="#999"
              maxLength={100}
            />
            <View style={styles.titleUnderline} />
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            <TextInput
              style={styles.inspiringContent}
              placeholder=""
              value={testimonyData.content}
              onChangeText={(text) =>
                setTestimonyData({ ...testimonyData, content: text })
              }
              placeholderTextColor="#999"
              multiline
              numberOfLines={12}
              textAlignVertical="top"
              maxLength={2000}
            />
          </View>

          {/* Media Section */}
          <View style={styles.mediaSection}>
            <Text style={styles.mediaSectionTitle}>Add Photos or Videos</Text>
            <Text style={styles.mediaSectionSubtitle}>
              Share images or videos that tell your story
            </Text>

            <View style={styles.mediaButtons}>
              <TouchableOpacity style={styles.mediaButton} onPress={pickImages}>
                <Ionicons name="images" size={20} color="#1a365d" />
                <Text style={styles.mediaButtonText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                <Ionicons name="camera" size={20} color="#1a365d" />
                <Text style={styles.mediaButtonText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mediaButton} onPress={pickVideo}>
                <Ionicons name="videocam" size={20} color="#1a365d" />
                <Text style={styles.mediaButtonText}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaButton}
                onPress={recordVideo}
              >
                <Ionicons name="videocam-outline" size={20} color="#1a365d" />
                <Text style={styles.mediaButtonText}>Record</Text>
              </TouchableOpacity>
            </View>

            {/* Media Previews */}
            {images.length > 0 && (
              <View style={styles.mediaPreviewContainer}>
                <Text style={styles.mediaPreviewTitle}>
                  Photos ({images.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {images.map((image) => (
                    <View key={image.id} style={styles.mediaPreviewItem}>
                      <Image
                        source={{ uri: image.uri }}
                        style={styles.mediaPreview}
                      />
                      <TouchableOpacity
                        style={styles.removeMediaButton}
                        onPress={() => removeImage(image.id)}
                      >
                        <Ionicons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {videos.length > 0 && (
              <View style={styles.mediaPreviewContainer}>
                <Text style={styles.mediaPreviewTitle}>
                  Videos ({videos.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {videos.map((video) => (
                    <View key={video.id} style={styles.mediaPreviewItem}>
                      <Image
                        source={{ uri: video.thumbnail || video.uri }}
                        style={styles.mediaPreview}
                      />
                      <TouchableOpacity
                        style={styles.removeMediaButton}
                        onPress={() => removeVideo(video.id)}
                      >
                        <Ionicons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Inspiring Quote */}
          <View style={styles.inspiringQuote}>
            <Text style={styles.quoteText}>
              "I rejoice in the way of your testimonies as much as in all
              riches"
            </Text>
            <Text style={styles.quoteReference}>Psalm 119:14</Text>
          </View>

          <Text style={styles.characterCount}>
            {testimonyData.content.length}/2000 characters
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  minimalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    paddingTop: 40,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  submitButton: {
    backgroundColor: "#1a365d",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: "#666",
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scriptureContainer: {
    padding: 20,
    margin: 16,
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
  formContainer: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  contentInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
    minHeight: 120,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  // Inspiring Testimony Styles
  inspiringForm: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  titleSection: {
    marginBottom: 24,
  },
  inspiringTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a365d",
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  titleUnderline: {
    height: 3,
    backgroundColor: "#1a365d",
    marginTop: 4,
    borderRadius: 2,
  },
  contentSection: {
    marginBottom: 24,
  },
  inspiringContent: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    minHeight: 200,
    borderWidth: 0,
    lineHeight: 24,
  },
  mediaSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f0f8ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e3f2fd",
  },
  mediaSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a365d",
    marginBottom: 4,
  },
  mediaSectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  mediaButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  mediaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1a365d",
    minWidth: 80,
    justifyContent: "center",
    marginBottom: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  mediaButtonText: {
    fontSize: 14,
    color: "#1a365d",
    fontWeight: "600",
    marginLeft: 8,
  },
  mediaPreviewContainer: {
    marginTop: 16,
  },
  mediaPreviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  mediaPreviewItem: {
    position: "relative",
    marginRight: 12,
  },
  mediaPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  removeMediaButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ff4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  inspiringQuote: {
    backgroundColor: "#fff3cd",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 14,
    color: "#856404",
    fontStyle: "italic",
    lineHeight: 20,
    textAlign: "center",
  },
  quoteReference: {
    fontSize: 12,
    color: "#856404",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
});

export default CreateTestimonyScreen;
