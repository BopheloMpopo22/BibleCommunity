import { Image } from "react-native";

/**
 * AssetPreloadService
 * Preloads all permanent media assets on app start to prevent loading delays
 */
class AssetPreloadService {
  // All permanent assets that should be preloaded
  static permanentAssets = {
    // Time-based header images
    morningBG: require("../assets/background-morning-picture.jpg"),
    afternoonBG: require("../assets/background-afternoon-picture.jpg"),
    nightBG: require("../assets/background-night-picture.jpg"),
    morningGradient: require("../assets/morning-gradient.jpg"),
    afternoonGradient: require("../assets/afternoon-gradient.jpg"),
    nightGradient: require("../assets/night-gradient.jpg"),

    // Community header
    communityHeaderBG: require("../assets/community-header-background.jpg"),

    // Icons/Stickers (permanent media - preload to prevent black screens)
    openArtPrayingHands: require("../assets/openart-praying-hands.png"),
    openArtBible: require("../assets/openart-bible.png"),
    openArtMeditation: require("../assets/openart-meditation.png"),
    openArtWordOfDay: require("../assets/openart-word-of-the-day.png"),
    openArtPrayerRequest: require("../assets/openart-prayer-request.png"),
    openArtCommunity: require("../assets/openart-community.png"),
    openArtHourglass: require("../assets/openart-hourglass.png"),

    // Meditation category images (permanent media)
    meditationField: require("../assets/field-3629120_1920.jpg"),
    meditationSea: require("../assets/sea-4242303_1920.jpg"),
    meditationJoy: require("../assets/Joy Photo.jpg"),
    meditationHope: require("../assets/Hope Photo.jpg"),
    meditationFaith: require("../assets/Faith photo.jpg"),
    meditationPeace: require("../assets/Peace photo.jpg"),
    meditationBackground: require("../assets/Background of meditaton screen..jpg"),
  };

  // Cache for preloaded images
  static preloadedImages = new Map();

  /**
   * Preload all permanent assets
   * Call this on app start (in App.js or main entry point)
   * For require() assets, they're already bundled - just cache them immediately
   */
  static preloadAllAssets() {
    console.log("[AssetPreload] Starting asset preload...");
    const startTime = Date.now();

    try {
      // For require() assets, they're already bundled in the app
      // Just cache them immediately - no async needed, they're instant
      Object.entries(this.permanentAssets).forEach(([key, asset]) => {
        if (asset) {
          this.preloadedImages.set(key, asset);
        }
      });

      const duration = Date.now() - startTime;
      const count = Object.keys(this.permanentAssets).length;
      console.log(
        `[AssetPreload] ✅ Cached ${count} bundled assets in ${duration}ms`
      );

      return { success: true, count, duration };
    } catch (error) {
      console.error("[AssetPreload] Error during preload:", error);
      throw error;
    }
  }

  /**
   * Get a preloaded asset by key
   */
  static getAsset(key) {
    return this.preloadedImages.get(key) || this.permanentAssets[key];
  }

  /**
   * Check if assets are preloaded
   */
  static isPreloaded() {
    return this.preloadedImages.size > 0;
  }

  /**
   * Preload time-based images specifically (for smooth transitions)
   */
  static async preloadTimeBasedImages() {
    const timeBasedAssets = [
      "morningBG",
      "afternoonBG",
      "nightBG",
      "morningGradient",
      "afternoonGradient",
      "nightGradient",
    ];

    console.log("[AssetPreload] Preloading time-based images...");
    const promises = timeBasedAssets.map((key) => {
      const asset = this.permanentAssets[key];
      if (asset) {
        this.preloadedImages.set(key, asset);
      }
    });

    await Promise.all(promises);
    console.log("[AssetPreload] ✅ Time-based images preloaded");
  }
}

// Preload immediately when module loads (before App component renders)
AssetPreloadService.preloadAllAssets();

export default AssetPreloadService;
