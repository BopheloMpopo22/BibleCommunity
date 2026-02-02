import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ImageBackground,
  Animated,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import VoiceService from "../services/VoiceService";
import { useFocusEffect } from "@react-navigation/native";
import AssetPreloadService from "../services/AssetPreloadService";

const { width, height } = Dimensions.get("window");

// Session length options (in minutes)
const SESSION_LENGTHS = [5, 10, 15, 20, 30];

// Music options for meditation
// Note: All music files must exist in assets folder
const MEDITATION_MUSIC = [
  {
    id: "zen-wind",
    name: "Zen Wind",
    description: "Peaceful ambient sounds",
    file: require("../assets/zen-wind-411951.mp3"),
  },
  {
    id: "heavenly-energy",
    name: "Heavenly Energy",
    description: "Uplifting celestial music",
    file: require("../assets/heavenly-energy-188908.mp3"),
  },
  {
    id: "inner-peace",
    name: "Inner Peace",
    description: "Calming meditation music",
    file: require("../assets/inner-peace-339640.mp3"),
  },
  {
    id: "prayer-meditation",
    name: "Prayer Meditation",
    description: "Holy grace piano music",
    file: require("../assets/prayer-meditation-piano-holy-grace-heavenly-celestial-music-393549.mp3"),
  },
  {
    id: "worship-piano",
    name: "Worship Piano",
    description: "Peaceful prayer instrumental",
    file: require("../assets/worship-piano-instrumental-peaceful-prayer-music-223373.mp3"),
  },
];

// Log music files on load to verify they exist
console.log("Meditation Music Files:", MEDITATION_MUSIC.map(m => ({
  name: m.name,
  hasFile: !!m.file,
  fileType: typeof m.file
})));

// Meditation categories - ONE image per category (no transitions)
const meditationCategories = [
  {
    id: "love",
    title: "Love",
    color: "#FF6B6B",
    icon: "heart",
    image: require("../assets/field-3629120_640.jpg"), // Using field image for love (warm, open)
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
    ],
  },
  {
    id: "peace",
    title: "Peace",
    color: "#4ECDC4",
    icon: "leaf",
    image: require("../assets/sea-4242303_640.jpg"), // Using sea image for peace (calm water)
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
    ],
  },
];

