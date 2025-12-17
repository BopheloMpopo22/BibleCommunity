# 🔐 Authentication Setup Guide

## 📋 Overview

This guide will help you set up comprehensive authentication for your Bible Community app with:

- ✅ Email/Password authentication
- ✅ Google OAuth authentication
- ✅ Profile picture uploads
- ✅ Firebase integration

## 🚀 Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "Bible Community" (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication

1. In Firebase Console, go to "Authentication" → "Sign-in method"
2. Enable "Email/Password" provider
3. Enable "Google" provider
4. Configure Google OAuth:
   - Add your app's package name (found in `app.json`)
   - Download the configuration files

### 1.3 Download Configuration Files

1. Go to Project Settings → General
2. Add your Android app:
   - Package name: `com.yourcompany.biblecommunity` (from app.json)
   - Download `google-services.json`
3. Add your iOS app:
   - Bundle ID: `com.yourcompany.biblecommunity`
   - Download `GoogleService-Info.plist`

## 📱 Step 2: Install Required Packages

```bash
# Core Firebase packages
npx expo install @react-native-firebase/app @react-native-firebase/auth

# Google OAuth
npx expo install expo-auth-session expo-crypto

# Image handling
npx expo install expo-image-picker

# Storage for user data
npx expo install @react-native-async-storage/async-storage
```

## 🔧 Step 3: Configure Firebase

### 3.1 Create Firebase Config

Create `config/firebase.js`:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
```

### 3.2 Update app.json

Add Firebase configuration to your `app.json`:

```json
{
  "expo": {
    "name": "Bible Community",
    "slug": "bible-community",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.biblecommunity",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.biblecommunity",
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": ["@react-native-firebase/app"]
  }
}
```

## 🔐 Step 4: Implement Authentication Service

Create `services/AuthService.js`:

```javascript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "../config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

class AuthService {
  // Email/Password Authentication
  async signUp(email, password, name, profilePicture = null) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update user profile
      await user.updateProfile({
        displayName: name,
        photoURL: profilePicture,
      });

      // Store user data locally
      await this.storeUserData({
        uid: user.uid,
        email: user.email,
        name: name,
        profilePicture: profilePicture,
      });

      return { success: true, user };
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

      // Store user data locally
      await this.storeUserData({
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        profilePicture: user.photoURL,
      });

      return { success: true, user };
    } catch (error) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Google Authentication
  async signInWithGoogle() {
    try {
      // This would integrate with expo-auth-session for Google OAuth
      // Implementation depends on your specific setup
      const result = await this.googleAuthFlow();

      if (result.type === "success") {
        const credential = GoogleAuthProvider.credential(
          result.params.id_token
        );
        const userCredential = await signInWithCredential(auth, credential);

        await this.storeUserData({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName,
          profilePicture: userCredential.user.photoURL,
        });

        return { success: true, user: userCredential.user };
      }
    } catch (error) {
      throw new Error("Google authentication failed");
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("userData");
      return { success: true };
    } catch (error) {
      throw new Error("Sign out failed");
    }
  }

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
      default:
        return "Authentication failed. Please try again";
    }
  }
}

export default new AuthService();
```

## 🖼️ Step 5: Profile Picture Upload

The profile picture functionality is already implemented in the enhanced `AuthScreen.js` using `expo-image-picker`. The implementation includes:

- ✅ Permission handling
- ✅ Image cropping (1:1 aspect ratio)
- ✅ Quality optimization
- ✅ Error handling

## 🔄 Step 6: Update AuthScreen Integration

Update your `AuthScreen.js` to use the real authentication service:

```javascript
import AuthService from "../services/AuthService";

// In your handleSubmit function:
const handleSubmit = async () => {
  if (!validateForm()) return;
  setLoading(true);

  try {
    if (isLogin) {
      const result = await AuthService.signIn(
        formData.email,
        formData.password
      );
      if (result.success) {
        Alert.alert("Success", "Welcome back! 🙏", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } else {
      const result = await AuthService.signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.profilePicture
      );
      if (result.success) {
        Alert.alert(
          "Success",
          "Account created! Welcome to our community! 🙏",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    }
  } catch (error) {
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};

// In your handleGoogleAuth function:
const handleGoogleAuth = async () => {
  try {
    setLoading(true);
    const result = await AuthService.signInWithGoogle();
    if (result.success) {
      Alert.alert("Success", "Google authentication successful! 🙏", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    }
  } catch (error) {
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};
```

## 🎯 Step 7: Test Your Implementation

1. **Test Email Authentication:**

   - Try signing up with a new email
   - Try signing in with existing credentials
   - Test password validation

2. **Test Profile Pictures:**

   - Upload a profile picture during signup
   - Verify image is cropped properly
   - Test permission handling

3. **Test Google Authentication:**
   - Configure Google OAuth properly
   - Test sign-in flow
   - Verify user data is stored

## 🚨 Important Notes

1. **Security:** Never commit Firebase config files to version control
2. **Permissions:** Ensure proper permissions for image picker
3. **Error Handling:** Implement comprehensive error handling
4. **User Experience:** Add loading states and proper feedback
5. **Testing:** Test on both iOS and Android devices

## 🔧 Troubleshooting

### Common Issues:

1. **Firebase not initialized:** Check your config file
2. **Google OAuth not working:** Verify OAuth configuration
3. **Image upload failing:** Check permissions
4. **Build errors:** Ensure all packages are properly installed

### Debug Steps:

1. Check Firebase console for authentication logs
2. Verify package versions are compatible
3. Test on physical devices (not just simulator)
4. Check network connectivity

## 📚 Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [React Native Firebase](https://rnfirebase.io/)

---

🎉 **You're all set!** Your Bible Community app now has comprehensive authentication with profile pictures and multiple sign-in options!
