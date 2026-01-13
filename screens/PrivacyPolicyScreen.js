import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a365d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>
          Last Updated: {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>

        <Text style={styles.intro}>
          At Bible Community, we are committed to protecting your privacy. This
          Privacy Policy explains how we collect, use, disclose, and safeguard
          your information when you use our mobile application.
        </Text>

        {/* Section 1: Information We Collect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          
          <Text style={styles.subsectionTitle}>1.1 Personal Information</Text>
          <Text style={styles.text}>
            When you create an account, we collect:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Email address</Text>
            <Text style={styles.bullet}>• Name or display name</Text>
            <Text style={styles.bullet}>• Profile picture (optional)</Text>
            <Text style={styles.bullet}>• Password (encrypted and securely stored)</Text>
          </View>

          <Text style={styles.subsectionTitle}>1.2 Content You Create</Text>
          <Text style={styles.text}>
            We collect content you create and share on our platform:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Posts and comments in communities</Text>
            <Text style={styles.bullet}>• Prayer requests and prayers</Text>
            <Text style={styles.bullet}>• Testimonies and stories</Text>
            <Text style={styles.bullet}>• Bible study notes</Text>
            <Text style={styles.bullet}>• Media files (images, videos) you upload</Text>
          </View>

          <Text style={styles.subsectionTitle}>1.3 Usage Information</Text>
          <Text style={styles.text}>
            We automatically collect certain information about your device and usage:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Device information (model, operating system)</Text>
            <Text style={styles.bullet}>• App usage data (features used, time spent)</Text>
            <Text style={styles.bullet}>• IP address and general location data</Text>
            <Text style={styles.bullet}>• Crash reports and error logs</Text>
          </View>

          <Text style={styles.subsectionTitle}>1.4 Prayer Reminders</Text>
          <Text style={styles.text}>
            If you set up prayer reminders, we collect:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Reminder times and schedules</Text>
            <Text style={styles.bullet}>• Email address (for email notifications)</Text>
            <Text style={styles.bullet}>• Timezone information</Text>
          </View>
        </View>

        {/* Section 2: How We Use Your Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          
          <Text style={styles.text}>
            We use the information we collect to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Provide, maintain, and improve our services</Text>
            <Text style={styles.bullet}>• Create and manage your account</Text>
            <Text style={styles.bullet}>• Send you prayer reminders and notifications</Text>
            <Text style={styles.bullet}>• Facilitate community interactions and content sharing</Text>
            <Text style={styles.bullet}>• Personalize your experience and content recommendations</Text>
            <Text style={styles.bullet}>• Respond to your inquiries and provide customer support</Text>
            <Text style={styles.bullet}>• Detect, prevent, and address technical issues and security threats</Text>
            <Text style={styles.bullet}>• Comply with legal obligations</Text>
          </View>
        </View>

        {/* Section 3: Third-Party Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Third-Party Services</Text>
          
          <Text style={styles.text}>
            We use the following third-party services that may collect information:
          </Text>

          <Text style={styles.subsectionTitle}>3.1 Firebase (Google)</Text>
          <Text style={styles.text}>
            Our app uses Firebase for:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• User authentication and account management</Text>
            <Text style={styles.bullet}>• Cloud database (Firestore) for storing your data</Text>
            <Text style={styles.bullet}>• Cloud storage for media files</Text>
            <Text style={styles.bullet}>• Push notifications</Text>
          </View>
          <Text style={styles.text}>
            Firebase's privacy policy:{" "}
            <Text style={styles.link}>https://firebase.google.com/support/privacy</Text>
          </Text>

          <Text style={styles.subsectionTitle}>3.2 Google Books API</Text>
          <Text style={styles.text}>
            We use Google Books API to provide book information and metadata in our bookstore feature. 
            This service may collect usage data according to Google's privacy policy.
          </Text>
          <Text style={styles.text}>
            Google's privacy policy:{" "}
            <Text style={styles.link}>https://policies.google.com/privacy</Text>
          </Text>

          <Text style={styles.subsectionTitle}>3.3 Affiliate Links</Text>
          <Text style={styles.text}>
            Our bookstore may contain affiliate links. When you click on these links, 
            third-party services (such as Amazon) may collect information according to their 
            own privacy policies. We do not control these third-party services.
          </Text>
        </View>

        {/* Section 4: Data Storage and Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Storage and Security</Text>
          
          <Text style={styles.text}>
            We implement appropriate technical and organizational measures to protect your 
            personal information:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Data encryption in transit and at rest</Text>
            <Text style={styles.bullet}>• Secure authentication using Firebase Auth</Text>
            <Text style={styles.bullet}>• Regular security assessments</Text>
            <Text style={styles.bullet}>• Access controls and authentication</Text>
          </View>
          <Text style={styles.text}>
            However, no method of transmission over the internet or electronic storage is 
            100% secure. While we strive to protect your data, we cannot guarantee absolute security.
          </Text>
        </View>

        {/* Section 5: Your Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          
          <Text style={styles.text}>
            You have the following rights regarding your personal information:
          </Text>

          <Text style={styles.subsectionTitle}>5.1 Access and Portability</Text>
          <Text style={styles.text}>
            You can access, update, or delete your personal information through the app 
            settings or by contacting us.
          </Text>

          <Text style={styles.subsectionTitle}>5.2 Deletion</Text>
          <Text style={styles.text}>
            You can delete your account at any time. When you delete your account, we will 
            delete your personal information, except where we are required to retain it for 
            legal purposes.
          </Text>

          <Text style={styles.subsectionTitle}>5.3 Opt-Out</Text>
          <Text style={styles.text}>
            You can opt-out of:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Email notifications (in app settings)</Text>
            <Text style={styles.bullet}>• Push notifications (in device settings)</Text>
            <Text style={styles.bullet}>• Prayer reminders (in Prayer Time settings)</Text>
          </View>

          <Text style={styles.subsectionTitle}>5.4 Data Portability</Text>
          <Text style={styles.text}>
            You can request a copy of your data by contacting us at the email address 
            provided below.
          </Text>
        </View>

        {/* Section 6: Children's Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
          
          <Text style={styles.text}>
            Our app is not intended for children under the age of 13. We do not knowingly 
            collect personal information from children under 13. If you are a parent or 
            guardian and believe your child has provided us with personal information, 
            please contact us immediately.
          </Text>
        </View>

        {/* Section 7: Changes to This Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Changes to This Privacy Policy</Text>
          
          <Text style={styles.text}>
            We may update this Privacy Policy from time to time. We will notify you of any 
            changes by posting the new Privacy Policy in the app and updating the "Last Updated" 
            date. You are advised to review this Privacy Policy periodically for any changes.
          </Text>
        </View>

        {/* Section 8: Contact Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Contact Us</Text>
          
          <Text style={styles.text}>
            If you have any questions about this Privacy Policy or our data practices, 
            please contact us at:
          </Text>
          <Text style={styles.contactInfo}>
            Email: support@biblecommunity.app
          </Text>
          <Text style={styles.contactInfo}>
            Or through the app's support feature in Settings
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using Bible Community, you agree to the collection and use of information 
            in accordance with this Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </View>
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
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 20,
    textAlign: "center",
  },
  intro: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a365d",
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 12,
  },
  bullet: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 4,
  },
  link: {
    color: "#1a365d",
    textDecorationLine: "underline",
  },
  contactInfo: {
    fontSize: 15,
    color: "#1a365d",
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  footer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#1a365d",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    fontStyle: "italic",
  },
});

export default PrivacyPolicyScreen;

