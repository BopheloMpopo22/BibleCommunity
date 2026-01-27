import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Dimensions,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import PostService from "../services/PostService";
import WorkingAuthService from "../services/WorkingAuthService";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const MediaPostCard = ({
  post,
  onPress,
  onLike,
  onComment,
  onShare,
  onDelete,
}) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasVideoStarted, setHasVideoStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState({
    positionMillis: 0,
    durationMillis: 0,
  });
  const videoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenVideoRef = useRef(null);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [fsProgressBarWidth, setFsProgressBarWidth] = useState(0);
  const [fsIsSeeking, setFsIsSeeking] = useState(false);
  const [fsSeekRatio, setFsSeekRatio] = useState(0);
  const [suppressToggleUntil, setSuppressToggleUntil] = useState(0);
  const [lastLeftTap, setLastLeftTap] = useState(0);
  const [lastRightTap, setLastRightTap] = useState(0);
  const [inlineSeekHint, setInlineSeekHint] = useState(null); // 'back' | 'forward' | null
  const [lastFsLeftTap, setLastFsLeftTap] = useState(0);
  const [lastFsRightTap, setLastFsRightTap] = useState(0);
  const [fsSeekHint, setFsSeekHint] = useState(null); // 'back' | 'forward' | null
  const [videoAspectRatio, setVideoAspectRatio] = useState(0.5); // Default to vertical
  const [inlineVideoHeight, setInlineVideoHeight] = useState(
    screenHeight * 0.6 // Default to reasonable height
  );
  const [inlineImageHeight, setInlineImageHeight] = useState(
    Math.min(screenWidth / (16 / 9), screenHeight * 0.5)
  );

  const seekToRatio = async (ratio) => {
    if (!videoRef.current || !playbackStatus.durationMillis) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    const newPos = Math.floor(clamped * playbackStatus.durationMillis);
    try {
      await videoRef.current.setPositionAsync(newPos);
    } catch (e) {
      console.log("Seek error:", e);
    }
  };

  const fsSeekToRatio = async (ratio) => {
    if (!fullscreenVideoRef.current || !playbackStatus.durationMillis) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    const newPos = Math.floor(clamped * playbackStatus.durationMillis);
    try {
      await fullscreenVideoRef.current.setPositionAsync(newPos);
    } catch (e) {
      console.log("FS Seek error:", e);
    }
  };

  const formatTime = (millis) => {
    if (!millis || millis <= 0) return "0:00";
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const padded = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}:${padded}`;
  };

  const maxContentLength = 150; // Characters before showing "Read more"
  const shouldShowReadMore =
    post.content && post.content.length > maxContentLength;

  // Check if current user is the author
  React.useEffect(() => {
    const checkAuthor = async () => {
      try {
        const currentUser = await WorkingAuthService.getCurrentUser();
        if (!currentUser || !currentUser.uid) {
          setIsAuthor(false);
          return;
        }

        // Check if user is the author - handle both authorId and author_id
        const postAuthorId = post.authorId || post.author_id;
        
        // If post has no authorId, allow deletion for authenticated users (legacy/test posts)
        // If post has authorId, only allow if it matches current user
        const userIsAuthor = postAuthorId 
          ? currentUser.uid === postAuthorId 
          : true; // Allow deletion of posts without authorId (old test posts)
        
        console.log("MediaPostCard author check:", {
          postId: post.id,
          postAuthorId: postAuthorId || "missing",
          currentUserId: currentUser.uid,
          isAuthor: userIsAuthor
        });
        
        setIsAuthor(userIsAuthor);
      } catch (error) {
        console.error("Error checking author:", error);
        setIsAuthor(false);
      }
    };
    checkAuthor();
  }, [post.authorId, post.author_id]);

  const handleLike = () => {
    const next = !isLiked;
    setIsLiked(next);
    // Optimistic update of count on the object to keep UI in sync
    if (post) {
      post.likes = Math.max(0, (post.likes || 0) + (next ? 1 : -1));
    }
    // Persist like toggle
    PostService.toggleLike(post.id).catch(() => {
      // Revert if failed
      setIsLiked(!next);
      if (post) {
        post.likes = Math.max(0, (post.likes || 0) + (next ? -1 : 1));
      }
    });
    if (onLike) onLike(post);
  };

  const handleImagePress = () => {
    if (post.media && post.media.type === "image") {
      setShowImageViewer(true);
    }
  };

  const handleVideoPress = () => {
    if (post.media && post.media.type === "video") {
      console.log("Video pressed, navigating to PostDetailScreen");
      // Navigate to PostDetailScreen for video playback
      if (onPress) onPress();
    }
  };

  const renderMedia = () => {
    if (!post.media) return null;

    const { type, uri } = post.media;
    const mediaHeight = 300; // Bigger height for better video experience

    if (type === "image") {
      return (
        <TouchableOpacity
          onPress={handleImagePress}
          style={styles.mediaContainer}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri }}
            style={[styles.media, { height: inlineImageHeight }]}
            resizeMode="contain"
            onLoad={(e) => {
              try {
                const natW = e?.nativeEvent?.source?.width;
                const natH = e?.nativeEvent?.source?.height;
                if (natW && natH) {
                  const ratio = natW / natH;
                  const computed = screenWidth / ratio;
                  const isVertical = ratio < 1;
                  const maxH = isVertical
                    ? screenHeight * 0.92
                    : screenHeight * 0.5;
                  const clamped = Math.min(computed, maxH);
                  setInlineImageHeight(Math.max(200, Math.floor(clamped)));
                }
              } catch (err) {
                // ignore
              }
            }}
          />
          <View style={styles.mediaOverlay}>
            <Ionicons
              name="expand"
              size={24}
              color="rgba(255, 255, 255, 0.8)"
            />
          </View>
        </TouchableOpacity>
      );
    }

    if (type === "video") {
      console.log("Rendering video:", uri);

      // If video has a thumbnail, show thumbnail with play button overlay
      if (post.media.thumbnail) {
        return (
          <View style={styles.mediaContainer}>
            <TouchableWithoutFeedback
              onPress={async () => {
                if (!videoRef.current) return;
                const now = Date.now();
                if (now < suppressToggleUntil) return;
                try {
                  if (isVideoPlaying) {
                    await videoRef.current.pauseAsync();
                  } else {
                    await videoRef.current.playAsync();
                  }
                } catch (e) {
                  console.log("Toggle play error:", e);
                }
              }}
            >
              <View>
                {/* Thumbnail overlay - only show when video hasn't started */}
                {!hasVideoStarted && (
                  <View style={styles.thumbnailOverlay}>
                    <Image
                      source={{ uri: post.media.thumbnail }}
                      style={[styles.media, { height: inlineVideoHeight }]}
                      resizeMode="contain"
                    />
                    <View style={styles.videoThumbnailOverlay}>
                      <View style={styles.videoPlayButton}>
                        <Ionicons
                          name="play-circle"
                          size={60}
                          color="rgba(255, 255, 255, 0.9)"
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Video player */}
                <Video
                  ref={videoRef}
                  source={{ uri }}
                  style={[styles.media, { height: inlineVideoHeight }]}
                  resizeMode="contain"
                  shouldPlay={false}
                  isLooping={false}
                  useNativeControls={false}
                  isMuted={isMuted}
                  onError={(error) => console.log("Video error:", error)}
                  onLoad={(status) => {
                    try {
                      const natural = status?.naturalSize;
                      if (natural && natural.width && natural.height) {
                        const ratio = natural.width / natural.height;
                        if (ratio && isFinite(ratio) && ratio > 0) {
                          setVideoAspectRatio(ratio);
                          const isVertical = ratio < 1;

                          if (isVertical) {
                            // For vertical videos, make them extremely compact like Reddit
                            const computedHeight = screenWidth / ratio;
                            const maxHeight = screenHeight * 0.25; // Ultra compact like Reddit
                            setInlineVideoHeight(
                              Math.min(computedHeight, maxHeight)
                            );
                          } else {
                            // For horizontal videos, keep current logic
                            const computed = screenWidth / ratio;
                            const maxH = screenHeight * 0.5;
                            const clamped = Math.min(computed, maxH);
                            setInlineVideoHeight(
                              Math.max(180, Math.floor(clamped))
                            );
                          }
                        }
                      }
                    } catch (e) {
                      // Ignore aspect ratio errors; fallback to default
                    }
                  }}
                  onPlaybackStatusUpdate={(status) => {
                    setIsVideoPlaying(status.isPlaying);

                    // Track when video starts playing
                    if (status.isPlaying && !hasVideoStarted) {
                      setHasVideoStarted(true);
                    }

                    if (
                      status.positionMillis != null ||
                      status.durationMillis != null
                    ) {
                      setPlaybackStatus({
                        positionMillis: status.positionMillis || 0,
                        durationMillis: status.durationMillis || 0,
                      });
                    }

                    if (status.didJustFinish) {
                      setIsVideoPlaying(false);
                      setHasVideoStarted(false); // Reset to show thumbnail again
                      if (videoRef.current) {
                        videoRef.current.setPositionAsync(0);
                      }
                    }
                  }}
                />

                {/* Video controls for thumbnail videos - only show when video has started */}
                {!isVideoPlaying && hasVideoStarted && (
                  <View style={styles.videoControlsContainer}>
                    <View style={styles.controlsRow}>
                      <View
                        style={styles.progressContainer}
                        onLayout={(e) =>
                          setProgressBarWidth(e.nativeEvent.layout.width)
                        }
                      >
                        <View
                          style={styles.progressBarBg}
                          onStartShouldSetResponder={() => true}
                          onResponderGrant={(e) => {
                            if (!progressBarWidth) return;
                            const x = e.nativeEvent.locationX;
                            const ratio = x / progressBarWidth;
                            seekToRatio(ratio);
                          }}
                          onResponderMove={(e) => {
                            if (!progressBarWidth) return;
                            const x = e.nativeEvent.locationX;
                            const ratio = x / progressBarWidth;
                            seekToRatio(ratio);
                          }}
                          onResponderRelease={() => {}}
                        >
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${
                                  playbackStatus.durationMillis > 0
                                    ? (playbackStatus.positionMillis /
                                        playbackStatus.durationMillis) *
                                      100
                                    : 0
                                }%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.timeText}>
                          {formatTime(playbackStatus.positionMillis)} /{" "}
                          {formatTime(playbackStatus.durationMillis)}
                        </Text>
                      </View>

                      <View style={styles.controlButtons}>
                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={async () => {
                            try {
                              await videoRef.current?.setIsMutedAsync(!isMuted);
                              setIsMuted(!isMuted);
                            } catch (e) {
                              console.log("Mute error:", e);
                            }
                          }}
                        >
                          <Ionicons
                            name={isMuted ? "volume-mute" : "volume-high"}
                            size={20}
                            color="#fff"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.controlButton}
                          onPress={() => setIsFullscreen(true)}
                        >
                          <Ionicons name="expand" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        );
      }

      // Fallback to video player if no thumbnail
      return (
        <View style={styles.mediaContainer}>
          <TouchableWithoutFeedback
            onPress={async () => {
              if (!videoRef.current) return;
              const now = Date.now();
              if (now < suppressToggleUntil) return;
              try {
                if (isVideoPlaying) {
                  await videoRef.current.pauseAsync();
                } else {
                  await videoRef.current.playAsync();
                }
              } catch (e) {
                console.log("Toggle play error:", e);
              }
            }}
          >
            <View>
              <Video
                ref={videoRef}
                source={{ uri }}
                style={[styles.media, { height: inlineVideoHeight }]}
                resizeMode="contain"
                shouldPlay={false}
                isLooping={false}
                useNativeControls={false}
                isMuted={isMuted}
                onError={(error) => console.log("Video error:", error)}
                onLoad={(status) => {
                  try {
                    const natural = status?.naturalSize;
                    if (natural && natural.width && natural.height) {
                      const ratio = natural.width / natural.height;
                      if (ratio && isFinite(ratio) && ratio > 0) {
                        setVideoAspectRatio(ratio);
                        const isVertical = ratio < 1;

                        if (isVertical) {
                          // For vertical videos, make them extremely compact like Reddit
                          const computedHeight = screenWidth / ratio;
                          const maxHeight = screenHeight * 0.25; // Ultra compact like Reddit
                          setInlineVideoHeight(
                            Math.min(computedHeight, maxHeight)
                          );
                        } else {
                          // For horizontal videos, keep current logic
                          const computed = screenWidth / ratio;
                          const maxH = screenHeight * 0.5;
                          const clamped = Math.min(computed, maxH);
                          setInlineVideoHeight(
                            Math.max(180, Math.floor(clamped))
                          );
                        }
                      }
                    }
                  } catch (e) {
                    // Ignore aspect ratio errors; fallback to default
                  }
                }}
                onPlaybackStatusUpdate={(status) => {
                  setIsVideoPlaying(status.isPlaying);
                  if (
                    status.positionMillis != null ||
                    status.durationMillis != null
                  ) {
                    setPlaybackStatus({
                      positionMillis: status.positionMillis || 0,
                      durationMillis: status.durationMillis || 0,
                    });
                  }
                  if (status.didJustFinish) {
                    setIsVideoPlaying(false);
                    if (videoRef.current) {
                      videoRef.current.setPositionAsync(0);
                    }
                  }
                }}
              />

              {!isVideoPlaying && (
                <TouchableOpacity
                  style={styles.videoPlayButton}
                  onPress={async () => {
                    if (!videoRef.current) return;
                    try {
                      await videoRef.current.playAsync();
                    } catch (e) {
                      console.log("Play error:", e);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="play-circle"
                    size={60}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                </TouchableOpacity>
              )}

              {/* Double-tap zones for +/-10s in inline */}
              <TouchableWithoutFeedback
                onPress={() => {
                  const now = Date.now();
                  if (now - lastLeftTap < 300) {
                    setSuppressToggleUntil(now + 350);
                    (async () => {
                      try {
                        const newPos = Math.max(
                          0,
                          (playbackStatus.positionMillis || 0) - 10000
                        );
                        if (videoRef.current) {
                          await videoRef.current.setPositionAsync(newPos);
                        }
                        setInlineSeekHint("back");
                        setTimeout(() => setInlineSeekHint(null), 600);
                      } catch (e) {
                        console.log("Inline DT rewind error:", e);
                      }
                    })();
                  }
                  setLastLeftTap(now);
                }}
              >
                <View pointerEvents="box-only" style={styles.inlineLeftZone} />
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback
                onPress={() => {
                  const now = Date.now();
                  if (now - lastRightTap < 300) {
                    setSuppressToggleUntil(now + 350);
                    (async () => {
                      try {
                        const duration = playbackStatus.durationMillis || 0;
                        const newPos = Math.min(
                          duration,
                          (playbackStatus.positionMillis || 0) + 10000
                        );
                        if (videoRef.current) {
                          await videoRef.current.setPositionAsync(newPos);
                        }
                        setInlineSeekHint("forward");
                        setTimeout(() => setInlineSeekHint(null), 600);
                      } catch (e) {
                        console.log("Inline DT forward error:", e);
                      }
                    })();
                  }
                  setLastRightTap(now);
                }}
              >
                <View pointerEvents="box-only" style={styles.inlineRightZone} />
              </TouchableWithoutFeedback>

              {inlineSeekHint === "back" && (
                <View style={styles.inlineSeekHintLeft}>
                  <Ionicons name="play-back" size={28} color="#fff" />
                  <Text style={styles.seekHintText}>10s</Text>
                </View>
              )}
              {inlineSeekHint === "forward" && (
                <View style={styles.inlineSeekHintRight}>
                  <Ionicons name="play-forward" size={28} color="#fff" />
                  <Text style={styles.seekHintText}>10s</Text>
                </View>
              )}

              {!isVideoPlaying && (
                <View style={styles.videoControlsContainer}>
                  <View
                    style={styles.progressContainer}
                    onLayout={(e) =>
                      setProgressBarWidth(e.nativeEvent.layout.width)
                    }
                  >
                    <View
                      style={styles.progressBarBg}
                      onStartShouldSetResponder={() => true}
                      onResponderGrant={(e) => {
                        if (!progressBarWidth) return;
                        const x = e.nativeEvent.locationX;
                        const ratio = x / progressBarWidth;
                        seekToRatio(ratio);
                      }}
                      onResponderMove={(e) => {
                        if (!progressBarWidth) return;
                        const x = e.nativeEvent.locationX;
                        const ratio = x / progressBarWidth;
                        seekToRatio(ratio);
                      }}
                      onResponderRelease={(e) => {
                        if (!progressBarWidth) return;
                        const x = e.nativeEvent.locationX;
                        const ratio = x / progressBarWidth;
                        seekToRatio(ratio);
                      }}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: playbackStatus.durationMillis
                              ? `${
                                  (100 * playbackStatus.positionMillis) /
                                  playbackStatus.durationMillis
                                }%`
                              : "0%",
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Removed bottom +/-10s to avoid duplicates; center controls handle seeking */}

                  <View style={styles.rightControlsGroup}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={async () => {
                        const nextMuted = !isMuted;
                        setIsMuted(nextMuted);
                        if (videoRef.current) {
                          try {
                            await videoRef.current.setIsMutedAsync(nextMuted);
                          } catch (e) {
                            console.log("Mute toggle error:", e);
                          }
                        }
                      }}
                    >
                      <Ionicons
                        name={isMuted ? "volume-mute" : "volume-high"}
                        size={22}
                        color="#fff"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={async () => {
                        if (!videoRef.current) return;
                        try {
                          // Pause inline player and open custom fullscreen modal
                          await videoRef.current.pauseAsync();
                          setIsVideoPlaying(false);
                          setIsFullscreen(true);
                        } catch (e) {
                          console.log("Enter fullscreen error:", e);
                        }
                      }}
                    >
                      <Ionicons name="expand" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.timeRow}>
                    <Text style={styles.timeText}>
                      {formatTime(playbackStatus.positionMillis)} /{" "}
                      {formatTime(playbackStatus.durationMillis)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      );
    }

    return null;
  };

  const renderContent = () => {
    if (!post.content) return null;

    const displayContent = showFullContent
      ? post.content
      : post.content.substring(0, maxContentLength);

    return (
      <View style={styles.contentContainer}>
        <Text style={styles.contentText}>{displayContent}</Text>
        {shouldShowReadMore && !showFullContent && (
          <TouchableOpacity onPress={() => setShowFullContent(true)}>
            <Text style={styles.readMoreText}>Read more</Text>
          </TouchableOpacity>
        )}
        {showFullContent && shouldShowReadMore && (
          <TouchableOpacity onPress={() => setShowFullContent(false)}>
            <Text style={styles.readMoreText}>Show less</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            {post.authorPhoto ? (
              <Image
                source={{ uri: post.authorPhoto }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={20} color="#666" />
            )}
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{post.author}</Text>
            {post.community && (
              <Text style={styles.communityName}>in {post.community}</Text>
            )}
            <Text style={styles.timeAgo}>{post.timeAgo}</Text>
          </View>
        </View>
        {/* Three dots menu - only show for author */}
        {isAuthor && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={async () => {
              Alert.alert("Post Options", "What would you like to do?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Post",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await PostService.deletePost(post.id);
                      if (onDelete) onDelete(post);
                      Alert.alert("Success", "Post deleted successfully");
                    } catch (e) {
                      const errorMessage = e.message || "Failed to delete post";
                      Alert.alert("Error", errorMessage);
                    }
                  },
                },
              ]);
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      {post.title && <Text style={styles.title}>{post.title}</Text>}

      {/* Content */}
      {renderContent()}

      {/* Media */}
      {renderMedia()}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={20}
            color={isLiked ? "#ff4444" : "#666"}
          />
          <Text style={styles.actionText}>{post.likes || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment && onComment(post)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{post.comments || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{post.views || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.imageViewerClose}
            onPress={() => setShowImageViewer(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            style={styles.imageScrollView}
          >
            <Image
              source={{ uri: post.media?.uri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Custom Fullscreen Video Modal with X button */}
      <Modal
        visible={isFullscreen}
        transparent={true}
        animationType="fade"
        onRequestClose={async () => {
          try {
            if (fullscreenVideoRef.current) {
              const status = await fullscreenVideoRef.current.getStatusAsync();
              if (status?.positionMillis != null && videoRef.current) {
                await videoRef.current.setPositionAsync(status.positionMillis);
              }
              await fullscreenVideoRef.current.pauseAsync();
            }
          } catch (e) {
            console.log("Sync on close error:", e);
          }
          setIsFullscreen(false);
        }}
      >
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity
            style={styles.fullscreenClose}
            onPress={async () => {
              try {
                if (fullscreenVideoRef.current) {
                  const status =
                    await fullscreenVideoRef.current.getStatusAsync();
                  if (status?.positionMillis != null && videoRef.current) {
                    await videoRef.current.setPositionAsync(
                      status.positionMillis
                    );
                  }
                  await fullscreenVideoRef.current.pauseAsync();
                }
              } catch (e) {
                console.log("Sync on X close error:", e);
              }
              setIsFullscreen(false);
            }}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableWithoutFeedback
            onPress={async () => {
              if (!fullscreenVideoRef.current) return;
              try {
                const status =
                  await fullscreenVideoRef.current.getStatusAsync();
                if (status?.isPlaying) {
                  await fullscreenVideoRef.current.pauseAsync();
                } else {
                  await fullscreenVideoRef.current.playAsync();
                }
              } catch (e) {
                console.log("FS toggle error:", e);
              }
            }}
          >
            <View style={styles.fullscreenVideoWrapper}>
              <Video
                ref={fullscreenVideoRef}
                source={{ uri: post.media?.uri }}
                style={styles.fullscreenVideo}
                resizeMode="contain"
                shouldPlay={false}
                isLooping={false}
                useNativeControls={false}
                isMuted={isMuted}
                onLoad={async () => {
                  // Sync the position to fullscreen instance
                  try {
                    if (videoRef.current && fullscreenVideoRef.current) {
                      const status = await videoRef.current.getStatusAsync();
                      if (status?.positionMillis != null) {
                        await fullscreenVideoRef.current.setPositionAsync(
                          status.positionMillis
                        );
                      }
                    }
                  } catch (e) {
                    console.log("FS pre-sync error:", e);
                  }
                }}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isPlaying !== undefined) {
                    setIsVideoPlaying(status.isPlaying);
                  }
                  if (
                    status.positionMillis != null ||
                    status.durationMillis != null
                  ) {
                    setPlaybackStatus({
                      positionMillis: status.positionMillis || 0,
                      durationMillis: status.durationMillis || 0,
                    });
                  }
                }}
              />

              {/* Double-tap zones for +/-10s in fullscreen */}
              <TouchableWithoutFeedback
                onPress={() => {
                  const now = Date.now();
                  if (now - lastFsLeftTap < 300) {
                    (async () => {
                      try {
                        const newPos = Math.max(
                          0,
                          (playbackStatus.positionMillis || 0) - 10000
                        );
                        if (fullscreenVideoRef.current) {
                          await fullscreenVideoRef.current.setPositionAsync(
                            newPos
                          );
                        }
                        setFsSeekHint("back");
                        setTimeout(() => setFsSeekHint(null), 600);
                      } catch (e) {
                        console.log("FS DT rewind error:", e);
                      }
                    })();
                  }
                  setLastFsLeftTap(now);
                }}
              >
                <View pointerEvents="box-only" style={styles.fsLeftZone} />
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback
                onPress={() => {
                  const now = Date.now();
                  if (now - lastFsRightTap < 300) {
                    (async () => {
                      try {
                        const duration = playbackStatus.durationMillis || 0;
                        const newPos = Math.min(
                          duration,
                          (playbackStatus.positionMillis || 0) + 10000
                        );
                        if (fullscreenVideoRef.current) {
                          await fullscreenVideoRef.current.setPositionAsync(
                            newPos
                          );
                        }
                        setFsSeekHint("forward");
                        setTimeout(() => setFsSeekHint(null), 600);
                      } catch (e) {
                        console.log("FS DT forward error:", e);
                      }
                    })();
                  }
                  setLastFsRightTap(now);
                }}
              >
                <View pointerEvents="box-only" style={styles.fsRightZone} />
              </TouchableWithoutFeedback>

              {fsSeekHint === "back" && (
                <View style={styles.fsSeekHintLeft}>
                  <Ionicons name="play-back" size={32} color="#fff" />
                  <Text style={styles.seekHintText}>10s</Text>
                </View>
              )}
              {fsSeekHint === "forward" && (
                <View style={styles.fsSeekHintRight}>
                  <Ionicons name="play-forward" size={32} color="#fff" />
                  <Text style={styles.seekHintText}>10s</Text>
                </View>
              )}

              {!isVideoPlaying && (
                <View style={styles.fsBottomControls}>
                  <View
                    style={styles.fsProgressContainer}
                    onLayout={(e) =>
                      setFsProgressBarWidth(e.nativeEvent.layout.width)
                    }
                  >
                    <View
                      style={styles.progressBarBg}
                      onStartShouldSetResponder={() => true}
                      onResponderGrant={(e) => {
                        if (!fsProgressBarWidth) return;
                        const x = e.nativeEvent.locationX;
                        const ratio = x / fsProgressBarWidth;
                        setFsIsSeeking(true);
                        setFsSeekRatio(ratio);
                        fsSeekToRatio(ratio);
                      }}
                      onResponderMove={(e) => {
                        if (!fsProgressBarWidth) return;
                        const x = e.nativeEvent.locationX;
                        const ratio = x / fsProgressBarWidth;
                        setFsSeekRatio(ratio);
                        fsSeekToRatio(ratio);
                      }}
                      onResponderRelease={(e) => {
                        if (!fsProgressBarWidth) return;
                        const x = e.nativeEvent.locationX;
                        const ratio = x / fsProgressBarWidth;
                        setFsSeekRatio(ratio);
                        fsSeekToRatio(ratio);
                        setFsIsSeeking(false);
                      }}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: playbackStatus.durationMillis
                              ? `${
                                  (100 * playbackStatus.positionMillis) /
                                  playbackStatus.durationMillis
                                }%`
                              : "0%",
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.fsBottomRow}>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={async () => {
                        const nextMuted = !isMuted;
                        setIsMuted(nextMuted);
                        if (fullscreenVideoRef.current) {
                          try {
                            await fullscreenVideoRef.current.setIsMutedAsync(
                              nextMuted
                            );
                          } catch (e) {
                            console.log("FS mute toggle error:", e);
                          }
                        }
                      }}
                    >
                      <Ionicons
                        name={isMuted ? "volume-mute" : "volume-high"}
                        size={22}
                        color="#fff"
                      />
                    </TouchableOpacity>

                    <Text style={styles.timeText}>
                      {formatTime(playbackStatus.positionMillis)} /{" "}
                      {formatTime(playbackStatus.durationMillis)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginBottom: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    paddingBottom: 6,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  communityName: {
    fontSize: 10,
    color: "#666",
    fontStyle: "italic",
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  contentText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  readMoreText: {
    fontSize: 14,
    color: "#1a365d",
    fontWeight: "600",
    marginTop: 4,
  },
  mediaContainer: {
    position: "relative",
    marginHorizontal: 0,
    marginBottom: 4,
    borderRadius: 0,
    overflow: "hidden",
    width: "100%",
    backgroundColor: "#000",
  },
  media: {
    width: "100%",
    backgroundColor: "#000",
  },
  mediaOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
    padding: 8,
  },
  videoOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 24,
  },
  videoControlsContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 3,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  controlButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  progressContainer: {
    flex: 1,
    paddingHorizontal: 2,
    paddingBottom: 8,
  },
  progressBarBg: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 4,
    backgroundColor: "#fff",
  },
  leftControlsGroup: {
    position: "absolute",
    left: 10,
    bottom: 44,
    flexDirection: "row",
    alignItems: "center",
  },
  rightControlsGroup: {
    position: "absolute",
    right: 10,
    bottom: 44,
    flexDirection: "row",
    alignItems: "center",
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 6,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  controlLabel: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  timeRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  imageScrollView: {
    flex: 1,
    width: screenWidth,
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenHeight,
    resizeMode: "contain",
  },
  videoPlayButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -30 }, { translateY: -30 }],
    zIndex: 1,
  },
  videoThumbnailOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  hiddenVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    zIndex: -1,
  },
  visibleVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 1,
    zIndex: 1,
  },
  thumbnailOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  centerControls: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    transform: [{ translateY: -20 }],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  centerSideButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  centerSideLabel: {
    color: "#fff",
    fontSize: 10,
    marginTop: 2,
  },
  inlineLeftZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "35%",
  },
  inlineRightZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "35%",
  },
  inlineSeekHintLeft: {
    position: "absolute",
    top: "50%",
    left: 24,
    transform: [{ translateY: -20 }],
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inlineSeekHintRight: {
    position: "absolute",
    top: "50%",
    right: 24,
    transform: [{ translateY: -20 }],
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seekHintText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 6,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenClose: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  fullscreenVideoWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenVideo: {
    width: "100%",
    height: "100%",
  },
  fsLeftZone: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "35%",
  },
  fsRightZone: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "35%",
  },
  fsSeekHintLeft: {
    position: "absolute",
    top: "50%",
    left: 30,
    transform: [{ translateY: -24 }],
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fsSeekHintRight: {
    position: "absolute",
    top: "50%",
    right: 30,
    transform: [{ translateY: -24 }],
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fsCenterControls: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    transform: [{ translateY: -36 }],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  fsPlayButton: {
    paddingHorizontal: 16,
  },
  fsSideButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  fsSideLabel: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  fsBottomControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  fsProgressContainer: {
    width: "100%",
    paddingBottom: 8,
  },
  fsBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export default MediaPostCard;
