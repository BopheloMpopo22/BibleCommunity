import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TimeBasedPrayerService from "../services/TimeBasedPrayerService";

const MorningBG = require("../assets/background-morning-picture.jpg");
const AfternoonBG = require("../assets/background-afternoon-picture.jpg");
const NightBG = require("../assets/background-night-picture.jpg");
const OpenArtPrayingHands = require("../assets/openart-praying-hands.png");
const OpenArtBible = require("../assets/openart-bible.png");
const OpenArtMeditation = require("../assets/openart-meditation.png");
const OpenArtWordOfDay = require("../assets/openart-word-of-the-day.png");
const OpenArtPrayerRequest = require("../assets/openart-prayer-request.png");
const OpenArtCommunity = require("../assets/openart-community.png");
const OpenArtHourglass = require("../assets/openart-hourglass.png");

const PrayerScreen = ({ navigation }) => {
  const [timeOfDay, setTimeOfDay] = useState(
    TimeBasedPrayerService.getCurrentTimeOfDay()
  );
  const [currentHeaderBG, setCurrentHeaderBG] = useState(() => {
    const currentTime = TimeBasedPrayerService.getCurrentTimeOfDay();
    switch (currentTime) {
      case "morning":
        return MorningBG;
      case "afternoon":
        return AfternoonBG;
      default:
        return NightBG;
    }
  });

  useEffect(() => {
    const checkTimeChange = setInterval(() => {
      const newTimeOfDay = TimeBasedPrayerService.getCurrentTimeOfDay();
      if (newTimeOfDay !== timeOfDay) {
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
        setCurrentHeaderBG(newHeaderBG);
        setTimeOfDay(newTimeOfDay);
      }
    }, 60000);
    return () => clearInterval(checkTimeChange);
  }, [timeOfDay]);

  const dailyPrayer = TimeBasedPrayerService.getTimeBasedPrayer();
  const timeBasedScripture = TimeBasedPrayerService.getTimeBasedScripture();

  // Get current date for header
  const getCurrentDate = () => {
    const today = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return today.toLocaleDateString("en-US", options);
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={currentHeaderBG}
        style={styles.headerImageContainer}
        imageStyle={styles.headerImage}
        defaultSource={NightBG}
      >
        <View style={styles.headerImageOverlay} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerDate}>{getCurrentDate()}</Text>
              <Text style={styles.headerTitle}>Prayer</Text>
              <Text style={styles.headerSubtitle}>
                {dailyPrayer?.title || "Daily Prayer"}
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={[styles.gridBox, styles.dailyPrayerBox]}
              onPress={() => navigation.navigate("DailyPrayer")}
            >
              <Image source={OpenArtPrayingHands} style={styles.gridBoxIcon} />
              <Text style={styles.gridBoxTitle}>Daily Prayer</Text>
              <Text style={styles.gridBoxSubtitle}>Today's prayer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gridBox, styles.dailyScriptureBox]}
              onPress={() => navigation.navigate("DailyScripture")}
            >
              <Image source={OpenArtBible} style={styles.gridBoxIcon} />
              <Text style={styles.gridBoxTitle}>Daily Scripture</Text>
              <Text style={styles.gridBoxSubtitle}>Today's word</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={[styles.gridBox, styles.meditationBox]}
              onPress={() => navigation.navigate("MeditationScreen")}
            >
              <Image source={OpenArtMeditation} style={styles.gridBoxIcon} />
              <Text style={styles.gridBoxTitle}>Meditation</Text>
              <Text style={styles.gridBoxSubtitle}>Peace & reflection</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gridBox, styles.wordOfDayBox]}
              onPress={() => navigation.navigate("WordOfDayScreen")}
            >
              <Image source={OpenArtWordOfDay} style={styles.gridBoxIcon} />
              <Text style={styles.gridBoxTitle}>Word of Day</Text>
              <Text style={styles.gridBoxSubtitle}>Daily inspiration</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={[
                styles.gridBox,
                styles.communityPrayersBox,
                styles.communityPrayersBoxFull,
              ]}
              onPress={() => navigation.navigate("CommunityPrayersHub")}
            >
              <Image source={OpenArtCommunity} style={styles.gridBoxIcon} />
              <Text style={styles.gridBoxTitle}>Community Prayers</Text>
              <Text style={styles.gridBoxSubtitle}>
                Pray together, share requests, browse categories
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={[
                styles.gridBox,
                styles.bookstoreBox,
                styles.bookstoreBoxFull,
              ]}
              onPress={() => navigation.navigate("Bookstore")}
            >
              <Ionicons
                name="library"
                size={64}
                color="#fff"
                style={styles.gridBoxIcon}
              />
              <Text style={styles.gridBoxTitle}>Bookstore</Text>
              <Text style={styles.gridBoxSubtitle}>
                Discover Christian books and resources
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={[styles.gridBox, styles.prayerTimeBox]}
              onPress={() => navigation.navigate("PrayerTimeScreen")}
            >
              <Image source={OpenArtHourglass} style={styles.gridBoxIcon} />
              <Text style={styles.gridBoxTitle}>Prayer Time</Text>
              <Text style={styles.gridBoxSubtitle}>Set reminders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gridBox, styles.signInBox]}
              onPress={() => navigation.navigate("PrayerAuth")}
            >
              <Ionicons name="log-in" size={32} color="#fff" />
              <Text style={[styles.gridBoxTitle, { color: "#fff" }]}>
                Sign In
              </Text>
              <Text style={[styles.gridBoxSubtitle, { color: "#fff" }]}>
                Join the community
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  headerImageContainer: {
    height: 80,
    width: "100%",
  },
  headerImage: {
    resizeMode: "cover",
    opacity: 0.8,
  },
  headerImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerDate: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.7,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerSubtitle: { fontSize: 14, color: "#fff", opacity: 0.9 },
  content: { flex: 1, backgroundColor: "#000" },
  gridContainer: { padding: 16 },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  gridBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  communityPrayersBoxFull: {
    width: "100%",
    backgroundColor: "rgba(139, 90, 43, 0.2)",
  },
  gridBoxIcon: { width: 64, height: 64, marginBottom: 10 },
  gridBoxTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  gridBoxSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  dailyPrayerBox: { backgroundColor: "rgba(30, 58, 138, 0.2)" },
  dailyScriptureBox: { backgroundColor: "rgba(20, 83, 45, 0.2)" },
  meditationBox: { backgroundColor: "rgba(88, 28, 135, 0.2)" },
  wordOfDayBox: { backgroundColor: "rgba(194, 65, 12, 0.2)" },
  communityPrayersBox: { backgroundColor: "rgba(139, 90, 43, 0.18)" },
  bookstoreBox: { backgroundColor: "rgba(101, 67, 33, 0.2)" },
  bookstoreBoxFull: {
    width: "100%",
    backgroundColor: "rgba(101, 67, 33, 0.2)",
  },
  prayerTimeBox: { backgroundColor: "rgba(26, 54, 93, 0.22)" },
  signInBox: { backgroundColor: "rgba(0, 0, 0, 0.3)" },
});

export default PrayerScreen;
