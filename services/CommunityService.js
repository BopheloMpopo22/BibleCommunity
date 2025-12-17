import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import FirebaseStorageService from "./FirebaseStorageService";
import AsyncStorage from "@react-native-async-storage/async-storage";

class CommunityService {
  // Create a new community in Firebase
  static async createCommunity(communityData) {
    try {
      const WorkingAuthService = (await import("./WorkingAuthService")).default;
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        throw new Error("User must be authenticated to create a community");
      }

      // Upload banner image to Firebase Storage if present
      let bannerUrl = communityData.bannerImage;
      if (communityData.bannerImage && !communityData.bannerImage.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          console.log("Uploading community banner to Firebase Storage...");
          const uploadResult = await FirebaseStorageService.uploadImage(
            communityData.bannerImage,
            `communities/${communityData.id || "new"}/banners`
          );
          bannerUrl = uploadResult.url;
          console.log("Community banner uploaded successfully");
        } catch (uploadError) {
          console.warn("Error uploading community banner:", uploadError.message);
        }
      }

      // Upload profile picture if present
      let profilePictureUrl = communityData.profilePicture;
      if (communityData.profilePicture && !communityData.profilePicture.startsWith("https://firebasestorage.googleapis.com")) {
        try {
          const uploadResult = await FirebaseStorageService.uploadImage(
            communityData.profilePicture,
            `communities/${communityData.id || "new"}/profile`
          );
          profilePictureUrl = uploadResult.url;
        } catch (uploadError) {
          console.warn("Error uploading community profile picture:", uploadError.message);
        }
      }

