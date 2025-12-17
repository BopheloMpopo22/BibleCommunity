import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Bible API configuration
const BIBLE_API_BASE_URL = "https://api.scripture.api.bible/v1";
const API_KEY = "73282bc1f0b0f56c02214adac330140e"; // Replace with your actual API key from https://scripture.api.bible/

// Cache keys for AsyncStorage
const CACHE_STORAGE_KEY = "bible_chapter_cache";
const BOOK_ID_CACHE_KEY = "bible_book_ids_cache";
const CHAPTER_ID_CACHE_KEY = "bible_chapter_ids_cache";

// Available Bible translations
export const BIBLE_TRANSLATIONS = [
  {
    id: "de4e12af7f28f599-02",
    name: "King James Version",
    abbreviation: "KJV",
    language: "English",
    description: "The classic English Bible translation",
  },
  {
    id: "65eec8e0b60e656b-01",
    name: "New International Version",
    abbreviation: "NIV",
    language: "English",
    description: "Modern, readable English translation",
  },
  {
    id: "f421fe261da7624f-01",
    name: "English Standard Version",
    abbreviation: "ESV",
    language: "English",
    description: "Word-for-word translation with modern language",
  },
  {
    id: "9879dbb7cfe39e4d-01",
    name: "New Living Translation",
    abbreviation: "NLT",
    language: "English",
    description: "Thought-for-thought translation for easy reading",
  },
  {
    id: "c315fa9f71d4af3a-01",
    name: "American Standard Version",
    abbreviation: "ASV",
    language: "English",
    description: "Literal translation from 1901",
  },
];

class BibleAPI {
  // Simple in-memory cache for Bible chapters
  static chapterCache = new Map();
  static bookIdCache = new Map(); // Cache book IDs to avoid repeated lookups
  static chapterIdCache = new Map(); // Cache chapter IDs to avoid repeated lookups
  static CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days (persistent cache)
  static cacheLoaded = false; // Track if cache has been loaded from storage

  // Load cache from AsyncStorage on app start
  static async loadCacheFromStorage() {
    if (this.cacheLoaded) return;
    
    try {
      // Load chapter cache
      const chapterCacheData = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
      if (chapterCacheData) {
        const parsed = JSON.parse(chapterCacheData);
        const now = Date.now();
        Object.entries(parsed).forEach(([key, value]) => {
          // Only load non-expired cache entries
          if (now - value.timestamp < this.CACHE_DURATION) {
            this.chapterCache.set(key, value);
          }
        });
        console.log(`📖 Loaded ${this.chapterCache.size} cached chapters from storage`);
      }

      // Load book ID cache
      const bookIdData = await AsyncStorage.getItem(BOOK_ID_CACHE_KEY);
      if (bookIdData) {
        this.bookIdCache = new Map(JSON.parse(bookIdData));
        console.log(`📖 Loaded ${this.bookIdCache.size} cached book IDs`);
      }

      // Load chapter ID cache
      const chapterIdData = await AsyncStorage.getItem(CHAPTER_ID_CACHE_KEY);
      if (chapterIdData) {
        this.chapterIdCache = new Map(JSON.parse(chapterIdData));
        console.log(`📖 Loaded ${this.chapterIdCache.size} cached chapter IDs`);
      }

      this.cacheLoaded = true;
    } catch (error) {
      console.error("❌ Error loading cache from storage:", error);
      this.cacheLoaded = true; // Mark as loaded to prevent retries
    }
  }

