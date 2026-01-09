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
import { auth } from "../config/firebase";

const PartnerAuthScreen = ({ navigation, route }) => {
  const { partnerType = "prayer" } = route?.params || {}; // "prayer", "scripture", or "word"
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePicture: null,
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    checkAuthAndNavigate();

    // Listen for auth state changes
    const unsubscribe = WorkingAuthService.onAuthStateChanged((user) => {
      if (user) {
        console.log("Partner user signed in:", user);
        // Navigate to appropriate partner page after login
        navigateToPartnerPage();
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [partnerType]);

  const checkAuthAndNavigate = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        navigateToPartnerPage();
      }
    } catch (error) {
      console.log("No user logged in");
    }
  };

  const navigateToPartnerPage = () => {
    if (partnerType === "prayer") {
      navigation.replace("PartnerInfo");
    } else if (partnerType === "scripture") {
      navigation.replace("PartnerScriptureInfo");
    } else if (partnerType === "word") {
      navigation.replace("PartnerWordInfo");
    }
  };

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      if (!acceptedTerms) {
        Alert.alert(
          "Required",
          "Please accept the Terms of Service to continue"
        );
        return false;
      }
      if (!acceptedPrivacy) {
        Alert.alert("Required", "Please accept the Privacy Policy to continue");
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
            // Navigate to partner page
            navigateToPartnerPage();
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
            {
              text: "OK",
              onPress: () => {
                // Navigate to partner page after signup
                navigateToPartnerPage();
              },
            },
          ]);
        }
      }
    } catch (error) {
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
        // Navigate to partner page
        navigateToPartnerPage();
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const result = await WorkingAuthService.resendVerification();
      if (result.success) {
        Alert.alert(
          "Verification Email Sent",
          "Please check your inbox and verify your email address."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to resend verification email.");
    }
  };

  const getPartnerInfo = () => {
    switch (partnerType) {
      case "prayer":
        return {
          title: "Be a Prayer Partner",
          description:
            "As a Prayer Partner, you help create and share prayers that bless thousands of users daily. Your contributions help send morning prayers, afternoon prayers, evening prayers, and more to our community.",
          icon: "heart",
          color: "#1a365d",
        };
      case "scripture":
        return {
          title: "Be a Scripture Partner",
          description:
            "As a Scripture Partner, you help create and share daily scriptures that inspire and guide our community. Your contributions help spread God's word to thousands of users.",
          icon: "book",
          color: "#50C878",
        };
      case "word":
        return {
          title: "Be a Word Partner",
          description:
            "As a Word Partner, you help create and share words of the day that inspire and encourage our community. Your contributions help uplift thousands of users daily.",
          icon: "sparkles",
          color: "#FF8C42",
        };
      default:
        return {
          title: "Be a Partner",
          description:
            "As a partner, you help create content that blesses our community.",
          icon: "people",
          color: "#1a365d",
        };
    }
  };

  const partnerInfo = getPartnerInfo();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a365d" />
          </TouchableOpacity>
        </View>

        {/* Partner Info Section */}
        <View style={styles.partnerInfoSection}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${partnerInfo.color}20` },
            ]}
          >
            <Ionicons
              name={partnerInfo.icon}
              size={48}
              color={partnerInfo.color}
            />
          </View>
          <Text style={styles.partnerTitle}>{partnerInfo.title}</Text>
          <Text style={styles.partnerDescription}>
            {partnerInfo.description}
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>What You Can Do:</Text>
          <View style={styles.benefitItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={partnerInfo.color}
            />
            <Text style={styles.benefitText}>
              Create content that blesses thousands of users
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={partnerInfo.color}
            />
            <Text style={styles.benefitText}>
              Your content may be selected for daily features
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={partnerInfo.color}
            />
            <Text style={styles.benefitText}>
              Build your profile and track your contributions
            </Text>
          </View>
        </View>

        {/* Auth Form */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>
            {isLogin ? "Sign In to Continue" : "Create Your Partner Account"}
          </Text>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={formData.password}
              onChangeText={(value) => handleInputChange("password", value)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(value) =>
                  handleInputChange("confirmPassword", value)
                }
                secureTextEntry={!showPassword}
              />
            </View>
          )}

          {!isLogin && (
            <TouchableOpacity
              style={styles.profilePictureButton}
              onPress={pickProfilePicture}
            >
              <Ionicons name="camera-outline" size={20} color="#1a365d" />
              <Text style={styles.profilePictureText}>
                {formData.profilePicture
                  ? "Change Profile Picture"
                  : "Add Profile Picture (Optional)"}
              </Text>
            </TouchableOpacity>
          )}

          {formData.profilePicture && !isLogin && (
            <Image
              source={{ uri: formData.profilePicture }}
              style={styles.profilePreview}
            />
          )}

          {/* Legal Acceptance Checkboxes (only for sign-up) */}
          {!isLogin && (
            <View style={styles.legalSection}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              >
                <View
                  style={[
                    styles.checkbox,
                    acceptedTerms && styles.checkboxChecked,
                  ]}
                >
                  {acceptedTerms && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <View style={styles.checkboxTextContainer}>
                  <Text style={styles.checkboxText}>
                    I accept the{" "}
                    <Text
                      style={styles.checkboxLink}
                      onPress={() => navigation.navigate("TermsOfService")}
                    >
                      Terms of Service
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
              >
                <View
                  style={[
                    styles.checkbox,
                    acceptedPrivacy && styles.checkboxChecked,
                  ]}
                >
                  {acceptedPrivacy && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <View style={styles.checkboxTextContainer}>
                  <Text style={styles.checkboxText}>
                    I accept the{" "}
                    <Text
                      style={styles.checkboxLink}
                      onPress={() => navigation.navigate("PrivacyPolicy")}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: partnerInfo.color },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.submitButtonText}>Please wait...</Text>
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? "Sign In" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleAuth}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              setIsLogin(!isLogin);
              // Reset checkboxes when switching modes
              setAcceptedTerms(false);
              setAcceptedPrivacy(false);
            }}
          >
            <Text style={styles.toggleText}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  partnerInfoSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  partnerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a365d",
    textAlign: "center",
    marginBottom: 12,
  },
  partnerDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  benefitsSection: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a365d",
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
  formSection: {
    paddingHorizontal: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a365d",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 8,
  },
  profilePictureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1a365d",
  },
  profilePictureText: {
    fontSize: 14,
    color: "#1a365d",
    marginLeft: 8,
  },
  profilePreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 16,
  },
  legalSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#1a365d",
    borderRadius: 4,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#1a365d",
    borderColor: "#1a365d",
  },
  checkboxTextContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  checkboxText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  checkboxLink: {
    color: "#1a365d",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  submitButton: {
    backgroundColor: "#1a365d",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  googleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  toggleButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  toggleText: {
    fontSize: 14,
    color: "#1a365d",
  },
});

export default PartnerAuthScreen;
