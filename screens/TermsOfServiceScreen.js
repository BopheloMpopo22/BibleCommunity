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

const TermsOfServiceScreen = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
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
          Welcome to Bible Community. By accessing or using our mobile application, 
          you agree to be bound by these Terms of Service. If you disagree with any 
          part of these terms, please do not use our service.
        </Text>

        {/* Section 1: Acceptance of Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          
          <Text style={styles.text}>
            By downloading, installing, accessing, or using Bible Community, you 
            acknowledge that you have read, understood, and agree to be bound by 
            these Terms of Service and our Privacy Policy. If you do not agree to 
            these terms, you must not use our service.
          </Text>
        </View>

        {/* Section 2: Description of Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          
          <Text style={styles.text}>
            Bible Community is a mobile application that provides:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Bible study tools and scripture reading</Text>
            <Text style={styles.bullet}>• Daily prayers, scriptures, and words of encouragement</Text>
            <Text style={styles.bullet}>• Community features for connecting with other believers</Text>
            <Text style={styles.bullet}>• Prayer requests and testimonies sharing</Text>
            <Text style={styles.bullet}>• Meditation and reflection resources</Text>
            <Text style={styles.bullet}>• Christian bookstore with affiliate links</Text>
          </View>
          <Text style={styles.text}>
            We reserve the right to modify, suspend, or discontinue any part of 
            our service at any time with or without notice.
          </Text>
        </View>

        {/* Section 3: User Accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          
          <Text style={styles.subsectionTitle}>3.1 Account Creation</Text>
          <Text style={styles.text}>
            To use certain features of our service, you must create an account. 
            You agree to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Provide accurate, current, and complete information</Text>
            <Text style={styles.bullet}>• Maintain and update your information as necessary</Text>
            <Text style={styles.bullet}>• Maintain the security of your password</Text>
            <Text style={styles.bullet}>• Accept responsibility for all activities under your account</Text>
            <Text style={styles.bullet}>• Notify us immediately of any unauthorized use</Text>
          </View>

          <Text style={styles.subsectionTitle}>3.2 Account Eligibility</Text>
          <Text style={styles.text}>
            You must be at least 13 years old to create an account. By creating an 
            account, you represent and warrant that you meet this age requirement.
          </Text>

          <Text style={styles.subsectionTitle}>3.3 Account Termination</Text>
          <Text style={styles.text}>
            We reserve the right to suspend or terminate your account at any time 
            for violations of these Terms of Service, illegal activity, or any 
            other reason we deem necessary to protect our service and users.
          </Text>
        </View>

        {/* Section 4: User Responsibilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
          
          <Text style={styles.text}>
            You are responsible for your use of Bible Community and agree to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Use the service only for lawful purposes</Text>
            <Text style={styles.bullet}>• Respect other users and maintain a positive community environment</Text>
            <Text style={styles.bullet}>• Not harass, abuse, or harm other users</Text>
            <Text style={styles.bullet}>• Not post content that is offensive, defamatory, or violates others' rights</Text>
            <Text style={styles.bullet}>• Not impersonate others or provide false information</Text>
            <Text style={styles.bullet}>• Not attempt to gain unauthorized access to our systems</Text>
            <Text style={styles.bullet}>• Not use automated systems to access the service without permission</Text>
            <Text style={styles.bullet}>• Not interfere with or disrupt the service</Text>
          </View>
        </View>

        {/* Section 5: Content Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Content Guidelines</Text>
          
          <Text style={styles.subsectionTitle}>5.1 User-Generated Content</Text>
          <Text style={styles.text}>
            You retain ownership of content you create and share on Bible Community. 
            However, by posting content, you grant us a worldwide, non-exclusive, 
            royalty-free license to use, display, and distribute your content within 
            our service.
          </Text>

          <Text style={styles.subsectionTitle}>5.2 Prohibited Content</Text>
          <Text style={styles.text}>
            You agree not to post, upload, or share content that:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Is illegal, harmful, or violates any laws</Text>
            <Text style={styles.bullet}>• Is defamatory, harassing, abusive, or threatening</Text>
            <Text style={styles.bullet}>• Contains hate speech or discriminates against others</Text>
            <Text style={styles.bullet}>• Is sexually explicit or pornographic</Text>
            <Text style={styles.bullet}>• Violates intellectual property rights of others</Text>
            <Text style={styles.bullet}>• Contains spam, advertisements, or promotional content</Text>
            <Text style={styles.bullet}>• Contains viruses, malware, or harmful code</Text>
            <Text style={styles.bullet}>• Is false, misleading, or deceptive</Text>
          </View>

          <Text style={styles.subsectionTitle}>5.3 Content Moderation</Text>
          <Text style={styles.text}>
            We reserve the right to review, edit, remove, or refuse to display any 
            content that violates these guidelines. We may remove content without 
            notice and terminate accounts of repeat offenders.
          </Text>

          <Text style={styles.subsectionTitle}>5.4 Reporting Inappropriate Content</Text>
          <Text style={styles.text}>
            If you encounter content that violates these guidelines, please report 
            it through the app's reporting feature or contact us directly.
          </Text>
        </View>

        {/* Section 6: Intellectual Property */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
          
          <Text style={styles.text}>
            The Bible Community app, including its design, features, and content 
            (except user-generated content), is owned by us and protected by 
            copyright, trademark, and other intellectual property laws.
          </Text>
          <Text style={styles.text}>
            You may not:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Copy, modify, or create derivative works of our service</Text>
            <Text style={styles.bullet}>• Reverse engineer or attempt to extract source code</Text>
            <Text style={styles.bullet}>• Use our trademarks or logos without permission</Text>
            <Text style={styles.bullet}>• Remove any copyright or proprietary notices</Text>
          </View>
        </View>

        {/* Section 7: Third-Party Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Third-Party Services</Text>
          
          <Text style={styles.text}>
            Our service may include links to third-party websites, services, or 
            products (such as affiliate book links). We are not responsible for 
            the content, privacy practices, or terms of service of third-party 
            services. Your use of third-party services is at your own risk.
          </Text>
        </View>

        {/* Section 8: Disclaimers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Disclaimers</Text>
          
          <Text style={styles.subsectionTitle}>8.1 Service Availability</Text>
          <Text style={styles.text}>
            We strive to provide reliable service, but we do not guarantee that 
            our service will be uninterrupted, secure, or error-free. The service 
            is provided "as is" and "as available."
          </Text>

          <Text style={styles.subsectionTitle}>8.2 Content Accuracy</Text>
          <Text style={styles.text}>
            While we strive for accuracy, we do not guarantee that all content, 
            including Bible verses, prayers, or other spiritual content, is 
            error-free or suitable for your specific needs.
          </Text>

          <Text style={styles.subsectionTitle}>8.3 Spiritual Guidance</Text>
          <Text style={styles.text}>
            Bible Community provides resources for spiritual growth, but we do not 
            provide professional counseling, medical advice, or legal advice. 
            Always consult qualified professionals for such matters.
          </Text>
        </View>

        {/* Section 9: Limitation of Liability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          
          <Text style={styles.text}>
            To the maximum extent permitted by law, Bible Community and its 
            operators shall not be liable for any indirect, incidental, special, 
            consequential, or punitive damages, or any loss of profits or revenues, 
            whether incurred directly or indirectly, or any loss of data, use, 
            goodwill, or other intangible losses resulting from your use of our service.
          </Text>
        </View>

        {/* Section 10: Indemnification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Indemnification</Text>
          
          <Text style={styles.text}>
            You agree to indemnify and hold harmless Bible Community and its 
            operators from any claims, damages, losses, liabilities, and expenses 
            (including legal fees) arising from your use of the service, your 
            violation of these Terms, or your violation of any rights of another.
          </Text>
        </View>

        {/* Section 11: Changes to Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Changes to Terms</Text>
          
          <Text style={styles.text}>
            We reserve the right to modify these Terms of Service at any time. 
            We will notify users of significant changes by updating the "Last Updated" 
            date and posting the updated terms in the app. Your continued use of 
            the service after changes constitutes acceptance of the new terms.
          </Text>
        </View>

        {/* Section 12: Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Termination</Text>
          
          <Text style={styles.text}>
            You may terminate your account at any time by deleting it through the 
            app settings or contacting us. We may terminate or suspend your account 
            immediately, without prior notice, for conduct that we believe violates 
            these Terms or is harmful to other users, us, or third parties.
          </Text>
        </View>

        {/* Section 13: Governing Law */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Governing Law</Text>
          
          <Text style={styles.text}>
            These Terms of Service shall be governed by and construed in accordance 
            with applicable laws, without regard to conflict of law provisions.
          </Text>
        </View>

        {/* Section 14: Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Contact Information</Text>
          
          <Text style={styles.text}>
            If you have any questions about these Terms of Service, please contact us at:
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
            By using Bible Community, you acknowledge that you have read, understood, 
            and agree to be bound by these Terms of Service.
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

export default TermsOfServiceScreen;

