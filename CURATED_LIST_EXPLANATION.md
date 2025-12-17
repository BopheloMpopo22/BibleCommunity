# How the Curated List Works

## Overview

The curated list is a **hand-picked collection** of verified Christian books. It ensures 100% accuracy - only real Christian books appear, no random results.

## How It Works

### 1. **The List** (`data/curatedChristianBooks.js`)

- Simple array of book objects
- Each book has: `isbn13`, `isbn10`, `title`, `author`
- Books are listed in order (newest at top)

### 2. **Metadata Fetching** (`services/CuratedBookService.js`)

When you load books, the service:

1. **Takes books from the curated list**

   - Uses ISBNs to fetch metadata from Google Books API
   - Gets: cover images, descriptions, publication dates, categories, etc.

2. **Fetches metadata in this order:**

   - First: Try ISBN-13 lookup
   - If fails: Try ISBN-10 lookup
   - If fails: Search by title + author
   - If still fails: Creates basic book object from curated data

3. **Sorts by publication date**

   - Newest books appear first
   - Books without dates appear last

4. **Filters by year** (if user selects year filter)
   - Only shows books from that year onward

## Why Use a Curated List?

✅ **100% Accuracy** - Only verified Christian books  
✅ **No Random Results** - No "Life of Pi" or "Das Kapital"  
✅ **Reliable** - You control what appears  
✅ **Fast** - Direct ISBN lookup is faster than searching

## Adding New Books

To add recent Christian books:

1. **Find the book's ISBN**

   - Look on Amazon, Google Books, or the publisher's website
   - Get ISBN-13 (preferred) or ISBN-10

2. **Add to the list** (`data/curatedChristianBooks.js`)

   ```javascript
   { isbn13: "9781234567890", isbn10: "1234567890", title: "Book Title", author: "Author Name" }
   ```

3. **Place at the top** (if it's recent)

   - Newer books should be at the top of the array
   - The service sorts by date, but having them at top helps

4. **Reload the app**
   - The service will automatically fetch metadata
   - Book will appear with cover, description, etc.

## Current Status

- ✅ **~100+ curated books** in the list
- ✅ **Recent books (2020-2025)** added at top
- ✅ **Classic books** included
- ✅ **All categories** covered (devotionals, theology, fiction, etc.)

## Tips

- **ISBN-13 preferred** - More reliable than ISBN-10
- **Check for duplicates** - Same ISBN shouldn't appear twice
- **Verify Christian content** - Only add books you've verified
- **Keep it updated** - Add new releases regularly

---

**The curated list is your quality control** - it ensures users only see real Christian books!
