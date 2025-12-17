import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import MediaService from "../services/MediaService";
import MediaPreview from "../components/MediaPreview";
import PostService from "../services/PostService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CreatePostScreen = ({ navigation, route }) => {
  const { selectedCommunity } = route.params || {};

  const [postData, setPostData] = useState({
    title: "",
    content: "",
    type: "discussion",
    community: selectedCommunity?.name || "",
    communityId: selectedCommunity?.id || "",
    images: [],
    videos: [],
  });
  const [loading, setLoading] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [communitySearchQuery, setCommunitySearchQuery] = useState("");
  const [recentCommunities, setRecentCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [customPostType, setCustomPostType] = useState("");
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);

  // Load smart communities on mount
  useEffect(() => {
    loadSmartCommunities();
  }, []);

  // Load recent and joined communities
  const loadSmartCommunities = async () => {
    try {
      // Load recent communities from AsyncStorage
      const recent = await AsyncStorage.getItem("recentCommunities");
      if (recent) {
        setRecentCommunities(JSON.parse(recent));
      }

      // Load joined communities (simulated for now)
      const joined = [
        {
          id: "1",
          name: "Bible Study Group",
          icon: "book",
          color: "#1a365d",
          isJoined: true,
        },
        {
          id: "2",
          name: "Prayer Warriors",
          icon: "heart",
          color: "#FF6B6B",
          isJoined: true,
        },
        {
          id: "3",
          name: "Christian Living",
          icon: "people",
          color: "#50C878",
          isJoined: true,
        },
      ];
      setJoinedCommunities(joined);
    } catch (error) {
      console.error("Error loading smart communities:", error);
    }
  };

  // Save community to recent when selected
  const saveToRecent = async (community) => {
    try {
      const recent = await AsyncStorage.getItem("recentCommunities");
      let recentList = recent ? JSON.parse(recent) : [];

      // Remove if already exists
      recentList = recentList.filter((c) => c.id !== community.id);

      // Add to beginning
      recentList.unshift(community);

      // Keep only last 5
      recentList = recentList.slice(0, 5);

      await AsyncStorage.setItem(
        "recentCommunities",
        JSON.stringify(recentList)
      );
      setRecentCommunities(recentList);
    } catch (error) {
      console.error("Error saving to recent:", error);
    }
  };

  // Sample communities
  const communities = [
    { id: "1", name: "Bible Study Group", icon: "book", color: "#1a365d" },
    { id: "2", name: "Prayer Warriors", icon: "heart", color: "#FF6B6B" },
    { id: "3", name: "Christian Living", icon: "people", color: "#50C878" },
    { id: "4", name: "Testimonies", icon: "star", color: "#FFD700" },
    {
      id: "5",
      name: "Worship & Music",
      icon: "musical-notes",
      color: "#9C27B0",
    },
  ];

  // Post types
  const postTypes = [
    {
      id: "discussion",
      name: "Discussion",
      icon: "chatbubbles",
      color: "#1a365d",
    },
    { id: "prayer", name: "Prayer Request", icon: "heart", color: "#FF6B6B" },
    { id: "testimony", name: "Testimony", icon: "star", color: "#FFD700" },
    { id: "question", name: "Question", icon: "help-circle", color: "#2196F3" },
    {
      id: "encouragement",
      name: "Encouragement",
      icon: "sunny",
      color: "#FF9800",
    },
  ];

  // Testimony categories
  const testimonyCategories = [
    { id: "healing", name: "Healing", icon: "medical" },
    { id: "salvation", name: "Salvation", icon: "heart" },
    { id: "provision", name: "Provision", icon: "gift" },
    { id: "deliverance", name: "Deliverance", icon: "shield" },
    { id: "miracles", name: "Miracles", icon: "star" },
    { id: "guidance", name: "Guidance", icon: "compass" },
    { id: "protection", name: "Protection", icon: "umbrella" },
    { id: "restoration", name: "Restoration", icon: "refresh" },
  ];

  const handleInputChange = (field, value) => {
    setPostData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    try {
      const images = await MediaService.pickImage();
      if (images.length > 0) {
        setPostData((prev) => ({
          ...prev,
          images: [...prev.images, ...images],
        }));
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick images");
    }
  };

  const takePhoto = async () => {
    try {
      const photos = await MediaService.takePhoto();
      if (photos.length > 0) {
        setPostData((prev) => ({
          ...prev,
          images: [...prev.images, ...photos],
        }));
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to take photo");
    }
  };

  const pickVideo = async () => {
    try {
      const videos = await MediaService.pickVideo();
      if (videos.length > 0) {
        // Navigate to video preview screen for the first video
        navigation.navigate("VideoPreview", {
          videoUri: videos[0].uri,
          onVideoConfirmed: (videoData) => {
            setPostData((prev) => ({
              ...prev,
              videos: [...prev.videos, videoData],
            }));
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to pick video");
    }
  };

  const recordVideo = async () => {
    try {
      const videos = await MediaService.recordVideo();
      if (videos.length > 0) {
        // Navigate to video preview screen for the recorded video
        navigation.navigate("VideoPreview", {
          videoUri: videos[0].uri,
          onVideoConfirmed: (videoData) => {
            setPostData((prev) => ({
              ...prev,
              videos: [...prev.videos, videoData],
            }));
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to record video");
    }
  };

  const removeImage = (imageId) => {
    setPostData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== imageId),
    }));
  };

  const removeVideo = (videoId) => {
    setPostData((prev) => ({
      ...prev,
      videos: prev.videos.filter((video) => video.id !== videoId),
    }));
  };

  const validateForm = () => {
    if (!postData.title.trim()) {
      Alert.alert("Error", "Please enter a title for your post");
      return false;
    }
    if (!postData.content.trim()) {
      Alert.alert("Error", "Please enter some content for your post");
      return false;
    }
    if (!postData.community) {
      Alert.alert("Error", "Please select a community to post in");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Check membership before allowing post (for new communities)
      if (postData.communityId && !["1", "2", "3", "4", "5"].includes(postData.communityId)) {
        const CommunityService = (await import("../services/CommunityService")).default;
        const isMember = await CommunityService.isMember(postData.communityId);
        
        if (!isMember) {
          Alert.alert(
            "Join Required",
            "You must join this community to post. Would you like to join now?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Join",
                onPress: async () => {
                  try {
                    await CommunityService.joinCommunity(postData.communityId);
                    Alert.alert("Welcome!", "You've joined the community! Now you can post.");
                    // Retry posting after joining
                    const postDataWithCommunity = {
                      ...postData,
                      communityId: postData.communityId,
                    };
                    const result = await PostService.createPost(postDataWithCommunity);
                    if (result.success) {
                      Alert.alert(
                        "Success",
                        "Your post has been shared with the community! 🙏",
                        [{ text: "OK", onPress: () => navigation.goBack() }]
                      );
                    }
                  } catch (joinError) {
                    Alert.alert("Error", "Failed to join community. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                },
              },
            ]
          );
          return;
        }
      }

      const postDataWithCommunity = {
        ...postData,
        communityId: postData.communityId || "1",
      };

      // Create the post using PostService
      const result = await PostService.createPost(postDataWithCommunity);

      if (result.success) {
        Alert.alert(
          "Success",
          "Your post has been shared with the community! 🙏",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCommunityItem = ({ item }) => (
    <TouchableOpacity
      style={styles.communityItem}
      onPress={() => {
        handleInputChange("community", item.name);
        handleInputChange("communityId", item.id);
        saveToRecent(item);
        setShowCommunityModal(false);
      }}
    >
      <View style={[styles.communityIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={20} color="#fff" />
      </View>
      <Text style={styles.communityName}>{item.name}</Text>
      {item.isJoined && (
        <View style={styles.joinedBadge}>
          <Ionicons name="checkmark" size={12} color="#4CAF50" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderTypeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.typeItem}
      onPress={() => {
        handleInputChange("type", item.id);
        setShowTypeModal(false);
      }}
    >
      <View style={[styles.typeIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={20} color="#fff" />
      </View>
      <Text style={styles.typeName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const selectedCommunityData = communities.find(
    (c) => c.name === postData.community
  );
  const selectedTypeData = postTypes.find((t) => t.id === postData.type);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollContainer}>
        {/* Minimal Header */}
        <View style={styles.minimalHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a365d" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Posting..." : "Post"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Post Type Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Post Type</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowTypeModal(true)}
            >
              <View
                style={[
                  styles.selectorIcon,
                  { backgroundColor: selectedTypeData?.color || "#1a365d" },
                ]}
              >
                <Ionicons
                  name={selectedTypeData?.icon || "chatbubbles"}
                  size={20}
                  color="#fff"
                />
              </View>
              <Text style={styles.selectorText}>
                {selectedTypeData?.name || "Select post type"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Community Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Community</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowCommunityModal(true)}
            >
              <View
                style={[
                  styles.selectorIcon,
                  {
                    backgroundColor: selectedCommunityData?.color || "#1a365d",
                  },
                ]}
              >
                <Ionicons
                  name={selectedCommunityData?.icon || "people"}
                  size={20}
                  color="#fff"
                />
              </View>
              <Text style={styles.selectorText}>
                {postData.community || "Select community"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <TextInput
              style={styles.titleInputNew}
              placeholder="Title - What's on your heart?"
              value={postData.title}
              onChangeText={(value) => handleInputChange("title", value)}
              placeholderTextColor="#999"
              maxLength={100}
            />
            <View style={styles.titleUnderline} />
            <Text style={styles.characterCount}>
              {postData.title.length}/100
            </Text>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <TextInput
              style={styles.contentInputNew}
              placeholder="Share your thoughts"
              value={postData.content}
              onChangeText={(value) => handleInputChange("content", value)}
              placeholderTextColor="#999"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          {/* Media Upload */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Add Media (Optional)</Text>
            <View style={styles.mediaButtonsContainer}>
              <View style={styles.mediaButtonsRow}>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={pickImage}
                >
                  <Ionicons name="image" size={20} color="#1a365d" />
                  <Text style={styles.mediaButtonText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={20} color="#1a365d" />
                  <Text style={styles.mediaButtonText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={pickVideo}
                >
                  <Ionicons name="videocam" size={20} color="#1a365d" />
                  <Text style={styles.mediaButtonText}>Video</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.mediaButtonsRow}>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={recordVideo}
                >
                  <Ionicons name="videocam-outline" size={20} color="#1a365d" />
                  <Text style={styles.mediaButtonText}>Record</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Media Preview */}
          {postData.images.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={styles.mediaPreviewTitle}>
                Images ({postData.images.length})
              </Text>
              {postData.images.map((image) => (
                <MediaPreview
                  key={image.id}
                  media={image}
                  onRemove={removeImage}
                />
              ))}
            </View>
          )}

          {postData.videos.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={styles.mediaPreviewTitle}>
                Videos ({postData.videos.length})
              </Text>
              {postData.videos.map((video) => (
                <MediaPreview
                  key={video.id}
                  media={video}
                  onRemove={removeVideo}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      {/* Using native editors only; no extra modals */}

      {/* Community Selection Modal */}
      <Modal
        visible={showCommunityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommunityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Community</Text>
              <TouchableOpacity onPress={() => setShowCommunityModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search communities..."
                value={communitySearchQuery}
                onChangeText={setCommunitySearchQuery}
                placeholderTextColor="#999"
              />
            </View>

            <ScrollView style={styles.communitySections}>
              {/* Recent Communities */}
              {recentCommunities.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Recent</Text>
                  {recentCommunities.map((item) => (
                    <View key={`recent-${item.id}`}>
                      {renderCommunityItem({ item })}
                    </View>
                  ))}
                </View>
              )}

              {/* Joined Communities */}
              {joinedCommunities.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Your Communities</Text>
                  {joinedCommunities.map((item) => (
                    <View key={`joined-${item.id}`}>
                      {renderCommunityItem({ item })}
                    </View>
                  ))}
                </View>
              )}

              {/* All Communities (filtered by search) */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>All Communities</Text>
                <FlatList
                  data={communities.filter((community) =>
                    community.name
                      .toLowerCase()
                      .includes(communitySearchQuery.toLowerCase())
                  )}
                  renderItem={renderCommunityItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Post Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Post Type</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={postTypes}
              renderItem={renderTypeItem}
              keyExtractor={(item) => item.id}
            />

            {/* Custom Post Type Input */}
            <View style={styles.customTypeContainer}>
              <TouchableOpacity
                style={styles.customTypeButton}
                onPress={() => setShowCustomTypeInput(!showCustomTypeInput)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#1a365d" />
                <Text style={styles.customTypeButtonText}>
                  Create Custom Type
                </Text>
              </TouchableOpacity>

              {showCustomTypeInput && (
                <View style={styles.customTypeInputContainer}>
                  <TextInput
                    style={styles.customTypeInput}
                    placeholder="Enter custom post type..."
                    value={customPostType}
                    onChangeText={setCustomPostType}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    style={styles.customTypeSubmitButton}
                    onPress={() => {
                      if (customPostType.trim()) {
                        const customType = {
                          id: `custom_${Date.now()}`,
                          name: customPostType.trim(),
                          icon: "create",
                          color: "#1a365d",
                        };
                        setPostData((prev) => ({
                          ...prev,
                          type: customType.name,
                        }));
                        setShowTypeModal(false);
                        setCustomPostType("");
                        setShowCustomTypeInput(false);
                      }
                    }}
                  >
                    <Text style={styles.customTypeSubmitText}>Use</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  submitButton: {
    backgroundColor: "#1a365d",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
    fontSize: 16,
    fontWeight: "600",
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  selectorButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  selectorIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  titleInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  contentInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    minHeight: 120,
  },
  mediaButtonsContainer: {
    marginTop: 8,
  },
  mediaButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  mediaButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaButtonText: {
    fontSize: 14,
    color: "#1a365d",
    fontWeight: "600",
    marginLeft: 6,
  },
  mediaPreviewContainer: {
    marginTop: 16,
  },
  mediaPreviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  imagePreview: {
    position: "relative",
    marginRight: 10,
    marginBottom: 10,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  communityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  communityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  communityName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  typeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  typeName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  communitySections: {
    maxHeight: 400,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginHorizontal: 16,
    paddingTop: 8,
  },
  // Custom Post Type Styles
  customTypeContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  customTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  customTypeButtonText: {
    fontSize: 16,
    color: "#1a365d",
    fontWeight: "500",
    marginLeft: 8,
  },
  customTypeInputContainer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  customTypeInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
  },
  customTypeSubmitButton: {
    backgroundColor: "#1a365d",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  customTypeSubmitText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // New Title and Content Styles
  titleContainer: {
    marginBottom: 20,
  },
  titleInputNew: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  titleUnderline: {
    height: 2,
    backgroundColor: "#1a365d",
    marginTop: 4,
  },
  contentContainer: {
    marginBottom: 20,
  },
  contentInputNew: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    minHeight: 120,
    borderWidth: 0,
  },
  joinedBadge: {
    marginLeft: 8,
    padding: 2,
    backgroundColor: "#E8F5E8",
    borderRadius: 10,
  },
});

export default CreatePostScreen;
