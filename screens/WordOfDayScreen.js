import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
  Share,
  ImageBackground,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import TimeBasedPrayerService from "../services/TimeBasedPrayerService";
import PrayerScriptureCommentService from "../services/PrayerScriptureCommentService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import VideoCacheService from "../services/VideoCacheService";

const { width, height } = Dimensions.get("window");

// Asset wallpaper mapping
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

const WordOfDayScreen = ({ navigation }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [wordOfDay, setWordOfDay] = useState(null);
  const [isWordSaved, setIsWordSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoStatus, setVideoStatus] = useState({
    positionMillis: 0,
    durationMillis: 0,
  });
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentCount, setCommentCount] = useState(0);
  const [videoHeight, setVideoHeight] = useState(300); // Fixed height to prevent re-renders
  const videoContainerWidthRef = useRef(null); // Use ref instead of state to prevent re-renders
  const videoAspectRatioRef = useRef(null); // Use ref instead of state to prevent re-renders
  const videoRef = useRef(null);
  const currentWordIdRef = useRef(null);
  const lastPlayingStateRef = useRef(false); // Track last playing state to avoid unnecessary updates
  const videoHeightSetRef = useRef(false); // Track if height has been set to prevent updates during playback
  const previousVideoUriRef = useRef(null); // Track video URI to reset height flag when video changes
  const [cachedVideoUri, setCachedVideoUri] = useState(null); // Cached video URI
  const [isVideoReady, setIsVideoReady] = useState(false); // Track if video is preloaded and ready
  
  // Memoize the video poster to prevent recreation on every render
  const videoPoster = useMemo(() => {
    if (!wordOfDay?.video?.thumbnail) return undefined;
    return { uri: wordOfDay.video.thumbnail };
  }, [wordOfDay?.video?.thumbnail]);

  // Initialize video cache on mount
  useEffect(() => {
    VideoCacheService.initialize();
  }, []);

  useEffect(() => {
    const loadWord = async () => {
      const word = await TimeBasedPrayerService.getTimeBasedWord();
      const wordId = word?.id || word?.word;
      currentWordIdRef.current = wordId;
      setWordOfDay(word);
      loadComments(word);
      
      // Get cached video URI if available, otherwise PRELOAD before allowing play
      if (word?.video?.uri) {
        try {
          console.log("[VideoCache] Checking cache for:", word.video.uri);
          const isCached = await VideoCacheService.isCached(word.video.uri);
          console.log("[VideoCache] Is cached?", isCached);

          if (isCached) {
            const cachedPath = VideoCacheService.getCachedPath(word.video.uri);
            console.log("[VideoCache] ✅ Using cached video:", cachedPath);
            setCachedVideoUri(cachedPath);
            setIsVideoReady(true); // Cached videos are ready immediately
          } else {
            console.log("[VideoCache] ❌ Not cached, PRELOADING before play...");
            setCachedVideoUri(null);
            setIsVideoReady(false); // Not ready until preloaded
            
            // PRELOAD: Download cache BEFORE allowing play
            try {
              console.log("[VideoCache] Starting preload...");
              const cachedPath = await VideoCacheService.preCacheVideo(word.video.uri);
              if (cachedPath) {
                console.log("[VideoCache] ✅ Preload complete, using cached:", cachedPath);
                setCachedVideoUri(cachedPath);
                setIsVideoReady(true);
              } else {
                console.log("[VideoCache] ⚠️ Preload failed, using network (may buffer)");
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
    loadWord();
  }, []);

  // Reload word when screen comes into focus
  // Don't pause video - let it continue playing like community videos
  useFocusEffect(
    React.useCallback(() => {
      const loadWord = async () => {
        const newWord = await TimeBasedPrayerService.getTimeBasedWord();
        const currentWordId = wordOfDay?.id || wordOfDay?.word;
        const newWordId = newWord?.id || newWord?.word;
        
        // Only reload if word actually changed
        if (currentWordId !== newWordId) {
          // Only pause if video is playing and word changed (different video)
          if (videoRef.current && isVideoPlaying) {
            try {
              const status = await videoRef.current.getStatusAsync();
              if (status.isPlaying) {
                await videoRef.current.pauseAsync();
                setIsVideoPlaying(false);
                lastPlayingStateRef.current = false;
              }
            } catch (error) {
              console.error("Error stopping video:", error);
            }
          }
          setWordOfDay(newWord);
          loadComments(newWord);
        }
        // Don't reload if word hasn't changed - let video continue playing
      };
      loadWord();
    }, [wordOfDay])
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
  const handleVideoLoad = useCallback((status) => {
    // Reset height flag if video URI changed
    if (wordOfDay?.video?.uri && previousVideoUriRef.current !== wordOfDay.video.uri) {
      videoHeightSetRef.current = false;
      previousVideoUriRef.current = wordOfDay.video.uri;
    }
    
    // Only set height once per video load - never update during playback
    if (videoHeightSetRef.current) return;
    
    try {
      const natural = status?.naturalSize;
      if (natural && natural.width && natural.height) {
        const ratio = natural.width / natural.height;
        if (ratio && isFinite(ratio) && ratio > 0) {
          videoAspectRatioRef.current = ratio;
          const fullContainerWidth = videoContainerWidthRef.current || (width - 24 - 40);
          const containerWidth = fullContainerWidth * 0.85;
          const videoBasedHeight = containerWidth / ratio;
          const minHeight = 250;
          const maxHeight = height * 0.65;
          const finalHeight = Math.max(minHeight, Math.min(videoBasedHeight, maxHeight));
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
  }, [wordOfDay?.video?.uri]);

  // REMOVED onPlaybackStatusUpdate completely - the callback itself was causing pauses
  // Videos will play without any status callbacks - we'll check status only on user interaction

  const loadComments = async (word) => {
    if (!word) return;
    try {
      const wordId = PrayerScriptureCommentService.getItemId(word);
      const wordComments = await PrayerScriptureCommentService.getScriptureComments(wordId); // Reuse scripture comments for words
      setComments(wordComments);
      setCommentCount(wordComments.length);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleSaveWord = async () => {
    try {
      const savedWordsJson = await AsyncStorage.getItem("saved_words");
      const savedWords = savedWordsJson ? JSON.parse(savedWordsJson) : [];
      
      const wordToSave = {
        id: Date.now().toString(),
        word: wordOfDay.word,
        definition: wordOfDay.definition,
        verse: wordOfDay.verse,
        reference: wordOfDay.reference,
        reflection: wordOfDay.reflection,
        savedAt: new Date().toISOString(),
      };

      savedWords.push(wordToSave);
      await AsyncStorage.setItem("saved_words", JSON.stringify(savedWords));
      
      setIsWordSaved(true);
      setSaveCount(prev => prev + 1);
    } catch (error) {
      console.error("Error saving word:", error);
    }
  };

  const handleShareWord = async () => {
    try {
      let shareText = `Word of the Day: ${wordOfDay.word || "Word of the Day"}\n\n`;
      if (wordOfDay.definition) {
        shareText += `${wordOfDay.definition}\n\n`;
      }
      if (wordOfDay.verse) {
        shareText += `"${wordOfDay.verse}"\n`;
      }
      if (wordOfDay.reference) {
        shareText += `— ${wordOfDay.reference}\n\n`;
      }
      if (wordOfDay.reflection) {
        shareText += `${wordOfDay.reflection}`;
      }
      await Share.share({
        message: shareText,
        title: "Word of the Day",
      });
    } catch (error) {
      console.error("Error sharing word:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    if (!wordOfDay) {
      Alert.alert("Error", "Word not available");
      return;
    }

    try {
      const comment = await PrayerScriptureCommentService.addScriptureComment(
        wordOfDay,
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

  // Memoize wallpaper source to prevent re-renders - only recalculate when wordOfDay changes
  // Must be called before early return to follow Rules of Hooks
  const wallpaperSource = useMemo(() => {
    if (!wordOfDay || !wordOfDay.wallpaper) {
      return null;
    }
    
    if (wordOfDay.wallpaper.type === "asset") {
      const wallpaperFile = ASSET_WALLPAPER_MAP[wordOfDay.wallpaper.id];
      return wallpaperFile || null;
    }
    
    if (wordOfDay.wallpaper.type === "phone") {
      return { uri: wordOfDay.wallpaper.uri };
    }
    
    return null;
  }, [wordOfDay?.wallpaper?.type, wordOfDay?.wallpaper?.id, wordOfDay?.wallpaper?.uri]);

  if (!wordOfDay) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading word...</Text>
        </View>
      </View>
    );
  }
  const textColor = wordOfDay.textColor || "black";
  const textStyle = { color: textColor === "white" ? "#fff" : "#000" };
  const hasWallpaper = wallpaperSource !== null;

  return (
    <SafeAreaView style={styles.container}>
      {hasWallpaper ? (
        <View style={styles.containerWithWallpaper}>
          {/* Header - Always White */}
          <View style={styles.headerWhite}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitleWhite}>Word of the Day</Text>
              <Text style={styles.headerSubtitleWhite}>
                {formatDate(currentTime)} • {formatTime(currentTime)}
              </Text>
            </View>
          </View>

          {/* Dark Background with Wallpaper */}
          <ImageBackground
            source={wallpaperSource}
            style={styles.darkBackground}
            resizeMode="cover"
          >
            <View style={styles.darkBackgroundOverlay} />
          </ImageBackground>

          {/* White Page Container */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled={true}
            removeClippedSubviews={false}
          >
            <View style={styles.whitePageContainer}>
              {/* Word Box with Wallpaper */}
              <View style={styles.wordBoxContainer}>
                <ImageBackground
                  source={wallpaperSource}
                  style={styles.wordBoxBackground}
                  resizeMode="cover"
                >
                  <View style={styles.wordBoxOverlay} />
                  <View style={styles.wordBoxContent}>
                    {/* Title */}
                    {wordOfDay.word && (
                      <View style={styles.wordCard}>
                        <Text style={[styles.wordTitle, textStyle]}>
                          {wordOfDay.word}
                        </Text>
                        {wordOfDay.definition && (
                          <Text style={[styles.wordDefinition, textStyle]}>
                            {wordOfDay.definition}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Scripture */}
                    {(wordOfDay.verse || wordOfDay.reference) && (
                      <View style={styles.scriptureCard}>
                        {wordOfDay.verse && (
                          <Text style={[styles.scriptureText, textStyle]}>
                            "{wordOfDay.verse}"
                          </Text>
                        )}
                        {wordOfDay.reference && (
                          <Text style={[styles.scriptureReference, textStyle]}>
                            — {wordOfDay.reference}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Reflection/Summary */}
                    {wordOfDay.reflection && (
                      <View style={styles.reflectionCard}>
                        <Text style={[styles.reflectionTitle, textStyle]}>
                          Reflection
                        </Text>
                        <Text style={[styles.reflectionText, textStyle]}>
                          {wordOfDay.reflection}
                        </Text>
                      </View>
                    )}
                  </View>
                </ImageBackground>
              </View>

              {/* Separator Line */}
              <View style={styles.separatorLine} />

              {/* Video Box */}
              {wordOfDay.video && wordOfDay.video.uri && (
                <>
                  <View 
                    style={styles.videoBoxContainer}
                    collapsable={false}
                    onLayout={(event) => {
                      // Use refs to avoid state updates that cause re-renders and pause video
                      // Only measure once, don't update on every layout change
                      const { width: containerWidth } = event.nativeEvent.layout;
                      if (containerWidth > 0 && !videoContainerWidthRef.current) {
                        videoContainerWidthRef.current = containerWidth;
                        // Height will be calculated in onLoad when aspect ratio is known
                      }
                    }}
                  >
                    <View style={[styles.videoContainer, { height: videoHeight }]} collapsable={false}>
                      {/* Thumbnail overlay - show when video not playing */}
                      {wordOfDay.video.thumbnail && !isVideoPlaying && (
                        <View style={styles.videoThumbnailOverlay}>
                          <Image
                            source={{ uri: wordOfDay.video.thumbnail }}
                            style={styles.videoThumbnail}
                            resizeMode="cover"
                          />
                        </View>
                      )}
                      <Video
                        key={wordOfDay.video.uri}
                        ref={videoRef}
                        source={{
                          uri: cachedVideoUri || wordOfDay.video.uri,
                        }}
                        style={[
                          styles.video,
                          wordOfDay.video.thumbnail && !isVideoPlaying && styles.hiddenVideo,
                        ]}
                        resizeMode="cover"
                        shouldPlay={false}
                        isLooping={false}
                        useNativeControls={false}
                        posterSource={videoPoster}
                        onLoadStart={() => {
                          setIsVideoReady(false);
                        }}
                        onLoad={(status) => {
                          handleVideoLoad(status);
                          
                          // If using cached video, it's already ready
                          // If using network, wait for sufficient buffer
                          if (cachedVideoUri) {
                            setIsVideoReady(true);
                          } else {
                            // Network video - wait for buffer
                            setTimeout(async () => {
                              try {
                                const readyStatus = await videoRef.current.getStatusAsync();
                                // Wait for at least 2 seconds of buffer
                                if (readyStatus.playableDurationMillis >= 2000) {
                                  setIsVideoReady(true);
                                } else {
                                  setTimeout(async () => {
                                    setIsVideoReady(true);
                                  }, 2000);
                                }
                              } catch (e) {
                                setIsVideoReady(true);
                              }
                            }, 1000);
                          }
                        }}
                        onError={(error) => {
                          console.error("[VideoPlayback] Video error:", error);
                          setIsVideoReady(true);
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
                                const status = await videoRef.current.getStatusAsync();
                                
                                // If video finished, reset to beginning
                                if (
                                  status.didJustFinish ||
                                  (status.durationMillis > 0 &&
                                    status.positionMillis >=
                                      status.durationMillis)
                                ) {
                                  await videoRef.current.setPositionAsync(0);
                                }
                                
                                lastPlayingStateRef.current = true;
                                await videoRef.current.playAsync();
                                
                                requestAnimationFrame(() => {
                                  requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                      setIsVideoPlaying(true);
                                      if (status.durationMillis) {
                                        setVideoStatus({
                                          positionMillis: status.positionMillis || 0,
                                          durationMillis: status.durationMillis,
                                        });
                                      }
                                    });
                                  });
                                });
                              } catch (error) {
                                console.error("Error toggling video:", error);
                              }
                            }}
                          >
                            <Ionicons
                              name="play"
                              size={50}
                              color="#fff"
                            />
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
                              setIsVideoPlaying(false);
                            } catch (error) {
                              console.error("[VideoPlayback] Error pausing video:", error);
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
                </>
              )}

              {/* Separator Line */}
              {(wordOfDay.video && wordOfDay.video.uri) && <View style={styles.separatorLine} />}

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleSaveWord}
                >
                  <Ionicons
                    name={isWordSaved ? "heart" : "heart-outline"}
                    size={20}
                    color={isWordSaved ? "#FF6B6B" : "#000"}
                  />
                  <Text style={styles.actionTextBlack}>
                    {isWordSaved ? "Hearted" : "Heart"}
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
                  onPress={handleShareWord}
                >
                  <Ionicons name="share-outline" size={20} color="#000" />
                  <Text style={styles.actionTextBlack}>Share</Text>
                </TouchableOpacity>
              </View>

              {/* Separator Line */}
              <View style={styles.separatorLine} />

              {/* Be a Partner Button */}
              <TouchableOpacity
                style={styles.partnerButtonCircle}
                onPress={() => navigation.navigate("PartnerAuth", { partnerType: "word" })}
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
                  <Text style={styles.headerTitleWhite}>Word of the Day</Text>
                  <Text style={styles.headerSubtitleWhite}>
                    {formatDate(currentTime)} • {formatTime(currentTime)}
                  </Text>
                </View>
              </View>

              {/* White Card Container - Full Screen */}
              <View style={styles.whiteCardFull}>
                {/* Word Content */}
                <View style={styles.contentContainer}>
                  {/* Title */}
                  {wordOfDay.word && (
                    <View style={styles.wordCard}>
                      <Text style={styles.wordTitle}>{wordOfDay.word}</Text>
                      {wordOfDay.definition && (
                        <Text style={styles.wordDefinition}>
                          {wordOfDay.definition}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Video Player */}
                  {wordOfDay.video && wordOfDay.video.uri && (
                    <View 
                      style={styles.videoBoxContainer}
                      onLayout={(event) => {
                        const { width: containerWidth } = event.nativeEvent.layout;
                        if (containerWidth > 0 && containerWidth !== videoContainerWidth) {
                          setVideoContainerWidth(containerWidth);
                          if (videoAspectRatio && videoAspectRatio > 0) {
                            const narrowerWidth = containerWidth * 0.85;
                            const videoBasedHeight = narrowerWidth / videoAspectRatio;
                            const minHeight = 250;
                            const maxHeight = height * 0.65;
                            const finalHeight = Math.max(minHeight, Math.min(videoBasedHeight, maxHeight));
                            setVideoHeight(Math.floor(finalHeight));
                          }
                        }
                      }}
                    >
                      <View style={[styles.videoContainer, { height: videoHeight }]} collapsable={false}>
                        {/* Thumbnail overlay - show when video not playing */}
                        {wordOfDay.video.thumbnail && !isVideoPlaying && (
                          <View style={styles.videoThumbnailOverlay}>
                            <Image
                              source={{ uri: wordOfDay.video.thumbnail }}
                              style={styles.videoThumbnail}
                              resizeMode="cover"
                            />
                          </View>
                        )}
                        <Video
                          key={wordOfDay.video.uri}
                          ref={videoRef}
                          source={{
                            uri: cachedVideoUri || wordOfDay.video.uri,
                          }}
                          style={[
                            styles.video,
                            wordOfDay.video.thumbnail && !isVideoPlaying && styles.hiddenVideo,
                          ]}
                          resizeMode="cover"
                          shouldPlay={false}
                          isLooping={false}
                          useNativeControls={false}
                          posterSource={videoPoster}
                          onLoadStart={() => {
                            setIsVideoReady(false);
                          }}
                          onLoad={(status) => {
                            handleVideoLoad(status);
                            
                            // If using cached video, it's already ready
                            // If using network, wait for sufficient buffer
                            if (cachedVideoUri) {
                              setIsVideoReady(true);
                            } else {
                              // Network video - wait for buffer
                              setTimeout(async () => {
                                try {
                                  const readyStatus = await videoRef.current.getStatusAsync();
                                  // Wait for at least 2 seconds of buffer
                                  if (readyStatus.playableDurationMillis >= 2000) {
                                    setIsVideoReady(true);
                                  } else {
                                    setTimeout(async () => {
                                      setIsVideoReady(true);
                                    }, 2000);
                                  }
                                } catch (e) {
                                  setIsVideoReady(true);
                                }
                              }, 1000);
                            }
                          }}
                          onError={(error) => {
                            console.error("[VideoPlayback] Video error:", error);
                            setIsVideoReady(true);
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
                                  const status = await videoRef.current.getStatusAsync();
                                  
                                  // If video finished, reset to beginning
                                  if (
                                    status.didJustFinish ||
                                    (status.durationMillis > 0 &&
                                      status.positionMillis >=
                                        status.durationMillis)
                                  ) {
                                    await videoRef.current.setPositionAsync(0);
                                  }
                                  
                                  lastPlayingStateRef.current = true;
                                  await videoRef.current.playAsync();
                                  
                                  requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                      requestAnimationFrame(() => {
                                        setIsVideoPlaying(true);
                                        if (status.durationMillis) {
                                          setVideoStatus({
                                            positionMillis: status.positionMillis || 0,
                                            durationMillis: status.durationMillis,
                                          });
                                        }
                                      });
                                    });
                                  });
                                } catch (error) {
                                  console.error("Error toggling video:", error);
                                }
                              }}
                            >
                              <Ionicons
                                name="play"
                                size={50}
                                color="#fff"
                              />
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
                                setIsVideoPlaying(false);
                              } catch (error) {
                                console.error("[VideoPlayback] Error pausing video:", error);
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
                  )}

                  {/* Scripture */}
                  {(wordOfDay.verse || wordOfDay.reference) && (
                    <View style={styles.scriptureCard}>
                      {wordOfDay.verse && (
                        <Text style={styles.scriptureText}>
                          "{wordOfDay.verse}"
                        </Text>
                      )}
                      {wordOfDay.reference && (
                        <Text style={styles.scriptureReference}>
                          — {wordOfDay.reference}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Reflection/Summary */}
                  {wordOfDay.reflection && (
                    <View style={styles.reflectionCard}>
                      <Text style={styles.reflectionTitle}>Reflection</Text>
                      <Text style={styles.reflectionText}>
                        {wordOfDay.reflection}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleSaveWord}
                  >
                    <Ionicons
                      name={isWordSaved ? "heart" : "heart-outline"}
                      size={20}
                      color={isWordSaved ? "#FF6B6B" : "#000"}
                    />
                    <Text style={styles.actionText}>
                      {isWordSaved ? "Hearted" : "Heart"}
                    </Text>
                    {saveCount > 0 && (
                      <Text style={styles.saveCount}>{saveCount}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowComments(true)}
                  >
                    <Ionicons name="chatbubble-outline" size={20} color="#000" />
                    <Text style={styles.actionText}>Comment</Text>
                    {commentCount > 0 && (
                      <Text style={styles.commentCount}>{commentCount}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleShareWord}
                  >
                    <Ionicons name="share-outline" size={20} color="#000" />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>

                {/* Be a Partner Button */}
                <TouchableOpacity
                  style={styles.partnerButtonCircle}
                  onPress={() => navigation.navigate("PartnerAuth", { partnerType: "word" })}
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
                        {PrayerScriptureCommentService.formatTimeAgo(comment.timestamp || comment.createdAt)}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
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
  wordBoxContainer: {
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
  wordBoxBackground: {
    width: "100%",
    minHeight: 300,
  },
  wordBoxOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  wordBoxContent: {
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
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  colorLayer: {
    flex: 1,
    backgroundColor: "rgba(255, 140, 66, 0.15)",
  },
  fullWhiteBackground: {
    flex: 1,
    backgroundColor: "rgba(255, 140, 66, 0.15)",
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
  wordCardWithWallpaper: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    padding: 24,
  },
  contentContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  wordCard: {
    backgroundColor: "rgba(255, 140, 66, 0.05)",
    padding: 30,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.1)",
  },
  wordTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 15,
  },
  wordDefinition: {
    fontSize: 16,
    color: "#000",
    lineHeight: 24,
    textAlign: "center",
    opacity: 0.8,
  },
  scriptureCard: {
    backgroundColor: "rgba(255, 140, 66, 0.05)",
    padding: 25,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.1)",
  },
  scriptureText: {
    fontSize: 18,
    color: "#000",
    lineHeight: 26,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 10,
  },
  scriptureReference: {
    fontSize: 14,
    color: "#000",
    textAlign: "center",
    opacity: 0.6,
  },
  reflectionCard: {
    backgroundColor: "rgba(255, 140, 66, 0.05)",
    padding: 25,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 140, 66, 0.1)",
  },
  reflectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  reflectionText: {
    fontSize: 16,
    color: "#000",
    lineHeight: 24,
    opacity: 0.8,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 0, // No bottom margin, handled by whitePageContent padding
    paddingVertical: 15, // Padding for actions
    backgroundColor: "#fff", // Ensure actions background is white
  },
  actionButton: {
    alignItems: "center",
    padding: 10,
  },
  actionText: {
    fontSize: 12,
    color: "#000",
    marginTop: 5,
    fontWeight: "600",
  },
  actionTextBlack: {
    fontSize: 12,
    color: "#000", // Black text for actions
    marginTop: 5,
    opacity: 0.7,
  },
  saveCount: {
    fontSize: 10,
    color: "#FF6B6B",
    marginTop: 2,
    fontWeight: "600",
  },
  saveCountBlack: {
    fontSize: 10,
    color: "#FF6B6B",
    fontWeight: "bold",
    marginTop: 2,
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
  partnerButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#CC6B2E",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#CC6B2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  partnerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CC6B2E",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: "#CC6B2E",
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
  videoContainer: {
    width: "85%", // Narrower width to reduce cropping and show more video content
    alignSelf: "center", // Center the narrower container
    borderRadius: 0,
    overflow: "hidden",
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: "#000",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  hiddenVideo: {
    opacity: 0,
    position: "absolute",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
    color: "#CC6B2E",
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
    backgroundColor: "#CC6B2E",
    justifyContent: "center",
    alignItems: "center",
  },
  commentSubmitButtonDisabled: {
    backgroundColor: "#ccc",
  },
});

export default WordOfDayScreen;
