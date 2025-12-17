import AsyncStorage from "@react-native-async-storage/async-storage";

class BibleStorageService {
  static NOTES_KEY = "bible_notes";
  static HIGHLIGHTS_KEY = "bible_highlights";

  // ===== NOTES METHODS =====

  // Get all notes for a specific verse
  static async getNotesForVerse(book, chapter, verse) {
    try {
      const notesJson = await AsyncStorage.getItem(this.NOTES_KEY);
      const allNotes = notesJson ? JSON.parse(notesJson) : {};

      const verseKey = `${book}-${chapter}-${verse}`;
      return allNotes[verseKey] || [];
    } catch (error) {
      console.error("Error getting notes for verse:", error);
      return [];
    }
  }

  // Save a note for a specific verse
  static async saveNote(book, chapter, verse, noteText) {
    try {
      const notesJson = await AsyncStorage.getItem(this.NOTES_KEY);
      const allNotes = notesJson ? JSON.parse(notesJson) : {};

      const verseKey = `${book}-${chapter}-${verse}`;
      if (!allNotes[verseKey]) {
        allNotes[verseKey] = [];
      }

      const newNote = {
        id: Date.now().toString(),
        text: noteText,
        timestamp: new Date().toISOString(),
      };

      allNotes[verseKey].push(newNote);
      await AsyncStorage.setItem(this.NOTES_KEY, JSON.stringify(allNotes));

      return newNote;
    } catch (error) {
      console.error("Error saving note:", error);
      return null;
    }
  }

  // Delete a note
  static async deleteNote(book, chapter, verse, noteId) {
    try {
      const notesJson = await AsyncStorage.getItem(this.NOTES_KEY);
      const allNotes = notesJson ? JSON.parse(notesJson) : {};

      const verseKey = `${book}-${chapter}-${verse}`;
      if (allNotes[verseKey]) {
        allNotes[verseKey] = allNotes[verseKey].filter(
          (note) => note.id !== noteId
        );
        await AsyncStorage.setItem(this.NOTES_KEY, JSON.stringify(allNotes));
      }

      return true;
    } catch (error) {
      console.error("Error deleting note:", error);
      return false;
    }
  }

  // ===== HIGHLIGHTS METHODS =====

  // Get all highlights for a specific verse
  static async getHighlightsForVerse(book, chapter, verse) {
    try {
      const highlightsJson = await AsyncStorage.getItem(this.HIGHLIGHTS_KEY);
      const allHighlights = highlightsJson ? JSON.parse(highlightsJson) : {};

      const verseKey = `${book}-${chapter}-${verse}`;
      return allHighlights[verseKey] || [];
    } catch (error) {
      console.error("Error getting highlights for verse:", error);
      return [];
    }
  }

  // Save a highlight for a specific verse
  static async saveHighlight(book, chapter, verse, color) {
    try {
      const highlightsJson = await AsyncStorage.getItem(this.HIGHLIGHTS_KEY);
      const allHighlights = highlightsJson ? JSON.parse(highlightsJson) : {};

      const verseKey = `${book}-${chapter}-${verse}`;
      if (!allHighlights[verseKey]) {
        allHighlights[verseKey] = [];
      }

      const newHighlight = {
        id: Date.now().toString(),
        color: color,
        timestamp: new Date().toISOString(),
      };

      allHighlights[verseKey].push(newHighlight);
      await AsyncStorage.setItem(
        this.HIGHLIGHTS_KEY,
        JSON.stringify(allHighlights)
      );

      return newHighlight;
    } catch (error) {
      console.error("Error saving highlight:", error);
      return null;
    }
  }

  // Remove a highlight
  static async removeHighlight(book, chapter, verse, highlightId) {
    try {
      const highlightsJson = await AsyncStorage.getItem(this.HIGHLIGHTS_KEY);
      const allHighlights = highlightsJson ? JSON.parse(highlightsJson) : {};

      const verseKey = `${book}-${chapter}-${verse}`;
      if (allHighlights[verseKey]) {
        allHighlights[verseKey] = allHighlights[verseKey].filter(
          (highlight) => highlight.id !== highlightId
        );
        await AsyncStorage.setItem(
          this.HIGHLIGHTS_KEY,
          JSON.stringify(allHighlights)
        );
      }

      return true;
    } catch (error) {
      console.error("Error removing highlight:", error);
      return false;
    }
  }

  // ===== UTILITY METHODS =====

  // Get all notes for a chapter
  static async getNotesForChapter(book, chapter) {
    try {
      const notesJson = await AsyncStorage.getItem(this.NOTES_KEY);
      const allNotes = notesJson ? JSON.parse(notesJson) : {};

      const chapterNotes = {};
      Object.keys(allNotes).forEach((verseKey) => {
        if (verseKey.startsWith(`${book}-${chapter}-`)) {
          chapterNotes[verseKey] = allNotes[verseKey];
        }
      });

      return chapterNotes;
    } catch (error) {
      console.error("Error getting notes for chapter:", error);
      return {};
    }
  }

  // Get all highlights for a chapter
  static async getHighlightsForChapter(book, chapter) {
    try {
      const highlightsJson = await AsyncStorage.getItem(this.HIGHLIGHTS_KEY);
      const allHighlights = highlightsJson ? JSON.parse(highlightsJson) : {};

      const chapterHighlights = {};
      Object.keys(allHighlights).forEach((verseKey) => {
        if (verseKey.startsWith(`${book}-${chapter}-`)) {
          chapterHighlights[verseKey] = allHighlights[verseKey];
        }
      });

      return chapterHighlights;
    } catch (error) {
      console.error("Error getting highlights for chapter:", error);
      return {};
    }
  }

  // Clear all data (for testing/reset)
  static async clearAllData() {
    try {
      await AsyncStorage.removeItem(this.NOTES_KEY);
      await AsyncStorage.removeItem(this.HIGHLIGHTS_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing Bible data:", error);
      return false;
    }
  }

  // Available highlight colors
  static getHighlightColors() {
    return [
      { id: "yellow", name: "Yellow", color: "#FFEB3B", textColor: "#333" },
      { id: "green", name: "Green", color: "#4CAF50", textColor: "#fff" },
      { id: "blue", name: "Blue", color: "#2196F3", textColor: "#fff" },
      { id: "pink", name: "Pink", color: "#E91E63", textColor: "#fff" },
      { id: "orange", name: "Orange", color: "#FF9800", textColor: "#fff" },
      { id: "purple", name: "Purple", color: "#9C27B0", textColor: "#fff" },
    ];
  }
}

export default BibleStorageService;

