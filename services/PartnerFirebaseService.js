import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FirebaseStorageService from "./FirebaseStorageService";

class PartnerFirebaseService {
  // Save partner prayer to Firebase
  static async savePartnerPrayer(prayer) {
    try {
      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to create partner content");
      }

      // Upload media to Firebase Storage if present
      let uploadedVideo = prayer.video;
      let uploadedWallpaper = prayer.wallpaper;

      if (prayer.video && prayer.video.uri && !prayer.video.uri.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          const uploadResult = await FirebaseStorageService.uploadVideo(
            prayer.video.uri,
            "partners/prayers/videos"
          );
          uploadedVideo = {
            ...prayer.video,
            uri: uploadResult.url,
            url: uploadResult.url,
            thumbnail: uploadResult.thumbnail || prayer.video.thumbnail,
          };
        } catch (uploadError) {
          console.warn("Error uploading partner prayer video:", uploadError.message);
        }
      }

      if (prayer.wallpaper && prayer.wallpaper.type === "phone" && prayer.wallpaper.uri && !prayer.wallpaper.uri.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          const uploadResult = await FirebaseStorageService.uploadImage(
            prayer.wallpaper.uri,
            "partners/prayers/wallpapers"
          );
          uploadedWallpaper = {
            type: "phone",
            uri: uploadResult.url,
            url: uploadResult.url,
          };
        } catch (uploadError) {
          console.warn("Error uploading partner prayer wallpaper:", uploadError.message);
        }
      }

      // Prepare prayer data for Firestore
      const firestorePrayerData = {
        time: prayer.time,
        prayer: prayer.prayer,
        video: uploadedVideo,
        wallpaper: uploadedWallpaper,
        textColor: prayer.textColor || "black",
        author: currentUser.displayName || "Anonymous",
        authorId: currentUser.uid,
        authorPhoto: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        selectedDate: null,
        isSelected: false,
        likes: 0,
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "partner_prayers"), firestorePrayerData);
      
      // Also save locally as backup
      const localPrayer = {
        id: docRef.id,
        ...firestorePrayerData,
        createdAt: new Date().toISOString(),
      };
      await this.savePartnerPrayerLocally(localPrayer);

      return { success: true, prayerId: docRef.id, prayer: localPrayer };
    } catch (error) {
      console.warn("Error saving partner prayer to Firebase (using local storage):", error.message);
      // Fallback to local storage
      return await this.savePartnerPrayerLocally(prayer);
    }
  }

  // Save partner word to Firebase
  static async savePartnerWord(word) {
    try {
      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to create partner content");
      }

      // Upload media to Firebase Storage if present
      let uploadedVideo = word.video;
      let uploadedWallpaper = word.wallpaper;

      if (word.video && word.video.uri && !word.video.uri.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          const uploadResult = await FirebaseStorageService.uploadVideo(
            word.video.uri,
            "partners/words/videos"
          );
          uploadedVideo = {
            ...word.video,
            uri: uploadResult.url,
            url: uploadResult.url,
            thumbnail: uploadResult.thumbnail || word.video.thumbnail,
          };
        } catch (uploadError) {
          console.warn("Error uploading partner word video:", uploadError.message);
        }
      }

      if (word.wallpaper && word.wallpaper.type === "phone" && word.wallpaper.uri && !word.wallpaper.uri.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          const uploadResult = await FirebaseStorageService.uploadImage(
            word.wallpaper.uri,
            "partners/words/wallpapers"
          );
          uploadedWallpaper = {
            type: "phone",
            uri: uploadResult.url,
            url: uploadResult.url,
          };
        } catch (uploadError) {
          console.warn("Error uploading partner word wallpaper:", uploadError.message);
        }
      }

      // Prepare word data for Firestore
      const firestoreWordData = {
        title: word.title || null,
        text: word.text || null,
        video: uploadedVideo,
        summary: word.summary || null,
        scriptureReference: word.scriptureReference || null,
        scriptureText: word.scriptureText || null,
        wallpaper: uploadedWallpaper,
        textColor: word.textColor || "black",
        author: currentUser.displayName || "Anonymous",
        authorId: currentUser.uid,
        authorPhoto: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        selectedDate: null,
        isSelected: false,
        likes: 0,
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "partner_words"), firestoreWordData);
      
      // Also save locally as backup
      const localWord = {
        id: docRef.id,
        ...firestoreWordData,
        createdAt: new Date().toISOString(),
      };
      await this.savePartnerWordLocally(localWord);

      return { success: true, wordId: docRef.id, word: localWord };
    } catch (error) {
      console.warn("Error saving partner word to Firebase (using local storage):", error.message);
      // Fallback to local storage
      return await this.savePartnerWordLocally(word);
    }
  }

  // Save partner scripture to Firebase
  static async savePartnerScripture(scripture) {
    try {
      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to create partner content");
      }

      // Upload media to Firebase Storage if present
      let uploadedVideo = scripture.video;
      let uploadedWallpaper = scripture.wallpaper;

      if (scripture.video && scripture.video.uri && !scripture.video.uri.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          const uploadResult = await FirebaseStorageService.uploadVideo(
            scripture.video.uri,
            "partners/scriptures/videos"
          );
          uploadedVideo = {
            ...scripture.video,
            uri: uploadResult.url,
            url: uploadResult.url,
            thumbnail: uploadResult.thumbnail || scripture.video.thumbnail,
          };
        } catch (uploadError) {
          console.warn("Error uploading partner scripture video:", uploadError.message);
        }
      }

      if (scripture.wallpaper && scripture.wallpaper.type === "phone" && scripture.wallpaper.uri && !scripture.wallpaper.uri.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          const uploadResult = await FirebaseStorageService.uploadImage(
            scripture.wallpaper.uri,
            "partners/scriptures/wallpapers"
          );
          uploadedWallpaper = {
            type: "phone",
            uri: uploadResult.url,
            url: uploadResult.url,
          };
        } catch (uploadError) {
          console.warn("Error uploading partner scripture wallpaper:", uploadError.message);
        }
      }

      // Prepare scripture data for Firestore
      const firestoreScriptureData = {
        time: scripture.time,
        reference: scripture.reference,
        text: scripture.text,
        video: uploadedVideo,
        wallpaper: uploadedWallpaper,
        textColor: scripture.textColor || "black",
        author: currentUser.displayName || "Anonymous",
        authorId: currentUser.uid,
        authorPhoto: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        selectedDate: null,
        isSelected: false,
        likes: 0,
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "partner_scriptures"), firestoreScriptureData);
      
      // Also save locally as backup
      const localScripture = {
        id: docRef.id,
        ...firestoreScriptureData,
        createdAt: new Date().toISOString(),
      };
      await this.savePartnerScriptureLocally(localScripture);

      return { success: true, scriptureId: docRef.id, scripture: localScripture };
    } catch (error) {
      console.warn("Error saving partner scripture to Firebase (using local storage):", error.message);
      // Fallback to local storage
      return await this.savePartnerScriptureLocally(scripture);
    }
  }

  // Get all partner prayers from Firebase
  static async getAllPartnerPrayers() {
    try {
      const prayersRef = collection(db, "partner_prayers");
      const querySnapshot = await getDocs(prayersRef);
      const prayers = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        prayers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        });
      });

      // Also get local prayers and merge
      const localPrayers = await this.getPartnerPrayersLocally();
      const firebasePrayerIds = new Set(prayers.map(p => p.id));
      const uniqueLocalPrayers = localPrayers.filter(p => !firebasePrayerIds.has(p.id));

      return [...prayers, ...uniqueLocalPrayers];
    } catch (error) {
      console.warn("Error getting partner prayers from Firebase (using local storage):", error.message);
      return await this.getPartnerPrayersLocally();
    }
  }

  // Get all partner words (LOCAL FIRST for instant display, then sync Firebase)
  static async getAllPartnerWords() {
    // Return local data immediately (instant display)
    const localWords = await this.getPartnerWordsLocally();
    
    // Fetch from Firebase in background (non-blocking)
    try {
      const wordsRef = collection(db, "partner_words");
      const querySnapshot = await getDocs(wordsRef);
      const words = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        words.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        });
      });

      // Merge Firebase with local
      const firebaseWordIds = new Set(words.map(w => w.id));
      const uniqueLocalWords = localWords.filter(w => !firebaseWordIds.has(w.id));

      return [...words, ...uniqueLocalWords];
    } catch (error) {
      console.warn("Error getting partner words from Firebase (using local only):", error.message);
      // Return local data if Firebase fails
      return localWords;
    }
  }

  // Get all partner scriptures (LOCAL FIRST for instant display, then sync Firebase)
  static async getAllPartnerScriptures() {
    // Return local data immediately (instant display)
    const localScriptures = await this.getPartnerScripturesLocally();
    
    // Fetch from Firebase in background (non-blocking)
    try {
      const scripturesRef = collection(db, "partner_scriptures");
      const querySnapshot = await getDocs(scripturesRef);
      const scriptures = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        scriptures.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        });
      });

      // Merge Firebase with local
      const firebaseScriptureIds = new Set(scriptures.map(s => s.id));
      const uniqueLocalScriptures = localScriptures.filter(s => !firebaseScriptureIds.has(s.id));

      return [...scriptures, ...uniqueLocalScriptures];
    } catch (error) {
      console.warn("Error getting partner scriptures from Firebase (using local only):", error.message);
      // Return local data if Firebase fails
      return localScriptures;
    }
  }

  // Local storage fallback methods
  static async savePartnerPrayerLocally(prayer) {
    try {
      const prayers = await this.getPartnerPrayersLocally();
      prayers.push(prayer);
      await AsyncStorage.setItem("partner_prayers", JSON.stringify(prayers));
      return { success: true, prayerId: prayer.id, prayer };
    } catch (error) {
      console.error("Error saving partner prayer locally:", error);
      return { success: false };
    }
  }

  static async savePartnerWordLocally(word) {
    try {
      const words = await this.getPartnerWordsLocally();
      words.push(word);
      await AsyncStorage.setItem("partner_words", JSON.stringify(words));
      return { success: true, wordId: word.id, word };
    } catch (error) {
      console.error("Error saving partner word locally:", error);
      return { success: false };
    }
  }

  static async savePartnerScriptureLocally(scripture) {
    try {
      const scriptures = await this.getPartnerScripturesLocally();
      scriptures.push(scripture);
      await AsyncStorage.setItem("partner_scriptures", JSON.stringify(scriptures));
      return { success: true, scriptureId: scripture.id, scripture };
    } catch (error) {
      console.error("Error saving partner scripture locally:", error);
      return { success: false };
    }
  }

  static async getPartnerPrayersLocally() {
    try {
      const prayersJson = await AsyncStorage.getItem("partner_prayers");
      return prayersJson ? JSON.parse(prayersJson) : [];
    } catch (error) {
      return [];
    }
  }

  static async getPartnerWordsLocally() {
    try {
      const wordsJson = await AsyncStorage.getItem("partner_words");
      return wordsJson ? JSON.parse(wordsJson) : [];
    } catch (error) {
      return [];
    }
  }

  static async getPartnerScripturesLocally() {
    try {
      const scripturesJson = await AsyncStorage.getItem("partner_scriptures");
      return scripturesJson ? JSON.parse(scripturesJson) : [];
    } catch (error) {
      return [];
    }
  }
}

export default PartnerFirebaseService;

