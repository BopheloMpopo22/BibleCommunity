import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ImageBackground,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import MediaService from "../services/MediaService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WorkingAuthService from "../services/WorkingAuthService";

// Available wallpapers from assets
const ASSET_WALLPAPERS = [
  { id: "morning-bg", name: "Morning Background", file: require("../assets/background-morning-picture.jpg") },
  { id: "afternoon-bg", name: "Afternoon Background", file: require("../assets/background-afternoon-picture.jpg") },
  { id: "night-bg", name: "Night Background", file: require("../assets/background-night-picture.jpg") },
  { id: "field-1920", name: "Field", file: require("../assets/field-3629120_640.jpg") },
  { id: "sea-1920", name: "Sea", file: require("../assets/sea-4242303_640.jpg") },
  { id: "joy", name: "Joy", file: require("../assets/Joy Photo.jpg") },
  { id: "hope", name: "Hope", file: require("../assets/Hope Photo.jpg") },
  { id: "faith", name: "Faith", file: require("../assets/Faith photo.jpg") },
  { id: "peace", name: "Peace", file: require("../assets/Peace photo.jpg") },
  { id: "meditation-bg", name: "Meditation Background", file: require("../assets/Background of meditaton screen..jpg") },
  { id: "tree", name: "Tree", file: require("../assets/photorealistic-view-tree-nature-with-branches-trunk.jpg") },
  { id: "bible", name: "Open Bible", file: require("../assets/open-bible-black-background.jpg") },
];

const PRAYER_TIMES = [
  { id: "morning", name: "Morning Prayer", icon: "sunny", color: "#FFD700" },
  { id: "afternoon", name: "Afternoon Prayer", icon: "partly-sunny", color: "#FF8C42" },
  { id: "evening", name: "Evening Prayer", icon: "moon", color: "#1a365d" },
];

