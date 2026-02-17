import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import AssetPreloadService from "../services/AssetPreloadService";

const { width } = Dimensions.get("window");

// Scripture topics - slideshow categories
const scriptureTopics = [
  {
    id: "love",
    title: "Love",
    color: "#FF6B6B",
    icon: "heart",
    image: require("../assets/field-3629120_1920.jpg"),
    categoryImage: require("../assets/field-3629120_640.jpg"),
    scriptures: [
      {
        verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
        reference: "John 3:16",
      },
      {
        verse: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
        reference: "1 Corinthians 13:4",
      },
      {
        verse: "Above all, love each other deeply, because love covers over a multitude of sins.",
        reference: "1 Peter 4:8",
      },
      {
        verse: "And now these three remain: faith, hope and love. But the greatest of these is love.",
        reference: "1 Corinthians 13:13",
      },
      {
        verse: "A new command I give you: Love one another. As I have loved you, so you must love one another.",
        reference: "John 13:34",
      },
    ],
  },
  {
    id: "peace",
    title: "Peace",
    color: "#4ECDC4",
    icon: "leaf",
    image: require("../assets/sea-4242303_1920.jpg"),
    categoryImage: require("../assets/Peace photo.jpg"),
    scriptures: [
      {
        verse: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.",
        reference: "John 14:27",
      },
      {
        verse: "The Lord gives strength to his people; the Lord blesses his people with peace.",
        reference: "Psalm 29:11",
      },
      {
        verse: "You will keep in perfect peace those whose minds are steadfast, because they trust in you.",
        reference: "Isaiah 26:3",
      },
      {
        verse: "Cast all your anxiety on him because he cares for you.",
        reference: "1 Peter 5:7",
      },
      {
        verse: "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
        reference: "Philippians 4:7",
      },
    ],
  },
  {
    id: "joy",
    title: "Joy",
    color: "#FFD93D",
    icon: "sunny",
    image: require("../assets/Joy Photo.jpg"),
    categoryImage: require("../assets/Joy Photo.jpg"),
    scriptures: [
      {
        verse: "The joy of the Lord is your strength.",
        reference: "Nehemiah 8:10",
      },
      {
        verse: "Consider it pure joy, my brothers and sisters, whenever you face trials of many kinds.",
        reference: "James 1:2",
      },
      {
        verse: "You make known to me the path of life; you will fill me with joy in your presence.",
        reference: "Psalm 16:11",
      },
      {
        verse: "Rejoice in the Lord always. I will say it again: Rejoice!",
        reference: "Philippians 4:4",
      },
      {
        verse: "Those who sow with tears will reap with songs of joy.",
        reference: "Psalm 126:5",
      },
    ],
  },
  {
    id: "hope",
    title: "Hope",
    color: "#95E1D3",
    icon: "star",
    image: require("../assets/Hope Photo.jpg"),
    categoryImage: require("../assets/Hope Cover Photo.jpg"),
    scriptures: [
      {
        verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
        reference: "Jeremiah 29:11",
      },
      {
        verse: "May the God of hope fill you with all joy and peace as you trust in him.",
        reference: "Romans 15:13",
      },
      {
        verse: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles.",
        reference: "Isaiah 40:31",
      },
      {
        verse: "Be strong and take heart, all you who hope in the Lord.",
        reference: "Psalm 31:24",
      },
      {
        verse: "Hope deferred makes the heart sick, but a longing fulfilled is a tree of life.",
        reference: "Proverbs 13:12",
      },
    ],
  },
  {
    id: "faith",
    title: "Faith",
    color: "#A8E6CF",
    icon: "shield",
    image: require("../assets/Faith photo.jpg"),
    categoryImage: require("../assets/Faith.jpg"),
    scriptures: [
      {
        verse: "Now faith is confidence in what we hope for and assurance about what we do not see.",
        reference: "Hebrews 11:1",
      },
      {
        verse: "Trust in the Lord with all your heart and lean not on your own understanding.",
        reference: "Proverbs 3:5",
      },
      {
        verse: "I can do all this through him who gives me strength.",
        reference: "Philippians 4:13",
      },
      {
        verse: "For we live by faith, not by sight.",
        reference: "2 Corinthians 5:7",
      },
      {
        verse: "Jesus replied, 'Truly I tell you, if you have faith as small as a mustard seed, you can say to this mountain, Move from here to there, and it will move.'",
        reference: "Matthew 17:20",
      },
    ],
  },
];

const MeditationScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [userTopics, setUserTopics] = useState([]);
  const [allCategories, setAllCategories] = useState(scriptureTopics);

  useEffect(() => {
    AssetPreloadService.preloadAllAssets();
    loadFavorites();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserTopics();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      const favoritesJson = await AsyncStorage.getItem("meditation_favorites");
      if (favoritesJson) {
        setFavorites(JSON.parse(favoritesJson));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const loadUserTopics = async () => {
    try {
      const MeditationFirebaseService = (await import("../services/MeditationFirebaseService")).default;
      const meditations = await MeditationFirebaseService.getAllMeditations();
      
      // Convert user meditations to topic format
      const convertedTopics = meditations.map((meditation) => {
        let imageSource = null;
        if (meditation.coverImage) {
          if (meditation.coverImage.type === "asset" && meditation.coverImage.file) {
            imageSource = meditation.coverImage.file;
          } else if (meditation.coverImage.type === "phone" && meditation.coverImage.uri) {
            imageSource = { uri: meditation.coverImage.uri };
          }
        }
        
        return {
          id: meditation.id,
          title: meditation.theme || meditation.title,
          color: meditation.backgroundColor || "#1A0F2E",
          icon: "book",
          image: imageSource,
          categoryImage: imageSource,
          scriptures: meditation.scriptures || [],
          video: meditation.video || null,
          isUserCreated: true,
          author: meditation.author,
        };
      });

      setUserTopics(convertedTopics);
      setAllCategories([...convertedTopics, ...scriptureTopics]);
    } catch (error) {
      console.error("Error loading user topics:", error);
    }
  };

  const handleCategorySelect = (category) => {
    navigation.navigate("ScriptureSlideshow", { category });
  };

  const toggleFavorite = async (categoryId) => {
    try {
      const newFavorites = favorites.includes(categoryId)
        ? favorites.filter((id) => id !== categoryId)
        : [...favorites, categoryId];
      setFavorites(newFavorites);
      await AsyncStorage.setItem("meditation_favorites", JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("../assets/Background of meditaton screen..jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Meditation</Text>
            <Text style={styles.headerSubtitle}>Scripture Slideshows</Text>
          </View>

          {/* Category Grid - 2 columns */}
          <View style={styles.categoriesGrid}>
            {allCategories.map((category) => {
              const isFavorite = favorites.includes(category.id);
              const getImageSource = () => {
                if (category.categoryImage) {
                  if (typeof category.categoryImage === 'number') {
                    return category.categoryImage;
                  }
                  if (category.categoryImage.uri) {
                    return { uri: category.categoryImage.uri };
                  }
                }
                return require("../assets/Background of meditaton screen..jpg");
              };

              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleCategorySelect(category)}
                >
                  <ImageBackground
                    source={getImageSource()}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  >
                    <View style={styles.categoryOverlay}>
                      {isFavorite && (
                        <TouchableOpacity
                          style={styles.favoriteBadge}
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleFavorite(category.id);
                          }}
                        >
                          <Ionicons name="heart" size={16} color="#FF6B6B" />
                        </TouchableOpacity>
                      )}
                      {category.isUserCreated && (
                        <View style={styles.userCreatedBadge}>
                          <Ionicons name="person" size={12} color="#fff" />
                        </View>
                      )}
                      <Text style={styles.categoryTitle}>Scriptures about {category.title}</Text>
                      {category.isUserCreated && category.author && (
                        <Text style={styles.categoryAuthor}>by {category.author}</Text>
                      )}
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Create Slideshow Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate("CreateMeditation")}
          >
            <Ionicons name="add-circle" size={28} color="#fff" />
            <Text style={styles.createButtonText}>Create Slideshow</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A0F2E",
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(26, 15, 46, 0.85)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.8,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  categoryCard: {
    width: (width - 36) / 2,
    height: 180,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  favoriteBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  userCreatedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(26, 26, 46, 0.8)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  categoryAuthor: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
    marginTop: 4,
    textAlign: "center",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a365d",
    marginHorizontal: 24,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
});

export default MeditationScreen;

