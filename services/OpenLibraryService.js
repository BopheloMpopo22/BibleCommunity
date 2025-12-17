/**
 * Open Library API Service
 * Fetches book data from Open Library API (free, open-source alternative to Google Books)
 */

const OPEN_LIBRARY_SEARCH_BASE = "https://openlibrary.org/search.json";
const OPEN_LIBRARY_COVERS_BASE = "https://covers.openlibrary.org/b";

class OpenLibraryService {
  /**
   * Search for Christian books
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results to return (default: 20)
   * @param {number} startIndex - Starting index for pagination
   * @param {number} minYear - Minimum year filter (optional)
   * @returns {Promise<Array>} Array of book objects
   */
  static async searchChristianBooks(
    query = "",
    maxResults = 20,
    startIndex = 0,
    minYear = null
  ) {
    try {
      // Build search query - be more specific for Christian books
      let searchQuery;
      if (query && query.trim()) {
        searchQuery = `${query} Christian religion`;
      } else {
        // Use subject search for better Christian book results
        searchQuery = "subject:Christian OR subject:Religion OR subject:Bible";
      }
      
      // Open Library uses offset for pagination (not startIndex)
      const offset = startIndex;
      const limit = Math.min(maxResults * 2, 100); // Open Library allows up to 100 per request
      
      const url = `${OPEN_LIBRARY_SEARCH_BASE}?q=${encodeURIComponent(
        searchQuery
      )}&limit=${limit}&offset=${offset}&fields=key,title,author_name,first_publish_year,isbn,cover_i,language,subject,number_of_pages_median`;

      console.log("[OpenLibrary] Fetching:", url);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error("[OpenLibrary] API Error:", response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();

      if (!data.docs || data.docs.length === 0) {
        console.warn("[OpenLibrary] No books found");
        return [];
      }

      console.log("[OpenLibrary] Found", data.numFound, "total books, returning", data.docs.length);

      // Transform Open Library data to our format
      let books = data.docs.map((doc) => this.transformBookData(doc));
      
      // Apply strict Christian filtering
      books = OpenLibraryService.filterChristianBooks(books);
      
      // Filter by year if specified
      if (minYear) {
        books = books.filter((book) => {
          if (!book.publishedDate) return false;
          try {
            const year = new Date(book.publishedDate).getFullYear();
            const maxYear = new Date().getFullYear() + 1;
            return year >= minYear && year <= maxYear;
          } catch {
            return false;
          }
        });
      }

      // Sort by published date (newest first)
      books.sort((a, b) => {
        try {
          const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
          const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
          return dateB - dateA; // Newest first
        } catch {
          return 0;
        }
      });

      return books.slice(0, maxResults);
    } catch (error) {
      console.error("[OpenLibrary] Error searching books:", error);
      return [];
    }
  }

  /**
   * Search books by specific query
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Array>} Array of book objects
   */
  static async searchBooks(query, maxResults = 20) {
    try {
      const limit = Math.min(maxResults * 2, 100);
      const url = `${OPEN_LIBRARY_SEARCH_BASE}?q=${encodeURIComponent(
        query
      )}&limit=${limit}&fields=key,title,author_name,first_publish_year,isbn,cover_i,language,subject,number_of_pages_median`;

      const response = await fetch(url);
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();

      if (!data.docs || data.docs.length === 0) {
        return [];
      }

      let books = data.docs.map((doc) => this.transformBookData(doc));
      
      // Apply strict Christian filtering for search results too
      books = this.filterChristianBooks(books);
      
      // Sort by date (newest first)
      books.sort((a, b) => {
        try {
          const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
          const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
          return dateB - dateA;
        } catch {
          return 0;
        }
      });

      return books.slice(0, maxResults);
    } catch (error) {
      console.error("[OpenLibrary] Error searching books:", error);
      return [];
    }
  }

  /**
   * Filter books to only include Christian books (strict filtering)
   * Uses Open Library's subject metadata to distinguish Christian books
   * @param {Array} books - Array of book objects
   * @returns {Array} Filtered array of Christian books
   */
  static filterChristianBooks(books) {
    return books.filter((book) => {
      const subjects = book.categories || [];
      const subjectLower = subjects.join(" ").toLowerCase();
      const titleLower = (book.title || "").toLowerCase();
      const authorLower = (book.author || "").toLowerCase();
      const allText = `${subjectLower} ${titleLower} ${authorLower}`.toLowerCase();
      
      // STRICT: Must have Christian-related SUBJECTS (Open Library metadata)
      const christianSubjects = [
        "christian", "christianity", "christian theology", "christian life",
        "christian living", "christian devotion", "christian devotionals",
        "bible", "biblical", "biblical studies", "bible study",
        "theology", "theological", "systematic theology",
        "religion", "religious", "religious life",
        "faith", "spiritual life", "spirituality",
        "church", "church history", "church life",
        "jesus christ", "christ", "gospel", "gospels",
        "prayer", "devotional", "devotionals",
        "catholic", "catholicism", "protestant", "protestantism",
        "evangelical", "evangelicalism", "worship",
        "missionary", "missions", "evangelism"
      ];
      
      // Check if subjects contain Christian keywords (REQUIRED - this is the distinguishing factor)
      const hasChristianSubject = christianSubjects.some(keyword => 
        subjectLower.includes(keyword)
      );
      
      // If no Christian subject, require strong indicators in title/author
      if (!hasChristianSubject) {
        const strongChristianKeywords = [
          "bible", "biblical", "gospel", "jesus", "christ", 
          "prayer", "devotional", "theology", "church"
        ];
        const hasStrongKeyword = strongChristianKeywords.some(keyword => 
          titleLower.includes(keyword)
        );
        
        if (!hasStrongKeyword) return false;
        
        // Require known Christian author OR multiple Christian words in title
        const christianAuthorIndicators = [
          "lewis", "tozer", "spurgeon", "piper", "keller", "chambers",
          "bonhoeffer", "schaeffer", "warren", "maxwell", "lucado"
        ];
        const hasChristianAuthor = christianAuthorIndicators.some(indicator =>
          authorLower.includes(indicator)
        );
        
        if (!hasChristianAuthor) {
          const christianWordCount = strongChristianKeywords.filter(keyword => 
            titleLower.includes(keyword)
          ).length;
          if (christianWordCount < 2) return false;
        }
      }
      
      // Exclude known non-Christian books by title (expanded list)
      const excludeKeywords = [
        "life of pi", "far from the madding crowd", "das kapital", "kapital",
        "salome", "jungle book", "ugly duckling", "night before christmas",
        "handmaid's tale", "handmaids tale", "hitchhiker's guide", "hitchhikers guide",
        "galaxy", "dystopian", "science fiction", "sci-fi"
      ];
      
      if (excludeKeywords.some(keyword => allText.includes(keyword))) return false;
      
      // STRICT: If subjects include fiction/literature without Christian subjects, exclude
      const fictionSubjects = ["fiction", "novel", "literature", "science fiction", "fantasy", "dystopian"];
      const hasFictionSubject = fictionSubjects.some(keyword => subjectLower.includes(keyword));
      if (hasFictionSubject && !hasChristianSubject) return false;
      
      // Exclude if subjects are purely non-Christian (unless also has Christian subject)
      const nonChristianSubjects = [
        "fiction", "novel", "literature", "poetry", "drama", "theater",
        "philosophy", "economics", "politics", "history", "science",
        "mathematics", "physics", "chemistry", "biology"
      ];
      const hasNonChristianSubject = nonChristianSubjects.some(keyword =>
        subjectLower.includes(keyword) && !subjectLower.includes("christian")
      );
      if (hasNonChristianSubject) return false;
      
      return true;
    });
  }

  /**
   * Transform Open Library API data to our format
   * @param {Object} doc - Open Library document
   * @returns {Object} Transformed book object
   */
  static transformBookData(doc) {
    // Extract ISBN (prefer ISBN 13, fallback to ISBN 10)
    const isbn = doc.isbn?.[0] || doc.isbn?.[1] || "";
    
    // Build cover image URL
    let coverImage = null;
    if (doc.cover_i) {
      coverImage = `${OPEN_LIBRARY_COVERS_BASE}/id/${doc.cover_i}-L.jpg`;
    } else if (isbn) {
      // Try to get cover by ISBN
      coverImage = `${OPEN_LIBRARY_COVERS_BASE}/isbn/${isbn}-L.jpg`;
    }

    // Format published date
    let publishedDate = "";
    if (doc.first_publish_year) {
      publishedDate = `${doc.first_publish_year}-01-01`;
    }

    return {
      id: doc.key || doc.isbn?.[0] || `ol-${Math.random()}`,
      title: doc.title || "Unknown Title",
      authors: doc.author_name || ["Unknown Author"],
      author: doc.author_name?.[0] || "Unknown Author",
      description: "", // Open Library search doesn't include description
      isbn: isbn,
      isbn10: doc.isbn?.find((isbn) => isbn.length === 10) || "",
      coverImage: coverImage,
      largeCoverImage: coverImage, // Open Library uses same URL for large covers
      categories: doc.subject || [],
      publishedDate: publishedDate,
      publisher: "", // Not available in search results
      pageCount: doc.number_of_pages_median || 0,
      language: doc.language?.[0] || "en",
      previewLink: doc.key ? `https://openlibrary.org${doc.key}` : "",
      infoLink: doc.key ? `https://openlibrary.org${doc.key}` : "",
      buyLink: null,
      saleability: "NOT_FOR_SALE",
      listPrice: null,
      retailPrice: null,
      source: "openlibrary", // Track source
    };
  }

  /**
   * Get book details by work key
   * @param {string} workKey - Open Library work key (e.g., "/works/OL123456W")
   * @returns {Promise<Object|null>} Book object or null
   */
  static async getBookDetails(workKey) {
    try {
      const url = `https://openlibrary.org${workKey}.json`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      // Transform to our format
      return {
        id: workKey,
        title: data.title || "Unknown Title",
        description: data.description?.value || data.description || "",
        // Add more fields as needed
      };
    } catch (error) {
      console.error("[OpenLibrary] Error fetching book details:", error);
      return null;
    }
  }
}

export default OpenLibraryService;