const CreatePartnerPrayerScreen = ({ navigation }) => {
  const [selectedTime, setSelectedTime] = useState(null);
  const [prayerText, setPrayerText] = useState("");
  const [video, setVideo] = useState(null);
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [showRecordingTip, setShowRecordingTip] = useState(false);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [showThumbnailPicker, setShowThumbnailPicker] = useState(false);
  const [wallpaper, setWallpaper] = useState(null);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [textColor, setTextColor] = useState("black"); // "black" or "white"
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickVideo = async () => {
    try {
      const result = await MediaService.pickVideo();
      if (result.length > 0) {
        setVideo(result[0]);
        setShowVideoPicker(false);
        // After video is selected, show thumbnail picker
        setShowThumbnailPicker(true);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick video");
    }
  };

  const recordVideo = async () => {
    // Show tip first
    setShowRecordingTip(true);
  };

  const handleRecordVideoAfterTip = async () => {
    setShowRecordingTip(false);
    try {
      const result = await MediaService.recordVideo();
      if (result.length > 0) {
        setVideo(result[0]);
        setShowVideoPicker(false);
        // After video is selected, show thumbnail picker
        setShowThumbnailPicker(true);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to record video");
    }
  };

  const removeVideo = () => {
    setVideo(null);
    setVideoThumbnail(null);
  };

  const pickThumbnail = async () => {
    try {
      const result = await MediaService.pickImage();
      if (result.length > 0) {
        setVideoThumbnail({ uri: result[0].uri });
        setShowThumbnailPicker(false);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick thumbnail");
    }
  };

  const useWallpaperAsThumbnail = () => {
    if (wallpaper) {
      if (wallpaper.type === "asset") {
        // For asset wallpapers, we can't use them directly as thumbnail
        // But we can set a flag to use wallpaper when saving
        setVideoThumbnail({ type: "useWallpaper" });
      } else {
        setVideoThumbnail({ uri: wallpaper.uri });
      }
    }
    setShowThumbnailPicker(false);
  };

  const declineThumbnail = () => {
    // Use wallpaper as thumbnail if available
    if (wallpaper) {
      useWallpaperAsThumbnail();
    } else {
      setVideoThumbnail(null);
      setShowThumbnailPicker(false);
    }
  };

  const pickWallpaperFromAssets = (wallpaper) => {
    // Only save id and type, not the file (can't be serialized to JSON)
    setWallpaper({ type: "asset", id: wallpaper.id });
    setShowWallpaperPicker(false);
  };

  const pickWallpaperFromPhone = async () => {
    try {
      const result = await MediaService.pickImage();
      if (result.length > 0) {
        setWallpaper({ type: "phone", uri: result[0].uri });
        setShowWallpaperPicker(false);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick wallpaper");
    }
  };

  const takePhotoForWallpaper = async () => {
    try {
      const result = await MediaService.takePhoto();
      if (result.length > 0) {
        setWallpaper({ type: "phone", uri: result[0].uri });
        setShowWallpaperPicker(false);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to take photo");
    }
  };

  const removeWallpaper = () => {
    setWallpaper(null);
  };

  const handleSubmit = async () => {
    if (!selectedTime) {
      Alert.alert("Required", "Please select a prayer time");
      return;
    }

    if (!prayerText.trim()) {
      Alert.alert("Required", "Please write your prayer");
      return;
    }

    setLoading(true);
    try {
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser) {
        Alert.alert("Error", "Please sign in to create a prayer");
        return;
      }

      // Upload media to Firebase Storage if present
      let uploadedVideo = video;
      let uploadedWallpaper = wallpaper;

      // Determine thumbnail
      let thumbnailUri = null;
      if (videoThumbnail) {
        if (videoThumbnail.type === "useWallpaper" && wallpaper) {
          // Use wallpaper as thumbnail
          if (wallpaper.type === "phone") {
            thumbnailUri = wallpaper.uri;
          } else if (wallpaper.type === "asset") {
            // For asset wallpapers, we'll need to handle this differently
            // For now, use the video's default thumbnail
            thumbnailUri = null;
          }
        } else if (videoThumbnail.uri) {
          thumbnailUri = videoThumbnail.uri;
        }
      }

      if (video && video.uri && !video.uri.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          console.log("Uploading partner prayer video to Firebase Storage...");
          const FirebaseStorageService = (await import("../services/FirebaseStorageService")).default;
          
          // Upload thumbnail if provided
          let thumbnailUrl = null;
          if (thumbnailUri && !thumbnailUri.startsWith("https://firebasestorage.googleapis.com")) {
            try {
              const thumbnailUpload = await FirebaseStorageService.uploadImage(
                thumbnailUri,
                "partners/prayers/thumbnails"
              );
              thumbnailUrl = thumbnailUpload.url;
            } catch (thumbError) {
              console.warn("Error uploading thumbnail:", thumbError.message);
            }
          } else if (thumbnailUri && thumbnailUri.startsWith("https://firebasestorage.googleapis.com")) {
            thumbnailUrl = thumbnailUri; // Already uploaded
          }

          const uploadResult = await FirebaseStorageService.uploadVideo(
            video.uri,
            "partners/prayers/videos"
          );
          uploadedVideo = {
            ...video,
            uri: uploadResult.url,
            url: uploadResult.url,
            thumbnail: thumbnailUrl || uploadResult.thumbnail || video.thumbnail,
          };
          console.log("Partner prayer video uploaded successfully");
        } catch (uploadError) {
          console.warn("Error uploading partner prayer video:", uploadError.message);
          // Continue with local URI if upload fails
        }
      }

      if (wallpaper && wallpaper.type === "phone" && wallpaper.uri && !wallpaper.uri.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          console.log("Uploading partner prayer wallpaper to Firebase Storage...");
          const FirebaseStorageService = (await import("../services/FirebaseStorageService")).default;
          const uploadResult = await FirebaseStorageService.uploadImage(
            wallpaper.uri,
            "partners/prayers/wallpapers"
          );
          uploadedWallpaper = {
            type: "phone",
            uri: uploadResult.url,
            url: uploadResult.url,
          };
          console.log("Partner prayer wallpaper uploaded successfully");
        } catch (uploadError) {
          console.warn("Error uploading partner prayer wallpaper:", uploadError.message);
          // Continue with local URI if upload fails
        }
      }

      const partnerPrayer = {
        time: selectedTime,
        prayer: prayerText.trim(),
        video: uploadedVideo,
        wallpaper: uploadedWallpaper, // Optional wallpaper (now with Firebase URL if uploaded)
        textColor: textColor, // Text color (black or white)
      };

      // Save to Firebase (and locally as backup)
      const PartnerFirebaseService = (await import("../services/PartnerFirebaseService")).default;
      const result = await PartnerFirebaseService.savePartnerPrayer(partnerPrayer);

      Alert.alert(
        "Thank You!",
        "Your prayer has been submitted. It may be selected for today or another day. Thank you for being a partner!",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("PartnerPrayers"),
          },
        ]
      );
    } catch (error) {
      console.error("Error creating partner prayer:", error);
      Alert.alert("Error", "Failed to submit prayer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a365d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Prayer</Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading || !selectedTime || !prayerText.trim()}
          >
            <Text
              style={[
                styles.submitButtonText,
                (!selectedTime || !prayerText.trim()) && styles.submitButtonDisabled,
              ]}
            >
              {loading ? "Submitting..." : "Submit"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Prayer Time Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Select Prayer Time</Text>
            <View style={styles.timeOptions}>
              {PRAYER_TIMES.map((time) => (
                <TouchableOpacity
                  key={time.id}
                  style={[
                    styles.timeOption,
                    selectedTime === time.id && styles.timeOptionSelected,
                  ]}
                  onPress={() => setSelectedTime(time.id)}
                >
                  <Ionicons
                    name={time.icon}
                    size={32}
                    color={selectedTime === time.id ? "#fff" : time.color}
                  />
                  <Text
                    style={[
                      styles.timeOptionText,
                      selectedTime === time.id && styles.timeOptionTextSelected,
                    ]}
                  >
                    {time.name}
                  </Text>
                  {selectedTime === time.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Prayer Text Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Write Your Prayer</Text>
            <TextInput
              style={styles.prayerInput}
              placeholder="Write your prayer here..."
              value={prayerText}
              onChangeText={setPrayerText}
              multiline
              placeholderTextColor="#999"
              textAlignVertical="top"
            />
          </View>

          {/* Optional Wallpaper */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Optional Wallpaper</Text>
            <Text style={styles.sectionHint}>
              Add a background image for your prayer (optional)
            </Text>
            {wallpaper ? (
              <View style={styles.wallpaperPreviewContainer}>
                <ImageBackground
                  source={
                    wallpaper.type === "asset"
                      ? wallpaper.file
                      : { uri: wallpaper.uri }
                  }
                  style={styles.wallpaperPreview}
                  resizeMode="cover"
                >
                  <View style={styles.wallpaperPreviewOverlay}>
                    <Text
                      style={[
                        styles.wallpaperPreviewText,
                        { color: textColor === "white" ? "#fff" : "#000" },
                      ]}
                    >
                      Preview
                    </Text>
                  </View>
                </ImageBackground>
                <TouchableOpacity
                  style={styles.removeWallpaperButton}
                  onPress={removeWallpaper}
                >
                  <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addWallpaperButton}
                onPress={() => setShowWallpaperPicker(true)}
              >
                <Ionicons name="image-outline" size={32} color="#1a365d" />
                <Text style={styles.addWallpaperButtonText}>Add Wallpaper</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Optional Text Color - Always visible when wallpaper is selected */}
          {wallpaper && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Text Color</Text>
              <Text style={styles.sectionHint}>
                Choose text color for better visibility on your wallpaper
              </Text>
              <View style={styles.textColorOptions}>
                <TouchableOpacity
                  style={[
                    styles.textColorOption,
                    textColor === "black" && styles.textColorOptionSelected,
                  ]}
                  onPress={() => setTextColor("black")}
                >
                  <View style={[styles.colorCircle, { backgroundColor: "#000" }]} />
                  <Text
                    style={[
                      styles.textColorOptionText,
                      textColor === "black" && styles.textColorOptionTextSelected,
                    ]}
                  >
                    Black
                  </Text>
                  {textColor === "black" && (
                    <Ionicons name="checkmark-circle" size={20} color="#1a365d" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.textColorOption,
                    textColor === "white" && styles.textColorOptionSelected,
                  ]}
                  onPress={() => setTextColor("white")}
                >
                  <View style={[styles.colorCircle, { backgroundColor: "#fff", borderWidth: 1, borderColor: "#ccc" }]} />
                  <Text
                    style={[
                      styles.textColorOptionText,
                      textColor === "white" && styles.textColorOptionTextSelected,
                    ]}
                  >
                    White
                  </Text>
                  {textColor === "white" && (
                    <Ionicons name="checkmark-circle" size={20} color="#1a365d" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Optional Video */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Optional Video</Text>
            <Text style={styles.sectionHint}>
              Add a video to accompany your prayer (optional)
            </Text>
            {video ? (
              <View style={styles.videoPreviewContainer}>
                <Ionicons name="videocam" size={32} color="#1a365d" />
                <Text style={styles.videoPreviewText}>
                  {video.fileName || "Video selected"}
                </Text>
                <TouchableOpacity
                  style={styles.removeVideoButton}
                  onPress={removeVideo}
                >
                  <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addVideoButton}
                onPress={() => setShowVideoPicker(true)}
              >
                <Ionicons name="videocam-outline" size={32} color="#1a365d" />
                <Text style={styles.addVideoButtonText}>Add Video</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Wallpaper Picker Modal */}
        <Modal
          visible={showWallpaperPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowWallpaperPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  style={styles.modalBackButton}
                  onPress={() => setShowWallpaperPicker(false)}
                >
                  <Ionicons name="arrow-back" size={24} color="#1a365d" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Wallpaper</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setShowWallpaperPicker(false)}
                >
                  <Ionicons name="close" size={24} color="#1a365d" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <Text style={styles.modalSectionTitle}>From Assets</Text>
                <View style={styles.wallpapersGrid}>
                  {ASSET_WALLPAPERS.map((wp) => (
                    <TouchableOpacity
                      key={wp.id}
                      style={styles.wallpaperItem}
                      onPress={() => pickWallpaperFromAssets(wp)}
                    >
                      <Image 
                        source={wp.file} 
                        style={styles.wallpaperThumbnail}
                        resizeMode="cover"
                      />
                      <Text style={styles.wallpaperName} numberOfLines={2}>
                        {wp.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.modalSectionTitle}>From Phone</Text>
                <TouchableOpacity
                  style={styles.phoneOption}
                  onPress={pickWallpaperFromPhone}
                >
                  <Ionicons name="images" size={24} color="#1a365d" />
                  <Text style={styles.phoneOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.phoneOption}
                  onPress={takePhotoForWallpaper}
                >
                  <Ionicons name="camera" size={24} color="#1a365d" />
                  <Text style={styles.phoneOptionText}>Take Photo</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Video Picker Modal */}
        <Modal
          visible={showVideoPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowVideoPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Video</Text>
                <TouchableOpacity onPress={() => setShowVideoPicker(false)}>
                  <Ionicons name="close" size={24} color="#1a365d" />
                </TouchableOpacity>
              </View>
              <View style={styles.videoOptions}>
                <TouchableOpacity
                  style={styles.videoOption}
                  onPress={pickVideo}
                >
                  <Ionicons name="videocam" size={24} color="#1a365d" />
                  <Text style={styles.videoOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.videoOption}
                  onPress={recordVideo}
                >
                  <Ionicons name="videocam-outline" size={24} color="#1a365d" />
                  <Text style={styles.videoOptionText}>Record Video</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Recording Tip Modal */}
        <Modal
          visible={showRecordingTip}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRecordingTip(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.tipModalContent}>
              <View style={styles.tipHeader}>
                <Ionicons name="information-circle" size={32} color="#1a365d" />
                <Text style={styles.tipTitle}>Recording Tip</Text>
              </View>
              <Text style={styles.tipText}>
                Place camera a bit far away from face to get a beautiful video with no cropping.
              </Text>
              <View style={styles.tipButtons}>
                <TouchableOpacity
                  style={styles.tipButton}
                  onPress={handleRecordVideoAfterTip}
                >
                  <Text style={styles.tipButtonText}>Got it, Record</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tipButton, styles.tipButtonCancel]}
                  onPress={() => setShowRecordingTip(false)}
                >
                  <Text style={[styles.tipButtonText, styles.tipButtonTextCancel]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Thumbnail Picker Modal */}
        <Modal
          visible={showThumbnailPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => declineThumbnail()}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Video Thumbnail</Text>
                <TouchableOpacity onPress={declineThumbnail}>
                  <Ionicons name="close" size={24} color="#1a365d" />
                </TouchableOpacity>
              </View>
              <View style={styles.thumbnailOptions}>
                <Text style={styles.thumbnailHint}>
                  Choose a thumbnail for your video, or use your wallpaper as thumbnail
                </Text>
                <TouchableOpacity
                  style={styles.thumbnailOption}
                  onPress={pickThumbnail}
                >
                  <Ionicons name="image-outline" size={24} color="#1a365d" />
                  <Text style={styles.thumbnailOptionText}>Choose Custom Thumbnail</Text>
                </TouchableOpacity>
                {wallpaper && (
                  <TouchableOpacity
                    style={styles.thumbnailOption}
                    onPress={useWallpaperAsThumbnail}
                  >
                    <Ionicons name="image" size={24} color="#1a365d" />
                    <Text style={styles.thumbnailOptionText}>Use Wallpaper as Thumbnail</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.thumbnailOption, styles.thumbnailOptionDecline]}
                  onPress={declineThumbnail}
                >
                  <Ionicons name="close-circle-outline" size={24} color="#666" />
                  <Text style={[styles.thumbnailOptionText, styles.thumbnailOptionTextDecline]}>
                    {wallpaper ? "Use Wallpaper (Default)" : "Skip"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a365d",
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
  },
  submitButtonDisabled: {
    color: "#ccc",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    fontStyle: "italic",
  },
  timeOptions: {
    gap: 12,
  },
  timeOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  timeOptionSelected: {
    backgroundColor: "#1a365d",
    borderColor: "#1a365d",
  },
  timeOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
    marginLeft: 12,
  },
  timeOptionTextSelected: {
    color: "#fff",
  },
  prayerInput: {
    fontSize: 16,
    color: "#000",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  addVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: "#1a365d",
    borderStyle: "dashed",
  },
  addVideoButtonText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 8,
    fontWeight: "600",
  },
  videoPreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  videoPreviewText: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    marginLeft: 12,
  },
  removeVideoButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalBackButton: {
    padding: 4,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a365d",
    flex: 1,
    textAlign: "center",
  },
  videoOptions: {
    padding: 16,
  },
  videoOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  videoOptionText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 12,
  },
  addWallpaperButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: "#1a365d",
    borderStyle: "dashed",
  },
  addWallpaperButtonText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 8,
    fontWeight: "600",
  },
  wallpaperPreviewContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 12,
  },
  wallpaperPreview: {
    width: "100%",
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  wallpaperPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  wallpaperPreviewText: {
    fontSize: 16,
    fontWeight: "600",
  },
  removeWallpaperButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
  },
  textColorOptions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  textColorOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  textColorOptionSelected: {
    borderColor: "#1a365d",
    backgroundColor: "#E3F2FD",
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  textColorOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  textColorOptionTextSelected: {
    color: "#1a365d",
  },
  wallpapersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  wallpaperItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 12,
  },
  wallpaperThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: "#f0f0f0",
  },
  wallpaperName: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  phoneOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  phoneOptionText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 12,
  },
  tipModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: "center",
  },
  tipHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  tipTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a365d",
    marginTop: 8,
  },
  tipText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  tipButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  tipButton: {
    flex: 1,
    backgroundColor: "#1a365d",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  tipButtonCancel: {
    backgroundColor: "#f0f0f0",
  },
  tipButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  tipButtonTextCancel: {
    color: "#666",
  },
  thumbnailOptions: {
    padding: 16,
  },
  thumbnailHint: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  thumbnailOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  thumbnailOptionDecline: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  thumbnailOptionText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 12,
  },
  thumbnailOptionTextDecline: {
    color: "#666",
  },
});

export default CreatePartnerPrayerScreen;

