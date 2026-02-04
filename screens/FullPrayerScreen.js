import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TimeBasedPrayerService from "../services/TimeBasedPrayerService";
import PrayerBackgroundService from "../services/PrayerBackgroundService";
import VoiceService from "../services/VoiceService";

const { width, height } = Dimensions.get("window");

export default function FullPrayerScreen({ route, navigation }) {
  const { prayerData } = route.params || {};
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [wallpaper, setWallpaper] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("device-0");
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [deviceVoices, setDeviceVoices] = useState([]);
  const [filteredVoices, setFilteredVoices] = useState([]);
  const [isPrayerPlaying, setIsPrayerPlaying] = useState(false);

  // Function to get image source from path
  const getImageSource = (imagePath) => {
    if (!imagePath) return null;

    // Map image paths to require statements - only include files that actually exist
    const imageMap = {
      "photorealistic-view-tree-nature-with-branches-trunk.jpg": require("../assets/photorealistic-view-tree-nature-with-branches-trunk.jpg"),
      // Using available images as fallbacks
      "background-morning-picture.jpg": require("../assets/background-morning-picture.jpg"),
      "background-afternoon-picture.jpg": require("../assets/background-afternoon-picture.jpg"),
      "background-night-picture.jpg": require("../assets/background-night-picture.jpg"),
      "open-bible-black-background.jpg": require("../assets/open-bible-black-background.jpg"),
    };

    return imageMap[imagePath] || null;
  };

  // Get only your 4 favorite voices with better names
  const getFavoriteVoices = (voices) => {
    const favoriteIdentifiers = [
      "en-us-x-tpc-network", // Female voice
      "en-gb-x-gbd-network", // Male voice
      "en-gb-x-gbd-local", // Male voice
      "en-gb-x-rjs-local", // Male voice
    ];

    const filteredVoices = voices.filter((voice) =>
      favoriteIdentifiers.some((identifier) =>
        voice.identifier.includes(identifier)
      )
    );

    // Give them better names and set the first one as default
    return filteredVoices.map((voice, index) => {
      let displayName = voice.name;

      // Give better names based on identifier
      if (voice.identifier.includes("en-us-x-tpc-network")) {
        displayName = "Female Voice (US)";
      } else if (voice.identifier.includes("en-gb-x-gbd-network")) {
        displayName = "Male Voice (UK Network)";
      } else if (voice.identifier.includes("en-gb-x-gbd-local")) {
        displayName = "Male Voice (UK Local)";
      } else if (voice.identifier.includes("en-gb-x-rjs-local")) {
        displayName = "Male Voice (UK RJS)";
      }

      return {
        ...voice,
        displayName: displayName,
        isDefault: index === 0, // First voice is default
      };
    });
  };

  // Load device voices on component mount
  useEffect(() => {
    const loadDeviceVoices = async () => {
      try {
        const voices = await VoiceService.getDeviceVoices();
        const favoriteVoices = getFavoriteVoices(voices);

        setDeviceVoices(favoriteVoices);
        setFilteredVoices(favoriteVoices);

        // Set the first voice as default (instead of "system default")
        if (favoriteVoices.length > 0) {
          setSelectedVoice("device-0");
        }

        console.log("Device voices loaded:", voices.length, "total voices");
        console.log("Favorite voices found:", favoriteVoices.length, "voices");
        console.log(
          "Favorite voice names:",
          favoriteVoices.map((v) => v.displayName || v.name)
        );
      } catch (error) {
        console.error("Error loading device voices:", error);
      }
    };

    loadDeviceVoices();
  }, []);

  // Main useEffect for prayer data and background
  useEffect(() => {
    try {
      const prayer = prayerData || TimeBasedPrayerService.getTimeBasedPrayer();

      // Get prayer-specific background instead of time-based
      const wallpaperData = PrayerBackgroundService.getPrayerBackground(prayer);

      // Debug: Log the prayer data structure
      console.log("FullPrayerScreen - Prayer data:", prayer);
      console.log(
        "FullPrayerScreen - Available properties:",
        Object.keys(prayer || {})
      );

      // Debug: Log the wallpaper data
      console.log("FullPrayerScreen - Wallpaper data:", wallpaperData);
      console.log(
        "FullPrayerScreen - Wallpaper properties:",
        Object.keys(wallpaperData || {})
      );

      // Ensure prayer data is valid
      if (prayer && typeof prayer === "object") {
        setCurrentPrayer(prayer);
      } else {
        console.error("Invalid prayer data:", prayer);
        setCurrentPrayer(null);
      }

      // Ensure wallpaper data is valid
      if (wallpaperData && typeof wallpaperData === "object") {
        setWallpaper(wallpaperData);
      } else {
        console.error("Invalid wallpaper data:", wallpaperData);
        setWallpaper(null);
      }

      // Load background music
      loadBackgroundMusic();

      // Set background image based on prayer type
      setImageLoading(true);
      if (wallpaperData?.imagePath) {
        const imageSource = getImageSource(wallpaperData.imagePath);
        setBackgroundImage(imageSource);
        console.log(
          "Prayer-specific background image loaded:",
          wallpaperData.imagePath
        );
      } else {
        // Fallback to random nature image
        const fallbackBackground =
          PrayerBackgroundService.getRandomNatureImage();
        const imageSource = getImageSource(fallbackBackground.imagePath);
        setBackgroundImage(imageSource);
        console.log(
          "Fallback random nature background image loaded:",
          fallbackBackground.imagePath
        );
      }
    } catch (error) {
      console.error("Error in FullPrayerScreen useEffect:", error);
      setCurrentPrayer(null);
      setWallpaper(null);
      // Fallback to random nature image if everything fails
      const fallbackBackground = PrayerBackgroundService.getRandomNatureImage();
      const imageSource = getImageSource(fallbackBackground.imagePath);
      setBackgroundImage(imageSource);
    }
  }, [prayerData]);

  // Load background music
  const loadBackgroundMusic = async () => {
    try {
      // Load from Firebase Storage (NOT bundled) to keep Play Store download size small
      const MeditationMusicService = (
        await import("../services/MeditationMusicService")
      ).default;
      const uri = await MeditationMusicService.getTrackUrlById("zen-wind");
      if (!uri) {
        console.warn("Background music URL not available");
        return;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          isLooping: true,
          volume: 0.3,
        }
      );
      setBackgroundMusic(sound);
      console.log("Background music loaded successfully");
    } catch (error) {
      console.error("Error loading background music:", error);
    }
  };

  // Play background music
  const playBackgroundMusic = async () => {
    try {
      if (backgroundMusic) {
        await backgroundMusic.playAsync();
        setIsMusicPlaying(true);
        console.log("Background music started");
      }
    } catch (error) {
      console.error("Error playing background music:", error);
    }
  };

  // Stop background music
  const stopBackgroundMusic = async () => {
    try {
      if (backgroundMusic && backgroundMusic.pauseAsync) {
        await backgroundMusic.pauseAsync();
        setIsMusicPlaying(false);
        console.log("Background music stopped");
      }
    } catch (error) {
      console.error("Error stopping background music:", error);
    }
  };

  // Stop prayer and music
  const stopPrayer = async () => {
    Speech.stop();
    setIsPrayerPlaying(false);
    if (isMusicPlaying) {
      await stopBackgroundMusic();
    }
    console.log("Prayer and music stopped");
  };

  // Handle text-to-speech
  const handleSpeak = async () => {
    if (!currentPrayer) {
      console.error("No prayer data available for speech");
      return;
    }

    // If prayer is already playing, stop it
    if (isPrayerPlaying) {
      await stopPrayer();
      return;
    }

    // Stop any existing speech
    Speech.stop();

    // Start background music automatically
    if (!isMusicPlaying) {
      await playBackgroundMusic();
    }

    // Construct full text based on prayer type
    let fullText = "";

    // Debug: Log the prayer data structure
    console.log("=== DEBUG: Prayer Data Structure ===");
    console.log("currentPrayer:", currentPrayer);
    console.log("currentPrayer.title:", currentPrayer.title);
    console.log("currentPrayer.scriptureText:", currentPrayer.scriptureText);
    console.log("currentPrayer.prayer:", currentPrayer.prayer);
    console.log("currentPrayer.content:", currentPrayer.content);
    console.log("currentPrayer.body:", currentPrayer.body);
    console.log("All prayer keys:", Object.keys(currentPrayer));

    // For time-based prayers (have scriptureText and prayer properties)
    if (currentPrayer.scriptureText && currentPrayer.prayer) {
      fullText = `${currentPrayer.title}\n\n${currentPrayer.scriptureText}\n\n${currentPrayer.prayer}`;
      console.log("Using time-based prayer format");
    }
    // For prayers with just prayer content (no scripture)
    else if (currentPrayer.prayer) {
      fullText = `${currentPrayer.title}\n\n${currentPrayer.prayer}`;
      console.log("Using prayer-only format");
    }
    // For community prayers (have content or body property)
    else if (currentPrayer.content || currentPrayer.body) {
      const content = currentPrayer.content || currentPrayer.body;
      fullText = `${currentPrayer.title}\n\n${content}`;
      console.log("Using community prayer format");
    }
    // Fallback
    else {
      fullText = currentPrayer.title || "No prayer content available";
      console.log("Using fallback format - only title available");
    }

    console.log("=== FINAL TEXT TO SPEAK ===");
    console.log("fullText:", fullText);
    console.log("fullText length:", fullText.length);

    // Get voice settings
    const voiceIndex = parseInt(selectedVoice.replace("device-", ""));
    const voice = deviceVoices[voiceIndex];

    const speechOptions = {
      language: voice?.language || "en-US",
      pitch: 1.0,
      rate: 0.8,
      quality: Speech.VoiceQuality.Enhanced,
    };

    if (voice?.identifier) {
      speechOptions.voice = voice.identifier;
    }

    console.log("Speech options:", speechOptions);

    // Small delay to ensure speech engine is ready
    setTimeout(() => {
      Speech.speak(fullText, speechOptions);
      setIsPrayerPlaying(true);
      console.log("Prayer started playing");
    }, 100);
  };

  // Get category color for community prayers
  const getCategoryColor = (category) => {
    const colors = {
      healing: "#4CAF50",
      peace: "#2196F3",
      guidance: "#FF9800",
      gratitude: "#9C27B0",
      protection: "#F44336",
      strength: "#795548",
      love: "#E91E63",
      faith: "#3F51B5",
    };
    return colors[category?.toLowerCase()] || "#1a365d";
  };

  // Check if a voice can speak multiple languages (useful for South African context)
  const canSpeakMultipleLanguages = (voice) => {
    // South African English voices can often speak other SA languages
    if (voice.language === "en-ZA") return true;

    // Check if voice identifier suggests multilingual capability
    const identifier = voice.identifier.toLowerCase();
    return (
      identifier.includes("multilingual") ||
      identifier.includes("polyglot") ||
      identifier.includes("global")
    );
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up speech, music, and video when component unmounts
      Speech.stop();
      setIsPrayerPlaying(false);
      if (backgroundMusic) {
        backgroundMusic.unloadAsync();
      }
    };
  }, [backgroundMusic]);

  // Listen for speech completion
  useEffect(() => {
    const handleSpeechEnd = () => {
      setIsPrayerPlaying(false);
      console.log("Prayer finished playing");
    };

    // Note: expo-speech doesn't have a direct callback for speech end
    // This is a workaround - in a real app you might want to use a different TTS library
    // For now, we'll rely on the user manually stopping or the cleanup effect
  }, []);

  if (!currentPrayer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading prayer...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Background - Beautiful Nature Image with Loading State */}
      {backgroundImage && (
        <Image
          source={backgroundImage}
          style={styles.backgroundImage}
          resizeMode="cover"
          onLoad={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />
      )}

      {/* Loading background with gradient */}
      {imageLoading && (
        <View
          style={[
            styles.wallpaper,
            {
              backgroundColor: wallpaper?.primaryColor || "#1a365d",
              background: wallpaper?.primaryColor
                ? `linear-gradient(135deg, ${wallpaper.primaryColor} 0%, ${wallpaper.secondaryColor} 100%)`
                : "linear-gradient(135deg, #4A90E2 0%, #87CEEB 100%)",
            },
          ]}
        />
      )}

      {/* Fallback background when image fails to load */}
      {!backgroundImage && !imageLoading && (
        <View
          style={[
            styles.wallpaper,
            { backgroundColor: wallpaper?.primaryColor || "#1a365d" },
          ]}
        />
      )}

      {/* Content Overlay */}
      <View style={styles.contentOverlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {currentPrayer.title || "Prayer"}
            </Text>
            {deviceVoices.length > 0 && (
              <Text style={styles.voiceIndicator}>
                {deviceVoices[parseInt(selectedVoice.replace("device-", ""))]
                  ?.displayName ||
                  deviceVoices[parseInt(selectedVoice.replace("device-", ""))]
                    ?.name ||
                  "Voice"}
              </Text>
            )}
          </View>

          <View style={styles.headerButtons}>
            {/* Voice Selector Button */}
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={() => setShowVoiceSelector(true)}
            >
              <Ionicons name="person-circle" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Music Toggle Button */}
            <TouchableOpacity
              style={styles.musicButton}
              onPress={
                isMusicPlaying ? stopBackgroundMusic : playBackgroundMusic
              }
            >
              <Ionicons
                name={
                  isMusicPlaying ? "musical-notes" : "musical-notes-outline"
                }
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Prayer Content */}
        <ScrollView
          style={styles.prayerScrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.prayerCard}>
            {/* Scripture Section (for time-based prayers) */}
            {currentPrayer.scriptureText && (
              <View style={styles.scriptureSection}>
                <Text style={styles.scriptureText}>
                  {currentPrayer.scriptureText}
                </Text>
              </View>
            )}

            {/* Prayer Section */}
            <View style={styles.prayerSection}>
              {currentPrayer.prayer ? (
                <Text style={styles.prayerText}>{currentPrayer.prayer}</Text>
              ) : currentPrayer.content ? (
                <Text style={styles.prayerText}>{currentPrayer.content}</Text>
              ) : currentPrayer.body ? (
                <Text style={styles.prayerText}>{currentPrayer.body}</Text>
              ) : (
                <Text style={styles.prayerText}>
                  No prayer content available
                </Text>
              )}
            </View>

            {/* Theme Section (for time-based prayers) */}
            {currentPrayer.theme && (
              <View style={styles.themeSection}>
                <Text style={styles.themeText}>
                  Theme: {currentPrayer.theme}
                </Text>
              </View>
            )}

            {/* Author Section (for community prayers) */}
            {currentPrayer.author && (
              <View style={styles.authorSection}>
                <Text style={styles.authorText}>- {currentPrayer.author}</Text>
              </View>
            )}

            {/* Category Badge (for community prayers) */}
            {currentPrayer.category && (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: getCategoryColor(currentPrayer.category) },
                ]}
              >
                <Text style={styles.categoryText}>
                  {currentPrayer.category}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Speaker Button */}
        <TouchableOpacity style={styles.speakerButton} onPress={handleSpeak}>
          <Ionicons
            name={isPrayerPlaying ? "stop" : "volume-high"}
            size={32}
            color="#fff"
          />
          <Text style={styles.speakerButtonText}>
            {isPrayerPlaying
              ? "Stop Prayer"
              : currentPrayer.scriptureText
              ? "Pray This Prayer"
              : "Read Full Prayer"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Voice Selector Modal - Simplified */}
      {showVoiceSelector && (
        <View style={styles.voiceSelectorOverlay}>
          <View style={styles.voiceSelectorModal}>
            <Text style={styles.voiceSelectorTitle}>Choose Voice</Text>

            {/* Voice List - Only Your 4 Favorites */}
            <ScrollView
              style={styles.voiceList}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.voiceSectionTitle}>
                ⭐ Your Favorite Voices ({filteredVoices.length})
              </Text>
              {filteredVoices.map((voice, index) => {
                const voiceId = `device-${index}`;

                return (
                  <TouchableOpacity
                    key={voiceId}
                    style={[
                      styles.voiceOption,
                      selectedVoice === voiceId && styles.selectedVoiceOption,
                    ]}
                    onPress={() => {
                      console.log("Voice selected:", voice);
                      setSelectedVoice(voiceId);
                      setShowVoiceSelector(false);

                      setTimeout(() => {
                        Speech.speak(
                          "Hello, this is a test of your favorite voice.",
                          {
                            language: voice.language,
                            pitch: 1.0,
                            rate: 0.8,
                            quality: Speech.VoiceQuality.Enhanced,
                            voice: voice.identifier,
                          }
                        );
                      }, 200);
                    }}
                  >
                    <View style={styles.voiceOptionContent}>
                      <Text
                        style={[
                          styles.voiceOptionText,
                          selectedVoice === voiceId &&
                            styles.selectedVoiceOptionText,
                        ]}
                      >
                        {voice.displayName || voice.name} ({voice.language})
                        {canSpeakMultipleLanguages(voice) && " 🌍"}
                      </Text>
                    </View>
                    {selectedVoice === voiceId && (
                      <Ionicons name="checkmark" size={20} color="#1a365d" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeVoiceSelector}
              onPress={() => setShowVoiceSelector(false)}
            >
              <Text style={styles.closeVoiceSelectorText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a365d",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  wallpaper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
  },
  contentOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  voiceIndicator: {
    fontSize: 12,
    color: "#ccc",
    textAlign: "center",
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  voiceButton: {
    padding: 8,
    marginRight: 8,
  },
  musicButton: {
    padding: 8,
  },
  prayerScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  prayerCard: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 20,
    padding: 25,
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scriptureSection: {
    marginBottom: 20,
  },
  scriptureText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#fff",
    fontStyle: "italic",
    textAlign: "center",
  },
  prayerSection: {
    marginBottom: 20,
  },
  prayerText: {
    fontSize: 18,
    lineHeight: 28,
    color: "#fff",
    textAlign: "left",
  },
  themeSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  themeText: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    fontStyle: "italic",
  },
  authorSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  authorText: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "right",
    fontStyle: "italic",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 15,
  },
  categoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  speakerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74, 144, 226, 0.8)",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  speakerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  voiceSelectorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  voiceSelectorModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voiceSelectorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  voiceSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    marginTop: 10,
  },
  voiceList: {
    maxHeight: 400,
  },
  voiceOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
  },
  selectedVoiceOption: {
    backgroundColor: "#e3f2fd",
    borderWidth: 2,
    borderColor: "#1a365d",
  },
  voiceOptionContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voiceOptionText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  selectedVoiceOptionText: {
    color: "#1a365d",
    fontWeight: "600",
  },
  closeVoiceSelector: {
    backgroundColor: "#1a365d",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  closeVoiceSelectorText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
