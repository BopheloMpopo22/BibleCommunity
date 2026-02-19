import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ImageBackground,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import { useFocusEffect } from "@react-navigation/native";
import { auth } from "../config/firebase";

const { width, height } = Dimensions.get("window");

const ScriptureSlideshowScreen = ({ navigation, route }) => {
  const { category } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState("slideshow"); // "slideshow" or "list"
  const [showAddScriptureModal, setShowAddScriptureModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newScriptureVerse, setNewScriptureVerse] = useState("");
  const [newScriptureReference, setNewScriptureReference] = useState("");
  const [isAuthor, setIsAuthor] = useState(false);
  const videoRef = useRef(null);

  // Check if current user is the author
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && category?.authorId) {
      setIsAuthor(currentUser.uid === category.authorId);
    }
  }, [category]);

  const scriptures = category?.scriptures || [];

  // Get wallpaper source
  const getWallpaperSource = () => {
    if (!category) return null;
    
    if (category.image) {
      // Asset image
      return category.image;
    }
    
    if (category.coverImage) {
      if (category.coverImage.type === "asset" && category.coverImage.file) {
        return category.coverImage.file;
      }
      if (category.coverImage.type === "phone" && category.coverImage.uri) {
        return { uri: category.coverImage.uri };
      }
    }
    
    return null;
  };

  const wallpaperSource = getWallpaperSource();
  const currentScripture = scriptures[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < scriptures.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleAddScripture = async () => {
    if (!newScriptureVerse.trim() || !newScriptureReference.trim()) {
      Alert.alert("Required", "Please enter both verse and reference");
      return;
    }

    try {
      // Save new scripture to Firebase
      const MeditationFirebaseService = (await import("../services/MeditationFirebaseService")).default;
      const { doc, updateDoc, arrayUnion } = await import("firebase/firestore");
      const { db } = await import("../config/firebase");
      
      if (category?.id) {
        const meditationRef = doc(db, "meditations", category.id);
        await updateDoc(meditationRef, {
          scriptures: arrayUnion({
            verse: newScriptureVerse.trim(),
            reference: newScriptureReference.trim(),
          }),
        });
        
        Alert.alert("Success", "Scripture added successfully!");
        setShowAddScriptureModal(false);
        setNewScriptureVerse("");
        setNewScriptureReference("");
        
        // Reload the category to show the new scripture
        // Note: In a real app, you'd reload from Firebase here
        navigation.goBack();
        navigation.navigate("ScriptureSlideshow", { category });
      } else {
        Alert.alert("Error", "Unable to add scripture. Please try again.");
      }
    } catch (error) {
      console.error("Error adding scripture:", error);
      Alert.alert("Error", "Failed to add scripture. Please try again.");
    }
  };

  const handleDeleteSlideshow = async () => {
    Alert.alert(
      "Delete Slideshow",
      "Are you sure you want to delete this slideshow? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel", onPress: () => setShowDeleteModal(false) },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { doc, deleteDoc } = await import("firebase/firestore");
              const { db } = await import("../config/firebase");
              
              if (category?.id) {
                await deleteDoc(doc(db, "meditations", category.id));
                Alert.alert("Success", "Slideshow deleted successfully!");
                navigation.goBack();
              } else {
                Alert.alert("Error", "Unable to delete slideshow. Please try again.");
              }
            } catch (error) {
              console.error("Error deleting slideshow:", error);
              Alert.alert("Error", "Failed to delete slideshow. Please try again.");
            }
            setShowDeleteModal(false);
          },
        },
      ]
    );
  };

  const renderSlideshowView = () => {
    if (!currentScripture) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No scriptures available</Text>
        </View>
      );
    }

    return (
      <View style={styles.slideshowContainer}>
        {/* Video background if available */}
        {category?.video && (
          <Video
            ref={videoRef}
            source={{
              uri: category.video.uri || category.video.url,
            }}
            style={styles.videoBackground}
            resizeMode="cover"
            shouldPlay={true}
            isLooping={true}
            muted={false}
            volume={0.3}
          />
        )}

        {/* Wallpaper background if no video */}
        {!category?.video && wallpaperSource && (
          <ImageBackground
            source={wallpaperSource}
            style={styles.wallpaperBackground}
            resizeMode="cover"
          >
            <View style={styles.wallpaperOverlay} />
          </ImageBackground>
        )}

        {/* Navigation arrows */}
        <TouchableOpacity
          style={[styles.navArrow, styles.leftArrow, currentIndex === 0 && styles.navArrowDisabled]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentIndex === 0 ? "#999" : "#fff"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navArrow,
            styles.rightArrow,
            currentIndex === scriptures.length - 1 && styles.navArrowDisabled,
          ]}
          onPress={handleNext}
          disabled={currentIndex === scriptures.length - 1}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={currentIndex === scriptures.length - 1 ? "#999" : "#fff"}
          />
        </TouchableOpacity>

        {/* Scripture card - now scrollable */}
        <ScrollView 
          style={styles.scriptureCardScroll}
          contentContainerStyle={styles.scriptureCardContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scriptureCard}>
            <Text style={styles.scriptureReference}>{currentScripture.reference}</Text>
            <Text style={styles.scriptureVerse}>"{currentScripture.verse}"</Text>
            <View style={styles.slideIndicator}>
              <Text style={styles.slideIndicatorText}>
                {currentIndex + 1} / {scriptures.length}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderListView = () => {
    return (
      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Scriptures about {category?.title || "Topic"}</Text>
          <Text style={styles.listSubtitle}>{scriptures.length} scriptures</Text>
        </View>

        {scriptures.map((scripture, index) => (
          <View key={index} style={styles.listScriptureCard}>
            <Text style={styles.listScriptureReference}>{scripture.reference}</Text>
            <Text style={styles.listScriptureVerse}>"{scripture.verse}"</Text>
          </View>
        ))}

        {/* Add more scriptures button */}
        <TouchableOpacity
          style={styles.addScriptureButton}
          onPress={() => setShowAddScriptureModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="#1a365d" />
          <Text style={styles.addScriptureButtonText}>Add More Scriptures</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          {isAuthor && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowDeleteModal(true)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Scriptures about {category?.title || "Topic"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewToggleButton}
          onPress={() => setShowViewModal(true)}
        >
          <Ionicons name="options-outline" size={20} color="#fff" />
          <Text style={styles.viewToggleButtonText}>View</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {viewMode === "slideshow" ? renderSlideshowView() : renderListView()}

      {/* View Mode Modal */}
      <Modal
        visible={showViewModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowViewModal(false)}
      >
        <TouchableOpacity
          style={styles.viewModalOverlay}
          activeOpacity={1}
          onPress={() => setShowViewModal(false)}
        >
          <View style={styles.viewModalContent}>
            <TouchableOpacity
              style={styles.viewOption}
              onPress={() => {
                setViewMode("slideshow");
                setShowViewModal(false);
              }}
            >
              <Ionicons name="images" size={24} color="#1a365d" />
              <Text style={styles.viewOptionText}>Slideshow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewOption, { borderBottomWidth: 0 }]}
              onPress={() => {
                setViewMode("list");
                setShowViewModal(false);
              }}
            >
              <Ionicons name="list" size={24} color="#1a365d" />
              <Text style={styles.viewOptionText}>List</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Scripture Modal */}
      <Modal
        visible={showAddScriptureModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddScriptureModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Scripture</Text>
              <TouchableOpacity onPress={() => setShowAddScriptureModal(false)}>
                <Ionicons name="close" size={24} color="#1a365d" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Scripture Reference</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., John 3:16"
                value={newScriptureReference}
                onChangeText={setNewScriptureReference}
                placeholderTextColor="#999"
              />
              <Text style={styles.modalLabel}>Scripture Verse</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Enter the scripture text..."
                value={newScriptureVerse}
                onChangeText={setNewScriptureVerse}
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleAddScripture}
              >
                <Text style={styles.modalSubmitButtonText}>Submit</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableOpacity
          style={styles.viewModalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteModal(false)}
        >
          <View style={styles.deleteModalContent}>
            <TouchableOpacity
              style={styles.deleteOption}
              onPress={handleDeleteSlideshow}
            >
              <Ionicons name="trash-outline" size={24} color="#ff4444" />
              <Text style={styles.deleteOptionText}>Delete Slideshow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteOption, { borderBottomWidth: 0 }]}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
    marginLeft: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  viewToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  viewToggleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  viewModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  viewOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  viewOptionText: {
    fontSize: 18,
    color: "#1a365d",
    marginLeft: 12,
    fontWeight: "500",
  },
  slideshowContainer: {
    flex: 1,
    position: "relative",
  },
  videoBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  wallpaperBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  wallpaperOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  navArrow: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -15 }],
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  leftArrow: {
    left: 20,
  },
  rightArrow: {
    right: 20,
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  scriptureCardScroll: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    maxHeight: height * 0.5,
  },
  scriptureCardContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  scriptureCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scriptureReference: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a365d",
    marginBottom: 12,
    textAlign: "center",
  },
  scriptureVerse: {
    fontSize: 20,
    color: "#333",
    lineHeight: 32,
    textAlign: "center",
    fontStyle: "italic",
  },
  slideIndicator: {
    marginTop: 16,
    alignItems: "center",
  },
  slideIndicatorText: {
    fontSize: 14,
    color: "#666",
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 60,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: 24,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  listScriptureCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FF8C42", // Dark orange border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listScriptureReference: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
    marginBottom: 8,
  },
  listScriptureVerse: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  addScriptureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#1a365d",
    borderStyle: "dashed",
  },
  addScriptureButtonText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 8,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
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
    maxHeight: height * 0.7,
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
    fontSize: 20,
    fontWeight: "600",
    color: "#1a365d",
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalSubmitButton: {
    backgroundColor: "#1a365d",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  modalSubmitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  deleteOptionText: {
    fontSize: 18,
    color: "#ff4444",
    marginLeft: 12,
    fontWeight: "500",
  },
  cancelOptionText: {
    fontSize: 18,
    color: "#1a365d",
    fontWeight: "500",
    textAlign: "center",
  },
});

export default ScriptureSlideshowScreen;

