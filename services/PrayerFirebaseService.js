import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  increment,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FirebaseStorageService from "./FirebaseStorageService";

class PrayerFirebaseService {
  // Save a prayer to Firebase (and locally as backup)
  static async savePrayer(prayer) {
    try {
      // Get current user
      const userData = await this.getCurrentUser();
      
      // Upload media to Firebase Storage if present
      let uploadedImages = prayer.images || [];
      let uploadedVideos = prayer.videos || [];
      let media = prayer.media || null;

      if ((prayer.images && prayer.images.length > 0) || (prayer.videos && prayer.videos.length > 0)) {
        try {
          console.log("Uploading prayer media to Firebase Storage...");
          const uploadResult = await FirebaseStorageService.uploadMedia(
            {
              images: prayer.images || [],
              videos: prayer.videos || [],
            },
            "prayer"
          );
          uploadedImages = uploadResult.images;
          uploadedVideos = uploadResult.videos;
          media = uploadResult.media;
          console.log("Prayer media uploaded successfully:", {
            images: uploadedImages.length,
            videos: uploadedVideos.length,
          });
        } catch (uploadError) {
          console.warn("Error uploading prayer media to Firebase Storage:", uploadError.message);
          // Continue with local URIs if upload fails (graceful degradation)
        }
      }
      
      // Prepare prayer data for Firestore
      const firestorePrayerData = {
        title: prayer.title,
        content: prayer.content || prayer.body,
        category: prayer.category || "General",
        author: userData?.displayName || prayer.author || "Anonymous",
        authorId: userData?.uid || "anonymous",
        authorPhoto: userData?.photoURL || null,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        type: prayer.type || "prayer",
        isActive: true,
        // Media (now with Firebase Storage URLs)
        media: media,
        images: uploadedImages,
        videos: uploadedVideos,
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "prayers"), firestorePrayerData);
      
      // Also save locally as backup
      const localPrayer = {
        id: docRef.id,
        ...firestorePrayerData,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      await this.savePrayerLocally(localPrayer);

      return { success: true, prayerId: docRef.id, prayer: localPrayer };
    } catch (error) {
      console.warn("Error saving prayer to Firebase (using local storage):", error.message, error.code);
      console.warn("Full error:", error);
      // Fallback to local storage
      return await this.savePrayerLocally(prayer);
    }
  }

  // Save a prayer request to Firebase (and locally as backup)
  static async savePrayerRequest(request) {
    try {
      // Get current user
      const userData = await this.getCurrentUser();
      
      // Upload media to Firebase Storage if present
      let uploadedImages = request.images || [];
      let uploadedVideos = request.videos || [];
      let media = request.media || null;

      if ((request.images && request.images.length > 0) || (request.videos && request.videos.length > 0)) {
        try {
          console.log("Uploading prayer request media to Firebase Storage...");
          const uploadResult = await FirebaseStorageService.uploadMedia(
            {
              images: request.images || [],
              videos: request.videos || [],
            },
            "prayer_request"
          );
          uploadedImages = uploadResult.images;
          uploadedVideos = uploadResult.videos;
          media = uploadResult.media;
          console.log("Prayer request media uploaded successfully:", {
            images: uploadedImages.length,
            videos: uploadedVideos.length,
          });
        } catch (uploadError) {
          console.warn("Error uploading prayer request media to Firebase Storage:", uploadError.message);
          // Continue with local URIs if upload fails (graceful degradation)
        }
      }
      
      // Prepare request data for Firestore
      const firestoreRequestData = {
        title: request.title,
        content: request.content,
        category: request.category || "General",
        author: userData?.displayName || request.author || "Anonymous",
        authorId: userData?.uid || "anonymous",
        authorPhoto: userData?.photoURL || null,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        type: "request",
        isActive: true,
        // Media (now with Firebase Storage URLs)
        media: media,
        images: uploadedImages,
        videos: uploadedVideos,
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "prayer_requests"), firestoreRequestData);
      
      // Also save locally as backup
      const localRequest = {
        id: docRef.id,
        ...firestoreRequestData,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      await this.saveRequestLocally(localRequest);

      return { success: true, requestId: docRef.id, request: localRequest };
    } catch (error) {
      console.warn("Error saving prayer request to Firebase (using local storage):", error.message, error.code);
      console.warn("Full error:", error);
      // Fallback to local storage
      return await this.saveRequestLocally(request);
    }
  }

