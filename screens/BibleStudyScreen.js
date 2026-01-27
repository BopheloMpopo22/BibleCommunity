import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ImageBackground,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BibleTextReader from "../components/BibleTextReader";
import BibleAPI from "../services/BibleAPI";
import TimeBasedPrayerService from "../services/TimeBasedPrayerService";

// Import time-based images
const MorningGradient = require("../assets/morning-gradient.jpg");
const AfternoonGradient = require("../assets/afternoon-gradient.jpg");
const NightGradient = require("../assets/night-gradient.jpg");
const MorningBG = require("../assets/background-morning-picture.jpg");
const AfternoonBG = require("../assets/background-afternoon-picture.jpg");
const NightBG = require("../assets/background-night-picture.jpg");

// Import Bible icon
const OpenArtBible = require("../assets/openart-bible.png");

const BibleStudyScreen = ({ route }) => {
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Track time of day and previous image to prevent black screen during transitions
  const [timeOfDay, setTimeOfDay] = useState(TimeBasedPrayerService.getCurrentTimeOfDay());
  const [currentHeaderBG, setCurrentHeaderBG] = useState(() => {
    const currentTime = TimeBasedPrayerService.getCurrentTimeOfDay();
    switch (currentTime) {
      case "morning": return MorningBG;
      case "afternoon": return AfternoonBG;
      default: return NightBG;
    }
  });

  // Monitor time changes and update header smoothly
  useEffect(() => {
    const checkTimeChange = setInterval(() => {
      const newTimeOfDay = TimeBasedPrayerService.getCurrentTimeOfDay();
      if (newTimeOfDay !== timeOfDay) {
        // Time changed - update header image smoothly
        let newHeaderBG;
        switch (newTimeOfDay) {
          case "morning":
            newHeaderBG = MorningBG;
            break;
          case "afternoon":
            newHeaderBG = AfternoonBG;
            break;
          default:
            newHeaderBG = NightBG;
        }
        // Update state - ImageBackground will handle the transition
        setCurrentHeaderBG(newHeaderBG);
        setTimeOfDay(newTimeOfDay);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkTimeChange);
  }, [timeOfDay]);

  // Time-based image function (now uses state for smooth transitions)
  const getTimeBasedImages = () => {
    return {
      headerBG: currentHeaderBG,
      gradient: timeOfDay === "morning" ? MorningGradient : 
                timeOfDay === "afternoon" ? AfternoonGradient : 
                NightGradient,
    };
  };

  const getTimeBasedTextColor = () => {
    const timeOfDay = TimeBasedPrayerService.getCurrentTimeOfDay();
    return timeOfDay === "evening" ? "#fff" : "#333";
  };

  // Complete Bible books with chapters
  const bibleBooks = [
    // Old Testament
    { name: "Genesis", chapters: 50, testament: "Old" },
    { name: "Exodus", chapters: 40, testament: "Old" },
    { name: "Leviticus", chapters: 27, testament: "Old" },
    { name: "Numbers", chapters: 36, testament: "Old" },
    { name: "Deuteronomy", chapters: 34, testament: "Old" },
    { name: "Joshua", chapters: 24, testament: "Old" },
    { name: "Judges", chapters: 21, testament: "Old" },
    { name: "Ruth", chapters: 4, testament: "Old" },
    { name: "1 Samuel", chapters: 31, testament: "Old" },
    { name: "2 Samuel", chapters: 24, testament: "Old" },
    { name: "1 Kings", chapters: 22, testament: "Old" },
    { name: "2 Kings", chapters: 25, testament: "Old" },
    { name: "1 Chronicles", chapters: 29, testament: "Old" },
    { name: "2 Chronicles", chapters: 36, testament: "Old" },
    { name: "Ezra", chapters: 10, testament: "Old" },
    { name: "Nehemiah", chapters: 13, testament: "Old" },
    { name: "Esther", chapters: 10, testament: "Old" },
    { name: "Job", chapters: 42, testament: "Old" },
    { name: "Psalms", chapters: 150, testament: "Old" },
    { name: "Proverbs", chapters: 31, testament: "Old" },
    { name: "Ecclesiastes", chapters: 12, testament: "Old" },
    { name: "Song of Solomon", chapters: 8, testament: "Old" },
    { name: "Isaiah", chapters: 66, testament: "Old" },
    { name: "Jeremiah", chapters: 52, testament: "Old" },
    { name: "Lamentations", chapters: 5, testament: "Old" },
    { name: "Ezekiel", chapters: 48, testament: "Old" },
    { name: "Daniel", chapters: 12, testament: "Old" },
    { name: "Hosea", chapters: 14, testament: "Old" },
    { name: "Joel", chapters: 3, testament: "Old" },
    { name: "Amos", chapters: 9, testament: "Old" },
    { name: "Obadiah", chapters: 1, testament: "Old" },
    { name: "Jonah", chapters: 4, testament: "Old" },
    { name: "Micah", chapters: 7, testament: "Old" },
    { name: "Nahum", chapters: 3, testament: "Old" },
    { name: "Habakkuk", chapters: 3, testament: "Old" },
    { name: "Zephaniah", chapters: 3, testament: "Old" },
    { name: "Haggai", chapters: 2, testament: "Old" },
    { name: "Zechariah", chapters: 14, testament: "Old" },
    { name: "Malachi", chapters: 4, testament: "Old" },

    // New Testament
    { name: "Matthew", chapters: 28, testament: "New" },
    { name: "Mark", chapters: 16, testament: "New" },
    { name: "Luke", chapters: 24, testament: "New" },
    { name: "John", chapters: 21, testament: "New" },
    { name: "Acts", chapters: 28, testament: "New" },
    { name: "Romans", chapters: 16, testament: "New" },
    { name: "1 Corinthians", chapters: 16, testament: "New" },
    { name: "2 Corinthians", chapters: 13, testament: "New" },
    { name: "Galatians", chapters: 6, testament: "New" },
    { name: "Ephesians", chapters: 6, testament: "New" },
    { name: "Philippians", chapters: 4, testament: "New" },
    { name: "Colossians", chapters: 4, testament: "New" },
    { name: "1 Thessalonians", chapters: 5, testament: "New" },
    { name: "2 Thessalonians", chapters: 3, testament: "New" },
    { name: "1 Timothy", chapters: 6, testament: "New" },
    { name: "2 Timothy", chapters: 4, testament: "New" },
    { name: "Titus", chapters: 3, testament: "New" },
    { name: "Philemon", chapters: 1, testament: "New" },
    { name: "Hebrews", chapters: 13, testament: "New" },
    { name: "James", chapters: 5, testament: "New" },
    { name: "1 Peter", chapters: 5, testament: "New" },
    { name: "2 Peter", chapters: 3, testament: "New" },
    { name: "1 John", chapters: 5, testament: "New" },
    { name: "2 John", chapters: 1, testament: "New" },
    { name: "3 John", chapters: 1, testament: "New" },
    { name: "Jude", chapters: 1, testament: "New" },
    { name: "Revelation", chapters: 22, testament: "New" },
  ];

  // Handle navigation parameters for scripture
  React.useEffect(() => {
    if (route?.params?.initialBook && route?.params?.initialChapter) {
      console.log("📖 Bible Study received parameters:", route.params);

      // Find the book object from the bibleBooks array
      const bookObject = bibleBooks.find(
        (book) => book.name === route.params.initialBook
      );
      if (bookObject) {
        console.log("📖 Found book object:", bookObject);
        setSelectedBook(bookObject);
        setSelectedChapter(route.params.initialChapter);
      } else {
        console.log(
          "❌ Book not found in bibleBooks array:",
          route.params.initialBook
        );
      }
    }
  }, [route?.params]);

  // Test API connection
  const testAPIConnection = async () => {
    try {
      const result = await BibleAPI.testAPI();
      if (result.success) {
        Alert.alert(
          "✅ API Test Successful",
          `Found ${result.bibles?.length || 0} available Bibles`
        );
      } else {
        Alert.alert("❌ API Test Failed", result.message);
      }
    } catch (error) {
      Alert.alert("❌ API Test Error", error.message);
    }
  };

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
  };

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
  };

  const handleBackFromReader = () => {
    setSelectedChapter(null);
  };

  const handleChapterChange = (newChapter) => {
    // Check if the new chapter is valid
    if (newChapter >= 1 && newChapter <= selectedBook.chapters) {
      setSelectedChapter(newChapter);
    }
  };

  const filteredBooks = bibleBooks.filter((book) =>
    book.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const oldTestamentBooks = filteredBooks.filter(
    (book) => book.testament === "Old"
  );
  const newTestamentBooks = filteredBooks.filter(
    (book) => book.testament === "New"
  );

  const renderBookItem = (book) => (
    <TouchableOpacity
      key={book.name}
      style={[
        styles.bookItem,
        selectedBook?.name === book.name && styles.selectedBook,
      ]}
      onPress={() => handleBookSelect(book)}
    >
      <Text
        style={[
          styles.bookText,
          selectedBook?.name === book.name && styles.selectedBookText,
        ]}
      >
        {book.name}
      </Text>
      <Text
        style={[
          styles.chapterCount,
          selectedBook?.name === book.name && styles.selectedChapterCount,
        ]}
      >
        {book.chapters} chapters
      </Text>
    </TouchableOpacity>
  );

  const renderChapterItem = (chapter) => (
    <TouchableOpacity
      key={chapter}
      style={styles.chapterItem}
      onPress={() => handleChapterSelect(chapter)}
    >
      <Text style={styles.chapterText}>{chapter}</Text>
    </TouchableOpacity>
  );

  // If we have a selected chapter, show the Bible text reader
  if (selectedChapter) {
    return (
      <BibleTextReader
        book={selectedBook.name}
        chapter={selectedChapter}
        onBack={handleBackFromReader}
        onChapterChange={handleChapterChange}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image source={OpenArtBible} style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Bible Study</Text>
        </View>
      </View>

      <View style={styles.content}>
        {!selectedBook ? (
          // Show book selection with search
          <View style={styles.bookSelectionContainer}>
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={18}
                color="#999"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search books..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              style={styles.bookList}
              showsVerticalScrollIndicator={false}
            >
              {oldTestamentBooks.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Old Testament</Text>
                  {oldTestamentBooks.map(renderBookItem)}
                </>
              )}

              {newTestamentBooks.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>New Testament</Text>
                  {newTestamentBooks.map(renderBookItem)}
                </>
              )}

              {filteredBooks.length === 0 && searchQuery.length > 0 && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No books found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        ) : (
          // Show chapter selection
          <View style={styles.chapterContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedBook(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#1a365d" />
              <Text style={styles.backButtonText}>Back to Books</Text>
            </TouchableOpacity>

            <Text style={styles.selectedBookTitle}>{selectedBook.name}</Text>

            <ScrollView
              style={styles.chapterList}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>Select a Chapter</Text>
              <View style={styles.chapterGrid}>
                {Array.from(
                  { length: selectedBook.chapters },
                  (_, i) => i + 1
                ).map(renderChapterItem)}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 8,
    paddingTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerImage: {
    resizeMode: "cover",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  bookSelectionContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 0,
  },
  bookList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
    marginBottom: 10,
  },
  bookItem: {
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  selectedBook: {
    backgroundColor: "#f8f9ff",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: -12,
  },
  bookText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  selectedBookText: {
    color: "#1a365d",
    fontWeight: "600",
  },
  chapterCount: {
    fontSize: 14,
    color: "#999",
  },
  selectedChapterCount: {
    color: "#1a365d",
    opacity: 0.8,
  },
  noResults: {
    alignItems: "center",
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: "#ccc",
  },
  chapterContainer: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#1a365d",
    marginLeft: 10,
  },
  selectedBookTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  chapterList: {
    flex: 1,
  },
  chapterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  chapterItem: {
    width: "30%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  chapterText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
  },
});

export default BibleStudyScreen;
