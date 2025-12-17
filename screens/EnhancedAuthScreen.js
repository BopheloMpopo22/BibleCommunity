import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import WorkingAuthService from "../services/WorkingAuthService";

const EnhancedAuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState("email");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePicture: null,
  });

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = WorkingAuthService.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in
        console.log("User signed in:", user);
      } else {
        // User is signed out
        console.log("User signed out");
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickProfilePicture = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to upload a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Using MediaTypeOptions (deprecated but still works)
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData((prev) => ({
          ...prev,
          profilePicture: result.assets[0].uri,
        }));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      Alert.alert("Error", "Please fill in all required fields");
      return false;
    }

    if (!isLogin) {
      if (!formData.name) {
        Alert.alert("Error", "Please enter your name");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return false;
      }
      if (formData.password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const result = await WorkingAuthService.signIn(
          formData.email,
          formData.password
        );
        if (result.success) {
          if (result.needsVerification) {
            setNeedsVerification(true);
            Alert.alert(
              "Email Verification Required",
              "Please verify your email address before signing in. Check your inbox for a verification email.",
              [
                { text: "Resend Email", onPress: handleResendVerification },
                { text: "OK" },
              ]
            );
          } else {
            Alert.alert("Success", "Welcome back! 🙏", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          }
        }
      } else {
        const result = await WorkingAuthService.signUp(
          formData.email,
          formData.password,
          formData.name,
          formData.profilePicture
        );
        if (result.success) {
          Alert.alert("Account Created!", result.message, [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
        }
      }
    } catch (error) {
      // Show user-friendly error message without logging to console
      Alert.alert(
        isLogin ? "Sign In Failed" : "Sign Up Failed",
        error.message || "Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const result = await WorkingAuthService.signInWithGoogle();
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

  const handlePasswordReset = async () => {
    if (!formData.email) {
      Alert.alert("Error", "Please enter your email address first");
      return;
    }

    try {
      setLoading(true);
      const result = await WorkingAuthService.resetPassword(formData.email);
      if (result.success) {
        Alert.alert("Password Reset", result.message);
        setShowPasswordReset(false);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const result = await WorkingAuthService.resendVerification();
      if (result.success) {
        Alert.alert("Verification Email Sent", result.message);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfilePicture = async () => {
    try {
      setLoading(true);
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to upload a profile picture."
        );
        setLoading(false);
        return;
      }

      // Pick image (no cropping - use full image)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Keep using MediaTypeOptions for now
        allowsEditing: false, // Removed cropping - use full image
        quality: 0.8,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const imageUri = result.assets[0].uri;
      
      // Upload to Firebase Storage first
      const FirebaseStorageService = (await import("../services/FirebaseStorageService")).default;
      const WorkingAuthService = (await import("../services/WorkingAuthService")).default;
      
      const currentUser = await WorkingAuthService.getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        throw new Error("You must be logged in to update your profile picture");
      }

      // Upload image to Firebase Storage
      // Use userId as folder, then filename inside
      const uploadResult = await FirebaseStorageService.uploadImage(
        imageUri,
        `profile-images/${currentUser.uid}`,
        `profile_${Date.now()}.jpg`
      );

      // Update profile with Firebase Storage URL
      await WorkingAuthService.updateProfilePicture(uploadResult.url);
      
      // Force a small delay to ensure all updates are complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        "Success", 
        "Profile picture updated successfully! Please refresh the app or navigate away and back to see the new image.",
        [{ text: "OK" }]
      );
      setShowProfilePicture(false);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      Alert.alert("Error", error.message || "Failed to update profile picture. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showPasswordReset) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowPasswordReset(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#1a365d" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reset Password</Text>
            <Text style={styles.headerSubtitle}>
              Enter your email address and we'll send you a link to reset your
              password
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handlePasswordReset}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Sending..." : "Send Reset Email"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a365d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isLogin ? "Welcome Back" : "Join Our Community"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isLogin
              ? "Sign in to connect with fellow believers"
              : "Create your account and start sharing your faith journey"}
          </Text>
        </View>

        {/* Authentication Method Selection */}
        <View style={styles.authMethodContainer}>
          <TouchableOpacity
            style={[
              styles.authMethodButton,
              authMethod === "email" && styles.authMethodButtonActive,
            ]}
            onPress={() => setAuthMethod("email")}
          >
            <Ionicons
              name="mail"
              size={20}
              color={authMethod === "email" ? "#fff" : "#1a365d"}
            />
            <Text
              style={[
                styles.authMethodText,
                authMethod === "email" && styles.authMethodTextActive,
              ]}
            >
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.authMethodButton,
              authMethod === "google" && styles.authMethodButtonActive,
            ]}
            onPress={() => setAuthMethod("google")}
          >
            <Ionicons
              name="logo-google"
              size={20}
              color={authMethod === "google" ? "#fff" : "#1a365d"}
            />
            <Text
              style={[
                styles.authMethodText,
                authMethod === "google" && styles.authMethodTextActive,
              ]}
            >
              Google
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Profile Picture Upload (only for signup) */}
          {!isLogin && (
            <View style={styles.profilePictureContainer}>
              <Text style={styles.inputLabel}>Profile Picture (Optional)</Text>
              <TouchableOpacity
                style={styles.profilePictureButton}
                onPress={pickProfilePicture}
              >
                {formData.profilePicture ? (
                  <Image
                    source={{ uri: formData.profilePicture }}
                    style={styles.profilePicture}
                  />
                ) : (
                  <View style={styles.profilePicturePlaceholder}>
                    <Ionicons name="camera" size={30} color="#999" />
                    <Text style={styles.profilePictureText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {authMethod === "email" && (
            <>
              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChangeText={(value) => handleInputChange("name", value)}
                    placeholderTextColor="#999"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChangeText={(value) =>
                      handleInputChange("password", value)
                    }
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChangeText={(value) =>
                        handleInputChange("confirmPassword", value)
                      }
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color="#666"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {isLogin && (
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => setShowPasswordReset(true)}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {authMethod === "email" ? (
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading
                  ? "Please wait..."
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.googleButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleGoogleAuth}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                {loading
                  ? "Please wait..."
                  : isLogin
                  ? "Sign in with Google"
                  : "Sign up with Google"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Toggle between Login/Signup */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.toggleLink}>
                {isLogin ? "Sign Up" : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Profile Picture Section for Signed-in Users */}
          <View style={styles.profilePictureSection}>
            <Text style={styles.sectionTitle}>Update Profile Picture</Text>
            <TouchableOpacity
              style={styles.profilePictureButton}
              onPress={handleUpdateProfilePicture}
              disabled={loading}
            >
              <Ionicons name="camera" size={20} color="#1a365d" />
              <Text style={styles.profilePictureButtonText}>
                {loading ? "Updating..." : "Change Profile Picture"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Faith-based message */}
        <View style={styles.faithMessage}>
          <Ionicons name="heart" size={24} color="#1a365d" />
          <Text style={styles.faithMessageText}>
            "For where two or three gather in my name, there am I with them." -
            Matthew 18:20
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: "#333",
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    lineHeight: 22,
  },
  authMethodContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 4,
  },
  authMethodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  authMethodButtonActive: {
    backgroundColor: "#1a365d",
  },
  authMethodText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
    marginLeft: 8,
  },
  authMethodTextActive: {
    color: "#fff",
  },
  formContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePictureButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  profilePicture: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  profilePicturePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  profilePictureText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#333",
  },
  eyeButton: {
    padding: 16,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#1a365d",
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#1a365d",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  googleButton: {
    backgroundColor: "#4285f4",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleText: {
    fontSize: 16,
    color: "#666",
  },
  toggleLink: {
    fontSize: 16,
    color: "#1a365d",
    fontWeight: "600",
  },
  faithMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#1a365d",
  },
  faithMessageText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginLeft: 12,
    lineHeight: 20,
  },
  profilePictureSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  profilePictureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1a365d",
  },
  profilePictureButtonText: {
    color: "#1a365d",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
});

export default EnhancedAuthScreen;
