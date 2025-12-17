import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PrayerService from "../services/PrayerService";

const AllCommunityPrayersScreen = ({ navigation }) => {
  const [prayers, setPrayers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrayers();
  }, []);

  const loadPrayers = async () => {
    try {
      setLoading(true);
      const prayersData = await PrayerService.getAllPrayers();
      setPrayers(prayersData);
    } catch (error) {
      console.error("Error loading prayers:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrayers();
    setRefreshing(false);
  };

  const handleLike = (prayerId) => {
    setPrayers((prevPrayers) =>
      prevPrayers.map((prayer) =>
        prayer.id === prayerId
          ? { ...prayer, likes: (prayer.likes || 0) + 1 }
          : prayer
      )
    );
  };

  const handleComment = (prayerId) => {
    Alert.alert("Comments", "Comment feature coming soon!");
  };

  const getCategoryColor = (category) => {
    const colors = {
      Healing: "#FF6B6B",
      Guidance: "#4ECDC4",
      Family: "#45B7D1",
      Financial: "#96CEB4",
      Comfort: "#FFEAA7",
      Career: "#DDA0DD",
      Relationships: "#98D8C8",
      General: "#1a365d",
    };
    return colors[category] || "#1a365d";
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Recently";

    const now = new Date();
    const prayerDate = new Date(timestamp);
    const diffInHours = Math.floor((now - prayerDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return prayerDate.toLocaleDateString();
  };

  const renderPrayerItem = ({ item }) => (
    <View style={styles.prayerCard}>
      <View style={styles.prayerHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.prayerTitle}>{item.title}</Text>
          {item.category && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: getCategoryColor(item.category) },
              ]}
            >
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      </View>

      <Text style={styles.prayerContent}>{item.body || item.content}</Text>

      <View style={styles.prayerFooter}>
        <Text style={styles.author}>- {item.author}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons name="heart-outline" size={16} color="#1a365d" />
            <Text style={styles.actionText}>{item.likes || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleComment(item.id)}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#1a365d" />
            <Text style={styles.actionText}>{item.comments || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Community Prayers Yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to share a prayer request with the community
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a365d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community Prayers</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading community prayers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a365d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Prayers</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>{prayers.length} Community Prayers</Text>
        <Text style={styles.statsSubtext}>Join us in prayer and support</Text>
      </View>

      <FlatList
        data={prayers}
        renderItem={renderPrayerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          prayers.length === 0
            ? styles.emptyListContainer
            : styles.listContainer
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  statsContainer: {
    backgroundColor: "#1a365d",
    padding: 16,
    alignItems: "center",
  },
  statsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statsSubtext: {
    fontSize: 14,
    color: "#E8F4FD",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  prayerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  prayerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  prayerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
  },
  prayerContent: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  prayerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  author: {
    fontSize: 12,
    color: "#1a365d",
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  actionText: {
    fontSize: 12,
    color: "#1a365d",
    marginLeft: 4,
  },
});

export default AllCommunityPrayersScreen;
