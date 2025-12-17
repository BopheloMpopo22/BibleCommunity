import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PrayerCreationForm = ({ visible, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prayerCategories = [
    { id: "morning", label: "Morning Prayer", icon: "sunny", color: "#FFD700" },
    {
      id: "afternoon",
      label: "Afternoon Prayer",
      icon: "partly-sunny",
      color: "#FF8C42",
    },
    { id: "evening", label: "Evening Prayer", icon: "moon", color: "#4A90E2" },
    {
      id: "healing",
      label: "Healing Prayer",
      icon: "medical",
      color: "#FF6B6B",
    },
    {
      id: "gratitude",
      label: "Gratitude Prayer",
      icon: "heart",
      color: "#FF8C42",
    },
    {
      id: "guidance",
      label: "Guidance Prayer",
      icon: "compass",
      color: "#50C878",
    },
    { id: "family", label: "Family Prayer", icon: "people", color: "#9B59B6" },
    {
      id: "worship",
      label: "Worship Prayer",
      icon: "musical-notes",
      color: "#E74C3C",
    },
    {
      id: "intercession",
      label: "Intercession",
      icon: "hand-left",
      color: "#3498DB",
    },
    {
      id: "thanksgiving",
      label: "Thanksgiving",
      icon: "gift",
      color: "#F39C12",
    },
    {
      id: "protection",
      label: "Protection Prayer",
      icon: "shield",
      color: "#8E44AD",
    },
    { id: "peace", label: "Peace Prayer", icon: "leaf", color: "#27AE60" },
    {
      id: "strength",
      label: "Strength Prayer",
      icon: "fitness",
      color: "#E67E22",
    },
    {
      id: "forgiveness",
      label: "Forgiveness Prayer",
      icon: "refresh",
      color: "#95A5A6",
    },
    {
      id: "blessing",
      label: "Blessing Prayer",
      icon: "star",
      color: "#F1C40F",
    },
    {
      id: "other",
      label: "Other",
      icon: "ellipsis-horizontal",
      color: "#34495E",
    },
  ];

  const handleSave = async () => {
    if (!title.trim() || !body.trim() || !category) {
      Alert.alert(
        "Missing Information",
        "Please fill in the title, prayer body, and select a category."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const newPrayer = {
        id: Date.now().toString(),
        title: title.trim(),
        body: body.trim(),
        category: category,
        tags: tags
          .trim()
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        createdAt: new Date().toISOString(),
        author: "Community Member", // This would come from user authentication
        duration: Math.ceil(body.length / 100) + " min", // Estimate based on text length
      };

      await onSave(newPrayer);

      // Reset form
      setTitle("");
      setBody("");
      setCategory("");
      setTags("");

      onClose();
      Alert.alert(
        "Success",
        "Your prayer has been saved and shared with the community!"
      );
    } catch (error) {
      Alert.alert("Error", "Failed to save prayer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (title.trim() || body.trim()) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to close?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setTitle("");
              setBody("");
              setCategory("");
              setTags("");
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Prayer</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveButton,
              isSubmitting && styles.saveButtonDisabled,
            ]}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prayer Title *</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter a meaningful title for your prayer"
              placeholderTextColor="#999"
              maxLength={100}
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {prayerCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    category === cat.id && styles.categoryOptionSelected,
                    { borderColor: cat.color },
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={20}
                    color={category === cat.id ? "#fff" : cat.color}
                  />
                  <Text
                    style={[
                      styles.categoryOptionText,
                      category === cat.id && styles.categoryOptionTextSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Prayer Body */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prayer Content *</Text>
            <TextInput
              style={styles.bodyInput}
              value={body}
              onChangeText={setBody}
              placeholder="Write your prayer here... Share your heart with God and the community"
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.characterCount}>{body.length}/2000</Text>
          </View>

          {/* Tags */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags (Optional)</Text>
            <TextInput
              style={styles.tagsInput}
              value={tags}
              onChangeText={setTags}
              placeholder="Add tags separated by commas (e.g., healing, family, guidance)"
              placeholderTextColor="#999"
            />
            <Text style={styles.tagsHelp}>
              Tags help others find your prayer when searching
            </Text>
          </View>

          {/* Preview */}
          {title.trim() && body.trim() && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Preview</Text>
              <View style={styles.previewCard}>
                <Text style={styles.previewPrayerTitle}>{title}</Text>
                <Text style={styles.previewPrayerBody} numberOfLines={3}>
                  {body}
                </Text>
                <View style={styles.previewMeta}>
                  <Text style={styles.previewCategory}>
                    {prayerCategories.find((cat) => cat.id === category)
                      ?.label || "Uncategorized"}
                  </Text>
                  <Text style={styles.previewDuration}>
                    {Math.ceil(body.length / 100)} min
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  bodyInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#333",
    height: 200,
  },
  tagsInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  characterCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
  tagsHelp: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    fontStyle: "italic",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryOption: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  categoryOptionSelected: {
    backgroundColor: "#4A90E2",
  },
  categoryOptionText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  categoryOptionTextSelected: {
    color: "#fff",
  },
  previewSection: {
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  previewCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  previewPrayerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  previewPrayerBody: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  previewMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewCategory: {
    fontSize: 12,
    color: "#4A90E2",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  previewDuration: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
});

export default PrayerCreationForm;
