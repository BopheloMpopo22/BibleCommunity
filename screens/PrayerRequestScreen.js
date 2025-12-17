import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PrayerService from "../services/PrayerService";

const PrayerRequestScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "Healing",
    "Guidance",
    "Family",
    "Financial",
    "Comfort",
    "Career",
    "Relationships",
    "General",
  ];

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert(
        "Missing Information",
        "Please fill in both title and prayer request."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const prayerRequest = {
        id: Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        category,
        author: author.trim() || "Anonymous",
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
        type: "request",
      };

      await PrayerService.savePrayerRequest(prayerRequest);

      Alert.alert(
        "Prayer Request Submitted",
        "Your prayer request has been shared with the community. Thank you for trusting us with your prayer needs.",
        [
          {
            text: "OK",
            onPress: () => {
              setTitle("");
              setContent("");
              setAuthor("");
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error submitting prayer request:", error);
      Alert.alert(
        "Error",
        "Failed to submit prayer request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      Healing: "#FF6B6B",
      Guidance: "#4ECDC4",
      Family: "#45B7D1",
      Financial: "#96CEB4",
      Comfort: "#FFEAA7",
      Career: "#DDA0DD",
      Relationships: "#98D8C8",
      General: "#1a365d",
    };
    return colors[cat] || "#1a365d";
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a365d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prayer Request</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Share Your Prayer Request</Text>
            <Text style={styles.sectionSubtitle}>
              Let our community join you in prayer. Your request will be shared
              with others who can pray for you.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prayer Request Title *</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Brief title for your prayer request"
                placeholderTextColor="#999"
                maxLength={100}
              />
              <Text style={styles.characterCount}>{title.length}/100</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prayer Request Details *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Share your prayer request details here..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>{content.length}/500</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Name (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={author}
                onChangeText={setAuthor}
                placeholder="Your name or leave blank for anonymous"
                placeholderTextColor="#999"
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor:
                          category === cat ? getCategoryColor(cat) : "#f0f0f0",
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        { color: category === cat ? "#fff" : "#666" },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Submitting..." : "Submit Prayer Request"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.privacyNote}>
              Your prayer request will be visible to the community. Please share
              only what you are comfortable with others seeing.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#1a365d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  privacyNote: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default PrayerRequestScreen;
