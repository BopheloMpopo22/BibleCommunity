import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import WorkingAuthService from "./WorkingAuthService";

/**
 * Admin utility service for managing communities
 * Use this to clean up test communities or fix data issues
 */
class CommunityAdminService {
  /**
   * Delete all communities with a specific name (case-insensitive)
   * WARNING: This bypasses security rules - use with caution!
   * @param {string} communityName - The name of communities to delete
   * @returns {Promise<{success: boolean, deleted: number, errors: string[]}>}
   */
  static async deleteCommunitiesByName(communityName) {
    try {
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        throw new Error("User must be authenticated");
      }

      console.log(`🔍 Searching for communities named "${communityName}" (case-insensitive)...`);
      
      // Get ALL communities and filter by name (case-insensitive)
      // Firestore doesn't support case-insensitive queries, so we fetch all and filter
      const communitiesRef = collection(db, "communities");
      const querySnapshot = await getDocs(communitiesRef);

      const deleted = [];
      const errors = [];
      const nameLower = communityName.toLowerCase().trim();

      // Filter communities by name (case-insensitive)
      const matchingCommunities = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const communityNameLower = (data.name || "").toLowerCase().trim();
        if (communityNameLower === nameLower) {
          matchingCommunities.push(doc);
        }
      });

      if (matchingCommunities.length === 0) {
        console.log(`❌ No communities found with name "${communityName}" (case-insensitive)`);
        console.log(`💡 Available community names:`, querySnapshot.docs.map(d => d.data().name).filter(Boolean));
        return { success: true, deleted: 0, errors: [] };
      }

      console.log(`📋 Found ${matchingCommunities.length} communities with name "${communityName}" (case-insensitive)`);

      // Delete each matching community
      for (const docSnap of matchingCommunities) {
        try {
          const communityData = docSnap.data();
          console.log(`🗑️  Deleting community: ${docSnap.id} (${communityData.name})`);
          
          await deleteDoc(doc(db, "communities", docSnap.id));
          deleted.push({
            id: docSnap.id,
            name: communityData.name,
            creatorId: communityData.creatorId,
          });
          console.log(`✅ Deleted community: ${docSnap.id}`);
        } catch (error) {
          const errorMsg = `Failed to delete ${docSnap.id}: ${error.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`✅ Deletion complete: ${deleted.length} deleted, ${errors.length} errors`);
      return {
        success: errors.length === 0,
        deleted: deleted.length,
        errors,
        deletedCommunities: deleted,
      };
    } catch (error) {
      console.error("Error deleting communities:", error);
      throw error;
    }
  }

  /**
   * Get all communities with a specific name (case-insensitive, for preview before deletion)
   * @param {string} communityName - The name of communities to find
   * @returns {Promise<Array>}
   */
  static async getCommunitiesByName(communityName) {
    try {
      const communitiesRef = collection(db, "communities");
      const querySnapshot = await getDocs(communitiesRef);

      const communities = [];
      const nameLower = communityName.toLowerCase().trim();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const communityNameLower = (data.name || "").toLowerCase().trim();
        if (communityNameLower === nameLower) {
          communities.push({
            id: doc.id,
            name: data.name,
            creatorId: data.creatorId,
            creatorName: data.creatorName,
            memberCount: data.memberCount || 0,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          });
        }
      });

      return communities;
    } catch (error) {
      console.error("Error getting communities:", error);
      throw error;
    }
  }

  /**
   * Get ALL communities (for debugging/finding exact names)
   * @returns {Promise<Array>}
   */
  static async getAllCommunities() {
    try {
      const communitiesRef = collection(db, "communities");
      const querySnapshot = await getDocs(communitiesRef);

      const communities = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        communities.push({
          id: doc.id,
          name: data.name,
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          memberCount: data.memberCount || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        });
      });

      return communities;
    } catch (error) {
      console.error("Error getting all communities:", error);
      throw error;
    }
  }

  /**
   * Fix creatorId for a community (if you're the actual creator but creatorId is wrong)
   * @param {string} communityId - The ID of the community to fix
   * @returns {Promise<{success: boolean}>}
   */
  static async fixCreatorId(communityId) {
    try {
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        throw new Error("User must be authenticated");
      }

      const { updateDoc } = await import("firebase/firestore");
      const communityRef = doc(db, "communities", communityId);
      
      await updateDoc(communityRef, {
        creatorId: currentUser.uid,
        creatorName: currentUser.displayName || "Anonymous",
      });

      console.log(`✅ Fixed creatorId for community ${communityId}`);
      return { success: true };
    } catch (error) {
      console.error("Error fixing creatorId:", error);
      throw error;
    }
  }

  /**
   * Delete a specific community by ID (admin override)
   * WARNING: This bypasses security rules - use with caution!
   * @param {string} communityId - The ID of the community to delete
   * @returns {Promise<{success: boolean}>}
   */
  static async deleteCommunityById(communityId) {
    try {
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        throw new Error("User must be authenticated");
      }

      console.log(`🗑️  Deleting community: ${communityId}`);
      
      // Also remove from local storage first to avoid any issues
      try {
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        const communitiesJson = await AsyncStorage.getItem("local_communities");
        if (communitiesJson) {
          const localCommunities = JSON.parse(communitiesJson);
          // Ensure it's an array
          const communitiesArray = Array.isArray(localCommunities) ? localCommunities : [];
          const updatedCommunities = communitiesArray.filter(c => c && c.id !== communityId);
          await AsyncStorage.setItem("local_communities", JSON.stringify(updatedCommunities));
          console.log("✅ Removed from local storage");
        }
      } catch (localError) {
        console.warn("Warning: Could not remove from local storage:", localError.message);
        // Continue with Firebase deletion even if local storage fails
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, "communities", communityId));
      console.log(`✅ Deleted community from Firebase: ${communityId}`);
      return { success: true };
    } catch (error) {
      console.error("Error deleting community:", error);
      // If it's a permission error, try to provide more helpful message
      if (error.message && error.message.includes("permission")) {
        throw new Error("You don't have permission to delete this community. It may have been created by a different user.");
      }
      throw error;
    }
  }
}

export default CommunityAdminService;

