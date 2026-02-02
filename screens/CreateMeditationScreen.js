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

// Available images from assets
const ASSET_IMAGES = [
  { id: "field-1920", name: "Field", file: require("../assets/field-3629120_640.jpg") },
  { id: "field-640", name: "Field (Small)", file: require("../assets/field-3629120_640.jpg") },
  { id: "sea-1920", name: "Sea", file: require("../assets/sea-4242303_640.jpg") },
  { id: "sea-640", name: "Sea (Small)", file: require("../assets/sea-4242303_640.jpg") },
  { id: "joy", name: "Joy", file: require("../assets/Joy Photo.jpg") },
  { id: "hope", name: "Hope", file: require("../assets/Hope Photo.jpg") },
  { id: "hope-cover", name: "Hope Cover", file: require("../assets/Hope Cover Photo.jpg") },
  { id: "faith", name: "Faith", file: require("../assets/Faith photo.jpg") },
  { id: "faith-small", name: "Faith (Small)", file: require("../assets/Faith.jpg") },
  { id: "peace", name: "Peace", file: require("../assets/Peace photo.jpg") },
  { id: "peace-cover", name: "Peace Cover", file: require("../assets/Peace Cover letter.jpg") },
  { id: "background", name: "Meditation Background", file: require("../assets/Background of meditaton screen..jpg") },
];

// Available music from assets
const ASSET_MUSIC = [
  { id: "zen-wind", name: "Zen Wind", file: require("../assets/zen-wind-411951.mp3") },
  { id: "heavenly-energy", name: "Heavenly Energy", file: require("../assets/heavenly-energy-188908.mp3") },
  { id: "inner-peace", name: "Inner Peace", file: require("../assets/inner-peace-339640.mp3") },
  { id: "prayer-meditation", name: "Prayer Meditation", file: require("../assets/prayer-meditation-piano-holy-grace-heavenly-celestial-music-393549.mp3") },
  { id: "worship-piano", name: "Worship Piano", file: require("../assets/worship-piano-instrumental-peaceful-prayer-music-223373.mp3") },
];

// Suggested themes
const SUGGESTED_THEMES = [
  "Love",
  "Peace",
  "Joy",
  "Hope",
  "Faith",
  "Gratitude",
  "Forgiveness",
  "Strength",
  "Comfort",
  "Wisdom",
  "Patience",
  "Courage",
];

// Color options for background
const COLOR_OPTIONS = [
  { id: "navy", name: "Navy", color: "#1a365d" },
  { id: "green", name: "Dark Green", color: "#2d5016" },
  { id: "purple", name: "Purple", color: "#1A0F2E" },
  { id: "orange", name: "Orange", color: "#8B4513" },
  { id: "blue", name: "Blue", color: "#1e3a5f" },
  { id: "teal", name: "Teal", color: "#2d5f5f" },
];