  // Save cache to AsyncStorage
  static async saveCacheToStorage() {
    try {
      // Save chapter cache
      const chapterCacheObj = Object.fromEntries(this.chapterCache);
      await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(chapterCacheObj));

      // Save book ID cache
      await AsyncStorage.setItem(BOOK_ID_CACHE_KEY, JSON.stringify(Array.from(this.bookIdCache.entries())));

      // Save chapter ID cache
      await AsyncStorage.setItem(CHAPTER_ID_CACHE_KEY, JSON.stringify(Array.from(this.chapterIdCache.entries())));
    } catch (error) {
      console.error("❌ Error saving cache to storage:", error);
    }
  }

  // Preload popular scriptures for instant access
  static async preloadPopularScriptures(translationId = "de4e12af7f28f599-02") {
    const popularScriptures = [
      { book: "John", chapter: 3 },
      { book: "Psalms", chapter: 23 },
      { book: "Matthew", chapter: 5 },
      { book: "Romans", chapter: 8 },
      { book: "1 Corinthians", chapter: 13 },
      { book: "Philippians", chapter: 4 },
      { book: "Genesis", chapter: 1 },
    ];

    console.log("📖 Preloading popular scriptures...");
    
    // Load cache first
    await this.loadCacheFromStorage();

    // Preload in parallel (but don't wait for all)
    Promise.all(
      popularScriptures.map(async ({ book, chapter }) => {
        const cacheKey = `${translationId}-${book}-${chapter}`;
        // Only preload if not already cached
        if (!this.chapterCache.has(cacheKey)) {
          try {
            await this.getBibleText(book, chapter, translationId);
          } catch (error) {
            // Silently fail - preloading is optional
          }
        }
      })
    ).then(() => {
      console.log("📖 Finished preloading popular scriptures");
      // Save cache after preloading
      this.saveCacheToStorage();
    });
  }

  // Test API connection
  static async testAPI() {
    try {
      console.log("🧪 Testing API connection...");

      // Test with a simpler endpoint first
      const response = await axios.get(`${BIBLE_API_BASE_URL}/bibles`, {
        headers: {
          "api-key": API_KEY,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ API Test Successful!");
      console.log("📚 Available Bibles:", response.data.data?.length || 0);

      return {
        success: true,
        message: "API connection successful",
        bibles: response.data.data,
      };
    } catch (error) {
      console.error("❌ API Test Failed:", error.message);

      if (error.response) {
        console.error("🔍 Test Error Details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }

      return {
        success: false,
        message: error.message,
        error: error.response?.data,
      };
    }
  }

  // Get Bible text from REAL API
  static async getBibleText(
    book,
    chapter,
    translationId = "de4e12af7f28f599-02"
  ) {
    try {
      // Load cache from storage if not already loaded
      if (!this.cacheLoaded) {
        await this.loadCacheFromStorage();
      }

      // Check if we have a real API key
      if (API_KEY === "YOUR_API_KEY") {
        console.log(
          "⚠️ Using sample data - Get a free API key from https://scripture.api.bible/"
        );
        return this.getSampleBibleText(book, chapter, translationId);
      }

      // Check cache first (instant return if cached)
      const cacheKey = `${translationId}-${book}-${chapter}`;
      const cachedData = this.chapterCache.get(cacheKey);

      if (
        cachedData &&
        Date.now() - cachedData.timestamp < this.CACHE_DURATION
      ) {
        console.log(`📖 Using cached data for ${book} Chapter ${chapter}`);
        return {
          success: true,
          data: {
            book: book,
            chapter: chapter,
            translation: translationId,
            verses: cachedData.verses,
            reference: `${book} ${chapter}`,
            copyright: "Bible API (Cached)",
          },
        };
      }

      console.log(
        `🔍 Getting Bible text for ${book} Chapter ${chapter} in ${translationId}`
      );

      // Step 1: Get the book ID first (use cache if available)
      let bookId = this.bookIdCache.get(`${translationId}-${book}`);
      if (!bookId) {
        bookId = await this.getBookId(translationId, book);
        if (!bookId) {
          throw new Error(`Book ${book} not found in this translation`);
        }
        // Cache the book ID
        this.bookIdCache.set(`${translationId}-${book}`, bookId);
        await this.saveCacheToStorage(); // Save immediately
      }

      console.log(`📖 Found book ID: ${bookId}`);

      // Step 2: Get the chapter ID (use cache if available)
      const chapterCacheKey = `${translationId}-${bookId}-${chapter}`;
      let chapterId = this.chapterIdCache.get(chapterCacheKey);
      if (!chapterId) {
        chapterId = await this.getChapterId(translationId, bookId, chapter);
        if (!chapterId) {
          throw new Error(`Chapter ${chapter} not found in ${book}`);
        }
        // Cache the chapter ID
        this.chapterIdCache.set(chapterCacheKey, chapterId);
        await this.saveCacheToStorage(); // Save immediately
      }

      console.log(`📖 Found chapter ID: ${chapterId}`);

      // Step 3: Get verses for the chapter
      const verses = await this.getVerses(translationId, chapterId);

      if (verses && verses.length > 0) {
        // Cache the result for faster future access
        this.chapterCache.set(cacheKey, {
          verses: verses,
          timestamp: Date.now(),
        });

        // Save to persistent storage (don't await to avoid blocking)
        this.saveCacheToStorage();

        console.log(
          `📖 Cached ${verses.length} verses for ${book} Chapter ${chapter}`
        );

        return {
          success: true,
          data: {
            book: book,
            chapter: chapter,
            translation: translationId,
            verses: verses,
            reference: `${book} ${chapter}`,
            copyright: "Bible API",
          },
        };
      }

      throw new Error("No verses found for this chapter");
    } catch (error) {
      console.error(
        "❌ Real API failed, falling back to sample data:",
        error.message
      );

      if (error.response) {
        console.error("🔍 API Error Details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }

      // Fallback to sample data
      return this.getSampleBibleText(book, chapter, translationId);
    }
  }

  // Get book ID from book name
  static async getBookId(translationId, bookName) {
    try {
      console.log(`🔍 Getting book ID for: ${bookName}`);

      const response = await axios.get(
        `${BIBLE_API_BASE_URL}/bibles/${translationId}/books`,
        {
          headers: {
            "api-key": API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.data) {
        const books = response.data.data;
        const book = books.find(
          (b) =>
            b.name.toLowerCase() === bookName.toLowerCase() ||
            b.abbreviation.toLowerCase() === bookName.toLowerCase()
        );

        console.log(
          `📖 Available books:`,
          books.map((b) => ({ name: b.name, id: b.id }))
        );
        console.log(`📖 Found book:`, book);

        return book ? book.id : null;
      }

      return null;
    } catch (error) {
      console.error("❌ Error getting book ID:", error.message);
      return null;
    }
  }

  // Get chapter ID from chapter number
  static async getChapterId(translationId, bookId, chapterNumber) {
    try {
      console.log(
        `🔍 Getting chapter ID for: ${bookId} Chapter ${chapterNumber}`
      );

      const response = await axios.get(
        `${BIBLE_API_BASE_URL}/bibles/${translationId}/books/${bookId}/chapters`,
        {
          headers: {
            "api-key": API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.data) {
        const chapters = response.data.data;
        const chapter = chapters.find(
          (c) => c.number === chapterNumber.toString()
        );

        console.log(
          `📖 Available chapters:`,
          chapters.map((c) => ({ number: c.number, id: c.id }))
        );
        console.log(`📖 Found chapter:`, chapter);

        return chapter ? chapter.id : null;
      }

      return null;
    } catch (error) {
      console.error("❌ Error getting chapter ID:", error.message);
      return null;
    }
  }

  // Get verses for a chapter - OPTIMIZED VERSION
  static async getVerses(translationId, chapterId) {
    try {
      console.log(`🔍 Getting chapter content for: ${chapterId}`);

      // Use the chapter content endpoint for much faster loading
      const response = await axios.get(
        `${BIBLE_API_BASE_URL}/bibles/${translationId}/chapters/${chapterId}`,
        {
          headers: {
            "api-key": API_KEY,
            "Content-Type": "application/json",
          },
          params: {
            "content-type": "text",
            "include-notes": false,
            "include-titles": true,
            "include-chapter-numbers": false,
            "include-verse-numbers": true,
          },
        }
      );

      console.log("📡 Chapter API Response Status:", response.status);

      if (response.data && response.data.data) {
        const chapterData = response.data.data;
        console.log("📖 Chapter data received, parsing content...");

        // Parse the chapter content to extract verses
        const verses = this.parseChapterContent(
          chapterData.content || chapterData.text
        );

        console.log(`📖 Parsed ${verses.length} verses from chapter content`);
        return verses;
      }

      console.log("❌ No chapter data in response");
      return [];
    } catch (error) {
      console.error("❌ Error getting chapter content:", error.message);
      if (error.response) {
        console.error("❌ Chapter API Error Response:", {
          status: error.response.status,
          data: error.response.data,
        });
      }

      // Fallback to the old method if the new one fails
      console.log("🔄 Falling back to individual verse loading...");
      return await this.getVersesFallback(translationId, chapterId);
    }
  }

  // Fallback method for individual verse loading (slower but more reliable)
  static async getVersesFallback(translationId, chapterId) {
    try {
      console.log(`🔍 Fallback: Getting verses for chapter: ${chapterId}`);

      const response = await axios.get(
        `${BIBLE_API_BASE_URL}/bibles/${translationId}/chapters/${chapterId}/verses`,
        {
          headers: {
            "api-key": API_KEY,
            "Content-Type": "application/json",
          },
          params: {
            "content-type": "text",
          },
        }
      );

      if (response.data && response.data.data) {
        const versesData = response.data.data;
        console.log(`📖 Number of verses: ${versesData.length}`);

        // Get actual text content for each verse (limit to first 20 for performance)
        const verses = [];
        const maxVerses = Math.min(versesData.length, 20);

        for (let i = 0; i < maxVerses; i++) {
          const verse = versesData[i];
          console.log(`📖 Getting text for verse ${i + 1}: ${verse.id}`);

          try {
            const verseResponse = await axios.get(
              `${BIBLE_API_BASE_URL}/bibles/${translationId}/verses/${verse.id}`,
              {
                headers: {
                  "api-key": API_KEY,
                  "Content-Type": "application/json",
                },
                params: {
                  "content-type": "text",
                },
              }
            );

            if (verseResponse.data && verseResponse.data.data) {
              const verseData = verseResponse.data.data;
              let verseText = "";

              // Try different possible text fields
              if (verseData.text) {
                verseText = verseData.text;
              } else if (verseData.content) {
                verseText = verseData.content;
              } else if (verseData.verseText) {
                verseText = verseData.verseText;
              }

              // Extract verse number from ID
              let verseNumber = i + 1;
              if (verse.id && typeof verse.id === "string") {
                const parts = verse.id.split(".");
                verseNumber = parseInt(parts[parts.length - 1]) || i + 1;
              }

              if (verseText.trim().length > 0) {
                verses.push({
                  verse: verseNumber,
                  text: verseText.trim(),
                });
                console.log(`📖 Added verse ${verseNumber}`);
              }
            }
          } catch (verseError) {
            console.error(
              `❌ Error getting verse ${i + 1}:`,
              verseError.message
            );
          }
        }

        console.log(`📖 Fallback: Loaded ${verses.length} verses`);
        return verses;
      }

      return [];
    } catch (error) {
      console.error("❌ Fallback method also failed:", error.message);
      return [];
    }
  }

  // Parse chapter content to extract individual verses
  static parseChapterContent(content) {
    try {
      if (!content) {
        console.log("❌ No content to parse");
        return [];
      }

      console.log("🔍 Parsing chapter content...");

      const verses = [];

      // Remove HTML tags and clean up the content
      let cleanContent = content
        .replace(/<[^>]*>/g, " ") // Remove HTML tags
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();

      console.log(
        "🔍 Clean content preview:",
        cleanContent.substring(0, 200) + "..."
      );

      // Try different verse number patterns
      const patterns = [
        // Pattern 1: [1] text [2] text
        /\[(\d+)\]\s*([^[\]]+?)(?=\[\d+\]|$)/g,
        // Pattern 2: 1. text 2. text
        /(\d+)\.\s*([^0-9\n]+?)(?=\d+\.\s|$)/g,
        // Pattern 3: 1 text 2 text (no period)
        /(\d+)\s+([^0-9\n]+?)(?=\d+\s|$)/g,
      ];

      for (const pattern of patterns) {
        let match;
        const tempVerses = [];

        while ((match = pattern.exec(cleanContent)) !== null) {
          const verseNumber = parseInt(match[1]);
          let verseText = match[2].trim();

          // Clean up verse text
          verseText = verseText
            .replace(/^\d+\.?\s*/, "") // Remove leading numbers
            .replace(/\s+/g, " ")
            .trim();

          if (verseNumber && verseText && verseText.length > 5) {
            tempVerses.push({
              verse: verseNumber,
              text: verseText,
            });
          }
        }

        if (tempVerses.length > 0) {
          console.log(`📖 Found ${tempVerses.length} verses with pattern`);
          verses.push(...tempVerses);
          break; // Use the first pattern that finds verses
        }
      }

      // Sort verses by verse number
      verses.sort((a, b) => a.verse - b.verse);

      // Remove duplicates
      const uniqueVerses = [];
      const seen = new Set();

      for (const verse of verses) {
        if (!seen.has(verse.verse)) {
          seen.add(verse.verse);
          uniqueVerses.push(verse);
        }
      }

      console.log(`📖 Final parsed verses: ${uniqueVerses.length}`);
      return uniqueVerses;
    } catch (error) {
      console.error("❌ Error parsing chapter content:", error);
      return [];
    }
  }

  // Parse HTML content from API to extract verses
  static parseVersesFromHTML(htmlContent) {
    try {
      console.log(
        "🔍 Raw HTML content:",
        htmlContent.substring(0, 500) + "..."
      );

      const verses = [];

      // First, try to extract verses using verse numbers in sup tags
      const verseRegex = /<sup[^>]*>(\d+)<\/sup>\s*([^<]+?)(?=<sup|$)/g;
      let match;

      while ((match = verseRegex.exec(htmlContent)) !== null) {
        const verseNumber = parseInt(match[1]);
        const verseText = match[2].trim();

        if (verseNumber && verseText) {
          verses.push({
            verse: verseNumber,
            text: verseText,
          });
        }
      }

      console.log("📖 Found verses with sup tags:", verses.length);

      // If no verses found with sup tags, try alternative methods
      if (verses.length === 0) {
        // Try parsing with verse numbers in different formats
        const alternativeRegex = /(\d+)\s+([^0-9\n]+?)(?=\d+\s|$)/g;

        while ((match = alternativeRegex.exec(htmlContent)) !== null) {
          const verseNumber = parseInt(match[1]);
          const verseText = match[2].trim();

          if (verseNumber && verseText && verseText.length > 10) {
            verses.push({
              verse: verseNumber,
              text: verseText,
            });
          }
        }

        console.log("📖 Found verses with alternative parsing:", verses.length);
      }

      // If still no verses, try to parse the content as plain text
      if (verses.length === 0) {
        // Remove all HTML tags and try to find verse patterns
        const cleanContent = htmlContent
          .replace(/<[^>]*>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
          .trim();

        console.log(
          "🔍 Clean content:",
          cleanContent.substring(0, 300) + "..."
        );

        // Look for patterns like "1 text" or "1. text"
        const plainTextRegex = /(\d+)\.?\s+([^0-9\n]+?)(?=\d+\.?\s|$)/g;

        while ((match = plainTextRegex.exec(cleanContent)) !== null) {
          const verseNumber = parseInt(match[1]);
          const verseText = match[2].trim();

          if (verseNumber && verseText && verseText.length > 5) {
            verses.push({
              verse: verseNumber,
              text: verseText,
            });
          }
        }

        console.log("📖 Found verses with plain text parsing:", verses.length);
      }

      // Sort verses by verse number
      verses.sort((a, b) => a.verse - b.verse);

      console.log("📖 Final parsed verses:", verses);

      return verses.length > 0 ? verses : null;
    } catch (error) {
      console.error("Error parsing HTML:", error);
      return null;
    }
  }

  // Get available translations from REAL API
  static async getTranslations() {
    try {
      // Check if we have a real API key
      if (API_KEY === "YOUR_API_KEY") {
        console.log(
          "⚠️ Using sample translations - Get a free API key from https://scripture.api.bible/"
        );
        return {
          success: true,
          data: BIBLE_TRANSLATIONS,
        };
      }

      // REAL API CALL
      const response = await axios.get(`${BIBLE_API_BASE_URL}/bibles`, {
        headers: {
          "api-key": API_KEY,
          "Content-Type": "application/json",
        },
        params: {
          language: "en",
          includeFullDetails: false,
        },
      });

      if (response.data && response.data.data) {
        const translations = response.data.data.map((bible) => ({
          id: bible.id,
          name: bible.name,
          abbreviation: bible.abbreviation,
          language: bible.language.name,
          description: bible.description || `${bible.name} translation`,
        }));

        return {
          success: true,
          data: translations,
        };
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error(
        "❌ Real API failed, falling back to sample translations:",
        error.message
      );

      // Fallback to sample translations
      return {
        success: true,
        data: BIBLE_TRANSLATIONS,
      };
    }
  }

  // Search Bible text using REAL API
  static async searchBible(query, translationId = "de4e12af7f28f599-02") {
    try {
      // Check if we have a real API key
      if (API_KEY === "YOUR_API_KEY") {
        console.log(
          "⚠️ Search not available with sample data - Get a free API key from https://scripture.api.bible/"
        );
        return {
          success: false,
          message:
            "Search requires a real API key. Get one from https://scripture.api.bible/",
        };
      }

      // REAL API CALL
      const response = await axios.get(
        `${BIBLE_API_BASE_URL}/bibles/${translationId}/search`,
        {
          headers: {
            "api-key": API_KEY,
            "Content-Type": "application/json",
          },
          params: {
            query: query,
            limit: 20,
          },
        }
      );

      if (response.data && response.data.data) {
        const results = response.data.data.passages.map((passage) => ({
          reference: passage.reference,
          text: passage.text,
          verseCount: passage.verseCount,
        }));

        return {
          success: true,
          data: {
            query: query,
            results: results,
            total: response.data.data.total,
          },
        };
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error("❌ Search API failed:", error.message);
      return {
        success: false,
        message: "Search failed. Please try again.",
      };
    }
  }

  // Get all books for a translation
  static async getBooks(translationId = "de4e12af7f28f599-02") {
    try {
      // Check if we have a real API key
      if (API_KEY === "YOUR_API_KEY") {
        console.log(
          "⚠️ Using sample books - Get a free API key from https://scripture.api.bible/"
        );
        return {
          success: true,
          data: this.getSampleBooks(),
        };
      }

      // REAL API CALL
      const response = await axios.get(
        `${BIBLE_API_BASE_URL}/bibles/${translationId}/books`,
        {
          headers: {
            "api-key": API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.data) {
        const books = response.data.data.map((book) => ({
          id: book.id,
          name: book.name,
          abbreviation: book.abbreviation,
          chapters: book.chaptersCount,
        }));

        return {
          success: true,
          data: books,
        };
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error(
        "❌ Books API failed, falling back to sample books:",
        error.message
      );

      // Fallback to sample books
      return {
        success: true,
        data: this.getSampleBooks(),
      };
    }
  }

  // Sample books data (fallback)
  static getSampleBooks() {
    return [
      { id: "gen", name: "Genesis", abbreviation: "Gen", chapters: 50 },
      { id: "exo", name: "Exodus", abbreviation: "Exo", chapters: 40 },
      { id: "lev", name: "Leviticus", abbreviation: "Lev", chapters: 27 },
      { id: "num", name: "Numbers", abbreviation: "Num", chapters: 36 },
      { id: "deu", name: "Deuteronomy", abbreviation: "Deu", chapters: 34 },
      { id: "jos", name: "Joshua", abbreviation: "Jos", chapters: 24 },
      { id: "jdg", name: "Judges", abbreviation: "Jdg", chapters: 21 },
      { id: "rut", name: "Ruth", abbreviation: "Rut", chapters: 4 },
      { id: "1sa", name: "1 Samuel", abbreviation: "1Sa", chapters: 31 },
      { id: "2sa", name: "2 Samuel", abbreviation: "2Sa", chapters: 24 },
      { id: "1ki", name: "1 Kings", abbreviation: "1Ki", chapters: 22 },
      { id: "2ki", name: "2 Kings", abbreviation: "2Ki", chapters: 25 },
      { id: "1ch", name: "1 Chronicles", abbreviation: "1Ch", chapters: 29 },
      { id: "2ch", name: "2 Chronicles", abbreviation: "2Ch", chapters: 36 },
      { id: "ezr", name: "Ezra", abbreviation: "Ezr", chapters: 10 },
      { id: "neh", name: "Nehemiah", abbreviation: "Neh", chapters: 13 },
      { id: "est", name: "Esther", abbreviation: "Est", chapters: 10 },
      { id: "job", name: "Job", abbreviation: "Job", chapters: 42 },
      { id: "psa", name: "Psalms", abbreviation: "Psa", chapters: 150 },
      { id: "pro", name: "Proverbs", abbreviation: "Pro", chapters: 31 },
      { id: "ecc", name: "Ecclesiastes", abbreviation: "Ecc", chapters: 12 },
      { id: "sng", name: "Song of Solomon", abbreviation: "Sng", chapters: 8 },
      { id: "isa", name: "Isaiah", abbreviation: "Isa", chapters: 66 },
      { id: "jer", name: "Jeremiah", abbreviation: "Jer", chapters: 52 },
      { id: "lam", name: "Lamentations", abbreviation: "Lam", chapters: 5 },
      { id: "ezk", name: "Ezekiel", abbreviation: "Ezk", chapters: 48 },
      { id: "dan", name: "Daniel", abbreviation: "Dan", chapters: 12 },
      { id: "hos", name: "Hosea", abbreviation: "Hos", chapters: 14 },
      { id: "jol", name: "Joel", abbreviation: "Jol", chapters: 3 },
      { id: "amo", name: "Amos", abbreviation: "Amo", chapters: 9 },
      { id: "oba", name: "Obadiah", abbreviation: "Oba", chapters: 1 },
      { id: "jnh", name: "Jonah", abbreviation: "Jnh", chapters: 4 },
      { id: "mic", name: "Micah", abbreviation: "Mic", chapters: 7 },
      { id: "nam", name: "Nahum", abbreviation: "Nam", chapters: 3 },
      { id: "hab", name: "Habakkuk", abbreviation: "Hab", chapters: 3 },
      { id: "zep", name: "Zephaniah", abbreviation: "Zep", chapters: 3 },
      { id: "hag", name: "Haggai", abbreviation: "Hag", chapters: 2 },
      { id: "zec", name: "Zechariah", abbreviation: "Zec", chapters: 14 },
      { id: "mal", name: "Malachi", abbreviation: "Mal", chapters: 4 },
      { id: "mat", name: "Matthew", abbreviation: "Mat", chapters: 28 },
      { id: "mrk", name: "Mark", abbreviation: "Mrk", chapters: 16 },
      { id: "luk", name: "Luke", abbreviation: "Luk", chapters: 24 },
      { id: "jhn", name: "John", abbreviation: "Jhn", chapters: 21 },
      { id: "act", name: "Acts", abbreviation: "Act", chapters: 28 },
      { id: "rom", name: "Romans", abbreviation: "Rom", chapters: 16 },
      { id: "1co", name: "1 Corinthians", abbreviation: "1Co", chapters: 16 },
      { id: "2co", name: "2 Corinthians", abbreviation: "2Co", chapters: 13 },
      { id: "gal", name: "Galatians", abbreviation: "Gal", chapters: 6 },
      { id: "eph", name: "Ephesians", abbreviation: "Eph", chapters: 6 },
      { id: "php", name: "Philippians", abbreviation: "Php", chapters: 4 },
      { id: "col", name: "Colossians", abbreviation: "Col", chapters: 4 },
      { id: "1th", name: "1 Thessalonians", abbreviation: "1Th", chapters: 5 },
      { id: "2th", name: "2 Thessalonians", abbreviation: "2Th", chapters: 3 },
      { id: "1ti", name: "1 Timothy", abbreviation: "1Ti", chapters: 6 },
      { id: "2ti", name: "2 Timothy", abbreviation: "2Ti", chapters: 4 },
      { id: "tit", name: "Titus", abbreviation: "Tit", chapters: 3 },
      { id: "phm", name: "Philemon", abbreviation: "Phm", chapters: 1 },
      { id: "heb", name: "Hebrews", abbreviation: "Heb", chapters: 13 },
      { id: "jas", name: "James", abbreviation: "Jas", chapters: 5 },
      { id: "1pe", name: "1 Peter", abbreviation: "1Pe", chapters: 5 },
      { id: "2pe", name: "2 Peter", abbreviation: "2Pe", chapters: 3 },
      { id: "1jn", name: "1 John", abbreviation: "1Jn", chapters: 5 },
      { id: "2jn", name: "2 John", abbreviation: "2Jn", chapters: 1 },
      { id: "3jn", name: "3 John", abbreviation: "3Jn", chapters: 1 },
      { id: "jud", name: "Jude", abbreviation: "Jud", chapters: 1 },
      { id: "rev", name: "Revelation", abbreviation: "Rev", chapters: 22 },
    ];
  }

  // Convert book names to API abbreviations
  static getBookAbbreviation(bookName) {
    const bookMap = {
      Genesis: "gen",
      Exodus: "exo",
      Leviticus: "lev",
      Numbers: "num",
      Deuteronomy: "deu",
      Joshua: "jos",
      Judges: "jdg",
      Ruth: "rut",
      "1 Samuel": "1sa",
      "2 Samuel": "2sa",
      "1 Kings": "1ki",
      "2 Kings": "2ki",
      "1 Chronicles": "1ch",
      "2 Chronicles": "2ch",
      Ezra: "ezr",
      Nehemiah: "neh",
      Esther: "est",
      Job: "job",
      Psalms: "psa",
      Proverbs: "pro",
      Ecclesiastes: "ecc",
      "Song of Solomon": "sng",
      Isaiah: "isa",
      Jeremiah: "jer",
      Lamentations: "lam",
      Ezekiel: "ezk",
      Daniel: "dan",
      Hosea: "hos",
      Joel: "jol",
      Amos: "amo",
      Obadiah: "oba",
      Jonah: "jnh",
      Micah: "mic",
      Nahum: "nam",
      Habakkuk: "hab",
      Zephaniah: "zep",
      Haggai: "hag",
      Zechariah: "zec",
      Malachi: "mal",
      Matthew: "mat",
      Mark: "mrk",
      Luke: "luk",
      John: "jhn",
      Acts: "act",
      Romans: "rom",
      "1 Corinthians": "1co",
      "2 Corinthians": "2co",
      Galatians: "gal",
      Ephesians: "eph",
      Philippians: "php",
      Colossians: "col",
      "1 Thessalonians": "1th",
      "2 Thessalonians": "2th",
      "1 Timothy": "1ti",
      "2 Timothy": "2ti",
      Titus: "tit",
      Philemon: "phm",
      Hebrews: "heb",
      James: "jas",
      "1 Peter": "1pe",
      "2 Peter": "2pe",
      "1 John": "1jn",
      "2 John": "2jn",
      "3 John": "3jn",
      Jude: "jud",
      Revelation: "rev",
    };

    return bookMap[bookName] || bookName.toLowerCase().substring(0, 3);
  }

  // Sample Bible text for demonstration (fallback)
  static getSampleBibleText(book, chapter, translationId) {
    const sampleTexts = {
      Genesis: {
        1: {
          "de4e12af7f28f599-02": [
            // KJV
            {
              verse: 1,
              text: "In the beginning God created the heaven and the earth.",
            },
            {
              verse: 2,
              text: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.",
            },
            {
              verse: 3,
              text: "And God said, Let there be light: and there was light.",
            },
            {
              verse: 4,
              text: "And God saw the light, that it was good: and God divided the light from the darkness.",
            },
            {
              verse: 5,
              text: "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.",
            },
            {
              verse: 6,
              text: "And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.",
            },
            {
              verse: 7,
              text: "And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.",
            },
            {
              verse: 8,
              text: "And God called the firmament Heaven. And the evening and the morning were the second day.",
            },
            {
              verse: 9,
              text: "And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.",
            },
            {
              verse: 10,
              text: "And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.",
            },
          ],
          "65eec8e0b60e656b-01": [
            // NIV
            {
              verse: 1,
              text: "In the beginning God created the heavens and the earth.",
            },
            {
              verse: 2,
              text: "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.",
            },
            {
              verse: 3,
              text: 'And God said, "Let there be light," and there was light.',
            },
            {
              verse: 4,
              text: "God saw that the light was good, and he separated the light from the darkness.",
            },
            {
              verse: 5,
              text: 'God called the light "day," and the darkness he called "night." And there was evening, and there was morning—the first day.',
            },
            {
              verse: 6,
              text: 'And God said, "Let there be a vault between the waters to separate water from water."',
            },
            {
              verse: 7,
              text: "So God made the vault and separated the water under the vault from the water above it. And it was so.",
            },
            {
              verse: 8,
              text: 'God called the vault "sky." And there was evening, and there was morning—the second day.',
            },
            {
              verse: 9,
              text: 'And God said, "Let the water under the sky be gathered to one place, and let dry ground appear." And it was so.',
            },
            {
              verse: 10,
              text: 'God called the dry ground "land," and the gathered waters he called "seas." And God saw that it was good.',
            },
          ],
          "f421fe261da7624f-01": [
            // ESV
            {
              verse: 1,
              text: "In the beginning, God created the heavens and the earth.",
            },
            {
              verse: 2,
              text: "The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters.",
            },
            {
              verse: 3,
              text: 'And God said, "Let there be light," and there was light.',
            },
            {
              verse: 4,
              text: "And God saw that the light was good. And God separated the light from the darkness.",
            },
            {
              verse: 5,
              text: "God called the light Day, and the darkness he called Night. And there was evening and there was morning, the first day.",
            },
            {
              verse: 6,
              text: 'And God said, "Let there be an expanse in the midst of the waters, and let it separate the waters from the waters."',
            },
            {
              verse: 7,
              text: "And God made the expanse and separated the waters that were under the expanse from the waters that were above the expanse. And it was so.",
            },
            {
              verse: 8,
              text: "And God called the expanse Heaven. And there was evening and there was morning, the second day.",
            },
            {
              verse: 9,
              text: 'And God said, "Let the waters under the heavens be gathered together into one place, and let the dry land appear." And it was so.',
            },
            {
              verse: 10,
              text: "God called the dry land Earth, and the waters that were gathered together he called Seas. And God saw that it was good.",
            },
          ],
        },
        2: {
          "de4e12af7f28f599-02": [
            // KJV
            {
              verse: 1,
              text: "Thus the heavens and the earth were finished, and all the host of them.",
            },
            {
              verse: 2,
              text: "And on the seventh day God ended his work which he had made; and he rested on the seventh day from all his work which he had made.",
            },
            {
              verse: 3,
              text: "And God blessed the seventh day, and sanctified it: because that in it he had rested from all his work which God created and made.",
            },
            {
              verse: 4,
              text: "These are the generations of the heavens and of the earth when they were created, in the day that the LORD God made the earth and the heavens.",
            },
            {
              verse: 5,
              text: "And every plant of the field before it was in the earth, and every herb of the field before it grew: for the LORD God had not caused it to rain upon the earth, and there was not a man to till the ground.",
            },
          ],
        },
      },
      John: {
        3: {
          "de4e12af7f28f599-02": [
            // KJV
            {
              verse: 16,
              text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
            },
            {
              verse: 17,
              text: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved.",
            },
            {
              verse: 18,
              text: "He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.",
            },
            {
              verse: 19,
              text: "And this is the condemnation, that light is come into the world, and men loved darkness rather than light, because their deeds were evil.",
            },
            {
              verse: 20,
              text: "For every one that doeth evil hateth the light, neither cometh to the light, lest his deeds should be reproved.",
            },
          ],
          "65eec8e0b60e656b-01": [
            // NIV
            {
              verse: 16,
              text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
            },
            {
              verse: 17,
              text: "For God did not send his Son into the world to condemn the world, but to save the world through him.",
            },
            {
              verse: 18,
              text: "Whoever believes in him is not condemned, but whoever does not believe stands condemned already because they have not believed in the name of God's one and only Son.",
            },
            {
              verse: 19,
              text: "This is the verdict: Light has come into the world, but people loved darkness instead of light because their deeds were evil.",
            },
            {
              verse: 20,
              text: "Everyone who does evil hates the light, and will not come into the light for fear that their deeds will be exposed.",
            },
          ],
        },
      },
      Psalms: {
        23: {
          "de4e12af7f28f599-02": [
            // KJV
            { verse: 1, text: "The LORD is my shepherd; I shall not want." },
            {
              verse: 2,
              text: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
            },
            {
              verse: 3,
              text: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.",
            },
            {
              verse: 4,
              text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.",
            },
            {
              verse: 5,
              text: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.",
            },
            {
              verse: 6,
              text: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.",
            },
          ],
          "65eec8e0b60e656b-01": [
            // NIV
            { verse: 1, text: "The LORD is my shepherd, I lack nothing." },
            {
              verse: 2,
              text: "He makes me lie down in green pastures, he leads me beside quiet waters.",
            },
            {
              verse: 3,
              text: "He refreshes my soul. He guides me along the right paths for his name's sake.",
            },
            {
              verse: 4,
              text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
            },
            {
              verse: 5,
              text: "You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.",
            },
            {
              verse: 6,
              text: "Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the LORD forever.",
            },
          ],
        },
      },
      Matthew: {
        5: {
          "de4e12af7f28f599-02": [
            // KJV
            {
              verse: 3,
              text: "Blessed are the poor in spirit: for theirs is the kingdom of heaven.",
            },
            {
              verse: 4,
              text: "Blessed are they that mourn: for they shall be comforted.",
            },
            {
              verse: 5,
              text: "Blessed are the meek: for they shall inherit the earth.",
            },
            {
              verse: 6,
              text: "Blessed are they which do hunger and thirst after righteousness: for they shall be filled.",
            },
            {
              verse: 7,
              text: "Blessed are the merciful: for they shall obtain mercy.",
            },
            {
              verse: 8,
              text: "Blessed are the pure in heart: for they shall see God.",
            },
            {
              verse: 9,
              text: "Blessed are the peacemakers: for they shall be called the children of God.",
            },
            {
              verse: 10,
              text: "Blessed are they which are persecuted for righteousness' sake: for theirs is the kingdom of heaven.",
            },
          ],
          "65eec8e0b60e656b-01": [
            // NIV
            {
              verse: 3,
              text: "Blessed are the poor in spirit, for theirs is the kingdom of heaven.",
            },
            {
              verse: 4,
              text: "Blessed are those who mourn, for they will be comforted.",
            },
            {
              verse: 5,
              text: "Blessed are the meek, for they will inherit the earth.",
            },
            {
              verse: 6,
              text: "Blessed are those who hunger and thirst for righteousness, for they will be filled.",
            },
            {
              verse: 7,
              text: "Blessed are the merciful, for they will be shown mercy.",
            },
            {
              verse: 8,
              text: "Blessed are the pure in heart, for they will see God.",
            },
            {
              verse: 9,
              text: "Blessed are the peacemakers, for they will be called children of God.",
            },
            {
              verse: 10,
              text: "Blessed are those who are persecuted because of righteousness, for theirs is the kingdom of heaven.",
            },
          ],
        },
      },
    };

    return new Promise((resolve) => {
      setTimeout(() => {
        const bookData = sampleTexts[book];
        if (bookData && bookData[chapter] && bookData[chapter][translationId]) {
          resolve({
            success: true,
            data: {
              book: book,
              chapter: chapter,
              translation: translationId,
              verses: bookData[chapter][translationId],
            },
          });
        } else {
          resolve({
            success: false,
            message: `Sample text not available for ${book} Chapter ${chapter} in this translation. Get a free API key from https://scripture.api.bible/ for the complete Bible.`,
          });
        }
      }, 500); // Simulate API delay
    });
  }
}

export default BibleAPI;
