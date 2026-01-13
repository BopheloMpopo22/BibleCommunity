import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { navigationRef } from "./services/NavigationService";
import RealTimeService from "./services/RealTimeService";
import NotificationService from "./services/NotificationService";
import { ScrollProvider, useScroll } from "./services/ScrollContext";
import AssetPreloadService from "./services/AssetPreloadService";
import ISBNdbService from "./services/ISBNdbService";
import BibleAPI from "./services/BibleAPI";
import BibleStudyScreen from "./screens/BibleStudyScreen";
import PrayerScreen from "./screens/PrayerScreen";
import CommunityScreen from "./screens/CommunityScreen";
import AllCommunityPrayersScreen from "./screens/AllCommunityPrayersScreen";
import CommunityPrayersHubScreen from "./screens/CommunityPrayersHubScreen";
import PrayerRequestScreen from "./screens/PrayerRequestScreen";
import FullPrayerScreen from "./screens/FullPrayerScreen";
import PrayerCategoriesScreen from "./screens/PrayerCategoriesScreen";
import AllPrayerRequestsScreen from "./screens/AllPrayerRequestsScreen";
import EnhancedAuthScreen from "./screens/EnhancedAuthScreen";
import CreatePostScreen from "./screens/CreatePostScreen";
import VideoPreviewScreen from "./screens/VideoPreviewScreen";
import CreateCommunityScreen from "./screens/CreateCommunityScreen";
import CommunityDetailScreen from "./screens/CommunityDetailScreen";
import PostDetailScreen from "./screens/PostDetailScreen";
import TestimoniesScreen from "./screens/TestimoniesScreen";
import TestimonyDetailScreen from "./screens/TestimonyDetailScreen";
import CreateTestimonyScreen from "./screens/CreateTestimonyScreen";
import NotificationScreen from "./screens/NotificationScreen";
import SearchScreen from "./screens/SearchScreen";
import DailyPrayerScreen from "./screens/DailyPrayerScreen";
import DailyScriptureScreen from "./screens/DailyScriptureScreen";
import MeditationScreen from "./screens/MeditationScreen";
import WordOfDayScreen from "./screens/WordOfDayScreen";
import MyPrayersScreen from "./screens/MyPrayersScreen";
import CreateMeditationScreen from "./screens/CreateMeditationScreen";
import PartnerAuthScreen from "./screens/PartnerAuthScreen";
import PartnerInfoScreen from "./screens/PartnerInfoScreen";
import CreatePartnerPrayerScreen from "./screens/CreatePartnerPrayerScreen";
import PartnerPrayersScreen from "./screens/PartnerPrayersScreen";
import PartnerScriptureInfoScreen from "./screens/PartnerScriptureInfoScreen";
import CreatePartnerScriptureScreen from "./screens/CreatePartnerScriptureScreen";
import PartnerScripturesScreen from "./screens/PartnerScripturesScreen";
import PartnerWordInfoScreen from "./screens/PartnerWordInfoScreen";
import CreatePartnerWordScreen from "./screens/CreatePartnerWordScreen";
import PartnerWordsScreen from "./screens/PartnerWordsScreen";
import PrayerTimeScreen from "./screens/PrayerTimeScreen";
import PrayerAuthScreen from "./screens/PrayerAuthScreen";
import BookstoreScreen from "./screens/BookstoreScreen";
import BookDetailScreen from "./screens/BookDetailScreen";
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen";
import TermsOfServiceScreen from "./screens/TermsOfServiceScreen";
import SettingsScreen from "./screens/SettingsScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import NotificationSettingsScreen from "./screens/NotificationSettingsScreen";
const Tab = createBottomTabNavigator();
const PrayerStack = createStackNavigator();
const CommunityStack = createStackNavigator();
function PrayerStackScreen() {
  return (
    <PrayerStack.Navigator screenOptions={{ headerShown: false }}>
      <PrayerStack.Screen name="PrayerMain" component={PrayerScreen} />
      <PrayerStack.Screen
        name="CommunityPrayersHub"
        component={CommunityPrayersHubScreen}
      />
      <PrayerStack.Screen
        name="AllCommunityPrayers"
        component={AllCommunityPrayersScreen}
      />
      <PrayerStack.Screen
        name="PrayerRequest"
        component={PrayerRequestScreen}
      />
      <PrayerStack.Screen name="FullPrayer" component={FullPrayerScreen} />
      <PrayerStack.Screen
        name="PrayerCategories"
        component={PrayerCategoriesScreen}
      />
      <PrayerStack.Screen
        name="AllPrayerRequests"
        component={AllPrayerRequestsScreen}
      />
      <PrayerStack.Screen name="DailyPrayer" component={DailyPrayerScreen} />
      <PrayerStack.Screen
        name="DailyScripture"
        component={DailyScriptureScreen}
      />
      <PrayerStack.Screen
        name="MeditationScreen"
        component={MeditationScreen}
      />
      <PrayerStack.Screen name="WordOfDayScreen" component={WordOfDayScreen} />
      <PrayerStack.Screen name="MyPrayersScreen" component={MyPrayersScreen} />
      <PrayerStack.Screen
        name="PrayerTimeScreen"
        component={PrayerTimeScreen}
      />
      <PrayerStack.Screen name="PrayerAuth" component={PrayerAuthScreen} />
      <PrayerStack.Screen name="Bookstore" component={BookstoreScreen} />
      <PrayerStack.Screen name="BookDetail" component={BookDetailScreen} />
      <PrayerStack.Screen
        name="CreateMeditation"
        component={CreateMeditationScreen}
      />
      <PrayerStack.Screen name="PartnerAuth" component={PartnerAuthScreen} />
      <PrayerStack.Screen name="PartnerInfo" component={PartnerInfoScreen} />
      <PrayerStack.Screen
        name="CreatePartnerPrayer"
        component={CreatePartnerPrayerScreen}
      />
      <PrayerStack.Screen
        name="PartnerPrayers"
        component={PartnerPrayersScreen}
      />
      <PrayerStack.Screen
        name="PartnerScriptureInfo"
        component={PartnerScriptureInfoScreen}
      />
      <PrayerStack.Screen
        name="CreatePartnerScripture"
        component={CreatePartnerScriptureScreen}
      />
      <PrayerStack.Screen
        name="PartnerScriptures"
        component={PartnerScripturesScreen}
      />
      <PrayerStack.Screen
        name="PartnerWordInfo"
        component={PartnerWordInfoScreen}
      />
      <PrayerStack.Screen
        name="CreatePartnerWord"
        component={CreatePartnerWordScreen}
      />
      <PrayerStack.Screen name="PartnerWords" component={PartnerWordsScreen} />
      <PrayerStack.Screen name="VideoPreview" component={VideoPreviewScreen} />
      <PrayerStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <PrayerStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <PrayerStack.Screen name="Settings" component={SettingsScreen} />
      <PrayerStack.Screen name="EditProfile" component={EditProfileScreen} />
      <PrayerStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </PrayerStack.Navigator>
  );
}
function CommunityStackScreen() {
  return (
    <CommunityStack.Navigator screenOptions={{ headerShown: false }}>
      <CommunityStack.Screen name="CommunityMain" component={CommunityScreen} />
      <CommunityStack.Screen name="Auth" component={EnhancedAuthScreen} />
      <CommunityStack.Screen name="CreatePost" component={CreatePostScreen} />
      <CommunityStack.Screen
        name="VideoPreview"
        component={VideoPreviewScreen}
      />
      <CommunityStack.Screen
        name="CreateCommunity"
        component={CreateCommunityScreen}
      />
      <CommunityStack.Screen
        name="CommunityDetail"
        component={CommunityDetailScreen}
      />
      <CommunityStack.Screen name="PostDetail" component={PostDetailScreen} />
      <CommunityStack.Screen name="Testimonies" component={TestimoniesScreen} />
      <CommunityStack.Screen
        name="TestimonyDetail"
        component={TestimonyDetailScreen}
      />
      <CommunityStack.Screen
        name="CreateTestimony"
        component={CreateTestimonyScreen}
      />
      <CommunityStack.Screen
        name="Notifications"
        component={NotificationScreen}
      />
      <CommunityStack.Screen name="Search" component={SearchScreen} />
      <CommunityStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <CommunityStack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <CommunityStack.Screen name="Settings" component={SettingsScreen} />
      <CommunityStack.Screen name="EditProfile" component={EditProfileScreen} />
      <CommunityStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    </CommunityStack.Navigator>
  );
}
function TabNavigator() {
  const { isScrolling } = useScroll();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Bible Study") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "Prayer") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "Community") {
            iconName = focused ? "people" : "people-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#1a365d",
        tabBarInactiveTintColor: "gray",
        tabBarStyle:
          route.name === "Community" && isScrolling ? { display: "none" } : {},
      })}
    >
      <Tab.Screen name="Bible Study" component={BibleStudyScreen} />
      <Tab.Screen name="Prayer" component={PrayerStackScreen} />
      <Tab.Screen name="Community" component={CommunityStackScreen} />
    </Tab.Navigator>
  );
}
export default function App() {
  React.useEffect(() => {
    // Preload already happens at module load, but call it here as safety measure
    try {
      AssetPreloadService.preloadAllAssets();
    } catch (error) {
      console.warn("[App] Asset preload failed:", error);
    }

    // Preload popular Bible scriptures for instant access
    BibleAPI.preloadPopularScriptures().catch((error) => {
      console.warn("[App] Bible preload failed:", error);
    });

    // Initialize ISBNdb API (optional - for better book metadata)
    // Get your free API key at: https://isbndb.com/
    // Uncomment and add your API key:
    // ISBNdbService.setApiKey("YOUR_ISBNDB_API_KEY_HERE");

    const restoreAuthState = async () => {
      try {
        const WorkingAuthService = (
          await import("./services/WorkingAuthService")
        ).default;
        const user = await WorkingAuthService.getCurrentUser();
        if (user) {
          console.log(" Auth state restored - user is logged in:", user.uid);
        } else {
          console.log("ℹ No user logged in");
        }
      } catch (error) {
        console.warn("Error restoring auth state:", error);
      }
    };
    restoreAuthState();
    RealTimeService.start();
    NotificationService.getAllNotifications().then((notifications) => {
      if (notifications.length === 0) {
        NotificationService.createSampleNotifications();
      }
    });
    return () => {
      RealTimeService.stop();
    };
  }, []);
  return (
    <ScrollProvider>
      <NavigationContainer ref={navigationRef}>
        <TabNavigator />
      </NavigationContainer>
    </ScrollProvider>
  );
}
