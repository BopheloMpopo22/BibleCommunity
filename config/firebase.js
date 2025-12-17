// Firebase Configuration
// Replace these values with your actual Firebase project configuration

import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCSfoIgfGTLiZUygEaPnLhY9wl6X0Ua49E",
  authDomain: "bible-community-b5afa.firebaseapp.com",
  projectId: "bible-community-b5afa",
  storageBucket: "bible-community-b5afa.firebasestorage.app",
  messagingSenderId: "256389727019",
  appId: "1:256389727019:web:d7f39816cecec898e8fb6e",
  measurementId: "G-FQHRXR990B",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
// This ensures auth state persists between app sessions
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);

// Firebase Auth now persists using AsyncStorage
// Users will stay logged in between app restarts until they explicitly sign out

export default app;