      // Prepare community data for Firestore
      const firestoreCommunityData = {
        name: communityData.name,
        description: communityData.description,
        category: communityData.category,
        privacy: communityData.privacy || "public",
        rules: communityData.rules || "",
        bannerImage: bannerUrl,
        profilePicture: profilePictureUrl,
        creatorId: currentUser.uid,
        creatorName: currentUser.displayName || "Anonymous",
        members: [currentUser.uid], // Creator is automatically a member
        memberCount: 1,
        posts: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "communities"), firestoreCommunityData);
      console.log("✅ Community created in Firebase with ID:", docRef.id);
      
      // Also save locally as backup
      const localCommunity = {
        id: docRef.id,
        ...firestoreCommunityData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.saveCommunityLocally(localCommunity);
      console.log("✅ Community saved locally as backup");

      return { success: true, communityId: docRef.id, community: localCommunity };
    } catch (error) {
      console.warn("Error creating community in Firebase:", error.message);
      // Fallback to local storage
      return await this.saveCommunityLocally(communityData);
    }
  }

  // Get all communities from Firebase (prioritize Firebase, merge with local)
  static async getAllCommunities() {
    try {
      // Always fetch from Firebase first to get latest communities
      const communitiesRef = collection(db, "communities");
      const querySnapshot = await getDocs(communitiesRef);
      const communities = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isActive !== false) {
          communities.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          });
        }
      });

      console.log(`📋 Loaded ${communities.length} communities from Firebase`);

      // Also get local communities and merge (for offline support)
      const localCommunities = await this.getLocalCommunities();
      const firebaseCommunityIds = new Set(communities.map(c => c.id));
      const uniqueLocalCommunities = localCommunities.filter(c => !firebaseCommunityIds.has(c.id));

      // Firebase communities first, then local
      const allCommunities = [...communities, ...uniqueLocalCommunities];
      console.log(`📋 Total communities (Firebase + local): ${allCommunities.length}`);
      return allCommunities;
    } catch (error) {
      console.warn("Error getting communities from Firebase (using local storage):", error.message);
      // Fallback to local storage
      return await this.getLocalCommunities();
    }
  }

  // Join a community (add user to members array)
  static async joinCommunity(communityId) {
    try {
      const WorkingAuthService = (await import("./WorkingAuthService")).default;
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        throw new Error("User must be authenticated to join a community");
      }

      const communityRef = doc(db, "communities", communityId);
      const communitySnap = await getDoc(communityRef);

      if (!communitySnap.exists()) {
        throw new Error("Community not found");
      }

      const communityData = communitySnap.data();
      
      // Ensure members is an array
      const members = Array.isArray(communityData.members) ? communityData.members : [];
      
      // Check if user is already a member
      if (members.includes(currentUser.uid)) {
        return { success: true, alreadyMember: true };
      }

      // Add user to members array and increment member count
      // arrayUnion will only add if not already present, but we check anyway for safety
      await updateDoc(communityRef, {
        members: arrayUnion(currentUser.uid),
        memberCount: (communityData.memberCount || 0) + 1,
        updatedAt: serverTimestamp(),
      });

      // Also update local storage
      await this.updateLocalCommunityMembership(communityId, currentUser.uid, true);

      return { success: true, alreadyMember: false };
    } catch (error) {
      console.warn("Error joining community:", error.message);
      // Fallback to local storage
      try {
        const WorkingAuthService = (await import("./WorkingAuthService")).default;
        const currentUser = await WorkingAuthService.getCurrentUser();
        if (currentUser && currentUser.uid) {
          await this.updateLocalCommunityMembership(communityId, currentUser.uid, true);
        }
      } catch (fallbackError) {
        console.warn("Error updating local membership:", fallbackError.message);
      }
      return { success: true };
    }
  }

  // Leave a community (remove user from members array)
  static async leaveCommunity(communityId) {
    try {
      const WorkingAuthService = (await import("./WorkingAuthService")).default;
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        throw new Error("User must be authenticated to leave a community");
      }

      const communityRef = doc(db, "communities", communityId);
      const communitySnap = await getDoc(communityRef);

      if (!communitySnap.exists()) {
        throw new Error("Community not found");
      }

      const communityData = communitySnap.data();
      
      // Ensure members is an array
      const members = Array.isArray(communityData.members) ? communityData.members : [];
      
      // Check if user is a member
      if (!members.includes(currentUser.uid)) {
        return { success: true, alreadyLeft: true };
      }

      // Ensure members array exists before removing
      const currentMembers = Array.isArray(communityData.members) ? communityData.members : [];
      if (currentMembers.includes(currentUser.uid)) {
        // Remove user from members array and decrement member count
        await updateDoc(communityRef, {
          members: arrayRemove(currentUser.uid),
          memberCount: Math.max(0, (communityData.memberCount || 1) - 1),
          updatedAt: serverTimestamp(),
        });
      }

      // Also update local storage
      await this.updateLocalCommunityMembership(communityId, currentUser.uid, false);

      return { success: true, alreadyLeft: false };
    } catch (error) {
      console.warn("Error leaving community:", error.message);
      // Fallback to local storage
      try {
        const WorkingAuthService = (await import("./WorkingAuthService")).default;
        const currentUser = await WorkingAuthService.getCurrentUser();
        if (currentUser && currentUser.uid) {
          await this.updateLocalCommunityMembership(communityId, currentUser.uid, false);
        }
      } catch (fallbackError) {
        console.warn("Error updating local membership:", fallbackError.message);
      }
      return { success: true };
    }
  }

  // Check if user is a member of a community
  static async isMember(communityId) {
    try {
      const WorkingAuthService = (await import("./WorkingAuthService")).default;
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        return false;
      }

      // Check Firebase first
      const communityRef = doc(db, "communities", communityId);
      const communitySnap = await getDoc(communityRef);

      if (communitySnap.exists()) {
        const communityData = communitySnap.data();
        // Ensure members is an array before checking
        const members = Array.isArray(communityData.members) ? communityData.members : [];
        return members.includes(currentUser.uid);
      }

      // Fallback to local storage
      const localCommunities = await this.getLocalCommunities();
      const community = localCommunities.find(c => c.id === communityId);
      if (community) {
        const members = Array.isArray(community.members) ? community.members : [];
        return members.includes(currentUser.uid);
      }
      return false;
    } catch (error) {
      console.warn("Error checking membership:", error.message);
      // Fallback to local storage
      try {
        const WorkingAuthService = (await import("./WorkingAuthService")).default;
        const currentUser = await WorkingAuthService.getCurrentUser();
        if (!currentUser || !currentUser.uid) {
          return false;
        }
        const localCommunities = await this.getLocalCommunities();
        const community = localCommunities.find(c => c.id === communityId);
        if (community) {
          const members = Array.isArray(community.members) ? community.members : [];
          return members.includes(currentUser.uid);
        }
      } catch (fallbackError) {
        console.warn("Error in membership fallback:", fallbackError.message);
      }
      return false;
    }
  }

  // Get community by ID
  static async getCommunity(communityId) {
    try {
      const communityRef = doc(db, "communities", communityId);
      const communitySnap = await getDoc(communityRef);

      if (communitySnap.exists()) {
        const data = communitySnap.data();
        return {
          id: communitySnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        };
      }

      // Fallback to local storage
      const localCommunities = await this.getLocalCommunities();
      return localCommunities.find(c => c.id === communityId) || null;
    } catch (error) {
      console.warn("Error getting community:", error.message);
      // Fallback to local storage
      const localCommunities = await this.getLocalCommunities();
      return localCommunities.find(c => c.id === communityId) || null;
    }
  }

  // Delete a community (only creator can delete)
  static async deleteCommunity(communityId) {
    try {
      const WorkingAuthService = (await import("./WorkingAuthService")).default;
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        throw new Error("User must be authenticated to delete a community");
      }

      // Check if user is the creator
      const communityRef = doc(db, "communities", communityId);
      const communitySnap = await getDoc(communityRef);

      if (!communitySnap.exists()) {
        throw new Error("Community not found");
      }

      const communityData = communitySnap.data();
      if (communityData.creatorId !== currentUser.uid) {
        throw new Error("Only the community creator can delete the community");
      }

      // Delete from Firestore
      await deleteDoc(communityRef);
      console.log("✅ Community deleted from Firebase");

      // Also remove from local storage
      try {
        const localCommunities = await this.getLocalCommunities();
        // Ensure it's an array before filtering
        const communitiesArray = Array.isArray(localCommunities) ? localCommunities : [];
        const updatedCommunities = communitiesArray.filter(c => c && c.id !== communityId);
        await AsyncStorage.setItem("local_communities", JSON.stringify(updatedCommunities));
      } catch (localError) {
        console.warn("Warning: Could not update local storage:", localError.message);
        // Continue even if local storage update fails
      }

      return { success: true };
    } catch (error) {
      console.warn("Error deleting community:", error.message);
      throw error;
    }
  }

  // Local storage methods
  static async saveCommunityLocally(community) {
    try {
      const communities = await this.getLocalCommunities();
      const existingIndex = communities.findIndex(c => c.id === community.id);
      
      if (existingIndex >= 0) {
        communities[existingIndex] = community;
      } else {
        communities.push(community);
      }
      
      await AsyncStorage.setItem("local_communities", JSON.stringify(communities));
      return { success: true, communityId: community.id, community };
    } catch (error) {
      console.error("Error saving community locally:", error);
      return { success: false };
    }
  }

  static async getLocalCommunities() {
    try {
      const communitiesJson = await AsyncStorage.getItem("local_communities");
      if (!communitiesJson) {
        return [];
      }
      const parsed = JSON.parse(communitiesJson);
      // Ensure it's always an array
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Error parsing local communities:", error);
      return [];
    }
  }

  static async updateLocalCommunityMembership(communityId, userId, isMember) {
    try {
      if (!userId) {
        console.warn("Cannot update membership: userId is missing");
        return;
      }
      
      const communities = await this.getLocalCommunities();
      const community = communities.find(c => c.id === communityId);
      
      if (community) {
        // Ensure members is always an array
        if (!Array.isArray(community.members)) {
          community.members = [];
        }
        
        if (isMember && !community.members.includes(userId)) {
          community.members.push(userId);
          community.memberCount = (community.memberCount || 0) + 1;
        } else if (!isMember && community.members.includes(userId)) {
          community.members = community.members.filter(id => id !== userId);
          community.memberCount = Math.max(0, (community.memberCount || 1) - 1);
        }
        
        await AsyncStorage.setItem("local_communities", JSON.stringify(communities));
      }
    } catch (error) {
      console.error("Error updating local membership:", error);
    }
  }
}

export default CommunityService;

