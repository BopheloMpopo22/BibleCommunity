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

const PartnerInfoScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a365d" />
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
            <Ionicons name="people" size={64} color="#1a365d" />
          </View>

          <Text style={styles.title}>What Does It Mean to Be a Partner?</Text>

          <Text style={styles.description}>
            As a partner, you help create and share prayers that bless thousands
            of users daily. Your contributions help send morning prayers,
            afternoon prayers, evening prayers, and more to our community.
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="sunny" size={24} color="#FFD700" />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Morning Prayers</Text>
                <Text style={styles.benefitDescription}>
                  Create prayers that start people's days with hope and faith
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="partly-sunny" size={24} color="#FF8C42" />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Afternoon Prayers</Text>
                <Text style={styles.benefitDescription}>
                  Share prayers that provide strength and encouragement
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="moon" size={24} color="#1a365d" />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>Evening Prayers</Text>
                <Text style={styles.benefitDescription}>
                  Write prayers that bring peace and reflection
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.note}>
            Many partners may participate, but one prayer is selected for each day
            and time. Your prayer may be chosen for today or another day - all
            contributions are valued and used to bless the community.
          </Text>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate("CreatePartnerPrayer")}
          >
            <Text style={styles.continueButtonText}>Create Prayer</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewPrayersButton}
            onPress={() => navigation.navigate("PartnerPrayers")}
          >
            <Ionicons name="document-text" size={20} color="#1a365d" />
            <Text style={styles.viewPrayersButtonText}>View My Prayers</Text>
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
    color: "#1a365d",
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
    color: "#1a365d",
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
    color: "#1a365d",
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
    borderLeftColor: "#1a365d",
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a365d",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: "#000",
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
  viewPrayersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#1a365d",
  },
  viewPrayersButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a365d",
    marginLeft: 8,
  },
});

export default PartnerInfoScreen;

