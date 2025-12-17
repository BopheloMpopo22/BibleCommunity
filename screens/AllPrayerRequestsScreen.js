import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PrayerService from "../services/PrayerService";

const AllPrayerRequestsScreen = ({ navigation }) => {
  const [prayerRequests, setPrayerRequests] = useState([]);

  useEffect(() => {
    loadPrayerRequests();
  }, []);

  const loadPrayerRequests = async () => {
    try {
      const requests = await PrayerService.getAllPrayerRequests();
      setPrayerRequests(requests);
    } catch (error) {
      console.error("Error loading prayer requests:", error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const requestDate = new Date(timestamp);
    const diffInHours = Math.floor((now - requestDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return requestDate.toLocaleDateString();
  };

  const getCategoryColor = (category) => {
    const colors = {
      healing: "#4CAF50",
      peace: "#2196F3",
      guidance: "#FF9800",
      provision: "#9C27B0",
      protection: "#F44336",
      strength: "#795548",
      love: "#E91E63",
      faith: "#3F51B5",
    };
    return colors[category] || "#1a365d";
  };

  const renderPrayerRequest = (request) => (
    <View key={request.id} style={styles.prayerRequestCard}>
      <View style={styles.prayerRequestHeader}>
        <Text style={styles.prayerRequestTitle}>{request.title}</Text>
        <View style={styles.prayerRequestMeta}>
          <Text style={styles.prayerRequestDuration}>{request.duration}</Text>
          <Text style={styles.prayerRequestAuthor}>by {request.author}</Text>
        </View>
      </View>

      <Text style={styles.prayerRequestContent} numberOfLines={3}>
        {request.content}
      </Text>

      <View style={styles.prayerRequestFooter}>
        <View style={styles.prayerRequestTags}>
          <Text style={styles.prayerRequestTag}>#{request.category}</Text>
        </View>
        <Text style={styles.prayerRequestTime}>
          {formatTimestamp(request.timestamp)}
        </Text>
      </View>

      <View style={styles.prayerRequestActions}>
        <TouchableOpacity style={styles.prayButton}>
          <Ionicons name="heart" size={16} color="#fff" />
          <Text style={styles.prayButtonText}>Pray Now</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share" size={16} color="#1a365d" />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Prayer Requests</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Prayer Requests List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {prayerRequests.length} Prayer Requests
          </Text>
          <Text style={styles.sectionSubtitle}>
            Join our community in prayer
          </Text>
        </View>

        {prayerRequests.map(renderPrayerRequest)}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  prayerRequestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  prayerRequestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  prayerRequestTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  prayerRequestMeta: {
    alignItems: "flex-end",
  },
  prayerRequestDuration: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#E9ECEF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  prayerRequestAuthor: {
    fontSize: 12,
    color: "#666",
  },
  prayerRequestContent: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    marginBottom: 15,
  },
  prayerRequestFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  prayerRequestTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  prayerRequestTag: {
    fontSize: 12,
    color: "#1a365d",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
  },
  prayerRequestTime: {
    fontSize: 12,
    color: "#999",
  },
  prayerRequestActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  prayButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a365d",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    justifyContent: "center",
  },
  prayButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  shareButtonText: {
    color: "#1a365d",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});

export default AllPrayerRequestsScreen;
