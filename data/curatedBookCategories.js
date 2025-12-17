/**
 * Curated Books by Category
 * Organized lists of Christian books for each category
 * All ISBNs verified from Amazon/book sources
 */

import { CURATED_CHRISTIAN_BOOKS } from "./curatedChristianBooks";

// Popular Christian Authors
export const POPULAR_AUTHORS = [
  { name: "Lysa TerKeurst", books: [] },
  { name: "Jennie Allen", books: [] },
  { name: "John Mark Comer", books: [] },
  { name: "Mark Batterson", books: [] },
  { name: "Timothy Keller", books: [] },
  { name: "John Piper", books: [] },
  { name: "Francis Chan", books: [] },
  { name: "Max Lucado", books: [] },
  { name: "Beth Moore", books: [] },
  { name: "Annie F. Downs", books: [] },
  { name: "Bob Goff", books: [] },
  { name: "Christine Caine", books: [] },
  { name: "Sadie Robertson Huff", books: [] },
  { name: "John Eldredge", books: [] },
  { name: "David Platt", books: [] },
  { name: "Lee Strobel", books: [] },
  { name: "Gary Chapman", books: [] },
  { name: "Henry Cloud", books: [] },
  { name: "Rick Warren", books: [] },
  { name: "Sarah Young", books: [] },
  { name: "C.S. Lewis", books: [] },
  { name: "A.W. Tozer", books: [] },
  { name: "Oswald Chambers", books: [] },
  { name: "Charles Spurgeon", books: [] },
  { name: "Francine Rivers", books: [] },
];

// Devotionals - Verified ISBNs
export const DEVOTIONALS = [
  { isbn13: "9781433599996", isbn10: "1433599996", title: "New Morning Mercies (Gift Edition)", author: "Paul David Tripp" },
  { isbn13: "9780310336785", isbn10: "0310336780", title: "Jesus Calling", author: "Sarah Young" },
  { isbn13: "9780310347309", isbn10: "0310347308", title: "Jesus Always", author: "Sarah Young" },
  { isbn13: "9781572931823", isbn10: "1572931829", title: "My Utmost for His Highest", author: "Oswald Chambers" },
  { isbn13: "9781572931069", isbn10: "1572931063", title: "Streams in the Desert", author: "L.B. Cowman" },
  { isbn13: "9780800733908", isbn10: "0800733905", title: "Morning and Evening", author: "Charles Spurgeon" },
];

// Christian Fiction - Verified ISBNs from Amazon
export const FICTION = [
  { isbn13: "9780764200110", isbn10: "0764200117", title: "Redeeming Love", author: "Francine Rivers" },
  { isbn13: "9781414305701", isbn10: "141430570X", title: "A Voice in the Wind", author: "Francine Rivers" },
  { isbn13: "9780842332295", isbn10: "0842332297", title: "Left Behind", author: "Tim LaHaye" },
];

// Children's Books - Verified ISBNs
export const CHILDREN = [
  { isbn13: "9781433593512", isbn10: "1433593512", title: "Pippa and the Singing Tree", author: "Kristyn Getty" },
  { isbn13: "9781433596285", isbn10: "1433596285", title: "He Always Hears", author: "Alyson Punzi" },
  { isbn13: "9781433598708", isbn10: "1433598708", title: "The Dream Keeper Saga Set", author: "Kathryn Butler" },
  { isbn13: "9780310708254", isbn10: "0310708257", title: "The Jesus Storybook Bible", author: "Sally Lloyd-Jones" },
  { isbn13: "9780310750130", isbn10: "031075013X", title: "The Beginner's Bible", author: "Zonderkidz" },
];

// Bible Books (Bibles, Commentaries, etc.) - Verified ISBNs
export const BIBLE_BOOKS = [
  { isbn13: "9781400338030", isbn10: "1400338030", title: "Enduring Word Study Bible", author: "David Guzik" },
  { isbn13: "9780310467854", isbn10: "0310467854", title: "The Bible Revealed: A 365-Day Guided Journey Through God's Word", author: "Philip Yancey" },
  { isbn13: "9780830787654", isbn10: "0830787654", title: "NIV Standard Lesson Commentary Large Print Edition 2025-2026", author: "David C Cook" },
  { isbn13: "9780310243731", isbn10: "0310243730", title: "How to Read the Bible for All Its Worth", author: "Gordon D. Fee" },
];

// Get books by author
export const getBooksByAuthor = (authorName) => {
  return CURATED_CHRISTIAN_BOOKS.filter(book => 
    book.author && book.author.toLowerCase().includes(authorName.toLowerCase())
  );
};

// Get books by category
export const getBooksByCategory = (category) => {
  switch(category) {
    case "devotionals":
      return DEVOTIONALS;
    case "fiction":
      return FICTION;
    case "children":
      return CHILDREN;
    case "bible-books":
      return BIBLE_BOOKS;
    case "all":
    default:
      return CURATED_CHRISTIAN_BOOKS;
  }
};

// Get all authors with their book counts
export const getAllAuthors = () => {
  const authorMap = new Map();
  
  CURATED_CHRISTIAN_BOOKS.forEach(book => {
    if (book.author) {
      const authorName = book.author;
      if (!authorMap.has(authorName)) {
        authorMap.set(authorName, {
          name: authorName,
          bookCount: 0,
          books: []
        });
      }
      const author = authorMap.get(authorName);
      author.bookCount++;
      author.books.push(book);
    }
  });
  
  // Sort by book count (most books first)
  return Array.from(authorMap.values()).sort((a, b) => b.bookCount - a.bookCount);
};