const CreateMeditationScreen = ({ navigation }) => {
  const [meditationTitle, setMeditationTitle] = useState("");
  const [creatorName, setCreatorName] = useState(""); // Username/name field
  const [scriptureBoxes, setScriptureBoxes] = useState([
    { id: 1, verse: "", reference: "" },
  ]);
  const [selectedTheme, setSelectedTheme] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [showCustomTheme, setShowCustomTheme] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null); // Video support
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const addScriptureBox = () => {
    setScriptureBoxes([
      ...scriptureBoxes,
      { id: Date.now(), verse: "", reference: "" },
    ]);
  };

  const removeScriptureBox = (id) => {
    if (scriptureBoxes.length > 1) {
      setScriptureBoxes(scriptureBoxes.filter((box) => box.id !== id));
    } else {
      Alert.alert("Required", "At least one scripture box is required");
    }
  };

  const updateScriptureBox = (id, field, value) => {
    setScriptureBoxes(
      scriptureBoxes.map((box) =>
        box.id === id ? { ...box, [field]: value } : box
      )
    );
  };

  const pickImageFromAssets = (image) => {
    if (!coverImage) {
      // First image becomes cover
      setCoverImage({ type: "asset", id: image.id, file: image.file });
    }
    setSelectedImages([
      ...selectedImages,
      { type: "asset", id: image.id, file: image.file },
    ]);
    setShowImagePicker(false);
  };

  const pickImageFromPhone = async () => {
    try {
      const result = await MediaService.pickImage();
      if (result.length > 0) {
        const image = result[0];
        if (!coverImage) {
          setCoverImage({ type: "phone", uri: image.uri });
        }
        setSelectedImages([
          ...selectedImages,
          { type: "phone", uri: image.uri, id: image.id },
        ]);
        setShowImagePicker(false);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const result = await MediaService.takePhoto();
      if (result.length > 0) {
        const image = result[0];
        if (!coverImage) {
          setCoverImage({ type: "phone", uri: image.uri });
        }
        setSelectedImages([
          ...selectedImages,
          { type: "phone", uri: image.uri, id: image.id },
        ]);
        setShowImagePicker(false);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to take photo");
    }
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    if (coverImage && index === 0) {
      setCoverImage(newImages[0] || null);
    }
  };

  const selectMusicFromAssets = (music) => {
    setSelectedMusic({ type: "asset", id: music.id, file: music.file });
    setShowMusicPicker(false);
  };

  const selectMusicFromPhone = async () => {
    try {
      // Request permissions
      const permissions = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissions.status !== "granted") {
        Alert.alert("Permission Required", "Please grant media library access to select music files.");
        return;
      }

      // Use ImagePicker with All media types to allow audio file selection
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // This includes audio files
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Check if it's an audio file (by extension or mime type)
        const uri = asset.uri;
        const isAudio = uri.match(/\.(mp3|m4a|wav|aac|ogg|flac)$/i) || 
                       asset.mimeType?.startsWith('audio/');
        
        if (isAudio) {
          setSelectedMusic({
            type: "phone",
            uri: uri,
            fileName: asset.fileName || `audio_${Date.now()}.mp3`,
          });
          setShowMusicPicker(false);
        } else {
          Alert.alert(
            "Invalid File",
            "Please select an audio file (MP3, M4A, WAV, etc.)"
          );
        }
      }
    } catch (error) {
      console.error("Error picking music:", error);
      Alert.alert("Error", error.message || "Failed to pick music file");
    }
  };

  const removeMusic = () => {
    setSelectedMusic(null);
  };

  const selectTheme = (theme) => {
    setSelectedTheme(theme);
    setShowCustomTheme(false);
    setShowThemePicker(false);
  };

  const selectCustomTheme = () => {
    setShowCustomTheme(true);
    setShowThemePicker(false);
  };

  const selectColor = (color) => {
    setSelectedColor(color);
    setShowColorPicker(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!meditationTitle.trim()) {
      Alert.alert("Required", "Please enter a meditation title");
      return;
    }

    if (!selectedTheme && !customTheme.trim()) {
      Alert.alert("Required", "Please select or create a theme");
      return;
    }

    const validBoxes = scriptureBoxes.filter(
      (box) => box.verse.trim() && box.reference.trim()
    );
    if (validBoxes.length === 0) {
      Alert.alert("Required", "Please add at least one scripture with verse and reference");
      return;
    }

    // Cover image OR video is required (videos can be meditations too)
    if (!coverImage && !selectedVideo) {
      Alert.alert("Required", "Please select a cover image or upload a video");
      return;
    }

    setLoading(true);
    try {
      const currentUser = WorkingAuthService.getCurrentUser();
      if (!currentUser) {
        Alert.alert("Error", "Please sign in to create a meditation");
        return;
      }

      // Upload video if provided
      let uploadedVideo = selectedVideo;
      if (selectedVideo && selectedVideo.uri && !selectedVideo.uri.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          const FirebaseStorageService = (await import("../services/FirebaseStorageService")).default;
          const uploadResult = await FirebaseStorageService.uploadVideo(
            selectedVideo.uri,
            "meditations/videos"
          );
          uploadedVideo = {
            ...selectedVideo,
            uri: uploadResult.url,
            url: uploadResult.url,
          };
        } catch (uploadError) {
          console.warn("Error uploading meditation video:", uploadError.message);
          Alert.alert("Warning", "Video upload failed, but continuing with submission.");
        }
      }

      const meditation = {
        id: Date.now().toString(),
        title: meditationTitle,
        creatorName: creatorName.trim() || null, // Store creator name (null if empty)
        theme: customTheme.trim() || selectedTheme,
        scriptures: validBoxes.map((box) => ({
          verse: box.verse,
          reference: box.reference,
        })),
        coverImage: coverImage,
        images: selectedImages,
        video: uploadedVideo, // Add video support
        music: selectedMusic,
        backgroundColor: selectedColor?.color || null,
        author: currentUser.displayName || "Anonymous",
        authorId: currentUser.uid,
        authorPhoto: currentUser.photoURL || null,
        timestamp: new Date().toISOString(),
        likes: 0,
        uses: 0,
      };

      // Save to AsyncStorage (in production, this would go to Firestore)
      const existingMeditations = await AsyncStorage.getItem("user_meditations");
      const meditations = existingMeditations ? JSON.parse(existingMeditations) : [];
      meditations.push(meditation);
      await AsyncStorage.setItem("user_meditations", JSON.stringify(meditations));

      Alert.alert(
        "Success!",
        "Your meditation has been created! It will be available for thousands of users to use daily.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Error creating meditation:", error);
      Alert.alert("Error", "Failed to create meditation. Please try again.");
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a365d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Meditation</Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Creating..." : "Publish"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Inspirational Heading */}
          <View style={styles.headingSection}>
            <Ionicons name="heart" size={32} color="#1a365d" />
            <Text style={styles.headingTitle}>
              Create Meditations & Devotions
            </Text>
            <Text style={styles.headingText}>
              Share your spiritual insights and create meditations that thousands
              of users will use daily. Contribute to the blessing of others
              through your devotion.
            </Text>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Meditation Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Enter a meaningful title..."
              value={meditationTitle}
              onChangeText={setMeditationTitle}
              placeholderTextColor="#999"
            />
          </View>

          {/* Creator Name Input (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your Name (Optional)</Text>
            <Text style={styles.sectionHint}>
              This will appear as "Made by [your name]" on the meditation cover
            </Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Enter your name..."
              value={creatorName}
              onChangeText={setCreatorName}
              placeholderTextColor="#999"
            />
          </View>

          {/* Scripture Boxes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Scriptures & Devotions</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addScriptureBox}
              >
                <Ionicons name="add-circle" size={20} color="#1a365d" />
                <Text style={styles.addButtonText}>Add More</Text>
              </TouchableOpacity>
            </View>

            {scriptureBoxes.map((box, index) => (
              <View key={box.id} style={styles.scriptureBox}>
                <View style={styles.scriptureBoxHeader}>
                  <Text style={styles.scriptureBoxNumber}>
                    Scripture {index + 1}
                  </Text>
                  {scriptureBoxes.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeScriptureBox(box.id)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.verseInput}
                  placeholder="Enter scripture verse or devotion text..."
                  value={box.verse}
                  onChangeText={(text) =>
                    updateScriptureBox(box.id, "verse", text)
                  }
                  multiline
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.referenceInput}
                  placeholder="Reference (e.g., John 3:16)"
                  value={box.reference}
                  onChangeText={(text) =>
                    updateScriptureBox(box.id, "reference", text)
                  }
                  placeholderTextColor="#999"
                />
              </View>
            ))}
          </View>

          {/* Theme Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Theme</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowThemePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {selectedTheme || customTheme || "Select or create theme"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
            {showCustomTheme && (
              <TextInput
                style={styles.customInput}
                placeholder="Enter custom theme..."
                value={customTheme}
                onChangeText={setCustomTheme}
                placeholderTextColor="#999"
              />
            )}
          </View>

          {/* Video Upload (Optional - for video meditations) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Video (Optional)</Text>
            <Text style={styles.sectionHint}>
              Some meditations are just videos. You can upload any size video file.
            </Text>
            {selectedVideo ? (
              <View style={styles.videoPreviewContainer}>
                <View style={styles.videoPreview}>
                  <Ionicons name="videocam" size={32} color="#1a365d" />
                  <Text style={styles.videoPreviewText}>
                    {selectedVideo.fileName || "Video selected"}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeVideoButton}
                    onPress={() => setSelectedVideo(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addVideoButton}
                onPress={async () => {
                  try {
                    const result = await MediaService.pickVideo();
                    if (result.length > 0) {
                      setSelectedVideo(result[0]);
                    }
                  } catch (error) {
                    Alert.alert("Error", error.message || "Failed to pick video");
                  }
                }}
              >
                <Ionicons name="videocam" size={24} color="#1a365d" />
                <Text style={styles.addVideoButtonText}>Select Video</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cover Image */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Cover Image {!selectedVideo && "(Required)"}</Text>
            {coverImage ? (
              <View style={styles.imagePreviewContainer}>
                <ImageBackground
                  source={
                    coverImage.type === "asset"
                      ? coverImage.file
                      : { uri: coverImage.uri }
                  }
                  style={styles.coverImagePreview}
                  resizeMode="cover"
                >
                  {/* Show "Made by [name]" at bottom if name is provided */}
                  {creatorName.trim() && (
                    <View style={styles.madeByOverlay}>
                      <Text style={styles.madeByText}>
                        Made by {creatorName.trim()}
                      </Text>
                    </View>
                  )}
                </ImageBackground>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => {
                    setCoverImage(null);
                    if (selectedImages.length > 0) {
                      setCoverImage(selectedImages[0]);
                      setSelectedImages(selectedImages.slice(1));
                    }
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={() => setShowImagePicker(true)}
                disabled={!!selectedVideo} // Disable if video is selected
              >
                <Ionicons name="image" size={32} color={selectedVideo ? "#ccc" : "#1a365d"} />
                <Text style={[styles.addImageButtonText, selectedVideo && styles.disabledText]}>
                  {selectedVideo ? "Cover Image (Optional with Video)" : "Select Cover Image"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Additional Images */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Additional Images</Text>
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={() => setShowImagePicker(true)}
            >
              <Ionicons name="images" size={24} color="#1a365d" />
              <Text style={styles.addImageButtonText}>Add Images</Text>
            </TouchableOpacity>
            {selectedImages.length > 0 && (
              <View style={styles.imagesGrid}>
                {selectedImages.map((img, index) => (
                  <View key={index} style={styles.imageThumbnailContainer}>
                    <Image
                      source={
                        img.type === "asset" ? img.file : { uri: img.uri }
                      }
                      style={styles.imageThumbnail}
                    />
                    <TouchableOpacity
                      style={styles.removeThumbnailButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Music Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Background Music</Text>
            {selectedMusic ? (
              <View style={styles.musicSelectedContainer}>
                <Ionicons name="musical-notes" size={24} color="#1a365d" />
                <Text style={styles.musicSelectedText}>
                  {selectedMusic.type === "asset"
                    ? ASSET_MUSIC.find((m) => m.id === selectedMusic.id)?.name
                    : "Custom Music"}
                </Text>
                <TouchableOpacity onPress={removeMusic}>
                  <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={() => setShowMusicPicker(true)}
              >
                <Ionicons name="musical-notes" size={24} color="#1a365d" />
                <Text style={styles.addImageButtonText}>Select Music</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Background Color */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Background Color (Optional)</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowColorPicker(true)}
            >
              <View
                style={[
                  styles.colorPreview,
                  { backgroundColor: selectedColor?.color || "#1A0F2E" },
                ]}
              />
              <Text style={styles.pickerButtonText}>
                {selectedColor?.name || "Select color"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Image Picker Modal */}
        <Modal
          visible={showImagePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImagePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Image</Text>
                <TouchableOpacity onPress={() => setShowImagePicker(false)}>
                  <Ionicons name="close" size={24} color="#1a365d" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <Text style={styles.modalSectionTitle}>From Assets</Text>
                <View style={styles.assetsGrid}>
                  {ASSET_IMAGES.map((img) => (
                    <TouchableOpacity
                      key={img.id}
                      style={styles.assetItem}
                      onPress={() => pickImageFromAssets(img)}
                    >
                      <Image source={img.file} style={styles.assetThumbnail} />
                      <Text style={styles.assetName}>{img.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.modalSectionTitle}>From Phone</Text>
                <TouchableOpacity
                  style={styles.phoneOption}
                  onPress={pickImageFromPhone}
                >
                  <Ionicons name="images" size={24} color="#1a365d" />
                  <Text style={styles.phoneOptionText}>Choose from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.phoneOption}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={24} color="#1a365d" />
                  <Text style={styles.phoneOptionText}>Take Photo</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Music Picker Modal */}
        <Modal
          visible={showMusicPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMusicPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Music</Text>
                <TouchableOpacity onPress={() => setShowMusicPicker(false)}>
                  <Ionicons name="close" size={24} color="#1a365d" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <Text style={styles.modalSectionTitle}>From Assets</Text>
                {ASSET_MUSIC.map((music) => (
                  <TouchableOpacity
                    key={music.id}
                    style={styles.musicOption}
                    onPress={() => selectMusicFromAssets(music)}
                  >
                    <Ionicons name="musical-notes" size={24} color="#1a365d" />
                    <Text style={styles.musicOptionText}>{music.name}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.modalSectionTitle}>From Phone</Text>
                <TouchableOpacity
                  style={styles.phoneOption}
                  onPress={selectMusicFromPhone}
                >
                  <Ionicons name="musical-notes" size={24} color="#1a365d" />
                  <Text style={styles.phoneOptionText}>
                    Choose from Phone
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Theme Picker Modal */}
        <Modal
          visible={showThemePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowThemePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Theme</Text>
                <TouchableOpacity onPress={() => setShowThemePicker(false)}>
                  <Ionicons name="close" size={24} color="#1a365d" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {SUGGESTED_THEMES.map((theme) => (
                  <TouchableOpacity
                    key={theme}
                    style={styles.themeOption}
                    onPress={() => selectTheme(theme)}
                  >
                    <Text style={styles.themeOptionText}>{theme}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.customThemeOption}
                  onPress={selectCustomTheme}
                >
                  <Ionicons name="add-circle" size={24} color="#1a365d" />
                  <Text style={styles.customThemeOptionText}>
                    Create Custom Theme
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Color Picker Modal */}
        <Modal
          visible={showColorPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowColorPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Background Color</Text>
                <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                  <Ionicons name="close" size={24} color="#1a365d" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {COLOR_OPTIONS.map((color) => (
                  <TouchableOpacity
                    key={color.id}
                    style={styles.colorOption}
                    onPress={() => selectColor(color)}
                  >
                    <View
                      style={[
                        styles.colorOptionPreview,
                        { backgroundColor: color.color },
                      ]}
                    />
                    <Text style={styles.colorOptionText}>{color.name}</Text>
                    {selectedColor?.id === color.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#1a365d" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
    flex: 1,
    textAlign: "center",
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headingSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  headingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a365d",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  headingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 18,
    color: "#000",
    borderBottomWidth: 2,
    borderBottomColor: "#1a365d",
    paddingVertical: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: "#1a365d",
    marginLeft: 4,
    fontWeight: "600",
  },
  scriptureBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  scriptureBoxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  scriptureBoxNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  verseInput: {
    fontSize: 16,
    color: "#000",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  referenceInput: {
    fontSize: 14,
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 8,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    marginLeft: 12,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  customInput: {
    fontSize: 16,
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#1a365d",
    paddingVertical: 8,
    marginTop: 12,
  },
  addImageButton: {
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
  addImageButtonText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 8,
    fontWeight: "600",
  },
  addVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "#1a365d",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },
  addVideoButtonText: {
    fontSize: 14,
    color: "#1a365d",
    marginLeft: 8,
    fontWeight: "600",
  },
  videoPreviewContainer: {
    marginTop: 8,
  },
  videoPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  videoPreviewText: {
    flex: 1,
    fontSize: 14,
    color: "#1a365d",
    marginLeft: 12,
    fontWeight: "500",
  },
  removeVideoButton: {
    padding: 4,
  },
  disabledText: {
    opacity: 0.5,
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  coverImagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    justifyContent: "flex-end",
  },
  madeByOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  madeByText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  sectionHint: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  imageThumbnailContainer: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  imageThumbnail: {
    width: "100%",
    height: "100%",
  },
  removeThumbnailButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255,0,0,0.7)",
    borderRadius: 10,
    padding: 2,
  },
  musicSelectedContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  musicSelectedText: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    marginLeft: 12,
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
    maxHeight: "80%",
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a365d",
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  assetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  assetItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 12,
  },
  assetThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
  },
  assetName: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
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
  musicOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  musicOptionText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 12,
  },
  themeOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  themeOptionText: {
    fontSize: 16,
    color: "#1a365d",
  },
  customThemeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: "#1a365d",
    marginTop: 8,
  },
  customThemeOptionText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 12,
    fontWeight: "600",
  },
  colorOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  colorOptionPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  colorOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 12,
  },
});

export default CreateMeditationScreen;

