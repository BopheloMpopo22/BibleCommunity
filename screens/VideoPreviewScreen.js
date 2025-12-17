import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const VideoPreviewScreen = ({ navigation, route }) => {
  const { videoUri, onVideoConfirmed } = route.params;
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState({
    positionMillis: 0,
    durationMillis: 0,
  });
  const videoRef = useRef(null);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        await videoRef.current.pauseAsync();
        setIsVideoPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsVideoPlaying(true);
      }
    }
  };

  const handleSeek = async (position) => {
    if (videoRef.current) {
      await videoRef.current.setPositionAsync(position);
    }
  };

  const pickThumbnail = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedThumbnail(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick thumbnail image");
    }
  };

  const captureThumbnail = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedThumbnail(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture thumbnail image");
    }
  };

  const handleConfirm = () => {
    if (!selectedThumbnail) {
      Alert.alert(
        "Thumbnail Required",
        "Please select a thumbnail for your video"
      );
      return;
    }

    // Call the callback function with video data
    if (onVideoConfirmed) {
      onVideoConfirmed({
        id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri: videoUri,
        thumbnail: selectedThumbnail,
        type: "video",
      });
    }
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color="#1a365d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Preview</Text>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Preview */}
        <View style={styles.videoSection}>
          <Text style={styles.sectionTitle}>Video Preview</Text>
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode="contain"
              shouldPlay={false}
              isLooping={false}
              onPlaybackStatusUpdate={(status) => {
                setPlaybackStatus(status);
                setIsVideoPlaying(status.isPlaying);
              }}
            />

            {/* Video Controls Overlay */}
            <TouchableOpacity
              style={styles.videoOverlay}
              onPress={handlePlayPause}
            >
              {!isVideoPlaying && (
                <View style={styles.playButton}>
                  <Ionicons name="play" size={50} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Thumbnail Selection */}
        <View style={styles.thumbnailSection}>
          <Text style={styles.sectionTitle}>Select Thumbnail</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a thumbnail image for your video
          </Text>

          {selectedThumbnail ? (
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: selectedThumbnail }}
                style={styles.thumbnail}
              />
              <TouchableOpacity
                style={styles.changeThumbnailButton}
                onPress={pickThumbnail}
              >
                <Ionicons name="camera" size={20} color="#1a365d" />
                <Text style={styles.changeThumbnailText}>Change Thumbnail</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="image-outline" size={60} color="#ccc" />
              <Text style={styles.placeholderText}>No thumbnail selected</Text>
            </View>
          )}

          {/* Thumbnail Options */}
          <View style={styles.thumbnailOptions}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={pickThumbnail}
            >
              <Ionicons name="images" size={24} color="#1a365d" />
              <Text style={styles.optionButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={captureThumbnail}
            >
              <Ionicons name="camera" size={24} color="#1a365d" />
              <Text style={styles.optionButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>
            • Preview your video by tapping the play button
          </Text>
          <Text style={styles.instructionsText}>
            • Select a thumbnail image that represents your video
          </Text>
          <Text style={styles.instructionsText}>
            • The thumbnail will be shown in the feed before users play the
            video
          </Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a365d",
  },
  confirmButton: {
    backgroundColor: "#1a365d",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  videoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  videoContainer: {
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  video: {
    width: "100%",
    height: 250,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailSection: {
    marginBottom: 30,
  },
  thumbnailContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  thumbnail: {
    width: 200,
    height: 112, // 16:9 aspect ratio
    borderRadius: 8,
    marginBottom: 15,
  },
  changeThumbnailButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeThumbnailText: {
    marginLeft: 8,
    color: "#1a365d",
    fontWeight: "500",
  },
  thumbnailPlaceholder: {
    height: 112,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  placeholderText: {
    color: "#999",
    marginTop: 8,
  },
  thumbnailOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  optionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  optionButtonText: {
    marginLeft: 8,
    color: "#1a365d",
    fontWeight: "500",
  },
  instructionsSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    lineHeight: 20,
  },
});

export default VideoPreviewScreen;
