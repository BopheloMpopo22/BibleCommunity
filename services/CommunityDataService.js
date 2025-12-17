import { db } from "../config/firebase";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";

class CommunityDataService {
  // Update community profile picture
  static async updateCommunityProfilePicture(communityId, profilePictureUrl) {
    try {
      const communityRef = doc(db, "communities", communityId);

      // First check if document exists
      const communitySnap = await getDoc(communityRef);

      if (communitySnap.exists()) {
        // Document exists, update it
        await updateDoc(communityRef, {
          profilePicture: profilePictureUrl,
          updatedAt: new Date(),
        });
      } else {
        // Document doesn't exist, create it with basic data
        await setDoc(communityRef, {
          id: communityId,
          profilePicture: profilePictureUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return { success: true };
    } catch (error) {
      console.warn("Error updating community profile picture:", error.message);
      // Return success even if Firebase fails - app uses local storage
      return { success: true };
    }
  }

  // Update community header background
  static async updateCommunityHeaderBackground(
    communityId,
    headerBackgroundUrl
  ) {
    try {
      const communityRef = doc(db, "communities", communityId);

      // First check if document exists
      const communitySnap = await getDoc(communityRef);

      if (communitySnap.exists()) {
        // Document exists, update it
        await updateDoc(communityRef, {
          headerBackground: headerBackgroundUrl,
          updatedAt: new Date(),
        });
      } else {
        // Document doesn't exist, create it with basic data
        await setDoc(communityRef, {
          id: communityId,
          headerBackground: headerBackgroundUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return { success: true };
    } catch (error) {
      console.warn("Error updating community header background:", error.message);
      // Return success even if Firebase fails - app uses local storage
      return { success: true };
    }
  }

  // Get community data
  static async getCommunityData(communityId) {
    try {
      const communityRef = doc(db, "communities", communityId);
      const communitySnap = await getDoc(communityRef);

      if (communitySnap.exists()) {
        return { success: true, data: communitySnap.data() };
      } else {
        return { success: false, error: "Community not found" };
      }
    } catch (error) {
      console.error("Error getting community data:", error);

      // Handle offline error gracefully
      if (
        error.message.includes("offline") ||
        error.message.includes("Failed to get document")
      ) {
        console.log("Firebase is offline, returning default data");
        return {
          success: true,
          data: {
            profilePicture: null,
            headerBackground: null,
            isOffline: true,
          },
        };
      }

      // Return default data if Firebase fails
      return { success: true, data: null };
    }
  }

  // Create or update community document
  static async createOrUpdateCommunity(communityData) {
    try {
      const communityRef = doc(db, "communities", communityData.id);
      await setDoc(
        communityRef,
        {
          ...communityData,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      return { success: true };
    } catch (error) {
      console.warn("Error creating/updating community:", error.message);
      // Return success even if Firebase fails - app uses local storage
      return { success: true };
    }
  }

  // Initialize community document with basic data
  static async initializeCommunity(communityId, basicData = {}) {
    try {
      const communityRef = doc(db, "communities", communityId);

      // Check if document already exists
      const communitySnap = await getDoc(communityRef);

      if (!communitySnap.exists()) {
        // Create document with basic data
        await setDoc(communityRef, {
          id: communityId,
          ...basicData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return { success: true };
    } catch (error) {
      console.warn("Error initializing community:", error.message);
      // Return success even if Firebase fails - app uses local storage
      return { success: true };
    }
  }
}

export default CommunityDataService;
