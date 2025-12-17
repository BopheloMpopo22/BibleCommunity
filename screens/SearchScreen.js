import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SearchService } from "../services/SearchService";

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    posts: [],
    users: [],
    communities: [],
  });
  const [activeTab, setActiveTab] = useState("posts");
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    postType: "all",
    community: "all",
    dateRange: "all",
    sortBy: "relevance",
  });

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await SearchService.getSearchHistory();
      setSearchHistory(history);
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await SearchService.search(searchQuery, filters);
      setSearchResults(results);

      // Save to search history
      await SearchService.addToHistory(searchQuery);
      await loadSearchHistory();
    } catch (error) {
      console.error("Error searching:", error);
      Alert.alert(
        "Search Error",
        "Failed to perform search. Please try again."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults({ posts: [], users: [], communities: [] });
  };

  const handleClearHistory = async () => {
    try {
      await SearchService.clearSearchHistory();
      setSearchHistory([]);
    } catch (error) {
      console.error("Error clearing search history:", error);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const renderSearchResult = ({ item, type }) => {
    switch (type) {
      case "posts":
        return (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => navigation.navigate("PostDetail", { post: item })}
          >
            <View style={styles.postHeader}>
              <View style={styles.postCommunity}>
                <Ionicons name="people" size={16} color="#1a365d" />
                <Text style={styles.postCommunityName}>{item.community}</Text>
              </View>
              <Text style={styles.postTime}>{item.timeAgo}</Text>
            </View>
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.postContent} numberOfLines={2}>
              {item.content}
            </Text>
            <View style={styles.postFooter}>
              <View style={styles.postActions}>
                <View style={styles.actionItem}>
                  <Ionicons name="heart-outline" size={16} color="#666" />
                  <Text style={styles.actionText}>{item.likes || 0}</Text>
                </View>
                <View style={styles.actionItem}>
                  <Ionicons name="chatbubble-outline" size={16} color="#666" />
                  <Text style={styles.actionText}>{item.comments || 0}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );

      case "users":
        return (
          <TouchableOpacity style={styles.resultCard}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={24} color="#1a365d" />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userBio}>{item.bio}</Text>
                <Text style={styles.userStats}>
                  {item.posts} posts • {item.followers} followers
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );

      case "communities":
        return (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() =>
              navigation.navigate("CommunityDetail", { community: item })
            }
          >
            <View style={styles.communityInfo}>
              <View
                style={[
                  styles.communityIcon,
                  { backgroundColor: item.color || "#1a365d" },
                ]}
              >
                <Ionicons name={item.icon || "people"} size={24} color="#fff" />
              </View>
              <View style={styles.communityDetails}>
                <Text style={styles.communityName}>{item.name}</Text>
                <Text style={styles.communityDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.communityStats}>
                  {item.members} members • {item.privacy}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  const renderTab = (tabName, title, icon) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === tabName && styles.activeTab]}
      onPress={() => setActiveTab(tabName)}
    >
      <Ionicons
        name={icon}
        size={20}
        color={activeTab === tabName ? "#1a365d" : "#666"}
      />
      <Text
        style={[styles.tabText, activeTab === tabName && styles.activeTabText]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Post Type:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["all", "discussion", "testimony", "prayer", "scripture"].map(
            (type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  filters.postType === type && styles.activeFilterChip,
                ]}
                onPress={() => handleFilterChange("postType", type)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.postType === type && styles.activeFilterChipText,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Sort By:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["relevance", "newest", "oldest", "popular"].map((sort) => (
            <TouchableOpacity
              key={sort}
              style={[
                styles.filterChip,
                filters.sortBy === sort && styles.activeFilterChip,
              ]}
              onPress={() => handleFilterChange("sortBy", sort)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filters.sortBy === sort && styles.activeFilterChipText,
                ]}
              >
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const getCurrentResults = () => {
    switch (activeTab) {
      case "posts":
        return searchResults.posts;
      case "users":
        return searchResults.users;
      case "communities":
        return searchResults.communities;
      default:
        return [];
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a365d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={24} color="#1a365d" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts, users, communities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={!searchQuery.trim() || isSearching}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.searchButtonText}>
            {isSearching ? "Searching..." : "Search"}
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && renderFilters()}

      {searchQuery.length === 0 && searchHistory.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={styles.clearHistoryText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {searchHistory.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyItem}
                onPress={() => {
                  setSearchQuery(item);
                  handleSearch();
                }}
              >
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.historyText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {searchQuery.length > 0 && (
        <View style={styles.tabsContainer}>
          {renderTab("posts", "Posts", "chatbubbles")}
          {renderTab("users", "Users", "people")}
          {renderTab("communities", "Communities", "people-circle")}
        </View>
      )}

      <View style={styles.resultsContainer}>
        {searchQuery.length > 0 && (
          <FlatList
            data={getCurrentResults()}
            renderItem={({ item }) =>
              renderSearchResult({ item, type: activeTab })
            }
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color="#ccc" />
                <Text style={styles.emptyStateTitle}>No results found</Text>
                <Text style={styles.emptyStateText}>
                  Try adjusting your search terms or filters
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a365d",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterRow: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    marginRight: 10,
  },
  activeFilterChip: {
    backgroundColor: "#1a365d",
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterChipText: {
    color: "#fff",
  },
  historySection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  clearHistoryText: {
    fontSize: 14,
    color: "#1a365d",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    gap: 6,
  },
  historyText: {
    fontSize: 14,
    color: "#666",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#1a365d",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#1a365d",
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: 20,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  postCommunity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  postCommunityName: {
    fontSize: 12,
    color: "#1a365d",
    fontWeight: "500",
  },
  postTime: {
    fontSize: 12,
    color: "#666",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postActions: {
    flexDirection: "row",
    gap: 15,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionText: {
    fontSize: 12,
    color: "#666",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  userStats: {
    fontSize: 12,
    color: "#999",
  },
  followButton: {
    backgroundColor: "#1a365d",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  communityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  communityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  communityDetails: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  communityStats: {
    fontSize: 12,
    color: "#999",
  },
  joinButton: {
    backgroundColor: "#1a365d",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});













