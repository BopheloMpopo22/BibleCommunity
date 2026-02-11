import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ImageBackground,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WorkingAuthService from "../services/WorkingAuthService";

// Asset wallpaper mapping
const ASSET_WALLPAPER_MAP = {
  "morning-bg": require("../assets/background-morning-picture.jpg"),
  "afternoon-bg": require("../assets/background-afternoon-picture.jpg"),
  "night-bg": require("../assets/background-night-picture.jpg"),
  "field-1920": require("../assets/field-3629120_1920.jpg"),
  "sea-1920": require("../assets/sea-4242303_1920.jpg"),
  "joy": require("../assets/Joy Photo.jpg"),
  "hope": require("../assets/Hope Photo.jpg"),
  "faith": require("../assets/Faith photo.jpg"),
  "peace": require("../assets/Peace photo.jpg"),
  "meditation-bg": require("../assets/Background of meditaton screen..jpg"),
  "tree": require("../assets/photorealistic-view-tree-nature-with-branches-trunk.jpg"),
  "bible": require("../assets/open-bible-black-background.jpg"),
};

const PartnerWordsScreen = ({ navigation }) => {
  const [words, setWords] = useState([]);
  const [filter, setFilter] = useState("all"); // "all", "scheduled", "unscheduled"
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadWords();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const AdminService = (await import("../services/AdminService")).default;
      const adminStatus = await AdminService.isAdmin();
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const loadWords = async () => {
    try {
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser) {
        Alert.alert("Error", "Please sign in to view your words");
        navigation.goBack();
        return;
      }

      // Load from Firebase (and merge with local)
      const PartnerFirebaseService = (await import("../services/PartnerFirebaseService")).default;
      const allWords = await PartnerFirebaseService.getAllPartnerWords();
      
      // Check if user is admin
      const AdminService = (await import("../services/AdminService")).default;
      const isAdmin = await AdminService.isAdmin();
      
      // Filter words: admin sees all, regular partners see only their own
      const userWords = isAdmin 
        ? allWords  // Admin sees all words
        : allWords.filter((word) => word.authorId === currentUser.uid);  // Partners see only their own
      
      // Sort by creation date (newest first)
      userWords.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setWords(userWords);
    } catch (error) {
      console.error("Error loading words:", error);
    }
  };

  // Normalize date to ISO format (YYYY-MM-DD)
  const normalizeDate = (dateString) => {
    if (!dateString) return null;
    const trimmed = dateString.trim();
    // If already in ISO format (YYYY-MM-DD), return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    // Try to parse and convert to ISO format
    try {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
    } catch (e) {
      console.warn("Error parsing date:", trimmed);
    }
    // If parsing fails, try to extract YYYY-MM-DD from the string
    const isoMatch = trimmed.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) {
      return isoMatch[1];
    }
    return trimmed; // Fallback to original if can't parse
  };

  const handleScheduleWord = async () => {
    if (!selectedDate.trim()) {
      Alert.alert("Required", "Please enter a date");
      return;
    }

    // Check if user is admin - only admin can schedule
    const AdminService = (await import("../services/AdminService")).default;
    const isAdmin = await AdminService.isAdmin();
    if (!isAdmin) {
      Alert.alert(
        "Access Denied",
        "Only administrators can schedule content. Please contact support if you need scheduling access."
      );
      return;
    }

    // Normalize date to ISO format (YYYY-MM-DD)
    const normalizedDate = normalizeDate(selectedDate);
    if (!normalizedDate) {
      Alert.alert("Error", "Invalid date format. Please use YYYY-MM-DD format (e.g., 2024-12-25)");
      return;
    }

    try {
      const { doc, updateDoc, getDocs, query, where, collection } = await import("firebase/firestore");
      const { db } = await import("../config/firebase");
      
      // Update in Firestore
      try {
        const wordRef = doc(db, "partner_words", selectedWord.id);
        await updateDoc(wordRef, {
          selectedDate: normalizedDate,
          isSelected: true,
        });
        
        // Unselect other words for the same date
        const wordsRef = collection(db, "partner_words");
        const q = query(
          wordsRef,
          where("selectedDate", "==", normalizedDate)
        );
        const snapshot = await getDocs(q);
        const updatePromises = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.id !== selectedWord.id) {
            updatePromises.push(updateDoc(doc(db, "partner_words", docSnap.id), {
              isSelected: false,
            }));
          }
        });
        await Promise.all(updatePromises);
      } catch (firestoreError) {
        console.warn("Error updating Firestore (updating local only):", firestoreError.message);
      }
      
      // Update local
      const wordsJson = await AsyncStorage.getItem("partner_words");
      const allWords = wordsJson ? JSON.parse(wordsJson) : [];
      
      const updatedWords = allWords.map((word) =>
        word.id === selectedWord.id
          ? { ...word, selectedDate: normalizedDate, isSelected: true }
          : word.selectedDate === normalizedDate && word.id !== selectedWord.id
          ? { ...word, isSelected: false }
          : word
      );
      
      await AsyncStorage.setItem("partner_words", JSON.stringify(updatedWords));
      
      Alert.alert(
        "Success",
        `This word will be shown on ${normalizedDate}.`
      );
      setShowDatePicker(false);
      setSelectedWord(null);
      setSelectedDate("");
      loadWords();
    } catch (error) {
      console.error("Error scheduling word:", error);
      Alert.alert("Error", "Failed to schedule word");
    }
  };

  const getWallpaperSource = (wallpaper) => {
    if (!wallpaper) return null;
    
    if (wallpaper.type === "asset") {
      return ASSET_WALLPAPER_MAP[wallpaper.id] || null;
    }
    
    if (wallpaper.type === "phone") {
      return { uri: wallpaper.uri };
    }
    
    return null;
  };

  const filteredWords = words.filter((word) => {
    if (filter === "scheduled") return word.isSelected;
    if (filter === "unscheduled") return !word.isSelected;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#CC6B2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Words</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("CreatePartnerWord")}
        >
          <Ionicons name="add" size={24} color="#CC6B2E" />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "all" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("all")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === "all" && styles.filterButtonTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "scheduled" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("scheduled")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === "scheduled" && styles.filterButtonTextActive,
            ]}
          >
            Scheduled
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "unscheduled" && styles.filterButtonActive,
          ]}
          onPress={() => setFilter("unscheduled")}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === "unscheduled" && styles.filterButtonTextActive,
            ]}
          >
            Unscheduled
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredWords.length > 0 ? (
          filteredWords.map((word) => {
            const wallpaperSource = getWallpaperSource(word.wallpaper);
            
            return (
              <View key={word.id} style={styles.wordCard}>
                {wallpaperSource ? (
                  <ImageBackground
                    source={wallpaperSource}
                    style={styles.previewContainer}
                    resizeMode="cover"
                  >
                    <View style={styles.previewOverlay}>
                      <View style={styles.wordPreviewContent}>
                        {word.title && (
                          <Text
                            style={[
                              styles.wordPreviewTitle,
                              { color: word.textColor === "white" ? "#fff" : "#000" },
                            ]}
                          >
                            {word.title}
                          </Text>
                        )}
                        {word.text && (
                          <Text
                            style={[
                              styles.wordPreviewText,
                              { color: word.textColor === "white" ? "#fff" : "#000" },
                            ]}
                            numberOfLines={2}
                          >
                            {word.text}
                          </Text>
                        )}
                      </View>
                    </View>
                  </ImageBackground>
                ) : (
                  <View style={styles.wordPreviewContent}>
                    {word.title && (
                      <Text style={styles.wordPreviewTitle}>{word.title}</Text>
                    )}
                    {word.text && (
                      <Text style={styles.wordPreviewText} numberOfLines={2}>
                        {word.text}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.wordInfo}>
                  <View style={styles.wordHeader}>
                    <View style={styles.wordHeaderText}>
                      <Text style={styles.wordAuthor}>{word.author}</Text>
                      <Text style={styles.wordDate}>
                        {new Date(word.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {/* Badges */}
                  <View style={styles.badgesContainer}>
                    {word.video && (
                      <View style={styles.videoBadge}>
                        <Ionicons name="videocam" size={16} color="#CC6B2E" />
                        <Text style={styles.videoBadgeText}>Has Video</Text>
                      </View>
                    )}
                    {word.wallpaper && (
                      <View style={styles.wallpaperBadge}>
                        <Ionicons name="image" size={16} color="#CC6B2E" />
                        <Text style={styles.wallpaperBadgeText}>
                          Wallpaper • {word.textColor === "white" ? "White" : "Black"} Text
                        </Text>
                      </View>
                    )}
                    {word.summary && (
                      <View style={styles.summaryBadge}>
                        <Ionicons name="document-text" size={16} color="#CC6B2E" />
                        <Text style={styles.summaryBadgeText}>Has Summary</Text>
                      </View>
                    )}
                    {word.scriptureReference && (
                      <View style={styles.scriptureBadge}>
                        <Ionicons name="book" size={16} color="#CC6B2E" />
                        <Text style={styles.scriptureBadgeText}>Has Scripture</Text>
                      </View>
                    )}
                  </View>

                  {word.isSelected && word.selectedDate && (
                    <View style={styles.scheduledBadge}>
                      <Ionicons name="calendar" size={16} color="#CC6B2E" />
                      <Text style={styles.scheduledText}>
                        Scheduled for {new Date(word.selectedDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}

                  {/* Only show schedule button for admin */}
                  {isAdmin && (
                    <View style={styles.wordFooter}>
                      {!word.isSelected ? (
                        <TouchableOpacity
                          style={styles.selectButton}
                          onPress={() => {
                            setSelectedWord(word);
                            setSelectedDate("");
                            setShowDatePicker(true);
                          }}
                        >
                          <Ionicons name="calendar" size={16} color="#CC6B2E" />
                          <Text style={styles.selectButtonText}>Schedule</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.selectButton}
                          onPress={() => {
                            setSelectedWord(word);
                            setSelectedDate(word.selectedDate || "");
                            setShowDatePicker(true);
                          }}
                        >
                          <Ionicons name="create-outline" size={16} color="#CC6B2E" />
                          <Text style={styles.selectButtonText}>Change Date</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No words yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first word to get started!
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate("CreatePartnerWord")}
            >
              <Text style={styles.createButtonText}>Create Word</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowDatePicker(false);
          setSelectedWord(null);
          setSelectedDate("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowDatePicker(false);
                  setSelectedWord(null);
                  setSelectedDate("");
                }}
              >
                <Ionicons name="close" size={24} color="#CC6B2E" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>
                When should this word be shown?
              </Text>
              <TextInput
                style={styles.dateInput}
                placeholder="Enter date (e.g., 2024-12-25 or Dec 25, 2024)"
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholderTextColor="#999"
              />
              <Text style={styles.dateHint}>
                This word will be displayed on the Word of the Day screen for the
                selected date.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowDatePicker(false);
                  setSelectedWord(null);
                  setSelectedDate("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleScheduleWord}
              >
                <Text style={styles.confirmButtonText}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    color: "#CC6B2E",
  },
  addButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#CC6B2E",
    borderColor: "#CC6B2E",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#CC6B2E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  wordCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewContainer: {
    width: "100%",
    height: 150,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 16,
    justifyContent: "center",
  },
  wordPreviewContent: {
    padding: 16,
  },
  wordPreviewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  wordPreviewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  wordInfo: {
    padding: 16,
  },
  wordHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  wordHeaderText: {
    flex: 1,
  },
  wordAuthor: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  wordDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  videoBadgeText: {
    fontSize: 12,
    color: "#CC6B2E",
    fontWeight: "600",
  },
  wallpaperBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  wallpaperBadgeText: {
    fontSize: 12,
    color: "#CC6B2E",
    fontWeight: "600",
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  summaryBadgeText: {
    fontSize: 12,
    color: "#CC6B2E",
    fontWeight: "600",
  },
  scriptureBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  scriptureBadgeText: {
    fontSize: 12,
    color: "#CC6B2E",
    fontWeight: "600",
  },
  scheduledBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4E6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  scheduledText: {
    fontSize: 14,
    color: "#CC6B2E",
    fontWeight: "600",
  },
  wordFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CC6B2E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  selectButtonText: {
    fontSize: 12,
    color: "#CC6B2E",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#CC6B2E",
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  dateInput: {
    fontSize: 16,
    color: "#000",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 8,
  },
  dateHint: {
    fontSize: 12,
    color: "#666",
    marginBottom: 16,
    fontStyle: "italic",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    backgroundColor: "#CC6B2E",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default PartnerWordsScreen;

