import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

const MyPrayersScreen = ({ navigation }) => {
  const [savedPrayers, setSavedPrayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedPrayers();
  }, []);

  // Reload prayers when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Add a small delay to ensure storage operations are complete
      const timer = setTimeout(() => {
        loadSavedPrayers();
      }, 100);

      return () => clearTimeout(timer);
    }, [])
  );

  const loadSavedPrayers = async () => {
    try {
      console.log("Loading saved prayers...");
      const savedPrayersData = await AsyncStorage.getItem("savedPrayers");
      console.log("Saved prayers data:", savedPrayersData);

      // Check all AsyncStorage keys to see what's stored
      const allKeys = await AsyncStorage.getAllKeys();
      console.log("All AsyncStorage keys:", allKeys);

      if (savedPrayersData) {
        const prayers = JSON.parse(savedPrayersData);
        console.log("Parsed prayers:", prayers);
        console.log("Number of prayers found:", prayers.length);
        setSavedPrayers(prayers);
      } else {
        console.log("No saved prayers found");
        setSavedPrayers([]);
      }
    } catch (error) {
      console.error("Error loading saved prayers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePrayer = async (prayerId) => {
    try {
      const updatedPrayers = savedPrayers.filter(
        (prayer) => prayer.id !== prayerId
      );
      setSavedPrayers(updatedPrayers);
      await AsyncStorage.setItem(
        "savedPrayers",
        JSON.stringify(updatedPrayers)
      );
      Alert.alert("Success", "Prayer removed from your collection");
    } catch (error) {
      console.error("Error deleting prayer:", error);
      Alert.alert("Error", "Failed to remove prayer");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderPrayerCard = (prayer, index) => (
    <View key={prayer.id} style={styles.prayerCard}>
      <View style={styles.prayerHeader}>
        <View style={styles.prayerInfo}>
          <Text style={styles.prayerTitle}>{prayer.title}</Text>
          <Text style={styles.prayerTheme}>{prayer.theme}</Text>
          <Text style={styles.prayerDate}>
            Saved on {formatDate(prayer.savedAt)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deletePrayer(prayer.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <Text style={styles.prayerText} numberOfLines={4}>
        {prayer.prayer}
      </Text>

      <View style={styles.prayerActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="play-outline" size={16} color="#1a365d" />
          <Text style={styles.actionText}>Play</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={16} color="#1a365d" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your prayers...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Prayers</Text>
            <Text style={styles.headerSubtitle}>
              {savedPrayers.length} saved prayer
              {savedPrayers.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Prayers List */}
        {savedPrayers.length > 0 ? (
          <View style={styles.prayersContainer}>
            {savedPrayers.map((prayer, index) =>
              renderPrayerCard(prayer, index)
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No Saved Prayers</Text>
            <Text style={styles.emptySubtitle}>
              Save prayers from the Daily Prayer screen to see them here
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate("DailyPrayer")}
            >
              <Text style={styles.exploreButtonText}>
                Explore Daily Prayers
              </Text>
            </TouchableOpacity>

            {/* Test button to add sample prayer */}
            <TouchableOpacity
              style={[
                styles.exploreButton,
                { backgroundColor: "rgba(255, 107, 107, 0.6)", marginTop: 10 },
              ]}
              onPress={async () => {
                try {
                  const testPrayer = {
                    id: `test-${Date.now()}`,
                    title: "Test Prayer",
                    prayer:
                      "This is a test prayer to verify the save functionality works correctly.",
                    theme: "Testing",
                    type: "test",
                    savedAt: new Date().toISOString(),
                  };

                  const existingPrayers = await AsyncStorage.getItem(
                    "savedPrayers"
                  );
                  const prayers = existingPrayers
                    ? JSON.parse(existingPrayers)
                    : [];
                  prayers.push(testPrayer);
                  await AsyncStorage.setItem(
                    "savedPrayers",
                    JSON.stringify(prayers)
                  );

                  console.log("Test prayer added:", testPrayer);
                  loadSavedPrayers(); // Reload the prayers
                } catch (error) {
                  console.error("Error adding test prayer:", error);
                }
              }}
            >
              <Text style={styles.exploreButtonText}>Add Test Prayer</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#B0C4DE",
    opacity: 0.8,
  },
  prayersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  prayerCard: {
    backgroundColor: "rgba(26, 54, 93, 0.3)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(26, 54, 93, 0.5)",
  },
  prayerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  prayerTheme: {
    fontSize: 14,
    color: "#B0C4DE",
    marginBottom: 4,
  },
  prayerDate: {
    fontSize: 12,
    color: "#B0C4DE",
    opacity: 0.7,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  prayerText: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 24,
    marginBottom: 15,
  },
  prayerActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 54, 93, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionText: {
    fontSize: 12,
    color: "#1a365d",
    marginLeft: 6,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#B0C4DE",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  exploreButton: {
    backgroundColor: "rgba(26, 54, 93, 0.6)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(26, 54, 93, 0.8)",
  },
  exploreButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});

export default MyPrayersScreen;
