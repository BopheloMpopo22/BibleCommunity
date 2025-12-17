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

const PartnerScriptureInfoScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2d5016" />
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
            <Ionicons name="book" size={64} color="#2d5016" />
          </View>

          <Text style={styles.title}>What Does It Mean to Be a Partner?</Text>

          <Text style={styles.description}>
            As a partner, you help create and share scriptures that bless thousands
            of users daily. Your contributions help send morning scriptures,
            afternoon scriptures, evening scriptures, and more to our community.
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="sunny" size={24} color="#FFD700" />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Morning Scriptures</Text>
                <Text style={styles.benefitDescription}>
                  Share scriptures that start people's days with hope and faith
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="partly-sunny" size={24} color="#FF8C42" />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Afternoon Scriptures</Text>
                <Text style={styles.benefitDescription}>
                  Provide scriptures that offer strength and encouragement
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="moon" size={24} color="#1a365d" />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Evening Scriptures</Text>
                <Text style={styles.benefitDescription}>
                  Share scriptures that bring peace and reflection
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.note}>
            Many partners may participate, but one scripture is selected for each day
            and time. Your scripture may be chosen for today or another day - all
            contributions are valued and used to bless the community.
          </Text>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate("CreatePartnerScripture")}
          >
            <Text style={styles.continueButtonText}>Create Scripture</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewScripturesButton}
            onPress={() => navigation.navigate("PartnerScriptures")}
          >
            <Ionicons name="document-text" size={20} color="#2d5016" />
            <Text style={styles.viewScripturesButtonText}>View My Scriptures</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d5016",
  },
  placeholder: {
    width: 34,
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
    color: "#000",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
  },
  benefitTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
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
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
    marginBottom: 32,
    padding: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2d5016",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 16,
    shadowColor: "#2d5016",
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
  viewScripturesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#2d5016",
  },
  viewScripturesButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d5016",
    marginLeft: 8,
  },
});

export default PartnerScriptureInfoScreen;

