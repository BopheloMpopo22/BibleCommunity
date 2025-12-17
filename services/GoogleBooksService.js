/**
 * Google Books API Service
 * Fetches book data from Google Books API
 */

const GOOGLE_BOOKS_API_BASE = "https://www.googleapis.com/books/v1/volumes";

class GoogleBooksService {
  /**
   * Search for Christian books
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results to return (default: 20)
   * @returns {Promise<Array>} Array of book objects
   */
  static async searchChristianBooks(
    query = "",
    maxResults = 20,
    startIndex = 0,
    minYear = null
  ) {
    try {
      // Only filter by year if explicitly specified (null means show all books)
      const filterYear = minYear; // null = show all books, just sorted by date
      
      // Build search query - prioritize newer books
      let searchQuery;
      if (query && query.trim()) {
        searchQuery = `${query} Christian`;
      } else {
        // Search for Christian books, prioritizing recent ones
        searchQuery = "Christian";
      }

      // Google Books API doesn't reliably support "after:" filter syntax
      // So we'll search without it and filter client-side
      // Google Books API has a max limit of 40 items per request
      const API_MAX_RESULTS = 40;
      let allBooks = [];
      let currentStartIndex = startIndex;
      const maxAttempts = 5; // Limit API calls to prevent infinite loops
      let attempts = 0;
      
      // Keep fetching until we have enough books
      // When no year filter, we still want to get enough books to show
      // But we don't need to be as aggressive since we're not filtering by year
      while (allBooks.length < maxResults && attempts < maxAttempts) {
        const requestSize = API_MAX_RESULTS;
        let url = `${GOOGLE_BOOKS_API_BASE}?q=${encodeURIComponent(
          searchQuery
        )}&maxResults=${requestSize}&startIndex=${currentStartIndex}&langRestrict=en&orderBy=newest`;

        console.log("[GoogleBooks] Fetching (attempt", attempts + 1, "):", url);
        let response = await fetch(url);
        let data = null;
        
        // Check if response is OK
        if (response.ok) {
          data = await response.json();
          console.log("[GoogleBooks] Response:", data?.totalItems || 0, "items found");
        } else {
          // Silently handle rate limits (429) and service unavailable (503) - don't log errors
          if (response.status === 429 || response.status === 503) {
            // Rate limited or service unavailable - stop trying
            break;
          }
          
          const errorText = await response.text();
          console.error("[GoogleBooks] API Error:", response.status, response.statusText);
          
          // Try fallback query (only if not rate limited)
          const fallbackUrl = `${GOOGLE_BOOKS_API_BASE}?q=${encodeURIComponent(
            "Christian books"
          )}&maxResults=${requestSize}&startIndex=${currentStartIndex}&langRestrict=en&orderBy=newest`;
          console.log("[GoogleBooks] Trying fallback query:", fallbackUrl);
          response = await fetch(fallbackUrl);
          if (response.ok) {
            data = await response.json();
            console.log("[GoogleBooks] Fallback successful:", data?.totalItems || 0, "items found");
          } else {
            if (response.status !== 429 && response.status !== 503) {
              // Only log other errors
              console.error("[GoogleBooks] Fallback also failed:", response.status);
            }
            break; // Stop trying if both fail
          }
        }
        
        // Check if we have data and items
        if (!data || !data.items || data.items.length === 0) {
          console.warn("[GoogleBooks] No more items available");
          break; // No more books available
        }
        
        console.log("[GoogleBooks] Successfully received", data.items.length, "items from API");

        // Transform Google Books API response to our format
        let books = data.items.map((item) => this.transformBookData(item));
        
        // Filter by year only if specified, otherwise include all books
        // Books without dates are included but will be sorted last
        const filteredBooks = books.filter((book) => {
          // If no publishedDate, include it (will be sorted last)
          if (!book.publishedDate) {
            return !filterYear; // Only include if no year filter
          }
          
          try {
            const date = new Date(book.publishedDate);
            if (isNaN(date.getTime())) {
              return !filterYear; // Include if no year filter
            }
            
            const year = date.getFullYear();
            const maxYear = new Date().getFullYear() + 1;
            
            // If filterYear is specified, filter by it; otherwise include all valid books
            if (filterYear) {
              return year >= filterYear && year <= maxYear;
            } else {
              // Include all books with valid dates (just cap at future years)
              return year <= maxYear;
            }
          } catch {
            return !filterYear; // Include if no year filter
          }
        });

        // Add filtered books to our collection
        allBooks.push(...filteredBooks);
        
        // Move to next page
        currentStartIndex += data.items.length;
        attempts++;
        
        // If we got fewer items than requested, we've reached the end
        if (data.items.length < requestSize) {
          break;
        }
        
        // If no year filter and we have enough books, we can stop
        // (pagination will handle loading more)
        if (!filterYear && allBooks.length >= maxResults) {
          break;
        }
      }

      // Sort by published date (newest first) - ensure proper sorting
      // Books without dates go to the end
      allBooks.sort((a, b) => {
        // If book A has no date, put it after B
        if (!a.publishedDate) {
          return 1;
        }
        // If book B has no date, put it after A
        if (!b.publishedDate) {
          return -1;
        }
        
        try {
          const dateA = new Date(a.publishedDate).getTime();
          const dateB = new Date(b.publishedDate).getTime();
          
          // If either date is invalid, put it after valid dates
          if (isNaN(dateA)) return 1;
          if (isNaN(dateB)) return -1;
          
          return dateB - dateA; // Newest first
        } catch {
          // If error parsing dates, maintain order
          return 0;
        }
      });

      // Return only the requested number of results
      const result = allBooks.slice(0, maxResults);
      
      console.log("[GoogleBooks] Transformed", result.length, "books (from", attempts, "API calls)");
      
      // Return result with metadata about whether more books are available
      // We consider more books available if:
      // 1. We got the full requested amount, OR
      // 2. We made multiple API calls (meaning there were more to fetch)
      const hasMore = result.length >= maxResults || attempts > 1;
      
      return result;
    } catch (error) {
      console.error("[GoogleBooks] Error searching books:", error);
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
      // Don't use "after:" syntax - search normally and filter client-side
      // Google Books API max is 40 items per request
      const API_MAX_RESULTS = 40;
      const requestSize = Math.min(maxResults * 2, API_MAX_RESULTS);
      const url = `${GOOGLE_BOOKS_API_BASE}?q=${encodeURIComponent(
        query
      )}&maxResults=${requestSize}&langRestrict=en&orderBy=newest`;

      const response = await fetch(url);
      if (!response.ok) {
        // Silently handle rate limits (429) and service unavailable (503) - don't log errors
        if (response.status !== 429 && response.status !== 503) {
          // Only log other errors
          console.error("[GoogleBooks] Search error:", response.status);
        }
        return [];
      }
      
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return [];
      }

      let books = data.items.map((item) => this.transformBookData(item));
      
      // Filter and sort by date (prioritize recent books)
      books = books.filter((book) => {
        if (!book.publishedDate) return false;
        try {
          const date = new Date(book.publishedDate);
          if (isNaN(date.getTime())) return false;
          const year = date.getFullYear();
          return year >= 2010 && year <= new Date().getFullYear() + 1;
        } catch {
          return false;
        }
      });

      // Sort by date (newest first)
      books.sort((a, b) => {
        try {
          const dateA = new Date(a.publishedDate).getTime();
          const dateB = new Date(b.publishedDate).getTime();
          return dateB - dateA;
        } catch {
          return 0;
        }
      });

      return books.slice(0, maxResults);
    } catch (error) {
      console.error("[GoogleBooks] Error searching books:", error);
      return [];
    }
  }

  /**
   * Get book by ISBN
   * @param {string} isbn - ISBN number
   * @returns {Promise<Object|null>} Book object or null
   */
  static async getBookByISBN(isbn) {
    try {
      const url = `${GOOGLE_BOOKS_API_BASE}?q=isbn:${isbn}`;

      const response = await fetch(url);
      
      // Silently handle rate limits (429) and service unavailable (503) - return null without logging
      if (!response.ok) {
        if (response.status !== 429 && response.status !== 503) {
          // Only log other errors
          console.error("[GoogleBooks] Error fetching book by ISBN:", response.status);
        }
        return null;
      }
      
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return null;
      }

      return this.transformBookData(data.items[0]);
    } catch (error) {
      // Silently handle errors - don't log
      return null;
    }
  }

  /**
   * Transform Google Books API data to our format
   * @param {Object} item - Google Books API item
   * @returns {Object} Transformed book object
   */
  static transformBookData(item) {
    const volumeInfo = item.volumeInfo || {};
    const saleInfo = item.saleInfo || {};

    // Extract ISBN
    const isbn13 =
      volumeInfo.industryIdentifiers?.find((id) => id.type === "ISBN_13")
        ?.identifier ||
      volumeInfo.industryIdentifiers?.find((id) => id.type === "ISBN_10")
        ?.identifier ||
      "";

    return {
      id: item.id,
      title: volumeInfo.title || "Unknown Title",
      authors: volumeInfo.authors || ["Unknown Author"],
      author: volumeInfo.authors?.[0] || "Unknown Author",
      description: volumeInfo.description || "",
      isbn: isbn13,
      isbn10: volumeInfo.industryIdentifiers?.find(
        (id) => id.type === "ISBN_10"
      )?.identifier,
      coverImage:
        volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") ||
        volumeInfo.imageLinks?.smallThumbnail?.replace("http://", "https://") ||
        null,
      largeCoverImage:
        volumeInfo.imageLinks?.large?.replace("http://", "https://") ||
        volumeInfo.imageLinks?.medium?.replace("http://", "https://") ||
        volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") ||
        null,
      categories: volumeInfo.categories || [],
      publishedDate: volumeInfo.publishedDate || "",
      publisher: volumeInfo.publisher || "",
      pageCount: volumeInfo.pageCount || 0,
      language: volumeInfo.language || "en",
      previewLink: volumeInfo.previewLink || "",
      infoLink: volumeInfo.infoLink || "",
      buyLink: saleInfo.buyLink || null,
      saleability: saleInfo.saleability || "NOT_FOR_SALE",
      listPrice: saleInfo.listPrice || null,
      retailPrice: saleInfo.retailPrice || null,
    };
  }

  /**
   * Get featured Christian books (popular/devotional)
   * @returns {Promise<Array>} Array of featured books
   */
  static async getFeaturedBooks() {
    const featuredQueries = [
      "Christian devotionals",
      "Christian living",
      "Bible study",
      "Christian theology",
    ];

    try {
      const allBooks = [];
      for (const query of featuredQueries) {
        const books = await this.searchBooks(query, 5);
        allBooks.push(...books);
      }

      // Remove duplicates based on ISBN or title
      const uniqueBooks = [];
      const seenIDs = new Set();

      for (const book of allBooks) {
        const id = book.isbn || book.id || book.title;
        if (id && !seenIDs.has(id)) {
          seenIDs.add(id);
          uniqueBooks.push(book);
        }
      }

      console.log("[GoogleBooks] Featured books:", uniqueBooks.length);
      return uniqueBooks.slice(0, 10); // Return top 10 featured
    } catch (error) {
      console.error("[GoogleBooks] Error fetching featured books:", error);
      return [];
    }
  }
}

export default GoogleBooksService;

