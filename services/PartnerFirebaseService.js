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

      // Normalize video URL - check both uri and url properties
      const videoUri = word.video?.uri || word.video?.url;
      if (word.video && videoUri && !videoUri.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          const uploadResult = await FirebaseStorageService.uploadVideo(
            videoUri,
            "partners/words/videos"
          );
          
          // Only set uploadedVideo if upload succeeded and we got a Firebase URL
          if (uploadResult && uploadResult.url && uploadResult.url.startsWith("https://firebasestorage.googleapis.com")) {
            uploadedVideo = {
              ...word.video,
              uri: uploadResult.url,
              url: uploadResult.url,
              thumbnail: word.video.thumbnail || uploadResult.thumbnail,
            };
          } else {
            console.warn("Video upload succeeded but no valid Firebase URL returned");
            uploadedVideo = null; // Don't save video with local path
          }
        } catch (uploadError) {
          console.error("Error uploading partner word video:", uploadError.message);
          uploadedVideo = null; // Don't save video if upload failed
        }
      } else if (word.video && videoUri && videoUri.startsWith("https://firebasestorage.googleapis.com")) {
        // Video already uploaded - preserve existing data including thumbnail
        uploadedVideo = {
          ...word.video,
          uri: videoUri,
          url: videoUri,
        };
      } else if (word.video && videoUri) {
        // Video has a local path but wasn't uploaded - don't save it
        console.warn("Video has local path but wasn't uploaded. Removing video.");
        uploadedVideo = null;
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
        // Normalize selectedDate to ISO string format if it exists
        let normalizedSelectedDate = data.selectedDate;
        if (normalizedSelectedDate) {
          if (typeof normalizedSelectedDate === 'string') {
            // Already a string, ensure it's trimmed
            normalizedSelectedDate = normalizedSelectedDate.trim();
          } else if (normalizedSelectedDate.toDate && typeof normalizedSelectedDate.toDate === 'function') {
            // Firebase Timestamp
            normalizedSelectedDate = normalizedSelectedDate.toDate().toISOString().split("T")[0];
          } else if (normalizedSelectedDate instanceof Date) {
            // Date object
            normalizedSelectedDate = normalizedSelectedDate.toISOString().split("T")[0];
          }
        }
        
        prayers.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          selectedDate: normalizedSelectedDate || data.selectedDate, // Use normalized date
        });
      });

      console.log(`📥 Fetched ${prayers.length} partner prayers from Firebase`);
      
      // Log scheduled prayers for debugging
      const scheduledPrayers = prayers.filter(p => p.isSelected === true && p.selectedDate);
      if (scheduledPrayers.length > 0) {
        console.log(`📅 Found ${scheduledPrayers.length} scheduled prayers:`);
        scheduledPrayers.forEach(p => {
          console.log(`  - ${p.time} prayer by ${p.author}: scheduled for ${p.selectedDate}`);
        });
      }

      // Also get local prayers and merge (Firebase takes priority)
      const localPrayers = await this.getPartnerPrayersLocally();
      const firebasePrayerIds = new Set(prayers.map(p => p.id));
      const uniqueLocalPrayers = localPrayers.filter(p => !firebasePrayerIds.has(p.id));

      // IMPORTANT: Firebase data takes priority - if a prayer exists in Firebase, use Firebase version
      // This ensures scheduled content from Firebase is always used, not stale local cache
      const allPrayers = [...prayers, ...uniqueLocalPrayers];
      console.log(`✅ Returning ${allPrayers.length} total prayers (${prayers.length} from Firebase, ${uniqueLocalPrayers.length} from local)`);
      
      return allPrayers;
    } catch (error) {
      console.warn("Error getting partner prayers from Firebase (using local storage):", error.message);
      return await this.getPartnerPrayersLocally();
    }
  }

  // Get all partner words from Firebase (Firebase takes priority for scheduled content)
  static async getAllPartnerWords() {
    try {
      const wordsRef = collection(db, "partner_words");
      const querySnapshot = await getDocs(wordsRef);
      const words = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Normalize selectedDate to ISO string format if it exists
        let normalizedSelectedDate = data.selectedDate;
        if (normalizedSelectedDate) {
          if (typeof normalizedSelectedDate === 'string') {
            // Already a string, ensure it's trimmed
            normalizedSelectedDate = normalizedSelectedDate.trim();
          } else if (normalizedSelectedDate.toDate && typeof normalizedSelectedDate.toDate === 'function') {
            // Firebase Timestamp
            normalizedSelectedDate = normalizedSelectedDate.toDate().toISOString().split("T")[0];
          } else if (normalizedSelectedDate instanceof Date) {
            // Date object
            normalizedSelectedDate = normalizedSelectedDate.toISOString().split("T")[0];
          }
        }
        
        words.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          selectedDate: normalizedSelectedDate || data.selectedDate, // Use normalized date
        });
      });

      console.log(`📥 Fetched ${words.length} partner words from Firebase`);
      
      // DEBUG: Log ALL words with their authors
      words.forEach((w, i) => {
        console.log(`  Firebase Word ${i+1}: "${w.title || 'Untitled'}" by ${w.author} (authorId: ${w.authorId || 'none'}), isSelected: ${w.isSelected}, selectedDate: ${w.selectedDate || 'none'}`);
      });
      
      // Log scheduled words for debugging
      const scheduledWords = words.filter(w => w.isSelected === true && w.selectedDate);
      if (scheduledWords.length > 0) {
        console.log(`📅 Found ${scheduledWords.length} scheduled words:`);
        scheduledWords.forEach(w => {
          console.log(`  - Word by ${w.author} (authorId: ${w.authorId}): scheduled for ${w.selectedDate}`);
        });
      } else {
        console.log(`⚠️ No scheduled words found in Firebase!`);
      }

      // Also get local words and merge (Firebase takes priority)
      const localWords = await this.getPartnerWordsLocally();
      console.log(`📱 Found ${localWords.length} words in local storage`);
      localWords.forEach((w, i) => {
        console.log(`  Local Word ${i+1}: "${w.title || 'Untitled'}" by ${w.author} (authorId: ${w.authorId || 'none'}), isSelected: ${w.isSelected}, selectedDate: ${w.selectedDate || 'none'}`);
      });
      
      const firebaseWordIds = new Set(words.map(w => w.id));
      const uniqueLocalWords = localWords.filter(w => !firebaseWordIds.has(w.id));
      console.log(`📊 After merge: ${uniqueLocalWords.length} unique local words (not in Firebase)`);

      // IMPORTANT: Firebase data takes priority - ensures scheduled content is always used
      const allWords = [...words, ...uniqueLocalWords];
      console.log(`✅ Returning ${allWords.length} total words (${words.length} from Firebase, ${uniqueLocalWords.length} from local)`);
      
      // DEBUG: Show alert with word count breakdown
      try {
        const { Alert } = require("react-native");
        const currentUser = auth.currentUser;
        Alert.alert(
          "DEBUG: getAllPartnerWords",
          `Firebase words: ${words.length}\nLocal words: ${localWords.length}\nUnique local: ${uniqueLocalWords.length}\nTotal returned: ${allWords.length}\n\nCurrent user: ${currentUser?.email || 'Not logged in'}\n\nScheduled words: ${scheduledWords.length}`
        );
      } catch (e) {}
      
      return allWords;
    } catch (error) {
      console.warn("Error getting partner words from Firebase (using local only):", error.message);
      return await this.getPartnerWordsLocally();
    }
  }

  // Get all partner scriptures from Firebase (Firebase takes priority for scheduled content)
  static async getAllPartnerScriptures() {
    try {
      const scripturesRef = collection(db, "partner_scriptures");
      const querySnapshot = await getDocs(scripturesRef);
      const scriptures = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Normalize selectedDate to ISO string format if it exists
        let normalizedSelectedDate = data.selectedDate;
        if (normalizedSelectedDate) {
          if (typeof normalizedSelectedDate === 'string') {
            // Already a string, ensure it's trimmed
            normalizedSelectedDate = normalizedSelectedDate.trim();
          } else if (normalizedSelectedDate.toDate && typeof normalizedSelectedDate.toDate === 'function') {
            // Firebase Timestamp
            normalizedSelectedDate = normalizedSelectedDate.toDate().toISOString().split("T")[0];
          } else if (normalizedSelectedDate instanceof Date) {
            // Date object
            normalizedSelectedDate = normalizedSelectedDate.toISOString().split("T")[0];
          }
        }
        
        scriptures.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          selectedDate: normalizedSelectedDate || data.selectedDate, // Use normalized date
        });
      });

      console.log(`📥 Fetched ${scriptures.length} partner scriptures from Firebase`);
      
      // Log scheduled scriptures for debugging
      const scheduledScriptures = scriptures.filter(s => s.isSelected === true && s.selectedDate);
      if (scheduledScriptures.length > 0) {
        console.log(`📅 Found ${scheduledScriptures.length} scheduled scriptures:`);
        scheduledScriptures.forEach(s => {
          console.log(`  - ${s.time} scripture by ${s.author}: scheduled for ${s.selectedDate}`);
        });
      }

      // Also get local scriptures and merge (Firebase takes priority)
      const localScriptures = await this.getPartnerScripturesLocally();
      const firebaseScriptureIds = new Set(scriptures.map(s => s.id));
      const uniqueLocalScriptures = localScriptures.filter(s => !firebaseScriptureIds.has(s.id));

      // IMPORTANT: Firebase data takes priority - ensures scheduled content is always used
      const allScriptures = [...scriptures, ...uniqueLocalScriptures];
      console.log(`✅ Returning ${allScriptures.length} total scriptures (${scriptures.length} from Firebase, ${uniqueLocalScriptures.length} from local)`);
      
      return allScriptures;
    } catch (error) {
      console.warn("Error getting partner scriptures from Firebase (using local only):", error.message);
      return await this.getPartnerScripturesLocally();
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




