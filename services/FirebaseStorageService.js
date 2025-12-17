import {
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "../config/firebase";
import * as FileSystem from "expo-file-system";

class FirebaseStorageService {
  /**
   * Upload an image to Firebase Storage
   * @param {string} imageUri - Local file URI (file:// or content://)
   * @param {string} path - Storage path (e.g., "posts/images" or "prayers/images")
   * @param {string} fileName - Optional custom filename, otherwise generates one
   * @returns {Promise<{url: string, path: string}>} Download URL and storage path
   */
  static async uploadImage(imageUri, path = "posts/images", fileName = null) {
    try {
      // Generate unique filename if not provided
      const uniqueFileName =
        fileName ||
        `image_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const storagePath = `${path}/${uniqueFileName}`;
      const storageRef = ref(storage, storagePath);

      // Read file as blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      return {
        url: downloadURL,
        path: storagePath,
        type: "image",
      };
    } catch (error) {
      console.error("Error uploading image to Firebase Storage:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Upload a video to Firebase Storage with progress tracking
   * @param {string} videoUri - Local file URI (file:// or content://)
   * @param {string} path - Storage path (e.g., "posts/videos" or "prayers/videos")
   * @param {string} fileName - Optional custom filename, otherwise generates one
   * @param {Function} onProgress - Optional progress callback (progress: number 0-100)
   * @returns {Promise<{url: string, path: string, thumbnail?: string}>} Download URL, storage path, and optional thumbnail
   */
  static async uploadVideo(
    videoUri,
    path = "posts/videos",
    fileName = null,
    onProgress = null
  ) {
    try {
      // Generate unique filename if not provided
      const uniqueFileName =
        fileName ||
        `video_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
      const storagePath = `${path}/${uniqueFileName}`;
      const storageRef = ref(storage, storagePath);

      // Read file as blob
      const response = await fetch(videoUri);
      const blob = await response.blob();

      // Use resumable upload for large files (videos) with progress tracking
      if (onProgress) {
        const uploadTask = uploadBytesResumable(storageRef, blob);

        return new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              if (onProgress) {
                onProgress(Math.round(progress));
              }
            },
            (error) => {
              console.error(
                "Error uploading video to Firebase Storage:",
                error
              );
              reject(new Error(`Failed to upload video: ${error.message}`));
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(
                  uploadTask.snapshot.ref
                );
                resolve({
                  url: downloadURL,
                  path: storagePath,
                  type: "video",
                  thumbnail: downloadURL,
                });
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      } else {
        // For smaller files or when progress not needed, use regular upload
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        return {
          url: downloadURL,
          path: storagePath,
          type: "video",
          thumbnail: downloadURL,
        };
      }
    } catch (error) {
      console.error("Error uploading video to Firebase Storage:", error);
      throw new Error(`Failed to upload video: ${error.message}`);
    }
  }

  /**
   * Upload multiple images
   * @param {Array<{uri: string, id?: string}>} images - Array of image objects with uri
   * @param {string} path - Storage path prefix
   * @returns {Promise<Array>} Array of uploaded image data with Firebase URLs
   */
  static async uploadImages(images, path = "posts/images") {
    try {
      const uploadPromises = images.map((image) => {
        if (!image.uri) {
          console.warn("Image missing URI, skipping:", image);
          return null;
        }
        // Check if already a Firebase URL (don't re-upload)
        if (image.uri.startsWith("https://firebasestorage.googleapis.com")) {
          return Promise.resolve({
            id: image.id || Date.now().toString(),
            uri: image.uri,
            url: image.uri,
            type: "image",
            ...image,
          });
        }
        return this.uploadImage(image.uri, path).then((result) => ({
          id: image.id || Date.now().toString(),
          uri: result.url,
          url: result.url,
          type: "image",
          width: image.width,
          height: image.height,
          fileName: image.fileName,
        }));
      });

      const results = await Promise.all(uploadPromises);
      return results.filter((result) => result !== null);
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
    }
  }

  /**
   * Upload multiple videos
   * @param {Array<{uri: string, id?: string}>} videos - Array of video objects with uri
   * @param {string} path - Storage path prefix
   * @returns {Promise<Array>} Array of uploaded video data with Firebase URLs
   */
  static async uploadVideos(videos, path = "posts/videos") {
    try {
      const uploadPromises = videos.map((video) => {
        if (!video.uri) {
          console.warn("Video missing URI, skipping:", video);
          return null;
        }
        // Check if already a Firebase URL (don't re-upload)
        if (video.uri.startsWith("https://firebasestorage.googleapis.com")) {
          return Promise.resolve({
            id: video.id || Date.now().toString(),
            uri: video.uri,
            url: video.uri,
            type: "video",
            thumbnail: video.thumbnail,
            duration: video.duration,
            ...video,
          });
        }
        return this.uploadVideo(video.uri, path).then((result) => ({
          id: video.id || Date.now().toString(),
          uri: result.url,
          url: result.url,
          type: "video",
          thumbnail: result.thumbnail || video.thumbnail,
          duration: video.duration,
          fileName: video.fileName,
        }));
      });

      const results = await Promise.all(uploadPromises);
      return results.filter((result) => result !== null);
    } catch (error) {
      console.error("Error uploading videos:", error);
      throw error;
    }
  }

  /**
   * Upload media (images and/or videos) for a post or prayer
   * @param {Object} mediaData - Object with images and/or videos arrays
   * @param {string} type - "post", "prayer", or "prayer_request"
   * @returns {Promise<Object>} Object with uploaded images and videos arrays
   */
  static async uploadMedia(mediaData, type = "post") {
    try {
      const pathPrefix = type === "post" ? "posts" : "prayers";
      const results = {
        images: [],
        videos: [],
        media: null,
      };

      // Upload images if present
      if (mediaData.images && mediaData.images.length > 0) {
        results.images = await this.uploadImages(
          mediaData.images,
          `${pathPrefix}/images`
        );
      }

      // Upload videos if present
      if (mediaData.videos && mediaData.videos.length > 0) {
        results.videos = await this.uploadVideos(
          mediaData.videos,
          `${pathPrefix}/videos`
        );
      }

      // Set primary media (first video, or first image if no video)
      if (results.videos.length > 0) {
        results.media = {
          type: "video",
          uri: results.videos[0].url,
          thumbnail: results.videos[0].thumbnail,
          duration: results.videos[0].duration,
        };
      } else if (results.images.length > 0) {
        results.media = {
          type: "image",
          uri: results.images[0].url,
        };
      }

      return results;
    } catch (error) {
      console.error("Error uploading media:", error);
      throw error;
    }
  }
}

export default FirebaseStorageService;
