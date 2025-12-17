import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PartnerWordInfoScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#CC6B2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Be a Partner</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="book" size={64} color="#CC6B2E" />
          </View>

          <Text style={styles.title}>What Does It Mean to Be a Partner?</Text>

          <Text style={styles.description}>
            As a partner, you help create and share words of the day that inspire
            and encourage thousands of users daily. Your contributions help send
            meaningful words, reflections, and scriptures to our community.
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="book" size={24} color="#CC6B2E" />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Share Your Word</Text>
                <Text style={styles.benefitDescription}>
                  Create words with definitions, reflections, and scriptures
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="videocam" size={24} color="#CC6B2E" />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Video Option</Text>
                <Text style={styles.benefitDescription}>
                  Share your word through video for a more personal touch
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="people" size={24} color="#CC6B2E" />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Bless the Community</Text>
                <Text style={styles.benefitDescription}>
                  Your words inspire and encourage thousands daily
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.note}>
            Many partners may participate, but one word is selected for each day.
            Your word may be chosen for today or another day - all contributions
            are valued and used to bless the community.
          </Text>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate("CreatePartnerWord")}
          >
            <Text style={styles.continueButtonText}>Create Word</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewWordsButton}
            onPress={() => navigation.navigate("PartnerWords")}
          >
            <Ionicons name="document-text" size={20} color="#CC6B2E" />
            <Text style={styles.viewWordsButtonText}>View My Words</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#CC6B2E",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  contentContainer: {
    padding: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#CC6B2E",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32,
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#CC6B2E",
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  note: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 32,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#CC6B2E",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CC6B2E",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 16,
    shadowColor: "#CC6B2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginRight: 8,
  },
  viewWordsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#CC6B2E",
  },
  viewWordsButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#CC6B2E",
    marginLeft: 8,
  },
});

export default PartnerWordInfoScreen;

