import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

class WorkingAuthService {
  constructor() {
    this.authStateListener = null;
  }

  // Email/Password Authentication with Verification
  async signUp(email, password, name, profilePicture = null) {
    try {
      console.log("Starting signup process...");

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("User created:", user.uid);

      // Update user profile
      await updateProfile(user, {
        displayName: name,
        photoURL: profilePicture,
      });
      console.log("Profile updated");

      // Send email verification
      await sendEmailVerification(user);
      console.log("Verification email sent");

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
      console.log("User data saved to Firestore");

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
      // Don't log the error to console to avoid showing it on screen
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  async signIn(email, password) {
    try {
      console.log("Starting signin process...");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("User signed in:", user.uid);

      // Update last login
      await updateDoc(doc(db, "users", user.uid), {
        lastLoginAt: serverTimestamp(),
      });

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      console.log("User data retrieved from Firestore");

      // Store user data locally
      await this.storeUserData(userData);

      return {
        success: true,
        user: userData,
        needsVerification: !user.emailVerified,
      };
    } catch (error) {
      // Don't log the error to console to avoid showing it on screen
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Google Authentication (simplified for now)
  async signInWithGoogle() {
    try {
      console.log("Starting Google signin...");

      // For now, simulate Google authentication
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
      console.log("Google user data stored");

      return { success: true, user: userData };
    } catch (error) {
      // Don't log the error to console to avoid showing it on screen
      throw new Error("Google authentication failed");
    }
  }

  // Password Reset
  async resetPassword(email) {
    try {
      console.log("Starting password reset...");

      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent");

      return {
        success: true,
        message: "Password reset email sent! Check your inbox.",
      };
    } catch (error) {
      // Don't log the error to console to avoid showing it on screen
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

  // Auth State Listener
  onAuthStateChanged(callback) {
    this.authStateListener = onAuthStateChanged(auth, callback);
    return () => {
      if (this.authStateListener) {
        this.authStateListener();
      }
    };
  }

  // Sign Out
  async signOut() {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("userData");
      console.log("User signed out successfully");
      return { success: true };
    } catch (error) {
      // Don't log the error to console to avoid showing it on screen
      throw new Error("Sign out failed");
    }
  }

  // Helper Methods
  async getCurrentUser() {
    try {
      // Wait for auth to be ready (Firebase Auth persists automatically)
      // Check Firebase Auth first - this is the source of truth
      const firebaseUser = auth.currentUser;
      
      if (firebaseUser) {
        console.log("✅ User authenticated via Firebase Auth:", firebaseUser.uid);
        
        // Get fresh data from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            // Merge Firebase Auth data with Firestore data
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL, // Use Firebase Auth photoURL (most up-to-date)
              emailVerified: firebaseUser.emailVerified,
              ...firestoreData,
              // Override with Firebase Auth photoURL if it exists (it's more up-to-date)
              photoURL: firebaseUser.photoURL || firestoreData.photoURL,
            };
            // Update local storage with fresh data
            await this.storeUserData(userData);
            return userData;
          } else {
            // User exists in Auth but not in Firestore - create basic user data
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
            };
            await this.storeUserData(userData);
            return userData;
          }
        } catch (firestoreError) {
          console.warn("Error getting user from Firestore, using Auth data:", firestoreError.message);
          // Return basic user data from Firebase Auth
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
          };
          await this.storeUserData(userData);
          return userData;
        }
      }
      
      // If no Firebase Auth user, check local storage (for backwards compatibility)
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsed = JSON.parse(userData);
        // Silently use local storage - no need to log warnings
        return parsed;
      }
      
      return null;
    } catch (error) {
      console.warn("Error getting current user:", error.message);
      // Final fallback to local storage
      try {
        const userData = await AsyncStorage.getItem("userData");
        return userData ? JSON.parse(userData) : null;
      } catch (localError) {
        return null;
      }
    }
  }

  async storeUserData(userData) {
    await AsyncStorage.setItem("userData", JSON.stringify(userData));
  }

  // Update user profile picture
  async updateProfilePicture(photoURL) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No user logged in");
      }

      console.log("Updating profile picture to:", photoURL);

      // Update Firebase Auth profile
      await updateProfile(user, { photoURL });
      console.log("✅ Updated Firebase Auth profile");

      // Update Firestore document
      await updateDoc(doc(db, "users", user.uid), {
        photoURL: photoURL,
        updatedAt: serverTimestamp(),
      });
      console.log("✅ Updated Firestore document");

      // Update local storage
      const currentUserData = await this.getCurrentUser();
      if (currentUserData) {
        const updatedUserData = {
          ...currentUserData,
          photoURL: photoURL,
        };
        await this.storeUserData(updatedUserData);
        console.log("✅ Updated local storage");
      }

      // Force reload of auth state to trigger UI updates
      // Firebase Auth doesn't always trigger onAuthStateChanged for profile updates
      // So we need to manually reload the user
      await user.reload();
      console.log("✅ Reloaded user from Firebase Auth");
      
      // Update local storage with the fresh Firebase Auth data after reload
      const reloadedUser = auth.currentUser;
      if (reloadedUser && currentUserData) {
        const updatedUserData = {
          ...currentUserData,
          photoURL: reloadedUser.photoURL, // Use the reloaded photoURL (most up-to-date)
        };
        await this.storeUserData(updatedUserData);
        console.log("✅ Updated local storage with reloaded photoURL:", reloadedUser.photoURL);
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw new Error(error.message || "Failed to update profile picture");
    }
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
      case "auth/invalid-credential":
        return "Invalid email or password. Please check your credentials and try again.";
      case "auth/invalid-login-credentials":
        return "Invalid email or password. Please check your credentials and try again.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later";
      case "auth/network-request-failed":
        return "Network error. Please check your connection";
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled. Please try a different method.";
      default:
        return "Authentication failed. Please check your credentials and try again.";
    }
  }
}

export default new WorkingAuthService();