  // Get all prayers from Firebase (LOCAL FIRST for instant display, then sync Firebase)
  static async getAllPrayers() {
    // Return local data immediately (instant display)
    const localPrayers = await this.getLocalPrayers();
    
    // Fetch from Firebase in background (non-blocking)
    try {
      const prayersRef = collection(db, "prayers");
      const querySnapshot = await getDocs(prayersRef);
      const prayers = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive !== false) {
          prayers.push({
            id: doc.id,
            ...data,
            timestamp: data.createdAt?.toDate?.()?.toISOString() || data.timestamp,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            itemType: "prayer",
          });
        }
      });

      // Merge Firebase with local
      const firebasePrayerIds = new Set(prayers.map(p => p.id));
      const uniqueLocalPrayers = localPrayers.filter(p => !firebasePrayerIds.has(p.id));
      const allPrayers = [...prayers, ...uniqueLocalPrayers];
      
      // Sort by date (newest first)
      allPrayers.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0);
        const dateB = new Date(b.timestamp || b.createdAt || 0);
        return dateB - dateA;
      });

      return allPrayers;
    } catch (error) {
      console.warn("Error getting prayers from Firebase (using local only):", error.message);
      // Return local data if Firebase fails
      return localPrayers;
    }
  }

  // Get all prayer requests (LOCAL FIRST for instant display, then sync Firebase)
  static async getAllPrayerRequests() {
    // Return local data immediately (instant display)
    const localRequests = await this.getLocalRequests();
    
    // Fetch from Firebase in background (non-blocking)
    try {
      const requestsRef = collection(db, "prayer_requests");
      const querySnapshot = await getDocs(requestsRef);
      const requests = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive !== false) {
          requests.push({
            id: doc.id,
            ...data,
            timestamp: data.createdAt?.toDate?.()?.toISOString() || data.timestamp,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            itemType: "request",
          });
        }
      });

      // Merge Firebase with local
      const firebaseRequestIds = new Set(requests.map(r => r.id));
      const uniqueLocalRequests = localRequests.filter(r => !firebaseRequestIds.has(r.id));
      const allRequests = [...requests, ...uniqueLocalRequests];
      
      // Sort by date (newest first)
      allRequests.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0);
        const dateB = new Date(b.timestamp || b.createdAt || 0);
        return dateB - dateA;
      });

      return allRequests;
    } catch (error) {
      console.warn("Error getting prayer requests from Firebase (using local only):", error.message);
      // Return local data if Firebase fails
      return localRequests;
    }
  }

  // Update prayer like count in Firebase
  static async updatePrayerLikeCount(prayerId, incrementBy = 1) {
    try {
      // Determine which collection based on prayer type
      const prayerDoc = await getDoc(doc(db, "prayers", prayerId));
      const requestDoc = await getDoc(doc(db, "prayer_requests", prayerId));
      
      if (prayerDoc.exists()) {
        await updateDoc(doc(db, "prayers", prayerId), {
          likes: increment(incrementBy),
        });
      } else if (requestDoc.exists()) {
        await updateDoc(doc(db, "prayer_requests", prayerId), {
          likes: increment(incrementBy),
        });
      }
    } catch (error) {
      console.warn("Error updating prayer like count in Firebase:", error.message);
      // Non-critical, continue
    }
  }

  // Local storage fallback methods
  static async savePrayerLocally(prayer) {
    try {
      const prayers = await this.getLocalPrayers();
      prayers.unshift(prayer);
      await AsyncStorage.setItem("community_prayers", JSON.stringify(prayers));
      return { success: true, prayerId: prayer.id, prayer };
    } catch (error) {
      console.error("Error saving prayer locally:", error);
      return { success: false };
    }
  }

  static async saveRequestLocally(request) {
    try {
      const requests = await this.getLocalRequests();
      requests.unshift(request);
      await AsyncStorage.setItem("prayer_requests", JSON.stringify(requests));
      return { success: true, requestId: request.id, request };
    } catch (error) {
      console.error("Error saving request locally:", error);
      return { success: false };
    }
  }

  static async getLocalPrayers() {
    try {
      const prayersJson = await AsyncStorage.getItem("community_prayers");
      return prayersJson ? JSON.parse(prayersJson) : [];
    } catch (error) {
      return [];
    }
  }

  static async getLocalRequests() {
    try {
      const requestsJson = await AsyncStorage.getItem("prayer_requests");
      return requestsJson ? JSON.parse(requestsJson) : [];
    } catch (error) {
      return [];
    }
  }

  static async getCurrentUser() {
    try {
      // First check Firebase Auth (required for Firestore rules)
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        return {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        };
      }
      
      // Fallback to AsyncStorage (for local storage operations)
      const userData = await AsyncStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  // Delete a prayer (author only)
  static async deletePrayer(prayerId) {
    try {
      // Get current user to verify ownership
      const userData = await this.getCurrentUser();
      if (!userData || !userData.uid) {
        throw new Error("You must be signed in to delete a prayer");
      }

      // First, get the prayer to check ownership
      const prayerRef = doc(db, "prayers", prayerId);
      const prayerDoc = await getDoc(prayerRef);
      
      if (!prayerDoc.exists()) {
        // Prayer doesn't exist in Firestore, just remove from local cache
        const localPrayers = await this.getLocalPrayers();
        const filteredPrayers = localPrayers.filter((p) => p.id !== prayerId);
        await AsyncStorage.setItem("community_prayers", JSON.stringify(filteredPrayers));
        return { success: true };
      }

      const prayerData = prayerDoc.data();
      
      // Check if user is the author
      const prayerAuthorId = prayerData.authorId || prayerData.author_id || null;
      
      if (!prayerAuthorId) {
        // Old prayer without authorId - allow deletion for legacy prayers if user is authenticated
        console.warn("Prayer missing authorId field - allowing deletion for legacy prayer");
      } else if (prayerAuthorId !== userData.uid) {
        // User is not the author
        throw new Error("You don't have permission to delete this prayer. Only the author can delete their own prayers.");
      }

      // User is authorized - delete the prayer
      await deleteDoc(prayerRef);

      // Remove from local storage cache
      const localPrayers = await this.getLocalPrayers();
      const filteredPrayers = localPrayers.filter((p) => p.id !== prayerId);
      await AsyncStorage.setItem("community_prayers", JSON.stringify(filteredPrayers));

      return { success: true };
    } catch (error) {
      console.error("Error deleting prayer:", error);
      // Return more specific error message
      if (error.message.includes("permission") || error.message.includes("must be signed in")) {
        throw error;
      }
      throw new Error(error.message || "Failed to delete prayer");
    }
  }

  // Delete a prayer request (author only)
  static async deletePrayerRequest(requestId) {
    try {
      // Get current user to verify ownership
      const userData = await this.getCurrentUser();
      if (!userData || !userData.uid) {
        throw new Error("You must be signed in to delete a prayer request");
      }

      // First, get the prayer request to check ownership
      const requestRef = doc(db, "prayer_requests", requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        // Request doesn't exist in Firestore, just remove from local cache
        const localRequests = await this.getLocalRequests();
        const filteredRequests = localRequests.filter((r) => r.id !== requestId);
        await AsyncStorage.setItem("prayer_requests", JSON.stringify(filteredRequests));
        return { success: true };
      }

      const requestData = requestDoc.data();
      
      // Check if user is the author
      const requestAuthorId = requestData.authorId || requestData.author_id || null;
      
      if (!requestAuthorId) {
        // Old request without authorId - allow deletion for legacy requests if user is authenticated
        console.warn("Prayer request missing authorId field - allowing deletion for legacy request");
      } else if (requestAuthorId !== userData.uid) {
        // User is not the author
        throw new Error("You don't have permission to delete this prayer request. Only the author can delete their own requests.");
      }

      // User is authorized - delete the request
      await deleteDoc(requestRef);

      // Remove from local storage cache
      const localRequests = await this.getLocalRequests();
      const filteredRequests = localRequests.filter((r) => r.id !== requestId);
      await AsyncStorage.setItem("prayer_requests", JSON.stringify(filteredRequests));

      return { success: true };
    } catch (error) {
      console.error("Error deleting prayer request:", error);
      // Return more specific error message
      if (error.message.includes("permission") || error.message.includes("must be signed in")) {
        throw error;
      }
      throw new Error(error.message || "Failed to delete prayer request");
    }
  }
}

export default PrayerFirebaseService;

