/**
 * Curated Book Service
 * Fetches metadata for curated Christian books using Google Books API
 * This ensures 100% accuracy - only verified Christian books
 */

import { CURATED_CHRISTIAN_BOOKS, searchCuratedBooks } from "../data/curatedChristianBooks";
import GoogleBooksService from "./GoogleBooksService";
import ISBNdbService from "./ISBNdbService";

class CuratedBookService {
  /**
   * Get all curated books with metadata
   * @param {number} maxResults - Maximum results to return
   * @param {number} startIndex - Starting index for pagination
   * @param {number} minYear - Minimum year filter (optional)
   * @returns {Promise<Array>} Array of book objects with metadata
   */
  static async getCuratedBooks(maxResults = 30, startIndex = 0, minYear = null) {
    try {
      // Get curated books for this page
      const curatedList = CURATED_CHRISTIAN_BOOKS.slice(startIndex, startIndex + maxResults);
      
      console.log("[CuratedBooks] Fetching metadata for", curatedList.length, "curated books");
      
      // Fetch metadata for each book using Google Books API
      // Process in batches with delays to avoid rate limits
      const booksWithMetadata = [];
      const BATCH_SIZE = 10; // Process 10 books at a time (faster loading)
      const DELAY_MS = 100; // 100ms delay between batches (reduced for faster loading)
      
      for (let i = 0; i < curatedList.length; i += BATCH_SIZE) {
        const batch = curatedList.slice(i, i + BATCH_SIZE);
        
        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map(async (curatedBook, batchIndex) => {
            const index = i + batchIndex;
            try {
              // Create unique ID first
              const uniqueId = `curated-${startIndex + index}-${curatedBook.title.replace(/\s+/g, '-').substring(0, 20)}-${curatedBook.author?.replace(/\s+/g, '-').substring(0, 15) || 'unknown'}`;
              
              // Try to get book by ISBN - prioritize ISBNdb, fallback to Google Books
              let book = null;
              
              // First try ISBNdb (better metadata) - only if ISBN exists and is valid
              if (ISBNdbService.isConfigured() && curatedBook.isbn13 && curatedBook.isbn13 !== null && curatedBook.isbn13 !== "9780802416728" && curatedBook.isbn13 !== "9780310243731") {
                book = await ISBNdbService.getBookByISBN(curatedBook.isbn13);
              }
              
              // If ISBNdb not configured or not found, try Google Books
              if (!book && curatedBook.isbn13 && curatedBook.isbn13 !== null && curatedBook.isbn13 !== "9780802416728" && curatedBook.isbn13 !== "9780310243731") {
                book = await GoogleBooksService.getBookByISBN(curatedBook.isbn13);
              }
              
              // Try ISBN10 if ISBN13 didn't work
              if (!book && curatedBook.isbn10 && curatedBook.isbn10 !== null && curatedBook.isbn10 !== "0802416728" && curatedBook.isbn10 !== "0310243730") {
                if (ISBNdbService.isConfigured()) {
                  book = await ISBNdbService.getBookByISBN(curatedBook.isbn10);
                }
                if (!book) {
                  book = await GoogleBooksService.getBookByISBN(curatedBook.isbn10);
                }
              }
              
              // If still not found (or no ISBN), try searching by title + author (with delay to avoid rate limits)
              if (!book) {
                // Add small delay before search to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
                const searchQuery = `${curatedBook.title} ${curatedBook.author}`;
                // Try ISBNdb search first if configured
                if (ISBNdbService.isConfigured()) {
                  const isbndbResults = await ISBNdbService.searchBooks(searchQuery, 1);
                  if (isbndbResults.length > 0) {
                    book = isbndbResults[0];
                  }
                }
                // Fallback to Google Books search
                if (!book) {
                  const googleResults = await GoogleBooksService.searchBooks(searchQuery, 1);
                  if (googleResults.length > 0) {
                    book = googleResults[0];
                  }
                }
              }
              
              // If still not found, return null (book will be filtered out)
              if (!book) {
                // Silently skip books that can't be loaded - don't log warnings
                return null;
              } else {
                // Mark as curated source and ensure unique ID
                book.source = "curated";
                book.id = uniqueId; // Override ID to ensure uniqueness
              }
              
              return book;
            } catch (error) {
              // Silently skip books that fail to load - don't log errors
              return null;
            }
          })
        );
        
        booksWithMetadata.push(...batchResults);
        
        // Add delay between batches to avoid rate limits (except for last batch)
        if (i + BATCH_SIZE < curatedList.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
      }
      
      // Filter out null results (books that failed to load)
      const validBooks = booksWithMetadata.filter(book => book !== null);
      
      // Filter by year if specified
      let filteredBooks = validBooks;
      if (minYear) {
        filteredBooks = booksWithMetadata.filter((book) => {
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
      filteredBooks.sort((a, b) => {
        try {
          const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
          const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
          return dateB - dateA; // Newest first
        } catch {
          return 0;
        }
      });
      
      console.log("[CuratedBooks] Returning", filteredBooks.length, "books with metadata");
      return filteredBooks;
    } catch (error) {
      console.error("[CuratedBooks] Error getting curated books:", error);
      return [];
    }
  }

  /**
   * Search curated books
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Array>} Array of book objects
   */
  static async searchCuratedBooks(query, maxResults = 40) {
    try {
      // Search curated list first
      const matchingCurated = searchCuratedBooks(query);
      
      // Fetch metadata for matching books
      const booksWithMetadata = await Promise.all(
        matchingCurated.slice(0, maxResults).map(async (curatedBook) => {
          try {
            let book = await GoogleBooksService.getBookByISBN(curatedBook.isbn13 || curatedBook.isbn10);
            if (!book && curatedBook.isbn10) {
              book = await GoogleBooksService.getBookByISBN(curatedBook.isbn10);
            }
            if (!book) {
              book = {
                id: `curated-${curatedBook.isbn13 || curatedBook.isbn10 || Math.random()}`,
                title: curatedBook.title,
                author: curatedBook.author,
                authors: [curatedBook.author],
                isbn: curatedBook.isbn13 || curatedBook.isbn10,
                source: "curated",
              };
            } else {
              book.source = "curated";
            }
            return book;
          } catch {
            return {
              id: `curated-${curatedBook.isbn13 || curatedBook.isbn10 || Math.random()}`,
              title: curatedBook.title,
              author: curatedBook.author,
              authors: [curatedBook.author],
              isbn: curatedBook.isbn13 || curatedBook.isbn10,
              source: "curated",
            };
          }
        })
      );
      
      return booksWithMetadata;
    } catch (error) {
      console.error("[CuratedBooks] Error searching curated books:", error);
      return [];
    }
  }

  /**
   * Get total count of curated books
   */
  static getTotalCount() {
    return CURATED_CHRISTIAN_BOOKS.length;
  }
}

export default CuratedBookService;

