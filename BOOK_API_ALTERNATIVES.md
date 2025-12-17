# Book API Alternatives to Google Books

## Overview

If Google Books API isn't working well or you want alternatives, here are other options for getting book data.

---

## 1. **Open Library API** ⭐ RECOMMENDED (Free & Open)

### Pros:

- ✅ Completely free
- ✅ No API key required
- ✅ Open source
- ✅ Large database (20+ million books)
- ✅ Good metadata (covers, descriptions, ISBNs)

### Cons:

- ⚠️ May have incomplete data for some books
- ⚠️ Covers might be lower quality

### How to Use:

```javascript
// Example: Search for books
const url = `https://openlibrary.org/search.json?q=christian+books&limit=20`;

// Get book details
const bookUrl = `https://openlibrary.org/works/${workId}.json`;

// Get cover image
const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
```

### Documentation:

https://openlibrary.org/developers/api

---

## 2. **ISBNdb API** (Free Tier Available)

### Pros:

- ✅ Comprehensive book database
- ✅ Good metadata quality
- ✅ ISBN lookup

### Cons:

- ⚠️ Free tier: 500 requests/day
- ⚠️ Requires API key
- ⚠️ Paid plans for more requests

### Pricing:

- Free: 500 requests/day
- Paid: $10-50/month for more

### Documentation:

https://isbndb.com/api/v2/docs

---

## 3. **Goodreads API** (Deprecated - Not Available)

❌ **No longer available** - Goodreads shut down their public API in 2020.

**Alternative**: Use Goodreads RSS feeds or scrape (with permission), but not recommended.

---

## 4. **LibraryThing API** (Limited)

### Pros:

- ✅ Free
- ✅ Good for book metadata

### Cons:

- ⚠️ Limited documentation
- ⚠️ Smaller database than Google Books
- ⚠️ Less maintained

### Documentation:

http://www.librarything.com/api/

---

## 5. **WorldCat API** (Library Catalog)

### Pros:

- ✅ Massive database (libraries worldwide)
- ✅ Very comprehensive

### Cons:

- ⚠️ Requires API key
- ⚠️ More complex to use
- ⚠️ Focused on library holdings

### Documentation:

https://www.oclc.org/developer/develop/web-services/worldcat-api/worldcat-search-api.en.html

---

## 6. **Amazon Product Advertising API** (Complex)

### Pros:

- ✅ Direct access to Amazon products
- ✅ Real-time pricing
- ✅ High-quality covers

### Cons:

- ⚠️ Requires separate approval (different from Associates)
- ⚠️ Complex setup
- ⚠️ Rate limits
- ⚠️ Must be used with Associates program

### Documentation:

https://webservices.amazon.com/paapi5/documentation/

---

## 7. **Combined Approach** ⭐ BEST SOLUTION

**Use multiple sources together:**

1. **Primary**: Google Books API (for search/discovery)
2. **Fallback**: Open Library API (if Google fails)
3. **Cover Images**: Use Open Library covers as backup
4. **Amazon**: Use search links (already implemented)

### Implementation Strategy:

```javascript
// Try Google Books first
let books = await GoogleBooksService.searchBooks(query);

// If no results, try Open Library
if (books.length === 0) {
  books = await OpenLibraryService.searchBooks(query);
}

// Use best cover available
books.forEach((book) => {
  if (!book.coverImage) {
    book.coverImage = `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg`;
  }
});
```

---

## **Recommendation for Your App**

### **Option 1: Add Open Library as Fallback** (Recommended)

Keep Google Books as primary, add Open Library as backup:

**Pros:**

- ✅ More reliable (if one fails, other works)
- ✅ Better coverage
- ✅ Still free
- ✅ Easy to implement

**Implementation:**

- Create `OpenLibraryService.js` similar to `GoogleBooksService.js`
- Use it when Google Books returns no results
- Combine results from both sources

### **Option 2: Switch to Open Library** (If Google Books Issues)

If Google Books is causing problems:

**Pros:**

- ✅ No API key needed
- ✅ More reliable
- ✅ Open source

**Cons:**

- ⚠️ May have less complete data
- ⚠️ Need to rewrite service

---

## **Quick Implementation: Open Library Service**

I can create an `OpenLibraryService.js` that:

1. Searches Open Library for Christian books
2. Gets book metadata (title, author, ISBN, description)
3. Gets cover images
4. Works as fallback or primary source

Would you like me to:

1. **Add Open Library as fallback** (keeps Google Books, adds Open Library)
2. **Switch to Open Library** (replaces Google Books)
3. **Use both together** (combines results from both APIs)

---

## **Comparison Table**

| API           | Free?      | API Key? | Quality    | Coverage   | Ease       |
| ------------- | ---------- | -------- | ---------- | ---------- | ---------- |
| Google Books  | ✅ Yes     | ❌ No    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Open Library  | ✅ Yes     | ❌ No    | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   | ⭐⭐⭐⭐   |
| ISBNdb        | ⚠️ Limited | ✅ Yes   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     |
| WorldCat      | ✅ Yes     | ✅ Yes   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐       |
| Amazon PA-API | ✅ Yes     | ✅ Yes   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐       |

---

**My Recommendation**: Add Open Library as a fallback to Google Books. This gives you:

- More reliable book loading
- Better coverage
- Still completely free
- Easy to implement

Would you like me to implement this?
