import React, { useState } from "react";
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
  Modal,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const CreateCommunityScreen = ({ navigation }) => {
  const [communityData, setCommunityData] = useState({
    name: "",
    description: "",
    category: "",
    privacy: "public",
    rules: "",
  });
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);

  // Community categories
  const categories = [
    { id: "bible-study", name: "Bible Study", icon: "book", color: "#1a365d" },
    { id: "prayer", name: "Prayer & Worship", icon: "heart", color: "#FF6B6B" },
    { id: "fellowship", name: "Fellowship", icon: "people", color: "#50C878" },
    { id: "ministry", name: "Ministry", icon: "hand-left", color: "#FF9800" },
    { id: "youth", name: "Youth", icon: "school", color: "#2196F3" },
    { id: "family", name: "Family", icon: "home", color: "#9C27B0" },
    {
      id: "music",
      name: "Music & Arts",
      icon: "musical-notes",
      color: "#E91E63",
    },
    { id: "outreach", name: "Outreach", icon: "globe", color: "#00BCD4" },
  ];

  // Privacy options
  const privacyOptions = [
    {
      id: "public",
      name: "Public",
      description: "Anyone can join and see posts",
      icon: "globe",
    },
    {
      id: "private",
      name: "Private",
      description: "Invite only, posts are private",
      icon: "lock-closed",
    },
    {
      id: "restricted",
      name: "Restricted",
      description: "Anyone can see, but approval to join",
      icon: "shield-checkmark",
    },
  ];

  const handleInputChange = (field, value) => {
    setCommunityData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Image picker functions
  const pickProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Removed cropping - use full image
        quality: 1,
      });

      if (!result.canceled) {
        setProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickBannerImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Removed cropping - use full image
        quality: 1,
      });

      if (!result.canceled) {
        setBannerImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const validateForm = () => {
    if (!communityData.name.trim()) {
      Alert.alert("Error", "Please enter a community name");
      return false;
    }
    if (communityData.name.length < 3) {
      Alert.alert("Error", "Community name must be at least 3 characters");
      return false;
    }
    if (!communityData.description.trim()) {
      Alert.alert("Error", "Please enter a community description");
      return false;
    }
    if (!communityData.category) {
      Alert.alert("Error", "Please select a category for your community");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const CommunityService = (await import("../services/CommunityService")).default;
      
      // Prepare community data
      const newCommunityData = {
        name: communityData.name.trim(),
        description: communityData.description.trim(),
        category: communityData.category,
        privacy: communityData.privacy,
        rules: communityData.rules.trim(),
        bannerImage: bannerImage || null, // bannerImage is already a URI string
        profilePicture: profilePicture || null, // profilePicture is already a URI string
      };

      // Create community in Firebase
      const result = await CommunityService.createCommunity(newCommunityData);

      if (result.success) {
        Alert.alert(
          "Success",
          "Your community has been created! Welcome to your new faith community! 🙏",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("Error", "Failed to create community. Please try again.");
      }
    } catch (error) {
      console.error("Error creating community:", error);
      Alert.alert("Error", error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => {
        handleInputChange("category", item.id);
        setShowCategoryModal(false);
      }}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={20} color="#fff" />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderPrivacyItem = ({ item }) => (
    <TouchableOpacity
      style={styles.privacyItem}
      onPress={() => {
        handleInputChange("privacy", item.id);
        setShowPrivacyModal(false);
      }}
    >
      <View style={styles.privacyIcon}>
        <Ionicons name={item.icon} size={20} color="#1a365d" />
      </View>
      <View style={styles.privacyContent}>
        <Text style={styles.privacyName}>{item.name}</Text>
        <Text style={styles.privacyDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const selectedCategoryData = categories.find(
    (c) => c.id === communityData.category
  );
  const selectedPrivacyData = privacyOptions.find(
    (p) => p.id === communityData.privacy
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
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
              {loading ? "Creating..." : "Create"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Community Name */}
          <View style={styles.nameContainer}>
            <TextInput
              style={styles.nameInputNew}
              placeholder="Enter community name"
              value={communityData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              placeholderTextColor="#999"
              maxLength={50}
            />
            <View style={styles.nameUnderline} />
            <Text style={styles.characterCount}>
              {communityData.name.length}/50
            </Text>
          </View>

          {/* Category Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <View
                style={[
                  styles.selectorIcon,
                  { backgroundColor: selectedCategoryData?.color || "#1a365d" },
                ]}
              >
                <Ionicons
                  name={selectedCategoryData?.icon || "folder"}
                  size={20}
                  color="#fff"
                />
              </View>
              <Text style={styles.selectorText}>
                {selectedCategoryData?.name || "Select category"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <TextInput
              style={styles.descriptionInputNew}
              placeholder="Describe your community's purpose and what members can expect..."
              value={communityData.description}
              onChangeText={(value) => handleInputChange("description", value)}
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {communityData.description.length}/500
            </Text>
          </View>

          {/* Profile Picture & Banner */}
          <View style={styles.mediaSection}>
            <Text style={styles.mediaSectionTitle}>Community Images</Text>

            {/* Profile Picture */}
            <View style={styles.mediaItem}>
              <Text style={styles.mediaLabel}>Profile Picture</Text>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={pickProfilePicture}
              >
                {profilePicture ? (
                  <Image
                    source={{ uri: profilePicture }}
                    style={styles.mediaPreview}
                  />
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <Ionicons name="camera" size={24} color="#1a365d" />
                    <Text style={styles.mediaPlaceholderText}>
                      Add Profile Picture
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Banner Image */}
            <View style={styles.mediaItem}>
              <Text style={styles.mediaLabel}>Banner Image</Text>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={pickBannerImage}
              >
                {bannerImage ? (
                  <Image
                    source={{ uri: bannerImage }}
                    style={styles.bannerPreview}
                  />
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <Ionicons name="image" size={24} color="#1a365d" />
                    <Text style={styles.mediaPlaceholderText}>
                      Add Banner Image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Privacy Settings */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Privacy Settings</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowPrivacyModal(true)}
            >
              <View style={styles.selectorIcon}>
                <Ionicons
                  name={selectedPrivacyData?.icon || "globe"}
                  size={20}
                  color="#1a365d"
                />
              </View>
              <Text style={styles.selectorText}>
                {selectedPrivacyData?.name || "Select privacy"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Community Rules */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Community Rules (Optional)</Text>
            <TextInput
              style={styles.rulesInput}
              placeholder="Set guidelines for your community members..."
              value={communityData.rules}
              onChangeText={(value) => handleInputChange("rules", value)}
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={styles.characterCount}>
              {communityData.rules.length}/300
            </Text>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#1a365d" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Community Guidelines</Text>
              <Text style={styles.infoText}>
                • Keep discussions respectful and Christ-centered
              </Text>
              <Text style={styles.infoText}>
                • No spam, harassment, or inappropriate content
              </Text>
              <Text style={styles.infoText}>
                • Encourage and support fellow believers
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
            />

            {/* Custom Category Input */}
            <View style={styles.customCategoryContainer}>
              <TouchableOpacity
                style={styles.customCategoryButton}
                onPress={() =>
                  setShowCustomCategoryInput(!showCustomCategoryInput)
                }
              >
                <Ionicons name="add-circle-outline" size={20} color="#1a365d" />
                <Text style={styles.customCategoryButtonText}>
                  Create Custom Category
                </Text>
              </TouchableOpacity>

              {showCustomCategoryInput && (
                <View style={styles.customCategoryInputContainer}>
                  <TextInput
                    style={styles.customCategoryInput}
                    placeholder="Enter custom category..."
                    value={customCategory}
                    onChangeText={setCustomCategory}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    style={styles.customCategorySubmitButton}
                    onPress={() => {
                      if (customCategory.trim()) {
                        const customCat = {
                          id: `custom_${Date.now()}`,
                          name: customCategory.trim(),
                          icon: "folder",
                          color: "#1a365d",
                        };
                        setCommunityData((prev) => ({
                          ...prev,
                          category: customCat.name,
                        }));
                        setShowCategoryModal(false);
                        setCustomCategory("");
                        setShowCustomCategoryInput(false);
                      }
                    }}
                  >
                    <Text style={styles.customCategorySubmitText}>Use</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Privacy Selection Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Settings</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={privacyOptions}
              renderItem={renderPrivacyItem}
              keyExtractor={(item) => item.id}
            />
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
  minimalHeader: {
    backgroundColor: "#fff",
    padding: 12,
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
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
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
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
  nameInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
  },
  descriptionInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    minHeight: 100,
  },
  rulesInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    minHeight: 80,
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
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
  infoCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 4,
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
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  privacyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  privacyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 14,
    color: "#666",
  },
  // New Community Name Styles
  nameContainer: {
    marginBottom: 20,
  },
  nameInputNew: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  nameUnderline: {
    height: 2,
    backgroundColor: "#1a365d",
    marginTop: 4,
  },
  // New Description Styles
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionInputNew: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    minHeight: 100,
    borderWidth: 0,
  },
  // Custom Category Styles
  customCategoryContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  customCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  customCategoryButtonText: {
    fontSize: 16,
    color: "#1a365d",
    fontWeight: "500",
    marginLeft: 8,
  },
  customCategoryInputContainer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  customCategoryInput: {
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
  customCategorySubmitButton: {
    backgroundColor: "#1a365d",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  customCategorySubmitText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Media Section Styles
  mediaSection: {
    marginBottom: 20,
  },
  mediaSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  mediaItem: {
    marginBottom: 16,
  },
  mediaLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  mediaButton: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  mediaPreview: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  bannerPreview: {
    width: "100%",
    height: 80,
    resizeMode: "cover",
  },
  mediaPlaceholder: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  mediaPlaceholderText: {
    fontSize: 14,
    color: "#1a365d",
    marginTop: 8,
    fontWeight: "500",
  },
});

export default CreateCommunityScreen;
