import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PrayerReader = ({ prayer, onClose }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [personalNote, setPersonalNote] = useState("");

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      isFavorite ? "Removed from Favorites" : "Added to Favorites",
      isFavorite
        ? "Prayer removed from your favorites."
        : "Prayer added to your favorites!"
    );
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const sharePrayer = () => {
    const shareText = `${prayer.title}\n\n${prayer.prayer}\n\nShared from Bible Community App`;
    // In a real app, you would use the Share API here
    Alert.alert("Share Prayer", "Prayer shared successfully!");
    setShowShareModal(false);
  };

  const savePersonalNote = () => {
    if (personalNote.trim()) {
      Alert.alert("Note Saved", "Your personal note has been saved!");
      setPersonalNote("");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleFavorite}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#FF6B6B" : "#666"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prayer Title */}
        <View style={styles.prayerHeader}>
          <Text style={styles.prayerTitle}>{prayer.title}</Text>
          <View style={styles.prayerMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{prayer.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="bookmark-outline" size={16} color="#666" />
              <Text style={styles.metaText}>Prayer</Text>
            </View>
          </View>
        </View>

        {/* Prayer Content */}
        <View style={styles.prayerContent}>
          <Text style={styles.prayerText}>{prayer.prayer}</Text>
        </View>

        {/* Prayer Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Prayer Tips</Text>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={20} color="#4A90E2" />
            <Text style={styles.tipText}>Find a quiet place to pray</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={20} color="#4A90E2" />
            <Text style={styles.tipText}>Speak from your heart</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={20} color="#4A90E2" />
            <Text style={styles.tipText}>Take time to listen</Text>
          </View>
        </View>

        {/* Personal Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Personal Notes</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Add your personal thoughts or prayer requests..."
            value={personalNote}
            onChangeText={setPersonalNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.saveNoteButton}
            onPress={savePersonalNote}
          >
            <Text style={styles.saveNoteText}>Save Note</Text>
          </TouchableOpacity>
        </View>

        {/* Related Scriptures */}
        <View style={styles.scriptureSection}>
          <Text style={styles.scriptureTitle}>Related Scriptures</Text>
          <View style={styles.scriptureCard}>
            <Text style={styles.scriptureReference}>Philippians 4:6-7</Text>
            <Text style={styles.scriptureText}>
              "Do not be anxious about anything, but in every situation, by
              prayer and petition, with thanksgiving, present your requests to
              God. And the peace of God, which transcends all understanding,
              will guard your hearts and your minds in Christ Jesus."
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Prayer</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Share this prayer with friends and family
            </Text>

            <View style={styles.shareOptions}>
              <TouchableOpacity style={styles.shareOption}>
                <Ionicons name="logo-whatsapp" size={32} color="#25D366" />
                <Text style={styles.shareOptionText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption}>
                <Ionicons name="mail-outline" size={32} color="#4A90E2" />
                <Text style={styles.shareOptionText}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOption}>
                <Ionicons name="copy-outline" size={32} color="#666" />
                <Text style={styles.shareOptionText}>Copy Text</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.shareButton} onPress={sharePrayer}>
              <Text style={styles.shareButtonText}>Share Prayer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    color: "#4A90E2",
    marginLeft: 5,
  },
  headerActions: {
    flexDirection: "row",
  },
  actionButton: {
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  prayerHeader: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  prayerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  prayerMeta: {
    flexDirection: "row",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  prayerContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  prayerText: {
    fontSize: 16,
    lineHeight: 26,
    color: "#333",
    textAlign: "justify",
  },
  tipsSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
  },
  notesSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 15,
  },
  saveNoteButton: {
    backgroundColor: "#4A90E2",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveNoteText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  scriptureSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scriptureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  scriptureCard: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 10,
  },
  scriptureReference: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A90E2",
    marginBottom: 8,
  },
  scriptureText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  shareOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  shareOption: {
    alignItems: "center",
  },
  shareOptionText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  shareButton: {
    backgroundColor: "#4A90E2",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PrayerReader;
