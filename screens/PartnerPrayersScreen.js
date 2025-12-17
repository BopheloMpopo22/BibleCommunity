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

// Asset wallpaper mapping (same as CreatePartnerPrayerScreen)
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

const PartnerPrayersScreen = ({ navigation }) => {
  const [prayers, setPrayers] = useState([]);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [filter, setFilter] = useState("all"); // all, morning, afternoon, evening

  useFocusEffect(
    React.useCallback(() => {
      loadPrayers();
    }, [])
  );

  const loadPrayers = async () => {
    try {
      // Load from Firebase (and merge with local)
      const PartnerFirebaseService = (await import("../services/PartnerFirebaseService")).default;
      const allPrayers = await PartnerFirebaseService.getAllPartnerPrayers();
      
      // Filter by current user
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (currentUser) {
        const userPrayers = allPrayers.filter(
          (prayer) => prayer.authorId === currentUser.uid
        );
        // Sort by creation date (newest first)
        userPrayers.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        setPrayers(userPrayers);
      } else {
        setPrayers([]);
      }
    } catch (error) {
      console.error("Error loading partner prayers:", error);
      setPrayers([]);
    }
  };

  const handleSelectDate = async () => {
    if (!selectedDate.trim()) {
      Alert.alert("Required", "Please enter a date");
      return;
    }

    try {
      const { doc, updateDoc, getDocs, query, where, collection } = await import("firebase/firestore");
      const { db } = await import("../config/firebase");
      
      // Update in Firestore
      try {
        const prayerRef = doc(db, "partner_prayers", selectedPrayer.id);
        await updateDoc(prayerRef, {
          selectedDate: selectedDate.trim(),
          isSelected: true,
        });
        
        // Unselect other prayers for the same time and date
        const prayersRef = collection(db, "partner_prayers");
        const q = query(
          prayersRef,
          where("time", "==", selectedPrayer.time),
          where("selectedDate", "==", selectedDate.trim())
        );
        const snapshot = await getDocs(q);
        const updatePromises = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.id !== selectedPrayer.id) {
            updatePromises.push(updateDoc(doc(db, "partner_prayers", docSnap.id), {
              isSelected: false,
            }));
          }
        });
        await Promise.all(updatePromises);
      } catch (firestoreError) {
        console.warn("Error updating Firestore (updating local only):", firestoreError.message);
      }
      
      // Update local state
      const updatedPrayers = prayers.map((prayer) => {
        if (prayer.id === selectedPrayer.id) {
          return {
            ...prayer,
            selectedDate: selectedDate.trim(),
            isSelected: true,
          };
        }
        // Unselect other prayers for the same time and date
        if (
          prayer.time === selectedPrayer.time &&
          prayer.selectedDate === selectedDate.trim() &&
          prayer.id !== selectedPrayer.id
        ) {
          return {
            ...prayer,
            isSelected: false,
          };
        }
        return prayer;
      });

      await AsyncStorage.setItem("partner_prayers", JSON.stringify(updatedPrayers));
      setPrayers(updatedPrayers);
      setShowDatePicker(false);
      setSelectedPrayer(null);
      setSelectedDate("");

      Alert.alert(
        "Success",
        `This prayer will be shown on ${selectedDate.trim()} for ${selectedPrayer.time} prayer.`
      );
    } catch (error) {
      console.error("Error selecting date:", error);
      Alert.alert("Error", "Failed to set date. Please try again.");
    }
  };

  const filteredPrayers = prayers.filter((prayer) => {
    if (filter === "all") return true;
    return prayer.time === filter;
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
          <Ionicons name="arrow-back" size={24} color="#1a365d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Prayers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("CreatePartnerPrayer")}
        >
          <Ionicons name="add" size={24} color="#1a365d" />
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
        {filteredPrayers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No prayers yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first partner prayer to get started
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate("CreatePartnerPrayer")}
            >
              <Text style={styles.createButtonText}>Create Prayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPrayers.map((prayer) => {
            const getWallpaperSource = () => {
              if (!prayer.wallpaper) return null;
              if (prayer.wallpaper.type === "asset") {
                return ASSET_WALLPAPER_MAP[prayer.wallpaper.id] || null;
              }
              return { uri: prayer.wallpaper.uri };
            };

            const wallpaperSource = getWallpaperSource();
            const textColor = prayer.textColor || "black";

            return (
              <View key={prayer.id} style={styles.prayerCard}>
                <View style={styles.prayerHeader}>
                  <View style={styles.prayerHeaderLeft}>
                    <Ionicons
                      name={getTimeIcon(prayer.time)}
                      size={24}
                      color={getTimeColor(prayer.time)}
                    />
                    <View style={styles.prayerHeaderText}>
                      <Text style={styles.prayerTime}>
                        {prayer.time.charAt(0).toUpperCase() + prayer.time.slice(1)} Prayer
                      </Text>
                      <Text style={styles.prayerAuthor}>by {prayer.author}</Text>
                    </View>
                  </View>
                  {prayer.isSelected && (
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
                            styles.previewText,
                            { color: textColor === "white" ? "#fff" : "#000" },
                          ]}
                          numberOfLines={4}
                        >
                          {prayer.prayer}
                        </Text>
                      </View>
                    </ImageBackground>
                  </View>
                ) : (
                  <Text style={styles.prayerText} numberOfLines={3}>
                    {prayer.prayer}
                  </Text>
                )}

                {prayer.video && (
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam" size={16} color="#1a365d" />
                    <Text style={styles.videoBadgeText}>Has Video</Text>
                  </View>
                )}

                {prayer.wallpaper && (
                  <View style={styles.wallpaperBadge}>
                    <Ionicons name="image" size={16} color="#1a365d" />
                    <Text style={styles.wallpaperBadgeText}>
                      Wallpaper • {textColor === "white" ? "White" : "Black"} Text
                    </Text>
                  </View>
                )}

                <View style={styles.prayerFooter}>
                <Text style={styles.prayerDate}>
                  {formatDate(prayer.selectedDate)}
                </Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => {
                    setSelectedPrayer(prayer);
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons name="calendar" size={16} color="#1a365d" />
                  <Text style={styles.selectButtonText}>Select Date</Text>
                </TouchableOpacity>
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
          setSelectedPrayer(null);
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
                  setSelectedPrayer(null);
                  setSelectedDate("");
                }}
              >
                <Ionicons name="close" size={24} color="#1a365d" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>
                When should this {selectedPrayer?.time} prayer be shown?
              </Text>
              <TextInput
                style={styles.dateInput}
                placeholder="Enter date (e.g., 2024-12-25 or Dec 25, 2024)"
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholderTextColor="#999"
              />
              <Text style={styles.dateHint}>
                This prayer will be displayed on the Daily Prayer screen for the
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
    color: "#1a365d",
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
    backgroundColor: "#1a365d",
    borderColor: "#1a365d",
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
    backgroundColor: "#1a365d",
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
  prayerCard: {
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
  prayerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  prayerHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  prayerHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  prayerTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
  },
  prayerAuthor: {
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
  prayerText: {
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
    marginBottom: 12,
  },
  previewContainer: {
    borderRadius: 12,
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
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    padding: 16,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  wallpaperBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  wallpaperBadgeText: {
    fontSize: 12,
    color: "#1a365d",
    marginLeft: 4,
    fontWeight: "600",
  },
  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  videoBadgeText: {
    fontSize: 12,
    color: "#1a365d",
    fontWeight: "600",
  },
  prayerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  prayerDate: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1a365d",
    gap: 4,
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1a365d",
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
    fontSize: 20,
    fontWeight: "600",
    color: "#1a365d",
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
    marginBottom: 12,
  },
  dateInput: {
    fontSize: 16,
    color: "#000",
    borderBottomWidth: 2,
    borderBottomColor: "#1a365d",
    paddingVertical: 8,
    marginBottom: 12,
  },
  dateHint: {
    fontSize: 12,
    color: "#666",
    marginBottom: 20,
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: "#1a365d",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default PartnerPrayersScreen;

