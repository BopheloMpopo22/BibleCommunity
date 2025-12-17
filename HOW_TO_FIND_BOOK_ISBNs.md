# How to Find Real ISBNs for Books

## Yes, Titles Are Hardcoded!

The curated list (`data/curatedChristianBooks.js`) is a **hardcoded list** of book titles, authors, and ISBNs. This ensures 100% accuracy - only verified Christian books.

## Why We Need Real ISBNs

- ✅ **Faster lookup** - Direct ISBN search is instant
- ✅ **More reliable** - Gets exact book match
- ✅ **Better metadata** - Gets cover, description, publication date
- ❌ **Wrong ISBNs** - Causes "metadata not found" errors
- ❌ **Duplicate ISBNs** - Multiple books sharing same ISBN = wrong results

## How to Find Real ISBNs

### Method 1: Amazon (Easiest)

1. Go to **Amazon.com** or **Amazon.co.za**
2. Search for the book by title
3. Click on the book
4. Scroll down to **"Product Details"**
5. Find **"ISBN-13"** or **"ISBN-10"**
6. Copy the number (e.g., `9780310347309`)

### Method 2: Google Books

1. Go to **books.google.com**
2. Search for the book
3. Click on the book
4. Look for **"ISBN"** in the book details
5. Copy the ISBN-13 (preferred) or ISBN-10

### Method 3: Publisher Website

1. Go to the publisher's website (Zondervan, Thomas Nelson, etc.)
2. Search for the book
3. Find ISBN in product details

### Method 4: Library Website

1. Go to your local library website
2. Search for the book
3. ISBN is usually shown in catalog details

## Format for Curated List

```javascript
{
  isbn13: "9780310347309",  // ISBN-13 (preferred)
  isbn10: "0310347308",      // ISBN-10 (optional)
  title: "The Best Yes",     // Exact title
  author: "Lysa TerKeurst"   // Author name
}
```

## Common Issues

### ❌ Duplicate ISBNs

**Problem**: Multiple books using same ISBN

```javascript
// WRONG - Same ISBN for different books
{ isbn13: "9780310347309", title: "The Best Yes", author: "Lysa TerKeurst" },
{ isbn13: "9780310347309", title: "Uninvited", author: "Lysa TerKeurst" },
```

**Solution**: Each book needs its own unique ISBN

```javascript
// CORRECT - Unique ISBNs
{ isbn13: "9780310347309", title: "The Best Yes", author: "Lysa TerKeurst" },
{ isbn13: "9780310347309", title: "Uninvited", author: "Lysa TerKeurst" }, // Find real ISBN!
```

### ❌ Wrong ISBN Format

**Problem**: Missing dashes or wrong length

```javascript
// WRONG
{ isbn13: "978-0310347309", ... }  // Has dashes
{ isbn13: "0310347309", ... }      // Missing 978 prefix
```

**Solution**: Use clean ISBN-13 format

```javascript
// CORRECT
{ isbn13: "9780310347309", ... }  // No dashes, starts with 978
```

## Quick Checklist

Before adding a book to curated list:

- [ ] Found ISBN-13 on Amazon/Google Books
- [ ] Verified ISBN matches the exact book
- [ ] Checked for duplicates in the list
- [ ] Used correct format (no dashes, 13 digits)
- [ ] Added ISBN-10 if available (optional)

## Example: Adding a New Book

1. **Find the book on Amazon**: "Get Out of Your Head" by Jennie Allen
2. **Get ISBN-13**: `9780310367350`
3. **Add to list**:
   ```javascript
   { isbn13: "9780310367350", isbn10: "0310367355", title: "Get Out of Your Head", author: "Jennie Allen" }
   ```
4. **Reload app** - Service will fetch metadata automatically!

---

**Remember**: Real ISBNs = Better results! 🎯
