import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FirebaseStorageService from "./FirebaseStorageService";

class MeditationFirebaseService {
  // Save user-created meditation to Firebase (and locally as backup)
  static async saveMeditation(meditation) {
    try {
      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to create meditations");
      }

      // Upload custom music to Firebase Storage if it's from phone
      let uploadedMusic = meditation.music;
      if (meditation.music && meditation.music.type === "phone" && meditation.music.uri) {
        try {
          // Upload audio file to Firebase Storage
          const uploadResult = await FirebaseStorageService.uploadAudio(
            meditation.music.uri,
            "meditations/music",
            meditation.music.fileName
          );
          uploadedMusic = {
            type: "phone",
            uri: uploadResult.url,
            url: uploadResult.url,
            fileName: meditation.music.fileName,
            storagePath: uploadResult.path,
          };
        } catch (uploadError) {
          console.warn("Error uploading meditation music:", uploadError.message);
          // Continue without music if upload fails
          uploadedMusic = null;
        }
      }

      // Upload images to Firebase Storage if they're from phone
      let uploadedImages = meditation.images || [];
      if (meditation.images && meditation.images.length > 0) {
        const uploadPromises = meditation.images.map(async (img) => {
          if (img.type === "phone" && img.uri && !img.uri.startsWith("https://firebasestorage.googleapis.com")) {
            try {
              const uploadResult = await FirebaseStorageService.uploadImage(
                img.uri,
                "meditations/images"
              );
              return {
                ...img,
                uri: uploadResult.url,
                url: uploadResult.url,
              };
            } catch (uploadError) {
              console.warn("Error uploading meditation image:", uploadError.message);
              return img; // Keep original if upload fails
            }
          }
          return img; // Asset images don't need upload
        });
        uploadedImages = await Promise.all(uploadPromises);
      }

      // Upload cover image if it's from phone
      let uploadedCoverImage = meditation.coverImage;
      if (meditation.coverImage && meditation.coverImage.type === "phone" && meditation.coverImage.uri && !meditation.coverImage.uri.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          const uploadResult = await FirebaseStorageService.uploadImage(
            meditation.coverImage.uri,
            "meditations/images"
          );
          uploadedCoverImage = {
            ...meditation.coverImage,
            uri: uploadResult.url,
            url: uploadResult.url,
          };
        } catch (uploadError) {
          console.warn("Error uploading cover image:", uploadError.message);
        }
      }

      // Prepare meditation data for Firestore
      const firestoreMeditationData = {
        title: meditation.title,
        creatorName: meditation.creatorName || null,
        theme: meditation.theme,
        scriptures: meditation.scriptures || [],
        coverImage: uploadedCoverImage,
        images: uploadedImages,
        video: meditation.video || null,
        music: uploadedMusic,
        backgroundColor: meditation.backgroundColor || null,
        author: currentUser.displayName || "Anonymous",
        authorId: currentUser.uid,
        authorPhoto: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        likes: 0,
        uses: 0,
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "meditations"), firestoreMeditationData);
      
      // Also save locally as backup
      const localMeditation = {
        id: docRef.id,
        ...firestoreMeditationData,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      await this.saveMeditationLocally(localMeditation);

      return { success: true, meditationId: docRef.id, meditation: localMeditation };
    } catch (error) {
      console.warn("Error saving meditation to Firebase (using local storage):", error.message);
      // Fallback to local storage
      return await this.saveMeditationLocally(meditation);
    }
  }

  // Get all user-created meditations from Firebase (prioritize Firebase, merge with local)
  static async getAllMeditations() {
    try {
      // Always fetch from Firebase first to get latest meditations
      const meditationsRef = collection(db, "meditations");
      const q = query(meditationsRef, orderBy("createdAt", "desc")); // Newest first
      const querySnapshot = await getDocs(q);
      const meditations = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        meditations.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          timestamp: data.createdAt?.toDate?.()?.toISOString() || data.timestamp,
        });
      });

      console.log(`📋 Loaded ${meditations.length} meditations from Firebase`);

      // Also get local meditations and merge (for offline support)
      const localMeditations = await this.getLocalMeditations();
      const firebaseMeditationIds = new Set(meditations.map(m => m.id));
      const uniqueLocalMeditations = localMeditations.filter(m => !firebaseMeditationIds.has(m.id));

      // Firebase meditations first (already sorted newest first), then local
      const allMeditations = [...meditations, ...uniqueLocalMeditations];
      
      // Sort all by date (newest first)
      allMeditations.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.timestamp || 0);
        const dateB = new Date(b.createdAt || b.timestamp || 0);
        return dateB - dateA;
      });

      console.log(`📋 Total meditations (Firebase + local): ${allMeditations.length}`);
      return allMeditations;
    } catch (error) {
      console.warn("Error getting meditations from Firebase (using local storage):", error.message);
      // Fallback to local storage
      return await this.getLocalMeditations();
    }
  }

  // Save meditation locally
  static async saveMeditationLocally(meditation) {
    try {
      const existingMeditations = await AsyncStorage.getItem("user_meditations");
      const meditations = existingMeditations ? JSON.parse(existingMeditations) : [];
      meditations.push(meditation);
      await AsyncStorage.setItem("user_meditations", JSON.stringify(meditations));
      return { success: true, meditationId: meditation.id, meditation };
    } catch (error) {
      console.error("Error saving meditation locally:", error);
      throw error;
    }
  }

  // Get local meditations
  static async getLocalMeditations() {
    try {
      const meditationsJson = await AsyncStorage.getItem("user_meditations");
      if (meditationsJson) {
        const meditations = JSON.parse(meditationsJson);
        // Sort by date (newest first)
        meditations.sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0);
          const dateB = new Date(b.timestamp || b.createdAt || 0);
          return dateB - dateA;
        });
        return meditations;
      }
      return [];
    } catch (error) {
      console.error("Error getting local meditations:", error);
      return [];
    }
  }
}

export default MeditationFirebaseService;

