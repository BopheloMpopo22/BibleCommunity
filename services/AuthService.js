import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../config/firebase";

class AuthService {
  // Email/Password Authentication
  async signUp(email, password, name, profilePicture = null) {
    try {
      // For demo purposes, we'll simulate the authentication
      // In production, replace with actual Firebase calls
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const userData = {
        uid: `user_${Date.now()}`,
        email: email,
        name: name,
        profilePicture: profilePicture,
        createdAt: new Date().toISOString(),
      };

      // Store user data locally
      await this.storeUserData(userData);

      return { success: true, user: userData };
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code || "auth/unknown"));
    }
  }

  async signIn(email, password) {
    try {
      // For demo purposes, we'll simulate the authentication
      // In production, replace with actual Firebase calls
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if user exists in local storage (demo)
      const existingUsers = await AsyncStorage.getItem("registeredUsers");
      const users = existingUsers ? JSON.parse(existingUsers) : [];

      const user = users.find((u) => u.email === email);
      if (!user) {
        throw new Error("auth/user-not-found");
      }

      // Store current user data
      await this.storeUserData(user);

      return { success: true, user };
    } catch (error) {
      throw new Error(this.getErrorMessage(error.message || error.code));
    }
  }

  // Google Authentication
  async signInWithGoogle() {
    try {
      // For demo purposes, we'll simulate Google authentication
      // In production, implement actual Google OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const userData = {
        uid: `google_user_${Date.now()}`,
        email: "user@gmail.com",
        name: "Google User",
        profilePicture: "https://via.placeholder.com/150",
        provider: "google",
        createdAt: new Date().toISOString(),
      };

      // Store user data locally
      await this.storeUserData(userData);

      return { success: true, user: userData };
    } catch (error) {
      throw new Error("Google authentication failed. Please try again.");
    }
  }

  async signOut() {
    try {
      await AsyncStorage.removeItem("userData");
      return { success: true };
    } catch (error) {
      throw new Error("Sign out failed");
    }
  }

  async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  async storeUserData(userData) {
    try {
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      // Also store in registered users list for demo purposes
      const existingUsers = await AsyncStorage.getItem("registeredUsers");
      const users = existingUsers ? JSON.parse(existingUsers) : [];

      // Check if user already exists
      const existingUserIndex = users.findIndex(
        (u) => u.email === userData.email
      );
      if (existingUserIndex >= 0) {
        users[existingUserIndex] = userData;
      } else {
        users.push(userData);
      }

      await AsyncStorage.setItem("registeredUsers", JSON.stringify(users));
    } catch (error) {
      console.error("Error storing user data:", error);
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
      case "auth/network-request-failed":
        return "Network error. Please check your connection";
      default:
        return "Authentication failed. Please try again";
    }
  }

  // Helper method to check if user is authenticated
  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // Helper method to get user profile
  async getUserProfile() {
    return await this.getCurrentUser();
  }
}

export default new AuthService();










