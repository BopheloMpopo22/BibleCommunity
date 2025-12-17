import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BibleStorageService from "../services/BibleStorageService";
import BibleAPI, { BIBLE_TRANSLATIONS } from "../services/BibleAPI";

const BibleTextReader = ({ book, chapter, onBack, onChapterChange }) => {
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [highlights, setHighlights] = useState({});
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [currentTranslation, setCurrentTranslation] = useState(
    BIBLE_TRANSLATIONS[0]
  );
  const [showTranslationModal, setShowTranslationModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [actionVerse, setActionVerse] = useState(null);

  useEffect(() => {
    loadBibleText();
    loadNotes();
    loadHighlights();
  }, [book, chapter, currentTranslation]);

  const loadBibleText = async () => {
    setLoading(true);
    try {
      const result = await BibleAPI.getBibleText(
        book,
        chapter,
        currentTranslation.id
      );

      if (result.success) {
        setVerses(result.data.verses);
      } else {
        Alert.alert("Error", result.message || "Failed to load Bible text");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load Bible text");
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const chapterNotes = await BibleStorageService.getNotesForChapter(
        book,
        chapter
      );
      setNotes(chapterNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  const loadHighlights = async () => {
    try {
      const chapterHighlights =
        await BibleStorageService.getHighlightsForChapter(book, chapter);
      setHighlights(chapterHighlights);
    } catch (error) {
      console.error("Error loading highlights:", error);
    }
  };

  const handleVersePress = (verse) => {
    setActionVerse(verse);
    setShowActionModal(true);
  };

  const handleNotePress = (verse) => {
    setSelectedVerse(verse);
    setNoteModalVisible(true);

    // Load existing note if it exists
    const verseKey = `${book}-${chapter}-${verse.verse}`;
    const existingNotes = notes[verseKey] || [];
    if (existingNotes.length > 0) {
      setNoteText(existingNotes[0].text);
      setEditingNote(existingNotes[0]);
    } else {
      setNoteText("");
      setEditingNote(null);
    }
  };

  // Chapter navigation functions
  const goToNextChapter = () => {
    if (onChapterChange) {
      onChapterChange(chapter + 1);
    }
  };

  const goToPreviousChapter = () => {
    if (onChapterChange && chapter > 1) {
      onChapterChange(chapter - 1);
    }
  };

  // Action functions
  const handleShare = async () => {
    try {
      const verseText = `${book} ${chapter}:${actionVerse.verse}\n\n"${actionVerse.text}"`;
      await Share.share({
        message: verseText,
        title: `Bible Verse - ${book} ${chapter}:${actionVerse.verse}`,
      });
    } catch (error) {
      console.error("Error sharing verse:", error);
    }
    setShowActionModal(false);
  };

  const handleCopy = async () => {
    try {
      const verseText = `${book} ${chapter}:${actionVerse.verse}\n\n"${actionVerse.text}"`;
      await Clipboard.setString(verseText);
      Alert.alert("Copied", "Verse copied to clipboard");
    } catch (error) {
      console.error("Error copying verse:", error);
    }
    setShowActionModal(false);
  };

  const handleHighlight = () => {
    setShowActionModal(false);
    setShowHighlightModal(true);
  };

  const handleRemoveHighlight = async () => {
    try {
      const verseKey = `${book}-${chapter}-${actionVerse.verse}`;
      const verseHighlights = highlights[verseKey] || [];

      if (verseHighlights.length > 0) {
        // Remove the first highlight (most recent)
        await BibleStorageService.removeHighlight(
          book,
          chapter,
          actionVerse.verse,
          verseHighlights[0].id
        );
        await loadHighlights(); // Reload highlights
      }
    } catch (error) {
      console.error("Error removing highlight:", error);
    }
    setShowActionModal(false);
  };

  const applyHighlight = async (color) => {
    try {
      await BibleStorageService.saveHighlight(
        book,
        chapter,
        actionVerse.verse,
        color
      );
      await loadHighlights(); // Reload highlights
      // No alert message - just highlight and close
    } catch (error) {
      console.error("Error highlighting verse:", error);
    }
    setShowHighlightModal(false);
  };

  const saveNote = async () => {
    if (!noteText.trim()) {
      Alert.alert("Error", "Please enter a note");
      return;
    }

    try {
      const result = await BibleStorageService.saveNote(
        book,
        chapter,
        selectedVerse.verse,
        noteText.trim()
      );
      if (result) {
        await loadNotes(); // Reload notes
        setNoteModalVisible(false);
        setNoteText("");
        setEditingNote(null);
        Alert.alert("Success", "Note saved successfully!");
      } else {
        Alert.alert("Error", "Failed to save note");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save note");
    }
  };

  const deleteNote = async () => {
    if (!editingNote) return;

    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const result = await BibleStorageService.deleteNote(
              book,
              chapter,
              selectedVerse.verse,
              editingNote.id
            );
            if (result) {
              await loadNotes(); // Reload notes
              setNoteModalVisible(false);
              setNoteText("");
              setEditingNote(null);
              Alert.alert("Success", "Note deleted successfully!");
            } else {
              Alert.alert("Error", "Failed to delete note");
            }
          } catch (error) {
            Alert.alert("Error", "Failed to delete note");
          }
        },
      },
    ]);
  };

  const handleTranslationChange = (translation) => {
    setCurrentTranslation(translation);
    setShowTranslationModal(false);
  };

  const renderVerse = (verse) => {
    const verseKey = `${book}-${chapter}-${verse.verse}`;
    const verseNotes = notes[verseKey] || [];
    const verseHighlights = highlights[verseKey] || [];
    const hasNote = verseNotes.length > 0;
    const hasHighlight = verseHighlights.length > 0;

    // Get the highlight color (use the first highlight if multiple)
    const highlightColor = hasHighlight ? verseHighlights[0].color.color : null;

    return (
      <View key={verse.verse} style={styles.verseContainer}>
        <TouchableOpacity
          style={[
            styles.verseContent,
            hasHighlight && { backgroundColor: highlightColor },
          ]}
          onPress={() => handleVersePress(verse)}
        >
          <View style={styles.verseHeader}>
            <Text
              style={[
                styles.verseNumber,
                hasHighlight && {
                  color: highlightColor === "#FFEB3B" ? "#333" : "#fff",
                },
              ]}
            >
              {verse.verse}
            </Text>
            <View style={styles.verseActions}>
              {hasNote && (
                <TouchableOpacity
                  style={styles.noteIndicator}
                  onPress={() => handleNotePress(verse)}
                >
                  <Ionicons name="pencil" size={16} color="#1a365d" />
                </TouchableOpacity>
              )}
              {!hasNote && (
                <TouchableOpacity
                  style={styles.noteIndicator}
                  onPress={() => handleNotePress(verse)}
                >
                  <Ionicons name="pencil-outline" size={16} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text
            style={[
              styles.verseText,
              hasHighlight && {
                color: highlightColor === "#FFEB3B" ? "#333" : "#fff",
              },
            ]}
          >
            {verse.text}
          </Text>
        </TouchableOpacity>

        {hasNote && (
          <View style={styles.noteBubble}>
            <Text style={styles.noteBubbleText} numberOfLines={2}>
              {verseNotes[0].text}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderTranslationOption = (translation) => (
    <TouchableOpacity
      key={translation.id}
      style={[
        styles.translationOption,
        currentTranslation.id === translation.id && styles.selectedTranslation,
      ]}
      onPress={() => handleTranslationChange(translation)}
    >
      <View style={styles.translationInfo}>
        <Text
          style={[
            styles.translationName,
            currentTranslation.id === translation.id &&
              styles.selectedTranslationText,
          ]}
        >
          {translation.name}
        </Text>
        <Text
          style={[
            styles.translationAbbreviation,
            currentTranslation.id === translation.id &&
              styles.selectedTranslationText,
          ]}
        >
          {translation.abbreviation}
        </Text>
      </View>
      {currentTranslation.id === translation.id && (
        <Ionicons name="checkmark" size={20} color="#1a365d" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a365d" />
        <View style={styles.loadingScriptureContainer}>
          <Text style={styles.loadingScriptureReference}>
            Philippians 4:6-7
          </Text>
          <Text style={styles.loadingScriptureText}>
            "Don't worry about anything, but in everything by prayer and
            petition with thanksgiving, let your requests be made known to God.
            And the peace of God, which transcends all understanding, will guard
            your hearts and your minds in Christ Jesus."
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1a365d" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {book} Chapter {chapter}
        </Text>
        <TouchableOpacity
          style={styles.translationButton}
          onPress={() => setShowTranslationModal(true)}
        >
          <Text style={styles.translationButtonText}>
            {currentTranslation.abbreviation}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#1a365d" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {verses.map(renderVerse)}
      </ScrollView>

      {/* Chapter Navigation */}
      <View style={styles.chapterNavigation}>
        <TouchableOpacity
          style={styles.chapterNavButton}
          onPress={goToPreviousChapter}
        >
          <Ionicons name="chevron-back" size={24} color="#1a365d" />
          <Text style={styles.chapterNavText}>Previous Chapter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chapterNavButton}
          onPress={goToNextChapter}
        >
          <Text style={styles.chapterNavText}>Next Chapter</Text>
          <Ionicons name="chevron-forward" size={24} color="#1a365d" />
        </TouchableOpacity>
      </View>

      {/* Translation Selection Modal */}
      <Modal
        visible={showTranslationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTranslationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Translation</Text>
              <TouchableOpacity onPress={() => setShowTranslationModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.translationsList}>
              {BIBLE_TRANSLATIONS.map(renderTranslationOption)}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Note Modal */}
      <Modal
        visible={noteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingNote ? "Edit Note" : "Add Note"}
              </Text>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {book} {chapter}:{selectedVerse?.verse}
            </Text>

            <TextInput
              style={styles.noteInput}
              placeholder="Enter your note here..."
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              {editingNote && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={deleteNote}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveNote}
              >
                <Text style={styles.saveButtonText}>
                  {editingNote ? "Update" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verse Actions</Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {book} {chapter}:{actionVerse?.verse}
            </Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.shareButton]}
                onPress={handleShare}
              >
                <Ionicons name="share" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.copyButton]}
                onPress={handleCopy}
              >
                <Ionicons name="copy" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Copy</Text>
              </TouchableOpacity>

              {(() => {
                const verseKey = `${book}-${chapter}-${actionVerse?.verse}`;
                const verseHighlights = highlights[verseKey] || [];
                const hasHighlight = verseHighlights.length > 0;

                if (hasHighlight) {
                  return (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.removeHighlightButton,
                      ]}
                      onPress={handleRemoveHighlight}
                    >
                      <Ionicons name="remove-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Remove</Text>
                    </TouchableOpacity>
                  );
                } else {
                  return (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.highlightButton]}
                      onPress={handleHighlight}
                    >
                      <Ionicons name="color-palette" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Highlight</Text>
                    </TouchableOpacity>
                  );
                }
              })()}
            </View>
          </View>
        </View>
      </Modal>

      {/* Highlight Color Modal */}
      <Modal
        visible={showHighlightModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHighlightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Highlight Color</Text>
              <TouchableOpacity onPress={() => setShowHighlightModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.colorGrid}>
              {BibleStorageService.getHighlightColors().map((color) => (
                <TouchableOpacity
                  key={color.id}
                  style={[styles.colorButton, { backgroundColor: color.color }]}
                  onPress={() => applyHighlight(color)}
                />
              ))}
            </View>
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
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 5,
  },
  chapterNavButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  chapterNavText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a365d",
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  translationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  translationButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1a365d",
    marginRight: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  chapterNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  loadingScriptureContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  loadingScriptureReference: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 10,
  },
  loadingScriptureText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
    fontStyle: "italic",
  },
  verseContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  verseContent: {
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  verseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  verseActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a365d",
    marginRight: 8,
    minWidth: 20,
  },
  noteIndicator: {
    padding: 4,
  },
  verseText: {
    fontSize: 17,
    lineHeight: 26,
    color: "#333",
    textAlign: "justify",
  },
  noteBubble: {
    backgroundColor: "#E3F2FD",
    padding: 10,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#1a365d",
  },
  noteBubbleText: {
    fontSize: 14,
    color: "#1976D2",
    fontStyle: "italic",
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
    maxHeight: "80%",
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
    marginBottom: 15,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#1a365d",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "#ff4444",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  translationsList: {
    maxHeight: 400,
  },
  translationOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedTranslation: {
    backgroundColor: "#E3F2FD",
  },
  translationInfo: {
    flex: 1,
  },
  translationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  translationAbbreviation: {
    fontSize: 14,
    color: "#666",
  },
  selectedTranslationText: {
    color: "#1a365d",
  },
  // Action Modal Styles
  actionModalContent: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: 300,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: "center",
  },
  shareButton: {
    backgroundColor: "#4CAF50",
  },
  copyButton: {
    backgroundColor: "#2196F3",
  },
  highlightButton: {
    backgroundColor: "#FF9800",
  },
  removeHighlightButton: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Highlight Color Modal Styles
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
});

export default BibleTextReader;
