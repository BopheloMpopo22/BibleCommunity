import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";

const { width } = Dimensions.get("window");

const MediaPreview = ({ media, onRemove, showRemoveButton = true }) => {
  const handleRemove = () => {
    Alert.alert("Remove Media", "Are you sure you want to remove this media?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => onRemove(media.id),
      },
    ]);
  };

  const renderMedia = () => {
    if (media.type === "image") {
      return (
        <Image
          source={{ uri: media.uri }}
          style={styles.mediaImage}
          resizeMode="contain"
        />
      );
    } else if (media.type === "video") {
      return (
        <View style={styles.videoContainer}>
          {media.thumbnail ? (
            <View style={styles.videoThumbnailContainer}>
              <Image
                source={{ uri: media.thumbnail }}
                style={styles.videoThumbnail}
              />
              <View style={styles.playOverlay}>
                <Ionicons name="play" size={30} color="#fff" />
              </View>
              {media.duration && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>
                    {formatDuration(media.duration)}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Video
              source={{ uri: media.uri }}
              style={styles.mediaVideo}
              resizeMode="contain"
              shouldPlay={false}
              isLooping={false}
              useNativeControls={true}
              onPlaybackStatusUpdate={(status) => {
                // Handle video state changes
                if (status.didJustFinish) {
                  console.log("Video finished playing");
                }
              }}
            />
          )}
        </View>
      );
    }
    return null;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.mediaContainer}>
        {renderMedia()}

        {showRemoveButton && (
          <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
            <Ionicons name="close-circle" size={24} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Hide filename to avoid showing number.mp4 in UI */}
      <View style={styles.mediaInfo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  mediaContainer: {
    position: "relative",
    height: 220,
    backgroundColor: "#000",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  mediaVideo: {
    width: "100%",
    height: "100%",
  },
  videoThumbnailContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: "#000",
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 2,
  },
  mediaInfo: {
    padding: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  mediaDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mediaType: {
    fontSize: 12,
    color: "#666",
    textTransform: "capitalize",
  },
  duration: {
    fontSize: 12,
    color: "#666",
  },
});

export default MediaPreview;
