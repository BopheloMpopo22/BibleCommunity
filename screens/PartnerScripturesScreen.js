import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  ImageBackground,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import WorkingAuthService from "../services/WorkingAuthService";

const { width } = Dimensions.get("window");

// Asset wallpaper mapping (same as CreatePartnerScriptureScreen)
const ASSET_WALLPAPER_MAP = {
  "morning-bg": require("../assets/background-morning-picture.jpg"),
  "afternoon-bg": require("../assets/background-afternoon-picture.jpg"),
  "night-bg": require("../assets/background-night-picture.jpg"),
  "field-1920": require("../assets/field-3629120_640.jpg"),
  "sea-1920": require("../assets/sea-4242303_640.jpg"),
  "joy": require("../assets/Joy Photo.jpg"),
  "hope": require("../assets/Hope Photo.jpg"),
  "faith": require("../assets/Faith photo.jpg"),
  "peace": require("../assets/Peace photo.jpg"),
  "meditation-bg": require("../assets/Background of meditaton screen..jpg"),
  "tree": require("../assets/photorealistic-view-tree-nature-with-branches-trunk.jpg"),
  "bible": require("../assets/open-bible-black-background.jpg"),
};

const ADMIN_EMAIL = "bophelompopo22@gmail.com";

const PartnerScripturesScreen = ({ navigation }) => {
  const [scriptures, setScriptures] = useState([]);
  const [selectedScripture, setSelectedScripture] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [filter, setFilter] = useState("all"); // all, morning, afternoon, evening
  const [isAdmin, setIsAdmin] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      checkAdminStatus();
      loadScriptures();
    }, [])
  );

  const checkAdminStatus = async () => {
    try {
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (currentUser && currentUser.email === ADMIN_EMAIL) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const loadScriptures = async () => {
    try {
      // Load from Firebase (and merge with local)
      const PartnerFirebaseService = (await import("../services/PartnerFirebaseService")).default;
      const allScriptures = await PartnerFirebaseService.getAllPartnerScriptures();
      
      // Filter by current user
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (currentUser) {
        const userScriptures = allScriptures.filter(
          (scripture) => scripture.authorId === currentUser.uid
        );
        // Sort by creation date (newest first)
        userScriptures.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        setScriptures(userScriptures);
      } else {
        setScriptures([]);
      }
    } catch (error) {
      console.error("Error loading partner scriptures:", error);
      setScriptures([]);
    }
  };

  const handleSelectDate = async () => {
    // Check if user is admin
    if (!isAdmin) {
      Alert.alert("Access Denied", "Only the administrator can schedule dates. You can view scheduled dates but cannot change them.");
      return;
    }

    if (!selectedDate.trim()) {
      Alert.alert("Required", "Please enter a date");
      return;
    }

    try {
      const { doc, updateDoc, getDocs, query, where, collection } = await import("firebase/firestore");
      const { db } = await import("../config/firebase");
      
      // Update in Firestore
      try {
        const scriptureRef = doc(db, "partner_scriptures", selectedScripture.id);
        await updateDoc(scriptureRef, {
          selectedDate: selectedDate.trim(),
          isSelected: true,
        });
        
        // Unselect other scriptures for the same time and date
        const scripturesRef = collection(db, "partner_scriptures");
        const q = query(
          scripturesRef,
          where("time", "==", selectedScripture.time),
          where("selectedDate", "==", selectedDate.trim())
        );
        const snapshot = await getDocs(q);
        const updatePromises = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.id !== selectedScripture.id) {
            updatePromises.push(updateDoc(doc(db, "partner_scriptures", docSnap.id), {
              isSelected: false,
            }));
          }
        });
        await Promise.all(updatePromises);
      } catch (firestoreError) {
        console.warn("Error updating Firestore (updating local only):", firestoreError.message);
      }
      
      // Update local state
      const updatedScriptures = scriptures.map((scripture) => {
        if (scripture.id === selectedScripture.id) {
          return {
            ...scripture,
            selectedDate: selectedDate.trim(),
            isSelected: true,
          };
        }
        // Unselect other scriptures for the same time and date
        if (
          scripture.time === selectedScripture.time &&
          scripture.selectedDate === selectedDate.trim() &&
          scripture.id !== selectedScripture.id
        ) {
          return {
            ...scripture,
            isSelected: false,
          };
        }
        return scripture;
      });

      await AsyncStorage.setItem("partner_scriptures", JSON.stringify(updatedScriptures));
      setScriptures(updatedScriptures);
      setShowDatePicker(false);
      setSelectedScripture(null);
      setSelectedDate("");

      Alert.alert(
        "Success",
        `This scripture will be shown on ${selectedDate.trim()} for ${selectedScripture.time} scripture.`
      );
    } catch (error) {
      console.error("Error selecting date:", error);
      Alert.alert("Error", "Failed to set date. Please try again.");
    }
  };

  const filteredScriptures = scriptures.filter((scripture) => {
    if (filter === "all") return true;
    return scripture.time === filter;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getTimeIcon = (time) => {
    switch (time) {
      case "morning":
        return "sunny";
      case "afternoon":
        return "partly-sunny";
      case "evening":
        return "moon";
      default:
        return "time";
    }
  };

  const getTimeColor = (time) => {
    switch (time) {
      case "morning":
        return "#FFD700";
      case "afternoon":
        return "#FF8C42";
      case "evening":
        return "#1a365d";
      default:
        return "#666";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2d5016" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Scriptures</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("CreatePartnerScripture")}
        >
          <Ionicons name="add" size={24} color="#2d5016" />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
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
          style={[styles.filterButton, filter === "morning" && styles.filterButtonActive]}
          onPress={() => setFilter("morning")}
        >
          <Ionicons
            name="sunny"
            size={16}
            color={filter === "morning" ? "#fff" : "#FFD700"}
          />
          <Text
            style={[
              styles.filterButtonText,
              filter === "morning" && styles.filterButtonTextActive,
            ]}
          >
            Morning
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === "afternoon" && styles.filterButtonActive]}
          onPress={() => setFilter("afternoon")}
        >
          <Ionicons
            name="partly-sunny"
            size={16}
            color={filter === "afternoon" ? "#fff" : "#FF8C42"}
          />
          <Text
            style={[
              styles.filterButtonText,
              filter === "afternoon" && styles.filterButtonTextActive,
            ]}
          >
            Afternoon
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === "evening" && styles.filterButtonActive]}
          onPress={() => setFilter("evening")}
        >
          <Ionicons
            name="moon"
            size={16}
            color={filter === "evening" ? "#fff" : "#1a365d"}
          />
          <Text
            style={[
              styles.filterButtonText,
              filter === "evening" && styles.filterButtonTextActive,
            ]}
          >
            Evening
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredScriptures.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No scriptures yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first partner scripture to get started
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate("CreatePartnerScripture")}
            >
              <Text style={styles.createButtonText}>Create Scripture</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredScriptures.map((scripture) => {
            const getWallpaperSource = () => {
              if (!scripture.wallpaper) return null;
              if (scripture.wallpaper.type === "asset") {
                return ASSET_WALLPAPER_MAP[scripture.wallpaper.id] || null;
              }
              return { uri: scripture.wallpaper.uri };
            };

            const wallpaperSource = getWallpaperSource();
            const textColor = scripture.textColor || "black";

            return (
              <View key={scripture.id} style={styles.scriptureCard}>
                <View style={styles.scriptureHeader}>
                  <View style={styles.scriptureHeaderLeft}>
                    <Ionicons
                      name={getTimeIcon(scripture.time)}
                      size={24}
                      color={getTimeColor(scripture.time)}
                    />
                    <View style={styles.scriptureHeaderText}>
                      <Text style={styles.scriptureTime}>
                        {scripture.time.charAt(0).toUpperCase() + scripture.time.slice(1)} Scripture
                      </Text>
                      <Text style={styles.scriptureAuthor}>by {scripture.author}</Text>
                    </View>
                  </View>
                  {scripture.isSelected && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.selectedText}>Selected</Text>
                    </View>
                  )}
                </View>

                {/* Preview with Wallpaper */}
                {wallpaperSource ? (
                  <View style={styles.previewContainer}>
                    <ImageBackground
                      source={wallpaperSource}
                      style={styles.previewBackground}
                      resizeMode="cover"
                    >
                      <View style={styles.previewOverlay}>
                        <Text
                          style={[
                            styles.previewReference,
                            { color: textColor === "white" ? "#fff" : "#000" },
                          ]}
                        >
                          {scripture.reference}
                        </Text>
                        <Text
                          style={[
                            styles.previewText,
                            { color: textColor === "white" ? "#fff" : "#000" },
                          ]}
                          numberOfLines={3}
                        >
                          "{scripture.text}"
                        </Text>
                      </View>
                    </ImageBackground>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.scriptureReference}>{scripture.reference}</Text>
                    <Text style={styles.scriptureText} numberOfLines={3}>
                      "{scripture.text}"
                    </Text>
                  </View>
                )}

                {scripture.video && (
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam" size={16} color="#228B22" />
                    <Text style={styles.videoBadgeText}>Has Video</Text>
                  </View>
                )}

                {scripture.wallpaper && (
                  <View style={styles.wallpaperBadge}>
                    <Ionicons name="image" size={16} color="#228B22" />
                    <Text style={styles.wallpaperBadgeText}>
                      Wallpaper • {textColor === "white" ? "White" : "Black"} Text
                    </Text>
                  </View>
                )}

                <View style={styles.scriptureFooter}>
                  <Text style={styles.scriptureDate}>
                    {formatDate(scripture.selectedDate)}
                  </Text>
                  {isAdmin ? (
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => {
                        setSelectedScripture(scripture);
                        setShowDatePicker(true);
                      }}
                    >
                      <Ionicons name="calendar" size={16} color="#228B22" />
                      <Text style={styles.selectButtonText}>Select Date</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.viewOnlyBadge}>
                      <Ionicons name="eye" size={16} color="#666" />
                      <Text style={styles.viewOnlyText}>View Only</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowDatePicker(false);
          setSelectedScripture(null);
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
                  setSelectedScripture(null);
                  setSelectedDate("");
                }}
              >
                <Ionicons name="close" size={24} color="#2d5016" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>
                When should this {selectedScripture?.time} scripture be shown?
              </Text>
              <TextInput
                style={styles.dateInput}
                placeholder="Enter date (e.g., 2024-12-25 or Dec 25, 2024)"
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholderTextColor="#999"
              />
              <Text style={styles.dateHint}>
                This scripture will be displayed on the Daily Scripture screen for the
                selected date and time.
              </Text>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSelectDate}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
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
    color: "#2d5016",
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: "#2d5016",
    borderColor: "#2d5016",
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
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
    backgroundColor: "#2d5016",
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
  scriptureCard: {
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
  scriptureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scriptureHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  scriptureHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  scriptureTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d5016",
  },
  scriptureAuthor: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  selectedText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  previewContainer: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    height: 150,
  },
  previewBackground: {
    width: "100%",
    height: "100%",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  previewReference: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  previewText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
  },
  scriptureReference: {
    fontSize: 16,
    fontWeight: "600",
    color: "#228B22",
    marginBottom: 8,
  },
  scriptureText: {
    fontSize: 14,
    color: "#000",
    fontStyle: "italic",
    lineHeight: 20,
    marginBottom: 12,
  },
  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
    gap: 4,
  },
  videoBadgeText: {
    fontSize: 12,
    color: "#2d5016",
    fontWeight: "600",
  },
  wallpaperBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 8,
    gap: 4,
  },
  wallpaperBadgeText: {
    fontSize: 12,
    color: "#2d5016",
    fontWeight: "600",
  },
  scriptureFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  scriptureDate: {
    fontSize: 12,
    color: "#666",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  selectButtonText: {
    fontSize: 12,
    color: "#2d5016",
    fontWeight: "600",
  },
  viewOnlyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  viewOnlyText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: "60%",
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
    color: "#2d5016",
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
  confirmButton: {
    backgroundColor: "#2d5016",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default PartnerScripturesScreen;

