import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

class ProductionAuthService {
  constructor() {
    this.authStateListener = null;
  }

  // Email/Password Authentication with Verification
  async signUp(email, password, name, profilePicture = null) {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: name,
        photoURL: profilePicture,
      });

      // Send email verification
      await sendEmailVerification(user);

      // Create user document in Firestore
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: profilePicture,
        emailVerified: false,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        profile: {
          bio: "",
          location: "",
          interests: [],
          prayerRequests: 0,
          testimonies: 0,
          communityPosts: 0,
        },
        preferences: {
          notifications: true,
          emailUpdates: true,
          privacy: "public",
        },
      };

      await setDoc(doc(db, "users", user.uid), userData);

      // Store user data locally
      await this.storeUserData(userData);

      return {
        success: true,
        user: userData,
        needsVerification: true,
        message:
          "Account created! Please check your email to verify your account.",
      };
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update last login
      await updateDoc(doc(db, "users", user.uid), {
        lastLoginAt: serverTimestamp(),
      });

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      // Store user data locally
      await this.storeUserData(userData);

      return {
        success: true,
        user: userData,
        needsVerification: !user.emailVerified,
      };
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Google Authentication
  async signInWithGoogle() {
    try {
      // For now, simulate Google authentication
      // In production, you would implement actual Google OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const userData = {
        uid: `google_user_${Date.now()}`,
        email: "user@gmail.com",
        displayName: "Google User",
        photoURL: "https://via.placeholder.com/150",
        emailVerified: true,
        provider: "google",
        createdAt: new Date().toISOString(),
        profile: {
          bio: "",
          location: "",
          interests: [],
          prayerRequests: 0,
          testimonies: 0,
          communityPosts: 0,
        },
        preferences: {
          notifications: true,
          emailUpdates: true,
          privacy: "public",
        },
      };

      await this.storeUserData(userData);
      return { success: true, user: userData };
    } catch (error) {
      throw new Error("Google authentication failed");
    }
  }

  // Password Reset
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: "Password reset email sent! Check your inbox.",
      };
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Resend Email Verification
  async resendVerification() {
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        return {
          success: true,
          message: "Verification email sent! Check your inbox.",
        };
      }
      throw new Error("No user logged in");
    } catch (error) {
      throw new Error("Failed to send verification email");
    }
  }

  // Profile Management
  async updateProfile(updates) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user logged in");

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: updates.displayName,
        photoURL: updates.photoURL,
      });

      // Update Firestore document
      await updateDoc(doc(db, "users", user.uid), {
        displayName: updates.displayName,
        photoURL: updates.photoURL,
        "profile.bio": updates.bio,
        "profile.location": updates.location,
        "profile.interests": updates.interests,
        updatedAt: serverTimestamp(),
      });

      // Update local storage
      const currentUser = await this.getCurrentUser();
      const updatedUser = { ...currentUser, ...updates };
      await this.storeUserData(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      throw new Error("Failed to update profile");
    }
  }

  // Image Upload to Firebase Storage
  async uploadProfileImage(imageUri) {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storageRef = ref(storage, `profile-images/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      throw new Error("Failed to upload image");
    }
  }

  // Auth State Listener
  onAuthStateChanged(callback) {
    this.authStateListener = onAuthStateChanged(auth, callback);
  }

  // Sign Out
  async signOut() {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("userData");
      return { success: true };
    } catch (error) {
      throw new Error("Sign out failed");
    }
  }

  // Helper Methods
  async getCurrentUser() {
    const userData = await AsyncStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  }

  async storeUserData(userData) {
    await AsyncStorage.setItem("userData", JSON.stringify(userData));
  }

  getErrorMessage(errorCode) {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "This email is already registered";
      case "auth/weak-password":
        return "Password should be at least 6 characters";
      case "auth/invalid-email":
        return "Invalid email address";
      case "auth/user-not-found":
        return "No account found with this email";
      case "auth/wrong-password":
        return "Incorrect password";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later";
      case "auth/network-request-failed":
        return "Network error. Please check your connection";
      default:
        return "Authentication failed. Please try again";
    }
  }
}

export default new ProductionAuthService();