const MeditationScreen = ({ navigation }) => {
  // Preload meditation images on mount
  useEffect(() => {
    AssetPreloadService.preloadAllAssets();
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentScriptureIndex, setCurrentScriptureIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [showLengthSelector, setShowLengthSelector] = useState(false);
  const [selectedLength, setSelectedLength] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lastMeditationDate, setLastMeditationDate] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [filteredVoices, setFilteredVoices] = useState([]);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [progress, setProgress] = useState(0); // Progress for progress bar (0-1)
  const [userMeditations, setUserMeditations] = useState([]); // User-created meditations
  const [allCategories, setAllCategories] = useState(meditationCategories); // Combined default + user meditations
  
  const scriptureTimerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const musicSoundRef = useRef(null);
  const preloadedMusicRef = useRef(null); // Preloaded music ready to play

  // Get only your 4 favorite voices with better names (same as Daily Prayer)
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

  // Load device voices on component mount (same as Daily Prayer)
  useEffect(() => {
    const loadDeviceVoices = async () => {
      try {
        const voices = await VoiceService.getDeviceVoices();
        const favoriteVoices = getFavoriteVoices(voices);

        setFilteredVoices(favoriteVoices);

        // Set the first voice as default
        if (favoriteVoices.length > 0) {
          setSelectedVoice(favoriteVoices[0].identifier);
        }
      } catch (error) {
        console.error("Error loading voices:", error);
      }
    };

    loadDeviceVoices();
  }, []);

  // Asset image mapping - maps asset IDs to require() references
  const ASSET_IMAGE_MAP = {
    "field-1920": require("../assets/field-3629120_640.jpg"),
    "field-640": require("../assets/field-3629120_640.jpg"),
    "sea-1920": require("../assets/sea-4242303_640.jpg"),
    "sea-640": require("../assets/sea-4242303_640.jpg"),
    "joy": require("../assets/Joy Photo.jpg"),
    "hope": require("../assets/Hope Photo.jpg"),
    "hope-cover": require("../assets/Hope Cover Photo.jpg"),
    "faith": require("../assets/Faith photo.jpg"),
    "faith-small": require("../assets/Faith.jpg"),
    "peace": require("../assets/Peace photo.jpg"),
    "peace-cover": require("../assets/Peace Cover letter.jpg"),
    "background": require("../assets/Background of meditaton screen..jpg"),
  };

  // Convert user meditation to category format
  const convertUserMeditationToCategory = (meditation) => {
    // Get image source - handle both asset files and phone URIs
    let imageSource = null;
    let categoryImageSource = null;
    
    if (meditation.coverImage) {
      if (meditation.coverImage.type === "asset") {
        // Use asset ID to get the actual require() reference
        const assetId = meditation.coverImage.id;
        imageSource = ASSET_IMAGE_MAP[assetId] || ASSET_IMAGE_MAP["background"];
        categoryImageSource = imageSource;
      } else if (meditation.coverImage.type === "phone") {
        imageSource = { uri: meditation.coverImage.uri };
        categoryImageSource = { uri: meditation.coverImage.uri };
      }
    }
    
    // If no cover image, try first image from selectedImages
    if (!imageSource && meditation.images && meditation.images.length > 0) {
      const firstImage = meditation.images[0];
      if (firstImage.type === "asset") {
        const assetId = firstImage.id;
        imageSource = ASSET_IMAGE_MAP[assetId] || ASSET_IMAGE_MAP["background"];
        categoryImageSource = imageSource;
      } else if (firstImage.type === "phone") {
        imageSource = { uri: firstImage.uri };
        categoryImageSource = { uri: firstImage.uri };
      }
    }
    
    // Default fallback image if none provided
    if (!imageSource) {
      imageSource = ASSET_IMAGE_MAP["background"];
      categoryImageSource = ASSET_IMAGE_MAP["background"];
    }
    
    // Get background color or use theme-based color
    let backgroundColor = meditation.backgroundColor || "#1A0F2E";
    
    // Map theme to color if no color specified
    if (!meditation.backgroundColor) {
      const themeColors = {
        Love: "#FF6B6B",
        Peace: "#4ECDC4",
        Joy: "#FFD93D",
        Hope: "#95E1D3",
        Faith: "#A8E6CF",
        Gratitude: "#FFB347",
        Forgiveness: "#87CEEB",
        Strength: "#DDA0DD",
        Comfort: "#F0E68C",
        Wisdom: "#98D8C8",
        Patience: "#FFA07A",
        Courage: "#FF6347",
      };
      backgroundColor = themeColors[meditation.theme] || "#1A0F2E";
    }
    
    return {
      id: meditation.id,
      title: meditation.title,
      creatorName: meditation.creatorName || null, // Store creator name for display
      theme: meditation.theme,
      color: backgroundColor,
      icon: "book", // Default icon for user meditations
      image: imageSource,
      categoryImage: categoryImageSource,
      scriptures: meditation.scriptures || [],
      music: meditation.music || null, // Store music for user-created meditations
      isUserCreated: true, // Flag to identify user-created meditations
      author: meditation.author,
      authorId: meditation.authorId,
    };
  };

  // Load user-created meditations
  const loadUserMeditations = async () => {
    try {
      const meditationsJson = await AsyncStorage.getItem("user_meditations");
      if (meditationsJson) {
        const meditations = JSON.parse(meditationsJson);
        console.log("Loaded user meditations:", meditations.length);
        
        // Convert to category format
        const convertedMeditations = meditations.map(convertUserMeditationToCategory);
        setUserMeditations(convertedMeditations);
        
        // Combine with default categories
        setAllCategories([...meditationCategories, ...convertedMeditations]);
      } else {
        // No user meditations, just use defaults
        setUserMeditations([]);
        setAllCategories(meditationCategories);
      }
    } catch (error) {
      console.error("Error loading user meditations:", error);
      setUserMeditations([]);
      setAllCategories(meditationCategories);
    }
  };

  // Load favorites and progress on mount
  useEffect(() => {
    loadFavorites();
    loadProgress();
    loadUserMeditations(); // Load user meditations
    // Set default music (first available)
    const defaultMusic = MEDITATION_MUSIC.find((m) => m.file !== null);
    if (defaultMusic) {
      setSelectedMusic(defaultMusic.id);
    }
    
    // Configure audio mode for background playback
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  // Reload user meditations when screen comes into focus (so new ones appear immediately)
  useFocusEffect(
    React.useCallback(() => {
      loadUserMeditations();
    }, [])
  );

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Session timer - auto-stop after selected length and update progress
  useEffect(() => {
    if (isPlaying && selectedLength && remainingTime !== null) {
      countdownTimerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          const newTime = prev - 1;
          // Update progress bar (0 = start, 1 = complete)
          const totalSeconds = selectedLength * 60;
          const elapsed = totalSeconds - newTime;
          setProgress(elapsed / totalSeconds);
          return newTime;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (!isPlaying) {
        setProgress(0);
      }
    }

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [isPlaying, selectedLength, remainingTime]);

  // Scripture rotation (every 30 seconds)
  useEffect(() => {
    if (selectedCategory && isPlaying) {
      scriptureTimerRef.current = setInterval(() => {
        setCurrentScriptureIndex((prev) => {
          const next = (prev + 1) % selectedCategory.scriptures.length;
          const nextScripture = selectedCategory.scriptures[next];
          
          // Fade animation for scripture
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();

          // Speak the new scripture using the same voice as Daily Prayer
          if (nextScripture && selectedVoice) {
            const selectedVoiceObj = filteredVoices.find(
              (voice) => voice.identifier === selectedVoice
            );
            
            Speech.speak(nextScripture.verse, {
              language: selectedVoiceObj?.language || "en",
              pitch: 1.0, // Normal pitch (lower was too robotic)
              rate: 0.7, // Slower rate for smoother, more contemplative speech (clearer enunciation)
              voice: selectedVoice,
              quality: Speech.VoiceQuality.Enhanced,
            });
          }
          
          return next;
        });
      }, 30000); // 30 seconds per scripture
    } else {
      if (scriptureTimerRef.current) {
        clearInterval(scriptureTimerRef.current);
      }
    }

    return () => {
      if (scriptureTimerRef.current) {
        clearInterval(scriptureTimerRef.current);
      }
    };
  }, [selectedCategory, isPlaying, selectedVoice, filteredVoices]);

  useEffect(() => {
    return () => {
      // Cleanup
      if (scriptureTimerRef.current) {
        clearInterval(scriptureTimerRef.current);
      }
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (musicSoundRef.current) {
        musicSoundRef.current.unloadAsync();
      }
      if (preloadedMusicRef.current) {
        preloadedMusicRef.current.unloadAsync();
      }
    };
  }, []);

  const loadFavorites = async () => {
    try {
      const favoritesData = await AsyncStorage.getItem("meditationFavorites");
      if (favoritesData) {
        setFavorites(JSON.parse(favoritesData));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const loadProgress = async () => {
    try {
      const progressData = await AsyncStorage.getItem("meditationProgress");
      if (progressData) {
        const progress = JSON.parse(progressData);
        setTotalMinutes(progress.totalMinutes || 0);
        setCurrentStreak(progress.currentStreak || 0);
        setLastMeditationDate(progress.lastMeditationDate || null);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const saveProgress = async (minutes) => {
    try {
      const today = new Date().toDateString();
      const progressData = await AsyncStorage.getItem("meditationProgress");
      let progress = progressData ? JSON.parse(progressData) : { totalMinutes: 0, currentStreak: 0 };
      
      progress.totalMinutes = (progress.totalMinutes || 0) + minutes;
      
      // Update streak
      if (progress.lastMeditationDate === today) {
        // Already meditated today, don't increase streak
      } else if (progress.lastMeditationDate) {
        const lastDate = new Date(progress.lastMeditationDate);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          progress.currentStreak = (progress.currentStreak || 0) + 1;
        } else {
          // Streak broken
          progress.currentStreak = 1;
        }
      } else {
        // First meditation
        progress.currentStreak = 1;
      }
      
      progress.lastMeditationDate = today;
      
      await AsyncStorage.setItem("meditationProgress", JSON.stringify(progress));
      setTotalMinutes(progress.totalMinutes);
      setCurrentStreak(progress.currentStreak);
      setLastMeditationDate(progress.lastMeditationDate);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!selectedCategory) return;
    
    try {
      const isFavorite = favorites.includes(selectedCategory.id);
      let newFavorites;
      
      if (isFavorite) {
        newFavorites = favorites.filter((id) => id !== selectedCategory.id);
      } else {
        newFavorites = [...favorites, selectedCategory.id];
      }
      
      setFavorites(newFavorites);
      await AsyncStorage.setItem("meditationFavorites", JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleVoiceSelect = (voiceIdentifier) => {
    setSelectedVoice(voiceIdentifier);
    setShowVoiceSelector(false);
    
    // If currently playing, restart with new voice
    if (isPlaying && selectedCategory) {
      Speech.stop().then(() => {
        const currentScripture = selectedCategory.scriptures[currentScriptureIndex];
        const selectedVoiceObj = filteredVoices.find(
          (voice) => voice.identifier === voiceIdentifier
        );
        
        Speech.speak(currentScripture.verse, {
          language: selectedVoiceObj?.language || "en",
          pitch: 1.0, // Normal pitch (lower was too robotic)
          rate: 0.7, // Slower rate for smoother, more contemplative speech (clearer enunciation)
          voice: voiceIdentifier,
          quality: Speech.VoiceQuality.Enhanced,
        });
      });
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setCurrentScriptureIndex(0);
    setIsPlaying(false);
    setSelectedLength(null);
    setRemainingTime(null);
    setShowCompletion(false);
    
    // Preload music for this category so it's ready when play is pressed
    // Determine music source
    let musicSource = null;
    if (category && category.isUserCreated && category.music) {
      // User-created meditation music
      if (category.music.type === "asset") {
        const assetId = category.music.id;
        const musicOption = MEDITATION_MUSIC.find((m) => m.id === assetId);
        if (musicOption && musicOption.file) {
          musicSource = musicOption.file;
        }
      } else if (category.music.type === "phone") {
        musicSource = { uri: category.music.uri };
      }
    } else if (selectedMusic) {
      // Default meditation music
      const musicOption = MEDITATION_MUSIC.find((m) => m.id === selectedMusic);
      if (musicOption && musicOption.file) {
        musicSource = musicOption.file;
      }
    }
    
    // Preload music in background (don't block UI)
    if (musicSource) {
      // Unload any previously preloaded music
      if (preloadedMusicRef.current) {
        try {
          await preloadedMusicRef.current.unloadAsync();
        } catch (e) {
          console.log("Error unloading preloaded music:", e);
        }
        preloadedMusicRef.current = null;
      }
      
      // Preload music (but don't play yet)
      Audio.Sound.createAsync(
        musicSource,
        { shouldPlay: false, isLooping: true, volume: 0.3 }
      ).then(({ sound }) => {
        preloadedMusicRef.current = sound;
        console.log("[MusicPreload] ✅ Music preloaded and ready");
      }).catch((error) => {
        console.error("[MusicPreload] ❌ Error preloading music:", error);
        preloadedMusicRef.current = null;
      });
    }
  };

  const handleLengthSelect = (length) => {
    setSelectedLength(length);
    setRemainingTime(length * 60); // Convert to seconds
    setShowLengthSelector(false);
  };

  const handlePlayPause = async () => {
    if (!selectedCategory) return;

    // If no length selected, show selector
    if (!selectedLength && !isPlaying) {
      setShowLengthSelector(true);
      return;
    }

    if (isPlaying) {
      // Stop meditation AND music completely
      await Speech.stop();
      setIsPlaying(false);
      
      // Stop and unload music completely
      if (musicSoundRef.current) {
        try {
          console.log("Stopping music on pause...");
          await musicSoundRef.current.stopAsync();
          await musicSoundRef.current.unloadAsync();
          console.log("Music stopped and unloaded on pause");
        } catch (error) {
          console.log("Error stopping music on pause:", error);
          // Continue anyway - try to clean up
        }
        musicSoundRef.current = null;
        setBackgroundMusic(null);
        setIsMusicPlaying(false);
      }
      
      // Also clean up preloaded music if it exists
      if (preloadedMusicRef.current) {
        try {
          await preloadedMusicRef.current.unloadAsync();
        } catch (e) {
          console.log("Error unloading preloaded music on pause:", e);
        }
        preloadedMusicRef.current = null;
      }
      
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      setProgress(0);
    } else {
      // Start meditation AND music together
      setIsPlaying(true);
      
      // Get current scripture and voice info first
      const currentScripture = selectedCategory.scriptures[currentScriptureIndex];
      const selectedVoiceObj = filteredVoices.find(
        (voice) => voice.identifier === selectedVoice
      );

      // Start music and speech in PARALLEL (not sequential) to avoid delay
      // Determine music source - check for user-created meditation music first
      let musicSource = null;
      if (selectedCategory && selectedCategory.isUserCreated && selectedCategory.music) {
        // User-created meditation music
        if (selectedCategory.music.type === "asset") {
          // Asset music from user meditation - find in MEDITATION_MUSIC
          const assetId = selectedCategory.music.id;
          const musicOption = MEDITATION_MUSIC.find((m) => m.id === assetId);
          if (musicOption && musicOption.file) {
            musicSource = musicOption.file;
          }
        } else if (selectedCategory.music.type === "phone") {
          // Phone music from user meditation
          musicSource = { uri: selectedCategory.music.uri };
        }
      } else if (selectedMusic) {
        // Default meditation music
        const musicOption = MEDITATION_MUSIC.find((m) => m.id === selectedMusic);
        if (musicOption && musicOption.file) {
          musicSource = musicOption.file;
        }
      }

      // Use preloaded music if available, otherwise load it
      if (musicSource) {
        // Stop and unload any existing playing music first (quick cleanup)
        if (musicSoundRef.current) {
          try {
            await musicSoundRef.current.stopAsync();
            await musicSoundRef.current.unloadAsync();
          } catch (e) {
            console.log("Error stopping existing music:", e);
          }
          musicSoundRef.current = null;
          setBackgroundMusic(null);
          setIsMusicPlaying(false);
        }
        
        // Use preloaded music if available (instant start!)
        if (preloadedMusicRef.current) {
          try {
            musicSoundRef.current = preloadedMusicRef.current;
            setBackgroundMusic(preloadedMusicRef.current);
            await preloadedMusicRef.current.playAsync();
            setIsMusicPlaying(true);
            console.log("[MusicPlay] ✅ Using preloaded music - instant start!");
            // Clear preloaded ref since we're now using it
            preloadedMusicRef.current = null;
          } catch (error) {
            console.error("[MusicPlay] Error playing preloaded music:", error);
            // Fallback to loading fresh
            preloadedMusicRef.current = null;
            Audio.Sound.createAsync(
              musicSource,
              { shouldPlay: true, isLooping: true, volume: 0.3 }
            ).then(({ sound }) => {
              musicSoundRef.current = sound;
              setBackgroundMusic(sound);
              setIsMusicPlaying(true);
              console.log("[MusicPlay] Music loaded and started (fallback)");
            }).catch((err) => {
              console.error("[MusicPlay] Error starting music:", err);
              setIsMusicPlaying(false);
            });
          }
        } else {
          // No preloaded music - load it now (fallback)
          console.log("[MusicPlay] No preloaded music, loading now...");
          Audio.Sound.createAsync(
            musicSource,
            { shouldPlay: true, isLooping: true, volume: 0.3 }
          ).then(({ sound }) => {
            musicSoundRef.current = sound;
            setBackgroundMusic(sound);
            setIsMusicPlaying(true);
            console.log("[MusicPlay] Music loaded and started");
          }).catch((error) => {
            console.error("[MusicPlay] Error starting music:", error);
            setIsMusicPlaying(false);
          });
        }
      }

      // Start speech immediately (don't wait for music)
      Speech.speak(currentScripture.verse, {
        language: selectedVoiceObj?.language || "en",
        pitch: 1.0, // Normal pitch (lower was too robotic)
        rate: 0.7, // Slower rate for smoother, more contemplative speech (clearer enunciation)
        voice: selectedVoice, // Use the better quality voice
        quality: Speech.VoiceQuality.Enhanced, // Enhanced quality like Daily Prayer
      });
    }
  };

  const handleSessionComplete = async () => {
    setIsPlaying(false);
    await Speech.stop();
    if (musicSoundRef.current) {
      try {
        await musicSoundRef.current.stopAsync();
        await musicSoundRef.current.unloadAsync();
      } catch (error) {
        console.log("Error stopping music on completion:", error);
      }
      musicSoundRef.current = null;
      setBackgroundMusic(null);
      setIsMusicPlaying(false);
    }
    
    // Save progress
    if (selectedLength) {
      await saveProgress(selectedLength);
    }
    
    setShowCompletion(true);
    setSelectedLength(null);
    setRemainingTime(null);
    setProgress(0);
  };

  const handleMusicSelect = async (musicId) => {
    console.log("Selecting music:", musicId);
    
    // STOP EVERYTHING FIRST - Stop meditation and music
    if (isPlaying) {
      await Speech.stop();
      setIsPlaying(false);
    }
    
    // Stop and unload any playing music
    if (musicSoundRef.current) {
      try {
        console.log("Stopping old music...");
        await musicSoundRef.current.stopAsync();
        await musicSoundRef.current.unloadAsync();
        musicSoundRef.current = null;
        setBackgroundMusic(null);
        setIsMusicPlaying(false);
        console.log("Old music stopped and unloaded");
      } catch (error) {
        console.error("Error stopping old music:", error);
        // Continue anyway
        musicSoundRef.current = null;
        setBackgroundMusic(null);
        setIsMusicPlaying(false);
      }
    }
    
    // Clear timers
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    // Reset progress
    setProgress(0);
    
    // Update selected music
    setSelectedMusic(musicId);
    setShowMusicSelector(false);
    
    // Pre-load the new music so it's ready to play immediately (no delay when pressing play)
    const musicOption = MEDITATION_MUSIC.find((m) => m.id === musicId);
    if (musicOption && musicOption.file) {
      try {
        // Pre-load music (but don't play yet) - this happens in background
        Audio.Sound.createAsync(
          musicOption.file,
          { shouldPlay: false, isLooping: true, volume: 0.3 }
        ).then(({ sound }) => {
          // Store it but don't set as playing yet
          musicSoundRef.current = sound;
          setBackgroundMusic(sound);
          console.log("New music pre-loaded:", musicOption.name, "- Ready to play instantly");
        }).catch((error) => {
          console.error("Error pre-loading music:", error);
        });
      } catch (error) {
        console.error("Error pre-loading music:", error);
      }
    }
    
    console.log("Music changed to:", musicId, "- Meditation stopped. Press play to start with new music.");
  };

  const handleMusicToggle = async () => {
    try {
      console.log("handleMusicToggle called, isMusicPlaying:", isMusicPlaying);
      console.log("selectedMusic:", selectedMusic);
      
      if (isMusicPlaying) {
        // STOP music completely (not just pause)
        console.log("Stopping music...");
        if (musicSoundRef.current) {
          try {
            await musicSoundRef.current.stopAsync();
            await musicSoundRef.current.unloadAsync();
            console.log("Music stopped and unloaded");
          } catch (error) {
            console.log("Error stopping music:", error);
            // Continue anyway
          }
          musicSoundRef.current = null;
          setBackgroundMusic(null);
        }
        setIsMusicPlaying(false);
        console.log("Music stopped");
      } else {
        // Start music
        console.log("Starting music...");
        if (!selectedMusic) {
          // No music selected, show selector
          console.log("No music selected, showing selector");
          setShowMusicSelector(true);
          return;
        }

        // Check if it's a user-created meditation with custom music
        let musicSource = null;
        if (selectedCategory && selectedCategory.isUserCreated && selectedCategory.music) {
          // User-created meditation music
          if (selectedCategory.music.type === "asset") {
            // Asset music from user meditation
            const assetId = selectedCategory.music.id;
            musicSource = ASSET_IMAGE_MAP[assetId] || null; // We'll need to create a music map
          } else if (selectedCategory.music.type === "phone") {
            // Phone music from user meditation
            musicSource = { uri: selectedCategory.music.uri };
          }
        } else {
          // Default meditation music
          const musicOption = MEDITATION_MUSIC.find((m) => m.id === selectedMusic);
          if (musicOption && musicOption.file) {
            musicSource = musicOption.file;
          }
        }

        if (!musicSource) {
          console.log("Music source not available, showing selector");
          setShowMusicSelector(true);
          return;
        }

        // Always create a new sound instance for reliability
        console.log("Creating new music sound...");
        const { sound } = await Audio.Sound.createAsync(
          musicSource,
          { shouldPlay: true, isLooping: true, volume: 0.3 }
        );
        musicSoundRef.current = sound;
        setBackgroundMusic(sound);
        setIsMusicPlaying(true);
        console.log("Music sound created and playing");
      }
    } catch (error) {
      console.error("Error toggling music:", error);
      console.error("Error details:", error.message, error.stack);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // If category is selected, show meditation view
  if (selectedCategory) {
    const currentScripture = selectedCategory.scriptures[currentScriptureIndex];
    const isFavorite = favorites.includes(selectedCategory.id);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.meditationView}>
          {/* Full Screen Image Background - ONE image, no transitions */}
          <ImageBackground
            source={selectedCategory.image}
            style={styles.fullScreenImage}
            resizeMode="cover"
            defaultSource={require("../assets/Background of meditaton screen..jpg")} // Fallback to prevent black screen
          >
            <View style={styles.imageOverlay}>
              {/* Scripture Overlay */}
              <Animated.View
                style={[
                  styles.scriptureOverlay,
                  { opacity: fadeAnim },
                ]}
              >
                <Text style={styles.scriptureVerse}>"{currentScripture.verse}"</Text>
                <Text style={styles.scriptureReference}>
                  — {currentScripture.reference}
                </Text>
              </Animated.View>

              {/* "Made by [name]" overlay at bottom if user-created and has creatorName */}
              {selectedCategory.isUserCreated && selectedCategory.creatorName && (
                <View style={styles.madeByContainer}>
                  <Text style={styles.madeByText}>
                    Made by {selectedCategory.creatorName}
                  </Text>
                </View>
              )}


              {/* YouTube-style Bottom Controls */}
              <View style={styles.bottomControlsContainer}>
                {/* Progress Bar */}
                {isPlaying && selectedLength && (
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progress * 100}%` },
                        ]}
                      />
                    </View>
                  </View>
                )}

                {/* Control Buttons Row */}
                <View style={styles.bottomControlsRow}>
                  {/* Big Play Button */}
                  <TouchableOpacity
                    style={styles.bigPlayButton}
                    onPress={handlePlayPause}
                  >
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={36}
                      color="#fff"
                    />
                  </TouchableOpacity>

                  {/* Voice Selector Button */}
                  <TouchableOpacity
                    style={styles.sideButton}
                    onPress={() => setShowVoiceSelector(true)}
                  >
                    <Ionicons
                      name="mic"
                      size={24}
                      color="#fff"
                    />
                  </TouchableOpacity>

                  {/* Music Selector Button */}
                  <TouchableOpacity
                    style={styles.sideButton}
                    onPress={() => setShowMusicSelector(true)}
                  >
                    <Ionicons
                      name="musical-notes"
                      size={24}
                      color="#fff"
                    />
                  </TouchableOpacity>

                  {/* Favorite Button */}
                  <TouchableOpacity
                    style={styles.sideButton}
                    onPress={toggleFavorite}
                  >
                    <Ionicons
                      name={isFavorite ? "heart" : "heart-outline"}
                      size={24}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButtonTop}
                onPress={() => {
                  setSelectedCategory(null);
                  setIsPlaying(false);
                  if (musicSoundRef.current) {
                    musicSoundRef.current.pauseAsync();
                    setIsMusicPlaying(false);
                  }
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </ImageBackground>

          {/* Session Length Selector Modal */}
          <Modal
            visible={showLengthSelector}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowLengthSelector(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Duration</Text>
                <Text style={styles.modalSubtitle}>How long would you like to meditate?</Text>
                {SESSION_LENGTHS.map((length) => (
                  <TouchableOpacity
                    key={length}
                    style={styles.lengthOption}
                    onPress={() => handleLengthSelect(length)}
                  >
                    <Text style={styles.lengthOptionText}>{length} minutes</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowLengthSelector(false)}
                >
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Voice Selector Modal */}
          <Modal
            visible={showVoiceSelector}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowVoiceSelector(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.voiceModalContent}>
                <View style={styles.voiceModalHeader}>
                  <Text style={styles.voiceModalTitle}>Select Voice</Text>
                  <TouchableOpacity
                    style={styles.voiceModalCloseButton}
                    onPress={() => setShowVoiceSelector(false)}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.voiceList}>
                  {filteredVoices.map((voice) => (
                    <TouchableOpacity
                      key={voice.identifier}
                      style={[
                        styles.voiceOption,
                        selectedVoice === voice.identifier && styles.selectedVoiceOption,
                      ]}
                      onPress={() => handleVoiceSelect(voice.identifier)}
                    >
                      <View style={styles.voiceOptionContent}>
                        <Text style={styles.voiceName}>{voice.displayName || voice.name}</Text>
                        <Text style={styles.voiceLanguage}>{voice.language}</Text>
                      </View>
                      {selectedVoice === voice.identifier && (
                        <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Music Selector Modal */}
          <Modal
            visible={showMusicSelector}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowMusicSelector(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.voiceModalContent}>
                <View style={styles.voiceModalHeader}>
                  <Text style={styles.voiceModalTitle}>Select Music</Text>
                  <TouchableOpacity
                    style={styles.voiceModalCloseButton}
                    onPress={() => setShowMusicSelector(false)}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.voiceList}>
                  {MEDITATION_MUSIC.map((music) => (
                    <TouchableOpacity
                      key={music.id}
                      style={[
                        styles.voiceOption,
                        selectedMusic === music.id && styles.selectedVoiceOption,
                        !music.file && styles.disabledOption,
                      ]}
                      onPress={() => {
                        if (music.file) {
                          handleMusicSelect(music.id);
                        }
                      }}
                      disabled={!music.file}
                    >
                      <View style={styles.voiceOptionContent}>
                        <Text style={[styles.voiceName, !music.file && styles.disabledText]}>
                          {music.name}
                        </Text>
                        <Text style={[styles.voiceLanguage, !music.file && styles.disabledText]}>
                          {music.description}
                          {!music.file && " (Coming soon)"}
                        </Text>
                      </View>
                      {selectedMusic === music.id && music.file && (
                        <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Completion Modal */}
          <Modal
            visible={showCompletion}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowCompletion(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Ionicons name="checkmark-circle" size={64} color="#4ECDC4" />
                <Text style={styles.completionTitle}>Meditation Complete!</Text>
                <Text style={styles.completionText}>
                  Great job! You've completed {selectedLength} minutes of meditation.
                </Text>
                <TouchableOpacity
                  style={styles.completionButton}
                  onPress={() => {
                    setShowCompletion(false);
                    setSelectedCategory(null);
                  }}
                >
                  <Text style={styles.completionButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    );
  }

  // Category selection view
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("../assets/Background of meditaton screen..jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.colorLayer}>
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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
              <Text style={styles.headerTitle}>Meditation</Text>
              <Text style={styles.headerSubtitle}>
                {formatDate(currentTime)} • {formatTime(currentTime)}
              </Text>
            </View>
          </View>


          {/* Category Grid - 2 columns */}
          <View style={styles.categoriesGrid}>
            {allCategories.map((category) => {
              const isFavorite = favorites.includes(category.id);
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleCategorySelect(category)}
                >
                  <ImageBackground
                    source={category.categoryImage}
                    style={styles.categoryImage}
                    resizeMode="cover"
                    defaultSource={require("../assets/Background of meditaton screen..jpg")} // Fallback to prevent black screen
                  >
                    <View style={styles.categoryOverlay}>
                      {isFavorite && (
                        <View style={styles.favoriteBadge}>
                          <Ionicons name="heart" size={16} color="#FF6B6B" />
                        </View>
                      )}
                      {category.isUserCreated && (
                        <View style={styles.userCreatedBadge}>
                          <Ionicons name="person" size={12} color="#fff" />
                        </View>
                      )}
                      <Text style={styles.categoryTitle}>{category.title}</Text>
                      {category.theme && (
                        <Text style={styles.categoryTheme}>{category.theme}</Text>
                      )}
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Create Meditation Button */}
          <TouchableOpacity
            style={styles.createMeditationButton}
            onPress={() => navigation.navigate("CreateMeditation")}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.createMeditationButtonText}>Create Meditation</Text>
          </TouchableOpacity>
        </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A0F2E", // Darker, more muted purple
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  colorLayer: {
    flex: 1,
    backgroundColor: "rgba(26, 15, 46, 0.3)", // Semi-transparent purple overlay for readability
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
    color: "#fff",
    opacity: 0.8,
  },
  // Category Grid
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: (width - 44) / 2, // 2 columns with gaps
    height: 180,
    borderRadius: 20,
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
    justifyContent: "flex-end",
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 20,
  },
  favoriteBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    padding: 6,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoryTheme: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
    marginTop: 4,
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userCreatedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(26, 54, 93, 0.8)",
    borderRadius: 10,
    padding: 4,
  },
  // Meditation View
  meditationView: {
    flex: 1,
    backgroundColor: "#1A0F2E", // Darker, more muted purple
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  scriptureOverlay: {
    // No background - text directly on image
    padding: 30,
    maxWidth: "90%",
  },
  scriptureVerse: {
    fontSize: 24,
    color: "#fff", // White text
    lineHeight: 36,
    textAlign: "center",
    marginBottom: 15,
    fontStyle: "italic",
    fontWeight: "500",
    textShadowColor: "rgba(0, 0, 0, 0.8)", // Dark shadow for readability
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  scriptureReference: {
    fontSize: 18,
    color: "#fff", // White text
    textAlign: "center",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.8)", // Dark shadow for readability
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  madeByContainer: {
    position: "absolute",
    bottom: 100, // Above the controls
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  madeByText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // YouTube-style Bottom Controls
  bottomControlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  progressBarContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  progressBarBackground: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  bottomControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 16,
  },
  bigPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 30,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  backButtonTop: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  lengthOption: {
    width: "100%",
    padding: 18,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  lengthOptionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A0F2E",
  },
  modalCloseButton: {
    marginTop: 12,
    padding: 12,
  },
  modalCloseText: {
    fontSize: 16,
    color: "#666",
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
  },
  completionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  completionButton: {
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
  },
  completionButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  // Voice Selector Modal Styles
  voiceModalContent: {
    backgroundColor: "#1A0F2E",
    borderRadius: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    padding: 0,
    overflow: "hidden",
  },
  voiceModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  voiceModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  voiceModalCloseButton: {
    padding: 5,
  },
  voiceList: {
    maxHeight: 400,
  },
  voiceOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedVoiceOption: {
    backgroundColor: "rgba(78, 205, 196, 0.2)",
  },
  voiceOptionContent: {
    flex: 1,
  },
  voiceName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  voiceLanguage: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.7,
  },
  disabledOption: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
  // Create Meditation Button
  createMeditationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a365d", // Deep navy color
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 12, // Smaller padding
    paddingHorizontal: 20, // Smaller padding
    borderRadius: 20, // Smaller border radius
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  createMeditationButtonText: {
    fontSize: 16, // Smaller font
    fontWeight: "600",
    color: "#fff",
    marginLeft: 6, // Smaller margin
  },
});

export default MeditationScreen;
