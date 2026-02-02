import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Modal,
  Alert,
  Share,
  ImageBackground,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import * as Speech from "expo-speech";
import TimeBasedPrayerService from "../services/TimeBasedPrayerService";
import VoiceService from "../services/VoiceService";
import PrayerBackgroundService from "../services/PrayerBackgroundService";
import PrayerScriptureCommentService from "../services/PrayerScriptureCommentService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import VideoCacheService from "../services/VideoCacheService";

const { width, height } = Dimensions.get("window");

// Asset wallpaper mapping (same as CreatePartnerPrayerScreen)
const ASSET_WALLPAPER_MAP = {
  "morning-bg": require("../assets/background-morning-picture.jpg"),
  "afternoon-bg": require("../assets/background-afternoon-picture.jpg"),
  "night-bg": require("../assets/background-night-picture.jpg"),
  "field-1920": require("../assets/field-3629120_640.jpg"),
  "sea-1920": require("../assets/sea-4242303_640.jpg"),
  joy: require("../assets/Joy Photo.jpg"),
  hope: require("../assets/Hope Photo.jpg"),
  faith: require("../assets/Faith photo.jpg"),
  peace: require("../assets/Peace photo.jpg"),
  "meditation-bg": require("../assets/Background of meditaton screen..jpg"),
  tree: require("../assets/photorealistic-view-tree-nature-with-branches-trunk.jpg"),
  bible: require("../assets/open-bible-black-background.jpg"),
};

