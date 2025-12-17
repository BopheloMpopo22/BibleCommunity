import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AffiliateService from "../services/AffiliateService";

const { width } = Dimensions.get("window");

const BookDetailScreen = ({ route, navigation }) => {
  const { book } = route.params;
  const [affiliateLinks, setAffiliateLinks] = useState([]);

  useEffect(() => {
    const links = AffiliateService.getAllAffiliateLinks(book);
    setAffiliateLinks(links);
  }, [book]);

  const handleBuyPress = async (link) => {
    const canOpen = await Linking.canOpenURL(link.link);
    if (canOpen) {
      await Linking.openURL(link.link);
    }
  };

  const handlePreviewPress = async () => {
    if (book.previewLink) {
      const canOpen = await Linking.canOpenURL(book.previewLink);
      if (canOpen) {
        await Linking.openURL(book.previewLink);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Book Cover and Basic Info */}
        <View style={styles.coverSection}>
          <Image
            source={
              book.largeCoverImage || book.coverImage
                ? { uri: book.largeCoverImage || book.coverImage }
                : require("../assets/openart-bible.png")
            }
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.bookInfo}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>by {book.author}</Text>
            {book.publishedDate && (
              <Text style={styles.meta}>
                Published: {new Date(book.publishedDate).getFullYear()}
              </Text>
            )}
            {book.pageCount > 0 && (
              <Text style={styles.meta}>{book.pageCount} pages</Text>
            )}
          </View>
        </View>

        {/* Description */}
        {book.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{book.description}</Text>
          </View>
        )}

        {/* Categories */}
        {book.categories && book.categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoriesContainer}>
              {book.categories.map((category, index) => (
                <View key={index} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Buy Buttons */}
        {affiliateLinks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where to Buy</Text>
            {affiliateLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.buyButton}
                onPress={() => handleBuyPress(link)}
              >
                <Ionicons name="cart-outline" size={20} color="#fff" />
                <Text style={styles.buyButtonText}>
                  Buy on {link.retailer}
                </Text>
                <Ionicons name="open-outline" size={20} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Preview Link */}
        {book.previewLink && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={handlePreviewPress}
            >
              <Ionicons name="book-outline" size={20} color="#1a365d" />
              <Text style={styles.previewButtonText}>Preview Book</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Affiliate Disclosure */}
        <View style={styles.disclosureContainer}>
          <Text style={styles.disclosureText}>
            💡 We may earn a commission from purchases made through our links.
            This helps support the app at no extra cost to you.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#1a365d",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  coverSection: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
  },
  bookInfo: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    color: "#999",
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#ccc",
    lineHeight: 24,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryTag: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  categoryText: {
    color: "#999",
    fontSize: 12,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a365d",
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#1a365d",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  previewButtonText: {
    color: "#1a365d",
    fontSize: 16,
    fontWeight: "600",
  },
  disclosureContainer: {
    backgroundColor: "#1a1a1a",
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  disclosureText: {
    color: "#999",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});

export default BookDetailScreen;




