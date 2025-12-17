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
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import WorkingAuthService from "../services/WorkingAuthService";

const PrayerAuthScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Check if user is already logged in
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const user = await WorkingAuthService.getCurrentUser();
      if (user) {
        // User is logged in, go back
        navigation.goBack();
      }
    } catch (error) {
      console.log("User not logged in");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const handleAuth = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        // Login
        await WorkingAuthService.signIn(formData.email, formData.password);
        Alert.alert("Success", "Welcome back! You're now signed in.");
        navigation.goBack();
      } else {
        // Sign up
        await WorkingAuthService.signUp(
          formData.email,
          formData.password,
          formData.name
        );
        Alert.alert(
          "Success",
          "Account created! Welcome to Bible Community. You're now signed in."
        );
        navigation.goBack();
      }
    } catch (error) {
      console.error("Auth error:", error);
      Alert.alert(
        "Error",
        error.message || "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isLogin ? "Sign In" : "Join Us"}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Ionicons name="heart" size={64} color="#fff" />
            <Text style={styles.welcomeTitle}>
              {isLogin
                ? "Welcome Back!"
                : "Join Bible Community"}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {isLogin
                ? "Continue your journey of faith"
                : "Connect, pray, and grow together"}
            </Text>
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>What You'll Get:</Text>
            
            <View style={styles.benefitItem}>
              <Ionicons name="time" size={24} color="#F1C40F" />
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>Prayer Reminders</Text>
                <Text style={styles.benefitDescription}>
                  Set daily prayer times and receive email reminders to help you stay consistent in your prayer life
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="people" size={24} color="#3498DB" />
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>Community Prayers</Text>
                <Text style={styles.benefitDescription}>
                  Share your prayers and prayer requests with a supportive community of believers
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="gift" size={24} color="#E74C3C" />
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>Share Your Gifts</Text>
                <Text style={styles.benefitDescription}>
                  Contribute daily prayers, scriptures, and words of encouragement to bless others
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="book" size={24} color="#2ECC71" />
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>Word of God</Text>
                <Text style={styles.benefitDescription}>
                  Share scripture and biblical insights with different communities to spread God's word
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="heart-circle" size={24} color="#9B59B6" />
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>Grow Together</Text>
                <Text style={styles.benefitDescription}>
                  Join communities, share testimonies, and encourage one another in faith
                </Text>
              </View>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor="#999"
                  value={formData.name}
                  onChangeText={(text) => handleInputChange("name", text)}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(text) => handleInputChange("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter password"
                  placeholderTextColor="#999"
                  value={formData.password}
                  onChangeText={(text) => handleInputChange("password", text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm password"
                    placeholderTextColor="#999"
                    value={formData.confirmPassword}
                    onChangeText={(text) =>
                      handleInputChange("confirmPassword", text)
                    }
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={24}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.authButtonText}>
                {loading
                  ? "Please wait..."
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setFormData({
                  name: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                });
              }}
            >
              <Text style={styles.switchButtonText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  placeholder: {
    width: 32,
  },
  welcomeSection: {
    alignItems: "center",
    padding: 32,
    paddingTop: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#B0C4DE",
    marginTop: 8,
    textAlign: "center",
  },
  benefitsSection: {
    padding: 20,
    paddingTop: 0,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  benefitItem: {
    flexDirection: "row",
    backgroundColor: "rgba(26, 54, 93, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(26, 54, 93, 0.5)",
  },
  benefitText: {
    flex: 1,
    marginLeft: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: "#B0C4DE",
    lineHeight: 20,
  },
  formSection: {
    padding: 20,
    paddingTop: 0,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#fff",
  },
  eyeButton: {
    padding: 16,
  },
  authButton: {
    backgroundColor: "#1a365d",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  switchButton: {
    marginTop: 20,
    alignItems: "center",
  },
  switchButtonText: {
    color: "#B0C4DE",
    fontSize: 14,
  },
});

export default PrayerAuthScreen;




