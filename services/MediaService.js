import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

class MediaService {
  static MEDIA_KEY = "user_media";

  // Request permissions for camera and media library
  static async requestPermissions() {
    try {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      return {
        camera: cameraStatus === "granted",
        mediaLibrary: mediaLibraryStatus === "granted",
      };
    } catch (error) {
      console.error("Error requesting permissions:", error);
      return { camera: false, mediaLibrary: false };
    }
  }

  // Pick image from gallery
  static async pickImage() {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.mediaLibrary) {
        throw new Error("Media library permission not granted");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        return result.assets.map((asset) => ({
          id: Date.now() + Math.random(),
          uri: asset.uri,
          type: "image",
          width: asset.width,
          height: asset.height,
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error picking image:", error);
      throw error;
    }
  }

  // Take photo with camera
  static async takePhoto() {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.camera) {
        throw new Error("Camera permission not granted");
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        return [
          {
            id: Date.now() + Math.random(),
            uri: result.assets[0].uri,
            type: "image",
            width: result.assets[0].width,
            height: result.assets[0].height,
            fileName: `photo_${Date.now()}.jpg`,
          },
        ];
      }

      return [];
    } catch (error) {
      console.error("Error taking photo:", error);
      throw error;
    }
  }

  // Pick video from gallery
  static async pickVideo() {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.mediaLibrary) {
        throw new Error("Media library permission not granted");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: false,
        quality: 0.8,
        videoMaxDuration: 180, // 3 minutes (180 seconds)
        allowsEditing: true,
      });

      if (!result.canceled) {
        return [
          {
            id: Date.now() + Math.random(),
            uri: result.assets[0].uri,
            type: "video",
            duration: result.assets[0].duration,
            fileName: result.assets[0].fileName || `video_${Date.now()}.mp4`,
          },
        ];
      }

      return [];
    } catch (error) {
      console.error("Error picking video:", error);
      throw error;
    }
  }

  // Record video with camera
  static async recordVideo() {
    try {
      const permissions = await this.requestPermissions();
      if (!permissions.camera) {
        throw new Error("Camera permission not granted");
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 180, // 3 minutes (180 seconds)
      });

      if (!result.canceled) {
        return [
          {
            id: Date.now() + Math.random(),
            uri: result.assets[0].uri,
            type: "video",
            duration: result.assets[0].duration,
            fileName: `video_${Date.now()}.mp4`,
          },
        ];
      }

      return [];
    } catch (error) {
      console.error("Error recording video:", error);
      throw error;
    }
  }

  // Save media to local storage
  static async saveMedia(mediaItems) {
    try {
      const existingMedia = await this.getStoredMedia();
      const updatedMedia = [...existingMedia, ...mediaItems];

      await AsyncStorage.setItem(this.MEDIA_KEY, JSON.stringify(updatedMedia));
      return updatedMedia;
    } catch (error) {
      console.error("Error saving media:", error);
      throw error;
    }
  }

  // Get stored media
  static async getStoredMedia() {
    try {
      const media = await AsyncStorage.getItem(this.MEDIA_KEY);
      return media ? JSON.parse(media) : [];
    } catch (error) {
      console.error("Error getting stored media:", error);
      return [];
    }
  }

  // Remove media from storage
  static async removeMedia(mediaId) {
    try {
      const existingMedia = await this.getStoredMedia();
      const updatedMedia = existingMedia.filter((item) => item.id !== mediaId);

      await AsyncStorage.setItem(this.MEDIA_KEY, JSON.stringify(updatedMedia));
      return updatedMedia;
    } catch (error) {
      console.error("Error removing media:", error);
      throw error;
    }
  }

  // Clear all media
  static async clearAllMedia() {
    try {
      await AsyncStorage.removeItem(this.MEDIA_KEY);
    } catch (error) {
      console.error("Error clearing media:", error);
      throw error;
    }
  }

  // Get media by type
  static async getMediaByType(type) {
    try {
      const allMedia = await this.getStoredMedia();
      return allMedia.filter((item) => item.type === type);
    } catch (error) {
      console.error("Error getting media by type:", error);
      return [];
    }
  }

  // Format file size
  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Format duration for videos
  static formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // Validate media file
  static validateMedia(mediaItem) {
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    const maxVideoDuration = 180; // 3 minutes (180 seconds)

    if (mediaItem.type === "image") {
      if (mediaItem.fileSize && mediaItem.fileSize > maxImageSize) {
        return { valid: false, error: "Image size must be less than 10MB" };
      }
    } else if (mediaItem.type === "video") {
      if (mediaItem.fileSize && mediaItem.fileSize > maxVideoSize) {
        return { valid: false, error: "Video size must be less than 100MB" };
      }
      if (mediaItem.duration && mediaItem.duration > maxVideoDuration) {
        return {
          valid: false,
          error: "Video duration must be 3 minutes or less",
        };
      }
    }

    return { valid: true };
  }
}

export default MediaService;
