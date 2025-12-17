/**
 * ISBNdb API Service
 * Fetches book metadata from ISBNdb API
 * Free tier: 500 requests/day
 * 
 * Get API key: https://isbndb.com/
 */

const ISBNDB_API_BASE = "https://api.isbndb.com";

class ISBNdbService {
  // API Key - set this in your environment or config
  static API_KEY = null; // Set via setApiKey() method

  /**
   * Set the ISBNdb API key
   * @param {string} apiKey - Your ISBNdb API key
   */
  static setApiKey(apiKey) {
    this.API_KEY = apiKey;
    console.log("[ISBNdb] API key set");
  }

  /**
   * Check if API key is configured
   * @returns {boolean}
   */
  static isConfigured() {
    return this.API_KEY !== null && this.API_KEY !== "";
  }

  /**
   * Get book by ISBN
   * @param {string} isbn - ISBN-13 or ISBN-10
   * @returns {Promise<Object|null>} Book object or null
   */
  static async getBookByISBN(isbn) {
    if (!this.isConfigured()) {
      console.warn("[ISBNdb] API key not configured");
      return null;
    }

    try {
      // Remove any dashes or spaces from ISBN
      const cleanISBN = isbn.replace(/[-\s]/g, "");

      const url = `${ISBNDB_API_BASE}/book/${cleanISBN}`;
      
      console.log("[ISBNdb] Fetching book:", cleanISBN);
      
      const response = await fetch(url, {
        headers: {
          "Authorization": this.API_KEY,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log("[ISBNdb] Book not found:", cleanISBN);
          return null;
        }
        console.error("[ISBNdb] API Error:", response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (!data.book) {
        return null;
      }

      return this.transformBookData(data.book);
    } catch (error) {
      console.error("[ISBNdb] Error fetching book:", error);
      return null;
    }
  }

  /**
   * Search books
   * @param {string} query - Search query (title, author, etc.)
   * @param {number} maxResults - Maximum results to return
   * @returns {Promise<Array>} Array of book objects
   */
  static async searchBooks(query, maxResults = 20) {
    if (!this.isConfigured()) {
      console.warn("[ISBNdb] API key not configured");
      return [];
    }

    try {
      const url = `${ISBNDB_API_BASE}/books/${encodeURIComponent(query)}?page=1&pageSize=${Math.min(maxResults, 100)}`;
      
      console.log("[ISBNdb] Searching:", query);
      
      const response = await fetch(url, {
        headers: {
          "Authorization": this.API_KEY,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("[ISBNdb] Search Error:", response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      
      if (!data.books || data.books.length === 0) {
        return [];
      }

      return data.books.map((book) => this.transformBookData(book));
    } catch (error) {
      console.error("[ISBNdb] Error searching books:", error);
      return [];
    }
  }

  /**
   * Transform ISBNdb API data to our format
   * @param {Object} book - ISBNdb book object
   * @returns {Object} Transformed book object
   */
  static transformBookData(book) {
    return {
      id: book.isbn13 || book.isbn || `isbndb-${book.isbn13 || book.isbn || Math.random()}`,
      title: book.title || "Unknown Title",
      authors: book.authors ? book.authors.split(",").map(a => a.trim()) : ["Unknown Author"],
      author: book.authors ? book.authors.split(",")[0].trim() : "Unknown Author",
      description: book.synopsis || book.overview || "",
      isbn: book.isbn13 || book.isbn || "",
      isbn10: book.isbn10 || "",
      coverImage: book.image || book.thumbnail || null,
      largeCoverImage: book.image || book.thumbnail || null,
      categories: book.subjects ? book.subjects.split(",").map(s => s.trim()) : [],
      publishedDate: book.date_published || book.publish_date || "",
      publisher: book.publisher || "",
      pageCount: book.pages || 0,
      language: book.language || "en",
      previewLink: book.preview || "",
      infoLink: book.url || "",
      buyLink: null,
      saleability: "NOT_FOR_SALE",
      listPrice: book.msrp ? { amount: book.msrp, currencyCode: "USD" } : null,
      retailPrice: book.msrp ? { amount: book.msrp, currencyCode: "USD" } : null,
      source: "isbndb",
    };
  }

  /**
   * Get multiple books by ISBNs (batch lookup)
   * @param {Array<string>} isbns - Array of ISBNs
   * @returns {Promise<Array>} Array of book objects
   */
  static async getBooksByISBNs(isbns) {
    if (!this.isConfigured()) {
      return [];
    }

    // ISBNdb doesn't support batch lookup, so we'll do sequential requests
    // But limit to avoid rate limits
    const results = await Promise.all(
      isbns.slice(0, 10).map(isbn => this.getBookByISBN(isbn))
    );

    return results.filter(book => book !== null);
  }
}

export default ISBNdbService;


