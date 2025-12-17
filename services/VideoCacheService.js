import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

/**
 * Video Cache Service
 * 
 * Caches videos locally to prevent network-related pauses during playback.
 * Videos are downloaded and stored in the app's cache directory.
 * 
 * How it works:
 * 1. When a video URI is requested, check if it's cached
 * 2. If cached, return local file URI immediately
 * 3. If not cached, download in background and return original URI
 * 4. Next time, use cached version
 * 
 * Storage:
 * - iOS: App's cache directory (cleared when app is uninstalled or cache is cleared)
 * - Android: App's cache directory (same behavior)
 * 
 * Benefits:
 * - Eliminates network buffering pauses
 * - Faster playback on subsequent views
 * - Works offline after first download
 */

class VideoCacheService {
  constructor() {
    // Cache directory for videos
    this.cacheDir = `${FileSystem.cacheDirectory}video_cache/`;
    this.maxCacheSize = 500 * 1024 * 1024; // 500MB max cache size
    this.loggingEnabled = true; // Enable logging for debugging
  }

  /**
   * Initialize cache directory
   */
  async initialize() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
        this.log("Cache directory created");
      }
    } catch (error) {
      console.error("Error initializing video cache:", error);
    }
  }

  /**
   * Generate cache key from video URI
   * Uses a simple hash to avoid nested directory issues
   */
  getCacheKey(uri) {
    // Create a simple hash from the URI to avoid nested directories
    // Remove query parameters
    const cleanUri = uri.split("?")[0];
    // Create a simple hash (just use last part of URL + hash of full URI)
    const urlParts = cleanUri.split("/");
    const lastPart = urlParts[urlParts.length - 1] || "video";
    // Create a hash from the full URI
    let hash = 0;
    for (let i = 0; i < cleanUri.length; i++) {
      const char = cleanUri.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Use hash to create unique filename
    const hashStr = Math.abs(hash).toString(36);
    const filename = lastPart.replace(/[^a-zA-Z0-9.-]/g, "_").substring(0, 50);
    return `${hashStr}_${filename}`;
  }

  /**
   * Get cached file path for a video URI
   */
  getCachedPath(uri) {
    const cacheKey = this.getCacheKey(uri);
    return `${this.cacheDir}${cacheKey}`;
  }

  /**
   * Check if video is cached
   */
  async isCached(uri) {
    try {
      const cachedPath = this.getCachedPath(uri);
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      return fileInfo.exists && fileInfo.size > 0;
    } catch (error) {
      this.log("Error checking cache:", error);
      return false;
    }
  }

  /**
   * Get video URI (cached if available, otherwise original)
   */
  async getVideoUri(originalUri) {
    if (!originalUri) return null;

    try {
      // Check if cached
      const isCached = await this.isCached(originalUri);
      if (isCached) {
        const cachedPath = this.getCachedPath(originalUri);
        this.log(`Using cached video: ${cachedPath}`);
        return cachedPath;
      }

      // Not cached - start downloading in background (non-blocking)
      this.downloadVideo(originalUri).catch((error) => {
        this.log("Background download failed:", error);
      });

      // Return original URI for now
      this.log(`Video not cached, using original URI: ${originalUri}`);
      return originalUri;
    } catch (error) {
      this.log("Error getting video URI:", error);
      return originalUri; // Fallback to original
    }
  }

  /**
   * Download and cache video
   */
  async downloadVideo(uri) {
    try {
      const cachedPath = this.getCachedPath(uri);
      
      // Check if already downloading or cached
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      if (fileInfo.exists && fileInfo.size > 0) {
        this.log("Video already cached");
        return cachedPath;
      }

      this.log(`Downloading video: ${uri}`);
      
      // Ensure cache directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
        this.log("Cache directory created");
      }
      
      // Download video - FileSystem.downloadAsync will create the file, not directories
      // So we just need the cache dir to exist
      const downloadResult = await FileSystem.downloadAsync(uri, cachedPath);
      
      if (downloadResult.status === 200) {
        this.log(`Video cached successfully: ${cachedPath}`);
        return cachedPath;
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
    } catch (error) {
      this.log("Error downloading video:", error);
      throw error;
    }
  }

  /**
   * Pre-cache a video (download immediately)
   * Returns the cached path if successful, false otherwise
   */
  async preCacheVideo(uri) {
    if (!uri) return false;
    
    try {
      const isCached = await this.isCached(uri);
      if (isCached) {
        this.log("Video already cached");
        return this.getCachedPath(uri);
      }

      this.log(`Pre-caching video: ${uri}`);
      const cachedPath = await this.downloadVideo(uri);
      return cachedPath;
    } catch (error) {
      this.log("Error pre-caching video:", error);
      return false;
    }
  }

  /**
   * Clear cache for a specific video
   */
  async clearVideoCache(uri) {
    try {
      const cachedPath = this.getCachedPath(uri);
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(cachedPath, { idempotent: true });
        this.log(`Cleared cache for: ${uri}`);
      }
    } catch (error) {
      this.log("Error clearing video cache:", error);
    }
  }

  /**
   * Clear all cached videos
   */
  async clearAllCache() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
        await this.initialize(); // Recreate directory
        this.log("All video cache cleared");
      }
    } catch (error) {
      this.log("Error clearing all cache:", error);
    }
  }

  /**
   * Get cache size
   */
  async getCacheSize() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) return 0;

      const files = await FileSystem.readDirectoryAsync(this.cacheDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = `${this.cacheDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size;
        }
      }

      return totalSize;
    } catch (error) {
      this.log("Error getting cache size:", error);
      return 0;
    }
  }

  /**
   * Logging helper
   */
  log(...args) {
    if (this.loggingEnabled) {
      console.log("[VideoCache]", ...args);
    }
  }

  /**
   * Enable/disable logging
   */
  setLogging(enabled) {
    this.loggingEnabled = enabled;
  }
}

// Export singleton instance
export default new VideoCacheService();

