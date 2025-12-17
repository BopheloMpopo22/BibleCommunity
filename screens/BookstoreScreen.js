import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Linking,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GoogleBooksService from "../services/GoogleBooksService";
import CuratedBookService from "../services/CuratedBookService";
import AffiliateService from "../services/AffiliateService";
import { getBooksByCategory, getAllAuthors, getBooksByAuthor } from "../data/curatedBookCategories";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = (width - 64) / 3; // 3 columns with padding
const SLIDESHOW_HEIGHT = height * 0.3; // 30% of screen height (reduced for better image display)

const BookstoreScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [latestBooks, setLatestBooks] = useState([]); // For slideshow
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [allBooks, setAllBooks] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [hasMoreBooks, setHasMoreBooks] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearFilterVisible, setYearFilterVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const slideshowRef = useRef(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [authorsVisible, setAuthorsVisible] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [authorBooks, setAuthorBooks] = useState([]);

  const categories = [
    { id: "all", name: "All Books" },
    { id: "devotionals", name: "Devotionals" },
    { id: "fiction", name: "Fiction" },
    { id: "children", name: "Children" },
    { id: "bible-books", name: "Bible Books" },
    { id: "authors", name: "Authors" },
  ];

  useEffect(() => {
    // Only reload if year changes, not category (category handled separately)
    if (selectedCategory === "all") {
      loadBooks(true);
    }
  }, [selectedYear]);

  // Load books when category changes
  useEffect(() => {
    if (selectedCategory === "authors" && !authorsVisible) {
      // Don't load books when authors tab is selected, wait for author selection
      return;
    }
    if (selectedCategory !== "all" && selectedCategory !== "authors") {
      loadCategoryBooks();
    } else if (selectedCategory === "all") {
      loadBooks(true);
    }
  }, [selectedCategory]);

  // Load author books when author is selected
  useEffect(() => {
    if (selectedAuthor) {
      loadAuthorBooks(selectedAuthor);
    }
  }, [selectedAuthor]);

  // Auto-scroll slideshow
  useEffect(() => {
    if (latestBooks.length > 1) {
      const interval = setInterval(() => {
        setSlideshowIndex((prev) => {
          const next = (prev + 1) % latestBooks.length;
          slideshowRef.current?.scrollToIndex({ index: next, animated: true });
          return next;
        });
      }, 4000); // Change slide every 4 seconds

      return () => clearInterval(interval);
    }
  }, [latestBooks.length]);

  const loadBooks = async (reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setStartIndex(0);
        setHasMoreBooks(true);
      } else {
        setLoadingMore(true);
      }

      console.log("[Bookstore] Loading books...", reset ? "initial" : "more");

      const currentIndex = reset ? 0 : startIndex;
      const maxResults = reset ? 15 : 30; // Show 15 books initially for faster load, then 30 for "Load More"

      // Load latest books for slideshow (at least 4)
      // Only filter by year if user explicitly selected one (null = show all books)
      // If selectedYear is 1900, it means "all years" so use null
      const minYear = selectedYear === 1900 ? null : selectedYear;
      let latest = [];
      if (reset) {
        // Get latest books from curated list
        latest = await CuratedBookService.getCuratedBooks(8, 0, minYear);
        // Sort by date (newest first) and take at least 4
        latest = latest
          .sort((a, b) => {
            const dateA = a.publishedDate
              ? new Date(a.publishedDate).getTime()
              : 0;
            const dateB = b.publishedDate
              ? new Date(b.publishedDate).getTime()
              : 0;
            return dateB - dateA;
          })
          .slice(0, Math.max(4, latest.length));
        setLatestBooks(latest);
      }

      // Load books with pagination
      // Use curated Christian books list (100% accurate)
      console.log("[Bookstore] Loading curated Christian books...");
      
      let all = await CuratedBookService.getCuratedBooks(maxResults, currentIndex, minYear);
      
      console.log("[Bookstore] Curated books:", all.length, "books");
      
      // If we need more books, supplement with Google Books
      if (all.length < maxResults && currentIndex === 0) {
        console.log("[Bookstore] Supplementing with Google Books...");
        const googleBooks = await GoogleBooksService.searchChristianBooks(
          "",
          maxResults - all.length,
          currentIndex,
          minYear
        );
        
        // Combine, avoiding duplicates by title
        const titleMap = new Map();
        all.forEach(book => {
          const titleKey = book.title?.toLowerCase().trim() || "";
          if (titleKey) titleMap.set(titleKey, book);
        });
        
        googleBooks.forEach(book => {
          const titleKey = book.title?.toLowerCase().trim() || "";
          if (titleKey && !titleMap.has(titleKey)) {
            titleMap.set(titleKey, book);
          }
        });
        
        all = Array.from(titleMap.values());
        console.log("[Bookstore] Combined:", all.length, "books (Curated + Google Books)");
      }

      console.log(
        "[Bookstore] Loaded:",
        all.length,
        "books at index",
        currentIndex
      );

      // Sort books by published date (newest first)
      const sortedAll = all.sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        return dateB - dateA;
      });

      if (reset) {
        setBooks(sortedAll);
        setAllBooks(sortedAll);
      } else {
        const updatedBooks = [...books, ...sortedAll];
        setBooks(updatedBooks);
        setAllBooks(updatedBooks);
      }

      // Check if there are more books available
      // Show Load More if we got the full requested amount (likely more available)
      // OR if this is initial load and we got some books (try loading more)
      // Check if there are more curated books available
      const totalCurated = CuratedBookService.getTotalCount();
      const loadedCount = reset ? all.length : books.length + all.length;
      const hasMoreCurated = loadedCount < totalCurated;
      
      setHasMoreBooks(hasMoreCurated || all.length >= maxResults);
      setStartIndex(currentIndex + all.length);

      if (reset && latest.length === 0 && all.length === 0) {
        console.warn("[Bookstore] No books loaded - check network/API");
      }
    } catch (error) {
      console.error("[Bookstore] Error loading books:", error);
      setHasMoreBooks(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreBooks = () => {
    if (!loadingMore && hasMoreBooks) {
      if (selectedCategory === "all") {
        loadBooks(false);
      } else {
        // For categories, we don't have pagination yet
        setHasMoreBooks(false);
      }
    }
  };

  const loadCategoryBooks = async () => {
    try {
      setLoading(true);
      const categoryBooks = getBooksByCategory(selectedCategory);
      
      // Process in batches with delays to avoid rate limits
      const BATCH_SIZE = 8; // Larger batches for faster loading
      const DELAY_MS = 150; // Reduced delay for faster loading
      const booksWithMetadata = [];
      
      for (let i = 0; i < categoryBooks.length; i += BATCH_SIZE) {
        const batch = categoryBooks.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.all(
          batch.map(async (book) => {
            try {
              let metadata = null;
              
              // Only try ISBN lookup if ISBN exists
              if (book.isbn13 && book.isbn13 !== null) {
                // Add delay before each API call
                await new Promise(resolve => setTimeout(resolve, 100));
                metadata = await GoogleBooksService.getBookByISBN(book.isbn13);
              }
              if (!metadata && book.isbn10 && book.isbn10 !== null) {
                await new Promise(resolve => setTimeout(resolve, 100));
                metadata = await GoogleBooksService.getBookByISBN(book.isbn10);
              }
              
              // Only search if ISBN lookup failed AND ISBN was provided
              // This prevents unnecessary searches for books without ISBNs
              if (!metadata && (book.isbn13 || book.isbn10)) {
                await new Promise(resolve => setTimeout(resolve, 200));
                const searchQuery = `${book.title} ${book.author}`;
                const results = await GoogleBooksService.searchBooks(searchQuery, 1);
                if (results.length > 0) {
                  metadata = results[0];
                }
              }
              
              if (metadata) {
                return metadata;
              } else {
                // Return null if metadata can't be loaded - book will be filtered out
                return null;
              }
            } catch (error) {
              // Silently skip books that fail to load - return null
              return null;
            }
          })
        );
        
        booksWithMetadata.push(...batchResults);
        
        // Add delay between batches (except for last batch)
        if (i + BATCH_SIZE < categoryBooks.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
      }
      
      // Filter out null results (books that failed to load)
      const validBooks = booksWithMetadata.filter(book => book !== null);
      
      // Sort by date (newest first)
      const sorted = validBooks.sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        return dateB - dateA;
      });
      
      setBooks(sorted);
      setAllBooks(sorted);
      setHasMoreBooks(false); // Categories don't have pagination
    } catch (error) {
      console.error("[Bookstore] Error loading category books:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuthorBooks = async (authorName) => {
    try {
      setLoading(true);
      const authorBookList = getBooksByAuthor(authorName);
      
      // Fetch metadata for author books
      const booksWithMetadata = await Promise.all(
        authorBookList.map(async (book) => {
          try {
            let metadata = null;
            if (book.isbn13) {
              metadata = await GoogleBooksService.getBookByISBN(book.isbn13);
            }
            if (!metadata && book.isbn10) {
              metadata = await GoogleBooksService.getBookByISBN(book.isbn10);
            }
            if (!metadata) {
              const searchQuery = `${book.title} ${book.author}`;
              const results = await GoogleBooksService.searchBooks(searchQuery, 1);
              if (results.length > 0) {
                metadata = results[0];
              }
            }
            
            if (metadata) {
              return metadata;
            } else {
              // Return null if metadata can't be loaded - book will be filtered out
              return null;
            }
          } catch (error) {
            // Silently skip books that fail to load - return null
            return null;
          }
        })
      );
      
      // Filter out null results (books that failed to load)
      const validBooks = booksWithMetadata.filter(book => book !== null);
      
      // Sort by date (newest first)
      const sorted = validBooks.sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        return dateB - dateA;
      });
      
      setAuthorBooks(sorted);
      setBooks(sorted);
      setAllBooks(sorted);
      setHasMoreBooks(false);
    } catch (error) {
      console.error("[Bookstore] Error loading author books:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Search curated books first, then supplement with Google Books
      const [curatedResults, googleResults] = await Promise.all([
        CuratedBookService.searchCuratedBooks(query, 40),
        GoogleBooksService.searchBooks(query, 40)
      ]);
      
      // Combine and deduplicate by title
      const searchTitleMap = new Map();
      curatedResults.forEach(book => {
        const titleKey = book.title?.toLowerCase().trim() || "";
        if (titleKey) searchTitleMap.set(titleKey, book);
      });
      googleResults.forEach(book => {
        const titleKey = book.title?.toLowerCase().trim() || "";
        if (titleKey && !searchTitleMap.has(titleKey)) {
          searchTitleMap.set(titleKey, book);
        }
      });
      
      // Sort by date (newest first)
      const sortedResults = Array.from(searchTitleMap.values()).sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
        const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
        return dateB - dateA;
      });
      setSearchResults(sortedResults);
    } catch (error) {
      console.error("[Bookstore] Error searching:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const getFilteredBooks = () => {
    // If searching, return search results
    if (searchQuery.length >= 2) {
      return searchResults;
    }
    
    // If authors tab and author selected, return author books
    if (selectedCategory === "authors" && selectedAuthor) {
      return authorBooks;
    }
    
    // Otherwise return all books (which may be filtered by category)
    return allBooks;

    // Apply year filter (selectedYear can be null for default 2010+, or a specific year)
    if (selectedYear && selectedYear !== 1900) {
      filtered = filtered.filter((book) => {
        if (!book.publishedDate) return false;
        const year = new Date(book.publishedDate).getFullYear();
        return year >= selectedYear;
      });
    } else if (selectedYear === 1900) {
      // "All Years" - show books from 1900 onwards
      filtered = filtered.filter((book) => {
        if (!book.publishedDate) return false;
        const year = new Date(book.publishedDate).getFullYear();
        return year >= 1900;
      });
    }
    // If selectedYear is null, books are already filtered by API (2010+)

    return filtered;
  };

  const handleBookPress = (book) => {
    navigation.navigate("BookDetail", { book });
  };

  const handleBuyPress = async (book, retailer) => {
    const affiliateLinks = AffiliateService.getAllAffiliateLinks(book);
    const link = affiliateLinks.find((l) => l.retailer === retailer);

    if (link) {
      const canOpen = await Linking.canOpenURL(link.link);
      if (canOpen) {
        await Linking.openURL(link.link);
      }
    } else {
      if (book.infoLink) {
        await Linking.openURL(book.infoLink);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.getFullYear().toString();
    } catch {
      return "";
    }
  };

  const renderSlideshowItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.slideshowItem}
      onPress={() => handleBookPress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={
          item.coverImage
            ? { uri: item.coverImage }
            : require("../assets/openart-bible.png")
        }
        style={styles.slideshowImage}
        resizeMode="contain"
      />
      <View style={styles.slideshowOverlay}>
        <Text style={styles.slideshowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.slideshowAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        {item.publishedDate && (
          <Text style={styles.slideshowDate}>
            {formatDate(item.publishedDate)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderBookCard = ({ item }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => handleBookPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={
          item.coverImage
            ? { uri: item.coverImage }
            : require("../assets/openart-bible.png")
        }
        style={styles.bookCover}
        resizeMode="cover"
      />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        {item.publishedDate && (
          <Text style={styles.bookDate}>{formatDate(item.publishedDate)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const displayBooks = getFilteredBooks();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CC5500" />
        <Text style={styles.loadingText}>Loading books...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Search Icon and Year Filter */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={() => setSearchModalVisible(true)}
        >
          <Ionicons name="search" size={24} color="#CC5500" />
        </TouchableOpacity>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.yearFilterButton}
            onPress={() => setYearFilterVisible(!yearFilterVisible)}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color={selectedYear ? "#CC5500" : "#666"}
            />
            <Text style={styles.yearFilterText}>
              {selectedYear === 1900 ? "All" : selectedYear || "Recent"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryTabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id && styles.categoryTabActive,
              ]}
              onPress={() => {
                setSelectedCategory(category.id);
                if (category.id === "authors") {
                  setAuthorsVisible(true);
                  setSelectedAuthor(null);
                } else {
                  setAuthorsVisible(false);
                  setSelectedAuthor(null);
                }
              }}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === category.id && styles.categoryTabTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

        {/* Year Picker */}
        {yearFilterVisible && (
          <View style={styles.yearPickerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {/* All Years option - shows books from 1900 */}
              <TouchableOpacity
                style={[
                  styles.yearChip,
                  selectedYear === 1900 && styles.yearChipActive,
                ]}
                onPress={() => {
                  setSelectedYear(1900);
                  setYearFilterVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.yearChipText,
                    selectedYear === 1900 && styles.yearChipTextActive,
                  ]}
                >
                  All Years
                </Text>
              </TouchableOpacity>
              {Array.from({ length: 125 }, (_, i) => 2024 - i).map(
                (year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearChip,
                      selectedYear === year && styles.yearChipActive,
                    ]}
                    onPress={() => {
                      setSelectedYear(year);
                      setYearFilterVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.yearChipText,
                        selectedYear === year && styles.yearChipTextActive,
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </ScrollView>
          </View>
        )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={null}
        onScrollBeginDrag={() => {}}
      >
        {/* Slideshow Header - Only show on "All Books" */}
        {selectedCategory === "all" && !searchQuery && latestBooks.length > 0 && (
          <View style={styles.slideshowContainer}>
            <FlatList
              ref={slideshowRef}
              data={latestBooks}
              renderItem={renderSlideshowItem}
              keyExtractor={(item, index) => `slide-${item.id || index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / width
                );
                setSlideshowIndex(index);
              }}
              getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
            />
            {/* Dots Indicator */}
            <View style={styles.dotsContainer}>
              {latestBooks.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === slideshowIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Authors List (when Authors tab is selected) */}
        {selectedCategory === "authors" && !selectedAuthor && (
          <View style={styles.authorsContainer}>
            <Text style={styles.sectionTitle}>Popular Christian Authors</Text>
            {getAllAuthors().slice(0, 50).map((author) => (
              <TouchableOpacity
                key={author.name}
                style={styles.authorItem}
                onPress={() => {
                  setSelectedAuthor(author.name);
                  setAuthorsVisible(false);
                }}
              >
                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>{author.name}</Text>
                  <Text style={styles.authorBookCount}>
                    {author.bookCount} {author.bookCount === 1 ? "book" : "books"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Back button when viewing author books */}
        {selectedCategory === "authors" && selectedAuthor && (
          <View style={styles.authorHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setSelectedAuthor(null);
                setAuthorBooks([]);
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#CC5500" />
            </TouchableOpacity>
            <Text style={styles.authorHeaderTitle}>{selectedAuthor}</Text>
            <View style={{ width: 24 }} />
          </View>
        )}

        {/* Books Grid */}
        <View style={styles.section}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#CC5500" />
            </View>
          ) : displayBooks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No books found. Try a different search."
                  : "No books available."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={displayBooks}
              renderItem={renderBookCard}
              keyExtractor={(item, index) => `book-${item.id || item.isbn || index}-${item.title?.substring(0, 10) || index}`}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.booksGrid}
              columnWrapperStyle={styles.bookRow}
            />
          )}

          {/* Load More Button */}
          {!searchQuery &&
            hasMoreBooks &&
            displayBooks.length > 0 && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={loadMoreBooks}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#CC5500" />
                ) : (
                  <>
                    <Text style={styles.loadMoreText}>Load More Books</Text>
                    <Ionicons name="chevron-down" size={20} color="#CC5500" />
                  </>
                )}
              </TouchableOpacity>
            )}
        </View>

        {/* Affiliate Disclosure */}
        <View style={styles.disclosureContainer}>
          <Text style={styles.disclosureText}>
            💡 We may earn a commission from purchases made through our links.
            This helps support the app at no extra cost to you.
          </Text>
        </View>
      </ScrollView>

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.searchModalContainer}>
          <View style={styles.searchModalContent}>
            <View style={styles.searchModalHeader}>
              <Text style={styles.searchModalTitle}>Search Books</Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchModalVisible(false);
                  setSearchQuery("");
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#999"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for books..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            {searchQuery.length >= 2 && (
              <View style={styles.searchResultsContainer}>
                {isSearching ? (
                  <ActivityIndicator size="small" color="#CC5500" />
                ) : searchResults.length === 0 ? (
                  <Text style={styles.noResultsText}>No books found</Text>
                ) : (
                  <FlatList
                    data={searchResults}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.searchResultItem}
                        onPress={() => {
                          handleBookPress(item);
                          setSearchModalVisible(false);
                        }}
                      >
                        <Image
                          source={
                            item.coverImage
                              ? { uri: item.coverImage }
                              : require("../assets/openart-bible.png")
                          }
                          style={styles.searchResultImage}
                        />
                        <View style={styles.searchResultInfo}>
                          <Text style={styles.searchResultTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.searchResultAuthor} numberOfLines={1}>
                            {item.author}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item, index) => `search-${item.id || index}`}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchIconButton: {
    padding: 8,
  },
  categoryTabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  categoryTabs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: "#FFF5E6",
    borderWidth: 1,
    borderColor: "#CC5500",
  },
  categoryTabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  categoryTabTextActive: {
    color: "#CC5500",
    fontWeight: "600",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  yearFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFF5E6",
    borderWidth: 1,
    borderColor: "#FFE5CC",
    gap: 6,
  },
  yearFilterText: {
    color: "#CC5500",
    fontSize: 14,
    fontWeight: "600",
  },
  yearPickerContainer: {
    backgroundColor: "#FFF5E6",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE5CC",
  },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFE5CC",
    marginLeft: 8,
  },
  yearChipActive: {
    backgroundColor: "#CC5500",
    borderColor: "#CC5500",
  },
  yearChipText: {
    color: "#666",
    fontSize: 14,
  },
  yearChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  slideshowContainer: {
    height: SLIDESHOW_HEIGHT,
    marginBottom: 16,
    position: "relative",
  },
  slideshowItem: {
    width: width,
    height: SLIDESHOW_HEIGHT,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  slideshowImage: {
    width: "80%",
    height: "85%",
    backgroundColor: "#F5F5F5",
  },
  slideshowOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 20,
  },
  slideshowTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  slideshowAuthor: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 4,
  },
  slideshowDate: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#333",
    fontSize: 16,
    paddingVertical: 12,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    paddingTop: 50,
  },
  searchModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
  },
  searchModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchResultItem: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchResultImage: {
    width: 60,
    height: 90,
    borderRadius: 4,
    marginRight: 12,
  },
  searchResultInfo: {
    flex: 1,
    justifyContent: "center",
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  searchResultAuthor: {
    fontSize: 14,
    color: "#666",
  },
  noResultsText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
    fontSize: 16,
  },
  authorsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  authorItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  authorBookCount: {
    fontSize: 14,
    color: "#666",
  },
  authorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 4,
  },
  authorHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  booksGrid: {
    paddingHorizontal: 16,
  },
  bookRow: {
    justifyContent: "flex-start",
    marginBottom: 16,
    gap: 8,
  },
  bookCard: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 4,
  },
  bookCover: {
    width: "100%",
    height: (CARD_WIDTH * 3) / 2,
    backgroundColor: "#F5F5F5",
  },
  bookInfo: {
    padding: 10,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    minHeight: 36,
  },
  bookAuthor: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  bookDate: {
    fontSize: 11,
    color: "#CC5500",
    fontWeight: "600",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF5E6",
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE5CC",
    gap: 8,
  },
  loadMoreText: {
    color: "#CC5500",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#CC5500",
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyText: {
    color: "#999",
    marginTop: 12,
    textAlign: "center",
    fontSize: 16,
  },
  disclosureContainer: {
    backgroundColor: "#FFF5E6",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE5CC",
  },
  disclosureText: {
    color: "#666",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  categoryMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  categoryMenuItemActive: {
    backgroundColor: "#FFF5E6",
  },
  categoryMenuText: {
    fontSize: 16,
    color: "#333",
  },
  categoryMenuTextActive: {
    color: "#CC5500",
    fontWeight: "600",
  },
});

export default BookstoreScreen;
