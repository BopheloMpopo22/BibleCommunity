// Temporary in-memory storage until AsyncStorage is properly configured
// In production, this would use AsyncStorage for persistence

class NotesService {
  static NOTES_STORAGE_KEY = "@bible_notes";
  static notesStorage = {}; // In-memory storage for now

  // Save a note for a specific verse
  static async saveNote(book, chapter, verse, note) {
    try {
      const key = `${book}_${chapter}_${verse}`;

      this.notesStorage[key] = {
        book,
        chapter,
        verse,
        note,
        timestamp: new Date().toISOString(),
      };

      return { success: true };
    } catch (error) {
      console.error("Error saving note:", error);
      return { success: false, error: error.message };
    }
  }

  // Get a note for a specific verse
  static async getNote(book, chapter, verse) {
    try {
      const key = `${book}_${chapter}_${verse}`;
      return this.notesStorage[key] || null;
    } catch (error) {
      console.error("Error getting note:", error);
      return null;
    }
  }

  // Get all notes
  static async getAllNotes() {
    try {
      return this.notesStorage;
    } catch (error) {
      console.error("Error getting all notes:", error);
      return {};
    }
  }

  // Get notes for a specific book and chapter
  static async getNotesForChapter(book, chapter) {
    try {
      const chapterNotes = {};

      Object.keys(this.notesStorage).forEach((key) => {
        const note = this.notesStorage[key];
        if (note.book === book && note.chapter === chapter) {
          chapterNotes[note.verse] = note;
        }
      });

      return chapterNotes;
    } catch (error) {
      console.error("Error getting chapter notes:", error);
      return {};
    }
  }

  // Delete a note
  static async deleteNote(book, chapter, verse) {
    try {
      const key = `${book}_${chapter}_${verse}`;

      if (this.notesStorage[key]) {
        delete this.notesStorage[key];
        return { success: true };
      }

      return { success: false, error: "Note not found" };
    } catch (error) {
      console.error("Error deleting note:", error);
      return { success: false, error: error.message };
    }
  }

  // Clear all notes
  static async clearAllNotes() {
    try {
      this.notesStorage = {};
      return { success: true };
    } catch (error) {
      console.error("Error clearing notes:", error);
      return { success: false, error: error.message };
    }
  }
}

export default NotesService;