const DailyPrayerScreen = ({ navigation }) => {
  const [dailyPrayer, setDailyPrayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [videoHeight, setVideoHeight] = useState(300); // Fixed height to prevent re-renders
  const videoContainerWidthRef = useRef(null); // Use ref instead of state to prevent re-renders
  const videoAspectRatioRef = useRef(null); // Use ref instead of state to prevent re-renders
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicInstances, setMusicInstances] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("device-0");
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [deviceVoices, setDeviceVoices] = useState([]);
  const [filteredVoices, setFilteredVoices] = useState([]);
  const [wallpaper, setWallpaper] = useState(null);
  const [isPrayerSaved, setIsPrayerSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const isVideoPlayingRef = useRef(false); // Track actual state without re-renders
  const [videoStatus, setVideoStatus] = useState({
    positionMillis: 0,
    durationMillis: 0,
  });
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const lastPlayingStateRef = useRef(false); // Track last playing state to avoid unnecessary updates
  const videoHeightSetRef = useRef(false); // Track if height has been set to prevent updates during playback
  const previousVideoUriRef = useRef(null); // Track video URI to reset height flag when video changes
  const [cachedVideoUri, setCachedVideoUri] = useState(null); // Cached video URI
  const [isVideoReady, setIsVideoReady] = useState(false); // Track if video is preloaded and ready

  // Use expo-av Video (same as community videos) - it works reliably
  const videoRef = useRef(null);

  // Memoize the video poster to prevent recreation on every render
  const videoPoster = useMemo(() => {
    if (!dailyPrayer?.video?.thumbnail) return undefined;
    return { uri: dailyPrayer.video.thumbnail };
  }, [dailyPrayer?.video?.thumbnail]);

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

  // Initialize video cache on mount
  useEffect(() => {
    VideoCacheService.initialize();
  }, []);

  useEffect(() => {
    const loadPrayer = async () => {
      const prayer = await TimeBasedPrayerService.getTimeBasedPrayer();
      console.log("Daily prayer loaded:", prayer);
      const prayerId = prayer?.id || prayer?.title;
      currentPrayerIdRef.current = prayerId;
      setDailyPrayer(prayer);
      loadWallpaper();
      loadComments(prayer);

      // Get cached video URI if available, otherwise PRELOAD before allowing play
      if (prayer?.video?.uri) {
        try {
          console.log("[VideoCache] Checking cache for:", prayer.video.uri);
          const isCached = await VideoCacheService.isCached(prayer.video.uri);
          console.log("[VideoCache] Is cached?", isCached);

          if (isCached) {
            const cachedPath = VideoCacheService.getCachedPath(
              prayer.video.uri
            );
            console.log("[VideoCache] ✅ Using cached video:", cachedPath);
            setCachedVideoUri(cachedPath);
            setIsVideoReady(true); // Cached videos are ready immediately
          } else {
            console.log(
              "[VideoCache] ❌ Not cached, PRELOADING before play..."
            );
            setCachedVideoUri(null);
            setIsVideoReady(false); // Not ready until preloaded

            // PRELOAD: Download cache BEFORE allowing play
            try {
              console.log("[VideoCache] Starting preload...");
              const cachedPath = await VideoCacheService.preCacheVideo(
                prayer.video.uri
              );
              if (cachedPath) {
                console.log(
                  "[VideoCache] ✅ Preload complete, using cached:",
                  cachedPath
                );
                setCachedVideoUri(cachedPath);
                setIsVideoReady(true);
              } else {
                console.log(
                  "[VideoCache] ⚠️ Preload failed, using network (may buffer)"
                );
                setCachedVideoUri(null);
                setIsVideoReady(true); // Allow play anyway after timeout
              }
            } catch (error) {
              console.log("[VideoCache] Preload error:", error);
              setCachedVideoUri(null);
              // Wait a bit then allow play (video will buffer)
              setTimeout(() => {
                setIsVideoReady(true);
                console.log("[VideoCache] Allowing play after timeout");
              }, 3000);
            }
          }
        } catch (error) {
          console.log("[VideoCache] Error getting cached URI:", error);
          setCachedVideoUri(null);
          setIsVideoReady(true); // Allow play anyway
        }
      } else {
        setCachedVideoUri(null);
        setIsVideoReady(true);
      }
    };
    loadPrayer();
  }, []);

  const loadComments = async (prayer) => {
    if (!prayer) return;
    try {
      const prayerId = PrayerScriptureCommentService.getItemId(prayer);
      const prayerComments =
        await PrayerScriptureCommentService.getPrayerComments(prayerId);
      setComments(prayerComments);
      setCommentCount(prayerComments.length);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  // Reload prayer when screen comes into focus (to show newly selected partner prayers)
  // Use ref to track current prayer ID to avoid dependency issues
  const currentPrayerIdRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      const loadPrayer = async () => {
        const newPrayer = await TimeBasedPrayerService.getTimeBasedPrayer();
        const newPrayerId = newPrayer?.id || newPrayer?.title;

        // Only reload if prayer actually changed
        if (currentPrayerIdRef.current !== newPrayerId) {
          // Only pause if video is playing and prayer changed (different video)
          if (videoRef.current) {
            try {
              const status = await videoRef.current.getStatusAsync();
              if (status.isPlaying) {
                await videoRef.current.pauseAsync();
                setIsVideoPlaying(false);
              }
            } catch (error) {
              console.error("Error stopping video:", error);
            }
          }
          console.log("Daily prayer reloaded:", newPrayer);
          currentPrayerIdRef.current = newPrayerId;
          setDailyPrayer(newPrayer);
          loadWallpaper();
          loadComments(newPrayer);
        }
        // Don't reload if prayer hasn't changed - let video continue playing
      };
      loadPrayer();
    }, []) // Empty dependency array - only run on focus
  );

  // Cleanup video on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(() => {});
      }
    };
  }, []);

  // Update video height when video loads - ONLY set once per video, never update during playback
  const handleVideoLoad = useCallback(
    (status) => {
      // Reset height flag if video URI changed
      if (
        dailyPrayer?.video?.uri &&
        previousVideoUriRef.current !== dailyPrayer.video.uri
      ) {
        videoHeightSetRef.current = false;
        previousVideoUriRef.current = dailyPrayer.video.uri;
      }

      // Only set height once per video load - never update during playback
      if (videoHeightSetRef.current) return;

      try {
        const natural = status?.naturalSize;
        if (natural && natural.width && natural.height) {
          const ratio = natural.width / natural.height;
          if (ratio && isFinite(ratio) && ratio > 0) {
            videoAspectRatioRef.current = ratio;
            const fullContainerWidth =
              videoContainerWidthRef.current || width - 24 - 40;
            const containerWidth = fullContainerWidth * 0.85;
            const videoBasedHeight = containerWidth / ratio;
            const minHeight = 250;
            const maxHeight = height * 0.65;
            const finalHeight = Math.max(
              minHeight,
              Math.min(videoBasedHeight, maxHeight)
            );
            const newHeight = Math.floor(finalHeight);
            // Set height immediately on load, before video starts playing
            setVideoHeight(newHeight);
            videoHeightSetRef.current = true;
          }
        }
      } catch (e) {
        if (!videoHeightSetRef.current) {
          setVideoHeight(300);
          videoHeightSetRef.current = true;
        }
      }
    },
    [dailyPrayer?.video?.uri]
  );

  // REMOVED onPlaybackStatusUpdate completely - the callback itself was causing pauses
  // Videos will play without any status callbacks - we'll check status only on user interaction

  // NO automatic status updates - only update on user interaction
  // This completely prevents re-renders that cause pauses
  // Videos will play smoothly without any polling or listeners

  const loadWallpaper = async () => {
    try {
      // Skip wallpaper loading for now to avoid error
      // const wallpaperData = await PrayerBackgroundService.getRandomWallpaper();
      // setWallpaper(wallpaperData);
    } catch (error) {
      console.error("Error loading wallpaper:", error);
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await Speech.stop();
      setIsPlaying(false);
    } else {
      if (dailyPrayer) {
        const selectedVoiceObj = filteredVoices.find(
          (voice) => voice.identifier === selectedVoice
        );

        await Speech.speak(dailyPrayer.prayer, {
          language: selectedVoiceObj?.language || "en",
          pitch: 1.0,
          rate: 0.8,
          voice: selectedVoice,
        });
        setIsPlaying(true);
      }
    }
  };

  const handleVoiceSelect = (voiceIdentifier) => {
    setSelectedVoice(voiceIdentifier);
    setShowVoiceSelector(false);
  };

  const handleSavePrayer = async () => {
    try {
      console.log("=== SAVE PRAYER FUNCTION CALLED ===");
      console.log("dailyPrayer exists?", !!dailyPrayer);
      console.log("isPrayerSaved?", isPrayerSaved);

      if (!dailyPrayer) {
        console.error("ERROR: dailyPrayer is null or undefined!");
        Alert.alert("Error", "Prayer data is not available");
        return;
      }

      if (!isPrayerSaved) {
        // Save prayer to user's saved prayers
        const savedPrayer = {
          id: `daily-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: dailyPrayer.title || "Daily Prayer",
          prayer: dailyPrayer.prayer || "",
          theme: dailyPrayer.theme || "General",
          type: "daily",
          savedAt: new Date().toISOString(),
        };

        console.log("=== SAVING PRAYER ===");
        console.log("Prayer object:", savedPrayer);

        // Get existing prayers with fresh read
        console.log("Reading from AsyncStorage...");
        const existingPrayersRaw = await AsyncStorage.getItem("savedPrayers");
        console.log("Raw data from storage:", existingPrayersRaw);
        console.log("Type of raw data:", typeof existingPrayersRaw);

        let prayers = [];
        if (existingPrayersRaw) {
          try {
            prayers = JSON.parse(existingPrayersRaw);
            console.log("Parsed prayers array:", prayers);
            console.log("Type of parsed:", Array.isArray(prayers));
            console.log("Length of array:", prayers?.length);
          } catch (parseError) {
            console.error("Error parsing existing prayers:", parseError);
            prayers = [];
          }
        } else {
          console.log("No existing prayers found, starting with empty array");
        }

        // Ensure prayers is an array
        if (!Array.isArray(prayers)) {
          console.warn("Prayers is not an array, resetting to empty array");
          prayers = [];
        }

        // Add new prayer
        prayers.push(savedPrayer);
        console.log("Updated prayers array length:", prayers.length);
        console.log("Last prayer in array:", prayers[prayers.length - 1]);

        // Save back to storage with verification
        console.log("Writing to AsyncStorage...");
        await AsyncStorage.setItem("savedPrayers", JSON.stringify(prayers));
        console.log("✓ Written to storage");

        // Immediate verification
        const verifyRaw = await AsyncStorage.getItem("savedPrayers");
        console.log("Verification - raw data:", verifyRaw);
        if (verifyRaw) {
          const verifyParsed = JSON.parse(verifyRaw);
          console.log(
            "Verification - parsed array length:",
            verifyParsed.length
          );
          console.log(
            "Verification - last prayer:",
            verifyParsed[verifyParsed.length - 1]
          );
        }

        setIsPrayerSaved(true);
        setSaveCount((prev) => prev + 1);

        console.log("=== PRAYER SAVE PROCESS COMPLETED ===");
      } else {
        console.log("Prayer already saved, showing alert");
        Alert.alert(
          "Already Saved",
          "This prayer is already in your saved prayers."
        );
      }
    } catch (error) {
      console.error("=== ERROR SAVING PRAYER ===");
      console.error("Error details:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      Alert.alert("Error", "Failed to save prayer: " + error.message);
    }
  };

  const handleSharePrayer = async () => {
    try {
      const shareContent = {
        message: `"${dailyPrayer.prayer}"\n\n- ${dailyPrayer.title} (${dailyPrayer.theme})\n\nShared from Bible Community App`,
        title: dailyPrayer.title,
      };

      const result = await Share.share(shareContent);

      if (result.action === Share.sharedAction) {
        console.log("Prayer shared successfully");
      }
    } catch (error) {
      console.error("Error sharing prayer:", error);
      Alert.alert("Error", "Failed to share prayer");
    }
  };

  const handleBookmarkPrayer = () => {
    // Navigate to saved prayers page
    try {
      navigation.navigate("MyPrayersScreen");
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert(
        "Navigation Error",
        "Could not navigate to My Prayers screen"
      );
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    if (!dailyPrayer) {
      Alert.alert("Error", "Prayer not available");
      return;
    }

    try {
      const comment = await PrayerScriptureCommentService.addPrayerComment(
        dailyPrayer,
        newComment
      );
      setComments((prev) => [...prev, comment]);
      setCommentCount((prev) => prev + 1);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
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

  const formatVideoTime = (millis) => {
    if (!millis || isNaN(millis)) return "0:00";
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Memoize wallpaper source to prevent re-renders - only recalculate when dailyPrayer changes
  // Must be called before early return to follow Rules of Hooks
  const wallpaperSource = useMemo(() => {
    if (!dailyPrayer) return null;

    // Handle default prayers (wallpaper is just a string like "morning", "afternoon", "evening")
    if (typeof dailyPrayer.wallpaper === "string") {
      return null; // Default prayers should use white card
    }

    // Handle partner prayers with wallpaper object
    if (!dailyPrayer.wallpaper) {
      return null;
    }

    if (dailyPrayer.wallpaper.type === "asset") {
      const wallpaperFile = ASSET_WALLPAPER_MAP[dailyPrayer.wallpaper.id];
      return wallpaperFile || null;
    }

    if (dailyPrayer.wallpaper.type === "phone") {
      return { uri: dailyPrayer.wallpaper.uri };
    }

    return null;
  }, [
    dailyPrayer?.wallpaper?.type,
    dailyPrayer?.wallpaper?.id,
    dailyPrayer?.wallpaper?.uri,
  ]);

  const textColor = dailyPrayer?.textColor || "black";
  const textStyle = { color: textColor === "white" ? "#fff" : "#000" };
  const hasWallpaper = wallpaperSource !== null;

  if (!dailyPrayer) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading prayer...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {hasWallpaper ? (
        <View style={styles.containerWithWallpaper}>
          {/* Dark Background with Wallpaper */}
          <ImageBackground
            source={wallpaperSource}
            style={styles.darkBackground}
            resizeMode="cover"
          >
            <View style={styles.darkBackgroundOverlay} />
          </ImageBackground>

          {/* Header - Always White */}
          <View style={styles.headerWhite}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitleWhite}>Daily Prayer</Text>
              <Text style={styles.headerSubtitleWhite}>
                {formatDate(currentTime)} • {formatTime(currentTime)}
              </Text>
            </View>
          </View>

          {/* White Page Container */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true}
            removeClippedSubviews={false}
          >
            <View style={styles.whitePageContainer}>
              {/* Prayer Box with Wallpaper */}
              <View style={styles.prayerBoxContainer}>
                <ImageBackground
                  source={wallpaperSource}
                  style={styles.prayerBoxBackground}
                  resizeMode="cover"
                >
                  <View style={styles.prayerBoxOverlay} />
                  <View style={styles.prayerBoxContent}>
                    <View style={styles.themeBadge}>
                      <Text style={[styles.themeText, textStyle]}>
                        {dailyPrayer.theme}
                      </Text>
                    </View>

                    <Text style={[styles.prayerTitle, textStyle]}>
                      {dailyPrayer.title}
                    </Text>

                    <Text style={[styles.prayerText, textStyle]}>
                      {dailyPrayer.prayer}
                    </Text>
                  </View>
                </ImageBackground>
              </View>

              {/* Separator Line */}
              <View style={styles.separatorLine} />

              {/* Video Box */}
              {dailyPrayer.video && dailyPrayer.video.uri && (
                <>
                  <View
                    style={styles.videoBoxContainer}
                    collapsable={false}
                    onLayout={(event) => {
                      // Use refs to avoid state updates that cause re-renders and pause video
                      // Only measure once, don't update on every layout change
                      const { width: containerWidth } =
                        event.nativeEvent.layout;
                      if (
                        containerWidth > 0 &&
                        !videoContainerWidthRef.current
                      ) {
                        videoContainerWidthRef.current = containerWidth;
                        // Height will be calculated in onLoad when aspect ratio is known
                      }
                    }}
                  >
                    <View
                      style={[styles.videoContainer, { height: videoHeight }]}
                      collapsable={false}
                    >
                      {/* Thumbnail overlay - show when video not playing */}
                      {dailyPrayer.video.thumbnail && !isVideoPlaying && (
                        <View style={styles.videoThumbnailOverlay}>
                          <Image
                            source={{ uri: dailyPrayer.video.thumbnail }}
                            style={styles.videoThumbnail}
                            resizeMode="cover"
                          />
                        </View>
                      )}
                      <Video
                        key={dailyPrayer.video.uri}
                        ref={videoRef}
                        source={{
                          uri: cachedVideoUri || dailyPrayer.video.uri,
                        }}
                        style={[
                          styles.video,
                          dailyPrayer.video.thumbnail &&
                            !isVideoPlaying &&
                            styles.hiddenVideo,
                        ]}
                        resizeMode="cover"
                        shouldPlay={false}
                        isLooping={false}
                        useNativeControls={false}
                        posterSource={videoPoster}
                        onLoadStart={() => {
                          console.log("[VideoPlayback] Video load started", {
                            uri: cachedVideoUri ? "CACHED" : "NETWORK",
                            cachedUri: cachedVideoUri,
                            originalUri: dailyPrayer.video.uri,
                          });
                          setIsVideoReady(false);
                        }}
                        onLoad={(status) => {
                          console.log(
                            "[VideoPlayback] Video loaded successfully",
                            {
                              duration: status.durationMillis,
                              naturalSize: status.naturalSize,
                              isBuffering: status.isBuffering,
                              uri: cachedVideoUri ? "CACHED" : "NETWORK",
                            }
                          );
                          handleVideoLoad(status);

                          // If using cached video, it's already ready
                          // If using network, wait for sufficient buffer
                          if (cachedVideoUri) {
                            setIsVideoReady(true);
                            console.log(
                              "[VideoPlayback] ✅ Cached video ready"
                            );
                          } else {
                            // Network video - wait for buffer
                            setTimeout(async () => {
                              try {
                                const readyStatus =
                                  await videoRef.current.getStatusAsync();
                                // Wait for at least 2 seconds of buffer
                                if (
                                  readyStatus.playableDurationMillis >= 2000
                                ) {
                                  setIsVideoReady(true);
                                  console.log(
                                    "[VideoPlayback] ✅ Network video buffered enough",
                                    {
                                      playableDuration:
                                        readyStatus.playableDurationMillis,
                                    }
                                  );
                                } else {
                                  // Wait more for buffer
                                  console.log(
                                    "[VideoPlayback] Waiting for more buffer..."
                                  );
                                  setTimeout(async () => {
                                    const checkStatus =
                                      await videoRef.current.getStatusAsync();
                                    setIsVideoReady(true);
                                    console.log(
                                      "[VideoPlayback] ✅ Video ready (after wait)",
                                      {
                                        playableDuration:
                                          checkStatus.playableDurationMillis,
                                      }
                                    );
                                  }, 2000);
                                }
                              } catch (e) {
                                console.error(
                                  "[VideoPlayback] Error checking ready status:",
                                  e
                                );
                                setIsVideoReady(true);
                              }
                            }, 1000);
                          }
                        }}
                        onError={(error) => {
                          console.error("[VideoPlayback] Video error:", error);
                          setIsVideoReady(true); // Allow play even on error
                        }}
                      />
                      {/* Play Button - Only show when paused and ready */}
                      {!isVideoPlaying && isVideoReady && (
                        <View style={styles.videoPlayPauseButton}>
                          <TouchableOpacity
                            activeOpacity={1}
                            onPress={async () => {
                              if (!videoRef.current) return;
                              try {
                                const status =
                                  await videoRef.current.getStatusAsync();
                                console.log(
                                  "[VideoPlayback] Play button pressed, current status:",
                                  {
                                    isPlaying: status.isPlaying,
                                    position: status.positionMillis,
                                    duration: status.durationMillis,
                                    isBuffering: status.isBuffering,
                                  }
                                );

                                // If video finished, reset to beginning
                                if (
                                  status.didJustFinish ||
                                  (status.durationMillis > 0 &&
                                    status.positionMillis >=
                                      status.durationMillis)
                                ) {
                                  await videoRef.current.setPositionAsync(0);
                                  console.log(
                                    "[VideoPlayback] Video reset to beginning"
                                  );
                                }

                                lastPlayingStateRef.current = true;
                                isVideoPlayingRef.current = true;
                                console.log(
                                  "[VideoPlayback] Calling playAsync()...",
                                  { usingCache: !!cachedVideoUri }
                                );

                                // Wait for video to be ready if buffering
                                let attempts = 0;
                                const maxAttempts = 10;
                                while (attempts < maxAttempts) {
                                  const checkStatus =
                                    await videoRef.current.getStatusAsync();
                                  if (
                                    !checkStatus.isBuffering ||
                                    checkStatus.isPlaying
                                  ) {
                                    console.log(
                                      `[VideoPlayback] Video ready (attempt ${
                                        attempts + 1
                                      })`
                                    );
                                    break;
                                  }
                                  console.log(
                                    `[VideoPlayback] Waiting for buffer... (attempt ${
                                      attempts + 1
                                    })`
                                  );
                                  await new Promise((resolve) =>
                                    setTimeout(resolve, 200)
                                  );
                                  attempts++;
                                }

                                await videoRef.current.playAsync();
                                console.log(
                                  "[VideoPlayback] playAsync() completed"
                                );

                                // Check status after play
                                setTimeout(async () => {
                                  try {
                                    const newStatus =
                                      await videoRef.current.getStatusAsync();
                                    console.log(
                                      "[VideoPlayback] Status after play:",
                                      {
                                        isPlaying: newStatus.isPlaying,
                                        isBuffering: newStatus.isBuffering,
                                        position: newStatus.positionMillis,
                                        playableDuration:
                                          newStatus.playableDurationMillis,
                                      }
                                    );
                                    if (
                                      !newStatus.isPlaying &&
                                      newStatus.isBuffering
                                    ) {
                                      console.warn(
                                        "[VideoPlayback] ⚠️ Video is buffering after play - retrying..."
                                      );
                                      // Try playing again after a delay
                                      setTimeout(async () => {
                                        try {
                                          await videoRef.current.playAsync();
                                          console.log(
                                            "[VideoPlayback] Retried playAsync() after buffering"
                                          );
                                        } catch (e) {
                                          console.error(
                                            "[VideoPlayback] Retry play error:",
                                            e
                                          );
                                        }
                                      }, 1000);
                                    }
                                  } catch (e) {
                                    console.error(
                                      "[VideoPlayback] Error checking status:",
                                      e
                                    );
                                  }
                                }, 500);

                                requestAnimationFrame(() => {
                                  requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                      setIsVideoPlaying(true);
                                      if (status.durationMillis) {
                                        setVideoStatus({
                                          positionMillis:
                                            status.positionMillis || 0,
                                          durationMillis: status.durationMillis,
                                        });
                                      }
                                    });
                                  });
                                });
                              } catch (error) {
                                console.error(
                                  "[VideoPlayback] Error toggling video:",
                                  error
                                );
                              }
                            }}
                          >
                            <Ionicons name="play" size={50} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      )}
                      {/* Tap to pause overlay - Entire video area when playing (invisible but tappable) */}
                      {isVideoPlaying && (
                        <TouchableOpacity
                          style={styles.videoTapToPauseOverlay}
                          activeOpacity={1}
                          onPress={async () => {
                            if (!videoRef.current) return;
                            try {
                              await videoRef.current.pauseAsync();
                              lastPlayingStateRef.current = false;
                              isVideoPlayingRef.current = false;
                              setIsVideoPlaying(false);
                              console.log(
                                "[VideoPlayback] Video paused via tap"
                              );
                            } catch (error) {
                              console.error(
                                "[VideoPlayback] Error pausing video:",
                                error
                              );
                            }
                          }}
                        />
                      )}
                      {/* Progress Bar REMOVED during playback to prevent re-renders that cause pauses */}
                      {/* Only show static duration on initial load, no position updates */}
                      {videoStatus.durationMillis > 0 && !isVideoPlaying && (
                        <View style={styles.videoControls}>
                          <View style={styles.videoTimeContainer}>
                            <Text style={styles.videoTimeText}>
                              {formatVideoTime(videoStatus.durationMillis)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Separator Line */}
                  <View style={styles.separatorLine} />
                </>
              )}

              {/* Controls */}
              <View style={styles.controlsContainer}>
                {/* Play/Pause Button */}
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={handlePlayPause}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={32}
                    color="#fff"
                  />
                </TouchableOpacity>

                {/* Voice Selector */}
                <TouchableOpacity
                  style={styles.voiceButton}
                  onPress={() => setShowVoiceSelector(true)}
                >
                  <Ionicons name="mic" size={20} color="#1a365d" />
                  <Text style={styles.voiceButtonTextBlack}>Voice</Text>
                </TouchableOpacity>
              </View>

              {/* Prayer Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={async () => {
                    console.log("========== BUTTON PRESSED ==========");
                    console.log("Save prayer button (HEART) pressed!");
                    console.log("Current prayer data:", dailyPrayer);
                    console.log("Is prayer already saved:", isPrayerSaved);
                    console.log("Calling handleSavePrayer now...");
                    await handleSavePrayer();
                    console.log("handleSavePrayer returned");
                  }}
                >
                  <Ionicons
                    name={isPrayerSaved ? "heart" : "heart-outline"}
                    size={20}
                    color={isPrayerSaved ? "#FF6B6B" : "#000"}
                  />
                  <Text style={styles.actionTextBlack}>
                    {isPrayerSaved ? "Hearted" : "Heart"}
                  </Text>
                  {saveCount > 0 && (
                    <Text style={styles.saveCountBlack}>{saveCount}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowComments(true)}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#000" />
                  <Text style={styles.actionTextBlack}>Comment</Text>
                  {commentCount > 0 && (
                    <Text style={styles.commentCountBlack}>{commentCount}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleSharePrayer}
                >
                  <Ionicons name="share-outline" size={20} color="#000" />
                  <Text style={styles.actionTextBlack}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleBookmarkPrayer}
                >
                  <Ionicons name="bookmark-outline" size={20} color="#000" />
                  <Text style={styles.actionTextBlack}>My Prayers</Text>
                </TouchableOpacity>
              </View>

              {/* Be a Partner Button */}
              <TouchableOpacity
                style={styles.partnerButtonCircle}
                onPress={() =>
                  navigation.navigate("PartnerAuth", { partnerType: "prayer" })
                }
              >
                <Ionicons name="people" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={styles.colorLayer}>
          <View style={styles.fullWhiteBackground}>
            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <View style={styles.headerWhite}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitleWhite}>Daily Prayer</Text>
                  <Text style={styles.headerSubtitleWhite}>
                    {formatDate(currentTime)} • {formatTime(currentTime)}
                  </Text>
                </View>
              </View>

              {/* White Card Container - Full Screen */}
              <View style={styles.whiteCardFull}>
                {/* Prayer Content */}
                <View style={styles.prayerContainer}>
                  <View style={styles.themeBadge}>
                    <Text style={styles.themeText}>{dailyPrayer.theme}</Text>
                  </View>

                  <Text style={styles.prayerTitle}>{dailyPrayer.title}</Text>

                  <Text style={styles.prayerText}>{dailyPrayer.prayer}</Text>
                </View>

                {/* Video Player */}
                {dailyPrayer.video && dailyPrayer.video.uri && (
                  <View
                    style={[styles.videoContainer, { height: videoHeight }]}
                  >
                    {/* Thumbnails removed to test if they cause pauses */}
                    <Video
                      key={dailyPrayer.video.uri}
                      ref={videoRef}
                      source={{ uri: dailyPrayer.video.uri }}
                      style={styles.video}
                      resizeMode="cover"
                      shouldPlay={false}
                      isLooping={false}
                      useNativeControls={false}
                    />
                    {/* Simple Play/Pause Button - No animations, just conditional position */}
                    <View
                      style={[
                        styles.videoPlayPauseButton,
                        {
                          top: isVideoPlaying
                            ? videoHeight - 80
                            : videoHeight / 2 - 30,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={async () => {
                          if (!videoRef.current) return;
                          try {
                            const status =
                              await videoRef.current.getStatusAsync();
                            if (status.isPlaying) {
                              await videoRef.current.pauseAsync();
                              setIsVideoPlaying(false);
                            } else {
                              // If video finished, reset to beginning
                              if (
                                status.didJustFinish ||
                                (status.durationMillis > 0 &&
                                  status.positionMillis >=
                                    status.durationMillis)
                              ) {
                                await videoRef.current.setPositionAsync(0);
                              }
                              // Update ref immediately, state later
                              lastPlayingStateRef.current = true;
                              isVideoPlayingRef.current = true;
                              await videoRef.current.playAsync();

                              // Wait for multiple frames before updating state to let video start
                              requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                  requestAnimationFrame(() => {
                                    setIsVideoPlaying(true);
                                    if (status.durationMillis) {
                                      setVideoStatus({
                                        positionMillis:
                                          status.positionMillis || 0,
                                        durationMillis: status.durationMillis,
                                      });
                                    }
                                  });
                                });
                              });
                            }
                          } catch (error) {
                            console.error("Error toggling video:", error);
                          }
                        }}
                      >
                        <Ionicons
                          name={isVideoPlaying ? "pause" : "play"}
                          size={50}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>
                    {/* Progress Bar - Only show when video has duration, update infrequently */}
                    {videoStatus.durationMillis > 0 && (
                      <View style={styles.videoControls}>
                        <View style={styles.progressBarContainer}>
                          <View
                            style={[
                              styles.progressBar,
                              {
                                width: `${
                                  (videoStatus.positionMillis /
                                    videoStatus.durationMillis) *
                                  100
                                }%`,
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.videoTimeContainer}>
                          <Text style={styles.videoTimeText}>
                            {formatVideoTime(videoStatus.positionMillis)}
                          </Text>
                          <Text style={styles.videoTimeText}>
                            {formatVideoTime(videoStatus.durationMillis)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Controls */}
                <View style={styles.controlsContainer}>
                  {/* Play/Pause Button */}
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={handlePlayPause}
                  >
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={32}
                      color="#fff"
                    />
                  </TouchableOpacity>

                  {/* Voice Selector */}
                  <TouchableOpacity
                    style={styles.voiceButton}
                    onPress={() => setShowVoiceSelector(true)}
                  >
                    <Ionicons name="mic" size={20} color="#1a365d" />
                    <Text style={styles.voiceButtonText}>Voice</Text>
                  </TouchableOpacity>
                </View>

                {/* Prayer Actions */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={async () => {
                      console.log("========== BUTTON PRESSED ==========");
                      console.log("Save prayer button (HEART) pressed!");
                      console.log("Current prayer data:", dailyPrayer);
                      console.log("Is prayer already saved:", isPrayerSaved);
                      console.log("Calling handleSavePrayer now...");
                      await handleSavePrayer();
                      console.log("handleSavePrayer returned");
                    }}
                  >
                    <Ionicons
                      name={isPrayerSaved ? "heart" : "heart-outline"}
                      size={20}
                      color={isPrayerSaved ? "#FF6B6B" : "#000"}
                    />
                    <Text style={styles.actionText}>
                      {isPrayerSaved ? "Hearted" : "Heart"}
                    </Text>
                    {saveCount > 0 && (
                      <Text style={styles.saveCount}>{saveCount}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowComments(true)}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={20}
                      color="#000"
                    />
                    <Text style={styles.actionText}>Comment</Text>
                    {commentCount > 0 && (
                      <Text style={styles.commentCount}>{commentCount}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleSharePrayer}
                  >
                    <Ionicons name="share-outline" size={20} color="#000" />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleBookmarkPrayer}
                  >
                    <Ionicons name="bookmark-outline" size={20} color="#000" />
                    <Text style={styles.actionText}>My Prayers</Text>
                  </TouchableOpacity>
                </View>

                {/* Be a Partner Button */}
                <TouchableOpacity
                  style={styles.partnerButtonCircle}
                  onPress={() =>
                    navigation.navigate("PartnerAuth", {
                      partnerType: "prayer",
                    })
                  }
                >
                  <Ionicons name="people" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.commentsModalContent}>
            <View style={styles.commentsModalHeader}>
              <Text style={styles.commentsModalTitle}>
                Comments ({commentCount})
              </Text>
              <TouchableOpacity
                onPress={() => setShowComments(false)}
                style={styles.closeCommentsButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList}>
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>{comment.author}</Text>
                      <Text style={styles.commentTime}>
                        {PrayerScriptureCommentService.formatTimeAgo(
                          comment.timestamp || comment.createdAt
                        )}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.noCommentsContainer}>
                  <Text style={styles.noCommentsText}>
                    No comments yet. Be the first to share your thoughts!
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={[
                  styles.commentSubmitButton,
                  !newComment.trim() && styles.commentSubmitButtonDisabled,
                ]}
                onPress={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Voice Selector Modal */}
      <Modal
        visible={showVoiceSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVoiceSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Voice</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowVoiceSelector(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.voiceList}>
              {filteredVoices.map((voice, index) => (
                <TouchableOpacity
                  key={voice.identifier}
                  style={[
                    styles.voiceOption,
                    selectedVoice === voice.identifier && styles.selectedVoice,
                  ]}
                  onPress={() => handleVoiceSelect(voice.identifier)}
                >
                  <View style={styles.voiceInfo}>
                    <Text style={styles.voiceName}>{voice.displayName}</Text>
                    <Text style={styles.voiceLanguage}>{voice.language}</Text>
                  </View>
                  {selectedVoice === voice.identifier && (
                    <Ionicons name="checkmark" size={20} color="#1a365d" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Black background
  },
  containerWithWallpaper: {
    flex: 1,
    position: "relative",
  },
  darkBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  darkBackgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Darker, more opaque overlay
  },
  whitePageContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  colorLayer: {
    flex: 1,
    backgroundColor: "rgba(26, 54, 93, 0.15)", // Very muted navy
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent", // Transparent to show dark background
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
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
  headerWhite: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 10,
    backgroundColor: "#fff",
    position: "relative",
    zIndex: 10, // Above dark background
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
  headerTitleWhite: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  headerSubtitleWhite: {
    fontSize: 14,
    color: "#000",
    opacity: 0.8,
  },
  whiteCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWhiteBackground: {
    flex: 1,
    backgroundColor: "#fff",
  },
  whiteCardFull: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    padding: 24,
    minHeight: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wallpaperContainer: {
    flex: 1,
    marginTop: 0,
  },
  wallpaperBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  wallpaperOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  prayerCardWithWallpaper: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    padding: 24,
  },
  // New styles for boxed layout
  prayerBoxContainer: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  prayerBoxBackground: {
    width: "100%",
    minHeight: 300,
  },
  prayerBoxOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  prayerBoxContent: {
    padding: 24,
    position: "relative",
    zIndex: 1,
  },
  separatorLine: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
    marginHorizontal: 0,
  },
  videoBoxContainer: {
    marginHorizontal: 0,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  prayerContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  themeBadge: {
    backgroundColor: "rgba(26, 54, 93, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  themeText: {
    fontSize: 14,
    color: "#1a365d",
    fontWeight: "600",
  },
  prayerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
    lineHeight: 34,
  },
  prayerText: {
    fontSize: 18,
    color: "#000",
    lineHeight: 28,
    marginBottom: 40,
    textAlign: "left",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1a365d",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1a365d",
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 54, 93, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(26, 54, 93, 0.3)",
  },
  voiceButtonText: {
    color: "#1a365d",
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  voiceButtonTextBlack: {
    color: "#1a365d",
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  partnerButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1a365d",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  partnerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a365d",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  partnerButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 40,
  },
  actionButton: {
    alignItems: "center",
    padding: 10,
  },
  actionText: {
    fontSize: 12,
    color: "#000",
    marginTop: 5,
    opacity: 0.7,
  },
  actionTextBlack: {
    fontSize: 12,
    color: "#000",
    marginTop: 5,
    opacity: 0.8,
  },
  saveCount: {
    fontSize: 10,
    color: "#FF6B6B",
    fontWeight: "bold",
    marginTop: 2,
  },
  saveCountBlack: {
    fontSize: 10,
    color: "#FF6B6B",
    fontWeight: "bold",
    marginTop: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a365d",
    borderRadius: 16,
    width: "90%",
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "rgba(26, 54, 93, 0.6)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 5,
  },
  voiceList: {
    maxHeight: 300,
  },
  voiceOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedVoice: {
    backgroundColor: "rgba(26, 54, 93, 0.6)",
  },
  voiceInfo: {
    flex: 1,
  },
  voiceName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  voiceLanguage: {
    fontSize: 14,
    color: "#B0C4DE",
    marginTop: 2,
  },
  videoContainer: {
    width: "85%", // Narrower width to reduce cropping and show more video content
    alignSelf: "center", // Center the narrower container
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  videoPoster: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  videoThumbnailOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  videoTapToPauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    // Invisible overlay - entire video area is tappable to pause
  },
  videoPauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  videoLoadingOverlay: {
    position: "absolute",
    top: -35,
    left: "50%",
    transform: [{ translateX: -40 }],
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    zIndex: 20,
  },
  videoLoadingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  videoPlayPauseButton: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -30 }, { translateY: -30 }],
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  videoControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  progressBarContainer: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  videoTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  videoTimeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  commentCount: {
    fontSize: 10,
    color: "#FF6B6B",
    fontWeight: "bold",
    marginTop: 2,
  },
  commentCountBlack: {
    fontSize: 10,
    color: "#FF6B6B",
    fontWeight: "bold",
    marginTop: 2,
  },
  commentsModalContent: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  commentsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  commentsModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  closeCommentsButton: {
    padding: 5,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commentCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a365d",
  },
  commentTime: {
    fontSize: 12,
    color: "#666",
  },
  commentText: {
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
  },
  noCommentsContainer: {
    padding: 40,
    alignItems: "center",
  },
  noCommentsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  commentInputContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
    alignItems: "flex-end",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    marginRight: 12,
  },
  commentSubmitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1a365d",
    justifyContent: "center",
    alignItems: "center",
  },
  commentSubmitButtonDisabled: {
    backgroundColor: "#ccc",
  },
});

export default DailyPrayerScreen;
