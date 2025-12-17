/**
 * Affiliate Service
 * Generates affiliate links for different retailers
 *
 * IMPORTANT: Add your affiliate IDs to config/affiliateConfig.js
 * This file should be added to .gitignore for security
 */

// Affiliate IDs - Updated with approved IDs
const AFFILIATE_IDS = {
  amazon: "biblecommunit-20", // ✅ Amazon Associates approved
  faithgateway: null, // Apply at: https://faithgateway.com/pages/affiliate
  christianbook: null, // Apply at: https://www.christianbook.com/page/affiliate-program
};

class AffiliateService {
  /**
   * Set affiliate IDs (call this after getting approved)
   * @param {Object} ids - Object with affiliate IDs
   */
  static setAffiliateIDs(ids) {
    Object.assign(AFFILIATE_IDS, ids);
  }

  /**
   * Generate Amazon affiliate link
   * @param {string} isbn - Book ISBN (10 or 13)
   * @param {string} title - Book title (fallback if no ISBN)
   * @param {string} author - Book author (fallback if no ISBN)
   * @returns {string|null} Affiliate link or null if no ID set
   */
  static generateAmazonLink(isbn, title = "", author = "") {
    if (!AFFILIATE_IDS.amazon) {
      return null;
    }

    // Always use search link - more reliable than direct ISBN links
    // This works even if ISBN doesn't match exactly or book isn't found by ISBN
    let searchQuery = "";

    if (title && author) {
      // Use title + author for best results
      searchQuery = `${title} ${author}`;
    } else if (title) {
      searchQuery = title;
    } else if (isbn) {
      // Fallback to ISBN if no title
      const cleanISBN = isbn.replace(/[-\s]/g, "");
      searchQuery = cleanISBN;
    } else {
      return null;
    }

    // Clean up search query
    searchQuery = searchQuery.trim().replace(/\s+/g, " ");
    const encodedQuery = encodeURIComponent(searchQuery);

    // Use Amazon search with affiliate tag
    return `https://www.amazon.com/s?k=${encodedQuery}&tag=${AFFILIATE_IDS.amazon}`;
  }

  /**
   * Generate FaithGateway affiliate link
   * @param {string} isbn - Book ISBN
   * @param {string} title - Book title
   * @returns {string|null} Affiliate link or null
   */
  static generateFaithGatewayLink(isbn, title = "") {
    if (!AFFILIATE_IDS.faithgateway) {
      return null;
    }

    // FaithGateway uses product search
    const searchQuery = encodeURIComponent(isbn ? `isbn:${isbn}` : title);
    return `https://faithgateway.com/search?q=${searchQuery}&ref=${AFFILIATE_IDS.faithgateway}`;
  }

  /**
   * Generate Christianbook.com affiliate link
   * @param {string} isbn - Book ISBN
   * @param {string} title - Book title
   * @returns {string|null} Affiliate link or null
   */
  static generateChristianbookLink(isbn, title = "") {
    if (!AFFILIATE_IDS.christianbook) {
      return null;
    }

    // Christianbook.com uses search
    const searchQuery = encodeURIComponent(isbn ? `isbn:${isbn}` : title);
    return `https://www.christianbook.com/search?keyword=${searchQuery}&p=${AFFILIATE_IDS.christianbook}`;
  }

  /**
   * Get all available affiliate links for a book
   * @param {Object} book - Book object with isbn, title, author
   * @returns {Array} Array of {retailer, link} objects
   */
  static getAllAffiliateLinks(book) {
    const links = [];

    const amazonLink = this.generateAmazonLink(
      book.isbn || book.isbn10,
      book.title,
      book.author
    );
    if (amazonLink) {
      links.push({ retailer: "Amazon", link: amazonLink });
    }

    const faithgatewayLink = this.generateFaithGatewayLink(
      book.isbn || book.isbn10,
      book.title
    );
    if (faithgatewayLink) {
      links.push({ retailer: "FaithGateway", link: faithgatewayLink });
    }

    const christianbookLink = this.generateChristianbookLink(
      book.isbn || book.isbn10,
      book.title
    );
    if (christianbookLink) {
      links.push({ retailer: "Christianbook.com", link: christianbookLink });
    }

    return links;
  }

  /**
   * Check if any affiliate IDs are configured
   * @returns {boolean}
   */
  static hasAffiliateIDs() {
    return (
      !!AFFILIATE_IDS.amazon ||
      !!AFFILIATE_IDS.faithgateway ||
      !!AFFILIATE_IDS.christianbook
    );
  }

  /**
   * Get configured affiliate retailers
   * @returns {Array} Array of retailer names
   */
  static getConfiguredRetailers() {
    const retailers = [];
    if (AFFILIATE_IDS.amazon) retailers.push("Amazon");
    if (AFFILIATE_IDS.faithgateway) retailers.push("FaithGateway");
    if (AFFILIATE_IDS.christianbook) retailers.push("Christianbook.com");
    return retailers;
  }
}

export default AffiliateService;
