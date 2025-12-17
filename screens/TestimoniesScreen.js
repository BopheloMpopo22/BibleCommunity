import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TestimonyCard from "../components/TestimonyCard";
import TestimoniesService from "../services/TestimoniesService";

const TestimoniesScreen = ({ navigation }) => {
  const [testimonies, setTestimonies] = useState([]);
  const [filteredTestimonies, setFilteredTestimonies] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [showCreateTestimony, setShowCreateTestimony] = useState(false);

  useEffect(() => {
    loadTestimonies();
    loadStats();
  }, []);

  useEffect(() => {
    filterTestimonies();
  }, [testimonies, selectedCategory, searchQuery]);

  const loadTestimonies = async () => {
    try {
      let loadedTestimonies = await TestimoniesService.getAllTestimonies();

      // If no testimonies exist, load sample data
      if (loadedTestimonies.length === 0) {
        const sampleTestimonies = TestimoniesService.getSampleTestimonies();
        for (const testimony of sampleTestimonies) {
          await TestimoniesService.saveTestimony(testimony);
        }
        loadedTestimonies = await TestimoniesService.getAllTestimonies();
      }

      setTestimonies(loadedTestimonies);
    } catch (error) {
      console.error("Error loading testimonies:", error);
      Alert.alert("Error", "Failed to load testimonies");
    }
  };

  const loadStats = async () => {
    try {
      const testimonyStats = await TestimoniesService.getTestimonyStats();
      setStats(testimonyStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const filterTestimonies = () => {
    let filtered = [...testimonies];

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (testimony) => testimony.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (testimony) =>
          testimony.title.toLowerCase().includes(query) ||
          testimony.content.toLowerCase().includes(query) ||
          testimony.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTestimonies(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTestimonies();
    await loadStats();
    setRefreshing(false);
  };

  const handleTestimonyPress = (testimony) => {
    // Navigate to testimony detail screen
    navigation.navigate("TestimonyDetail", { testimony });
  };

  const handleLike = (testimonyId) => {
    // Update local state
    setTestimonies((prev) =>
      prev.map((testimony) =>
        testimony.id === testimonyId
          ? { ...testimony, likes: testimony.likes + 1 }
          : testimony
      )
    );
  };

  const handleShare = (testimonyId) => {
    // Update local state
    setTestimonies((prev) =>
      prev.map((testimony) =>
        testimony.id === testimonyId
          ? { ...testimony, shares: testimony.shares + 1 }
          : testimony
      )
    );
  };

  const handleComment = (testimony) => {
    // Navigate to testimony detail screen with comment focus
    navigation.navigate("TestimonyDetail", { testimony, focusComment: true });
  };

  const categories = TestimoniesService.getTestimonyCategories();

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilter}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === "all" && styles.selectedCategoryButton,
          ]}
          onPress={() => setSelectedCategory("all")}
        >
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === "all" && styles.selectedCategoryButtonText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.selectedCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon}
              size={16}
              color={selectedCategory === category.id ? "#fff" : category.color}
            />
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.id &&
                  styles.selectedCategoryButtonText,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{stats?.total || 0}</Text>
        <Text style={styles.statLabel}>Testimonies</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{stats?.totalLikes || 0}</Text>
        <Text style={styles.statLabel}>Likes</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{stats?.totalComments || 0}</Text>
        <Text style={styles.statLabel}>Comments</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{stats?.totalShares || 0}</Text>
        <Text style={styles.statLabel}>Shares</Text>
      </View>
    </View>
  );

  const renderTestimony = ({ item }) => (
    <TestimonyCard
      testimony={item}
      onPress={handleTestimonyPress}
      onLike={handleLike}
      onShare={handleShare}
      onComment={handleComment}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="star-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Testimonies Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery.trim()
          ? "Try adjusting your search terms"
          : "Be the first to share your testimony!"}
      </Text>
      <TouchableOpacity
        style={styles.shareTestimonyButton}
        onPress={() =>
          navigation.navigate("CreatePost", { postType: "testimony" })
        }
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.shareTestimonyButtonText}>
          Share Your Testimony
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Scripture Header */}
      <View style={styles.scriptureHeader}>
        <Text style={styles.scriptureText}>
          "But you will receive power when the Holy Spirit comes on you; and you
          will be my witnesses... to the ends of the earth."
        </Text>
        <Text style={styles.scriptureReference}>Acts 1:8</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Testimonies</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateTestimony(true)}
          >
            <Ionicons name="add" size={20} color="#1a365d" />
            <Text style={styles.createButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search testimonies..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats */}
      {stats && renderStats()}

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Testimonies List */}
      <FlatList
        data={filteredTestimonies}
        renderItem={renderTestimony}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Create Testimony Modal */}
      {showCreateTestimony && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Your Testimony</Text>
              <TouchableOpacity onPress={() => setShowCreateTestimony(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.testimonyInput}
              placeholder="Share how God has worked in your life..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateTestimony(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => {
                  // TODO: Implement testimony creation
                  setShowCreateTestimony(false);
                  Alert.alert("Success", "Your testimony has been shared!");
                }}
              >
                <Text style={styles.shareButtonText}>Share Testimony</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#1a365d",
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 14,
    color: "#1a365d",
    fontWeight: "600",
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedCategoryButton: {
    backgroundColor: "#1a365d",
    borderColor: "#1a365d",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
    fontWeight: "500",
  },
  selectedCategoryButtonText: {
    color: "#fff",
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  shareTestimonyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a365d",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shareTestimonyButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  scriptureHeader: {
    backgroundColor: "#1a365d",
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  scriptureText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    lineHeight: 24,
    fontStyle: "italic",
    marginBottom: 8,
  },
  scriptureReference: {
    fontSize: 14,
    color: "#B0C4DE",
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  testimonyInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    minHeight: 120,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  shareButton: {
    flex: 1,
    backgroundColor: "#1a365d",
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  shareButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});

export default TestimoniesScreen;
