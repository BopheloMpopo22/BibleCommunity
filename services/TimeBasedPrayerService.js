class TimeBasedPrayerService {
  static getCurrentTimeOfDay() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeString = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;

    console.log(`🕐 Current time: ${timeString} (Hour: ${hour})`);

    // Morning: 06:00 - 11:59
    if (hour >= 6 && hour < 12) {
      console.log("🌅 Time of day: MORNING");
      return "morning";
    }
    // Afternoon: 12:00 - 16:59
    else if (hour >= 12 && hour < 17) {
      console.log("☀️ Time of day: AFTERNOON");
      return "afternoon";
    }
    // Evening: 17:00 - 05:59
    else {
      console.log("🌙 Time of day: EVENING");
      return "evening";
    }
  }

  static async getTimeBasedPrayer() {
    const timeOfDay = this.getCurrentTimeOfDay();
    console.log(`📖 Getting ${timeOfDay} prayer`);

    // Check for partner prayers first (LOCAL FIRST for instant display)
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      const partnerPrayersJson = await AsyncStorage.getItem("partner_prayers");
      
      if (partnerPrayersJson) {
        const partnerPrayers = JSON.parse(partnerPrayersJson);
        const today = new Date().toDateString();
        
        // Find a partner prayer selected for today and this time
        const selectedPrayer = partnerPrayers.find(
          (prayer) =>
            prayer.time === timeOfDay &&
            prayer.isSelected === true &&
            prayer.selectedDate &&
            (new Date(prayer.selectedDate).toDateString() === today ||
             prayer.selectedDate === today ||
             prayer.selectedDate.includes(today.split(" ")[1])) // Match month/day
        );

        if (selectedPrayer) {
          console.log(`✅ Using partner prayer from ${selectedPrayer.author} (local)`);
          return {
            title: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Prayer`,
            scripture: "",
            scriptureText: "",
            prayer: selectedPrayer.prayer,
            theme: "Partner Prayer",
            wallpaper: selectedPrayer.wallpaper || null, // Partner's wallpaper
            textColor: selectedPrayer.textColor || "black", // Partner's text color
            timeLabel: `Good ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}`,
            video: selectedPrayer.video || null,
            author: selectedPrayer.author,
            isPartnerPrayer: true,
          };
        }
      }
    } catch (error) {
      console.log("Error checking local partner prayers:", error);
    }

    // Try Firebase in background (non-blocking)
    try {
      const PartnerFirebaseService = (await import("./PartnerFirebaseService")).default;
      PartnerFirebaseService.getAllPartnerPrayers().then((partnerPrayers) => {
        if (partnerPrayers && partnerPrayers.length > 0) {
          const today = new Date().toDateString();
          const selectedPrayer = partnerPrayers.find(
            (prayer) =>
              prayer.time === timeOfDay &&
              prayer.isSelected === true &&
              prayer.selectedDate &&
              (new Date(prayer.selectedDate).toDateString() === today ||
               prayer.selectedDate === today ||
               prayer.selectedDate.includes(today.split(" ")[1]))
          );
          if (selectedPrayer) {
            console.log(`✅ Updated with Firebase partner prayer from ${selectedPrayer.author}`);
            // Note: This won't update the UI automatically, but ensures data is synced
          }
        }
      }).catch(err => console.log("Background Firebase sync error:", err));
    } catch (error) {
      console.log("Error checking Firebase partner prayers (non-blocking):", error);
    }

    // Default prayers if no partner prayer is selected
    const prayers = {
      morning: {
        title: "Morning Prayer",
        scripture: "Psalm 5:3",
        scriptureText:
          "In the morning, LORD, you hear my voice; in the morning I lay my requests before you and wait expectantly.",
        prayer:
          "Dear Heavenly Father, as I begin this new day, I thank You for Your faithfulness and love. Guide my steps, guard my heart, and help me to walk in Your ways. May Your light shine through me to others. In Jesus name, Amen.",
        theme: "Gratitude & Guidance",
        wallpaper: "morning",
        timeLabel: "Good Morning",
      },
      afternoon: {
        title: "Afternoon Prayer",
        scripture: "Psalm 90:14",
        scriptureText:
          "Satisfy us in the morning with your unfailing love, that we may sing for joy and be glad all our days.",
        prayer:
          "Lord, as the day continues, I seek Your strength and wisdom. Help me to remain focused on Your purpose and to be a blessing to those around me. Renew my energy and keep me steadfast in faith. Amen.",
        theme: "Strength & Focus",
        wallpaper: "afternoon",
        timeLabel: "Good Afternoon",
      },
      evening: {
        title: "Evening Prayer",
        scripture: "Psalm 4:8",
        scriptureText:
          "In peace I will lie down and sleep, for you alone, LORD, make me dwell in safety.",
        prayer:
          "Heavenly Father, as this day comes to a close, I thank You for Your protection and provision. Forgive me for any shortcomings and help me to rest in Your peace. Prepare my heart for tomorrow. Amen.",
        theme: "Peace & Rest",
        wallpaper: "evening",
        timeLabel: "Good Evening",
      },
    };

    return prayers[timeOfDay];
  }

  static getWallpaperForTime() {
    const timeOfDay = this.getCurrentTimeOfDay();

    const wallpapers = {
      morning: {
        imagePath:
          "vertical-shot-some-beautiful-trees-sun-setting-background.jpg",
        overlay: "rgba(255, 200, 100, 0.3)",
        primaryColor: "#FFD700",
        secondaryColor: "#FFA500",
      },
      afternoon: {
        imagePath: "vertical-shot-empty-road-greenery-starry-blue-sky.jpg",
        overlay: "rgba(100, 150, 200, 0.3)",
        primaryColor: "#1a365d",
        secondaryColor: "#87CEEB",
      },
      evening: {
        imagePath: "3d-tree-against-sunset-sky.jpg",
        overlay: "rgba(255, 150, 50, 0.3)",
        primaryColor: "#FF6B35",
        secondaryColor: "#F7931E",
      },
    };

    return wallpapers[timeOfDay];
  }

  static getRandomNatureImage() {
    const natureImagePaths = [
      "closeup-shot-beautiful-butterfly-with-interesting-textures-orange-petaled-flower.jpg",
      "magnificent-view-wave-with-rocksnin-background-captured-lombok-indonesia.jpg",
      "photorealistic-view-tree-nature-with-branches-trunk.jpg",
      "vertical-aerial-shot-sea-waves-hitting-cliff.jpg",
      "beautiful-night-landscape-view-milky-way-galactic-core-etosha-national-park-camping-namibia.jpg",
    ];

    const randomIndex = Math.floor(Math.random() * natureImagePaths.length);
    return natureImagePaths[randomIndex];
  }

  static getTimeBasedIcon() {
    const timeOfDay = this.getCurrentTimeOfDay();

    const icons = {
      morning: "sunny",
      afternoon: "partly-sunny",
      evening: "moon",
    };

    return icons[timeOfDay];
  }

  static async getTimeBasedScripture() {
    const timeOfDay = this.getCurrentTimeOfDay();
    console.log(`📖 Getting ${timeOfDay} scripture`);

    // Check for partner scriptures first (LOCAL FIRST for instant display)
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      const partnerScripturesJson = await AsyncStorage.getItem("partner_scriptures");
      
      if (partnerScripturesJson) {
        const partnerScriptures = JSON.parse(partnerScripturesJson);
        const today = new Date().toDateString();
        
        // Find a partner scripture selected for today and this time
        const selectedScripture = partnerScriptures.find(
          (scripture) =>
            scripture.time === timeOfDay &&
            scripture.isSelected === true &&
            scripture.selectedDate &&
            (new Date(scripture.selectedDate).toDateString() === today ||
             scripture.selectedDate === today ||
             scripture.selectedDate.includes(today.split(" ")[1])) // Match month/day
        );

        if (selectedScripture) {
          console.log(`✅ Using partner scripture from ${selectedScripture.author} (local)`);
          return {
            reference: selectedScripture.reference,
            text: selectedScripture.text,
            wallpaper: selectedScripture.wallpaper || null,
            textColor: selectedScripture.textColor || "black",
            video: selectedScripture.video || null,
            author: selectedScripture.author,
            isPartnerScripture: true,
          };
        }
      }
    } catch (error) {
      console.log("Error checking local partner scriptures:", error);
    }

    // Try Firebase in background (non-blocking)
    try {
      const PartnerFirebaseService = (await import("./PartnerFirebaseService")).default;
      PartnerFirebaseService.getAllPartnerScriptures().then((partnerScriptures) => {
        if (partnerScriptures && partnerScriptures.length > 0) {
          const today = new Date().toDateString();
          const selectedScripture = partnerScriptures.find(
            (scripture) =>
              scripture.time === timeOfDay &&
              scripture.isSelected === true &&
              scripture.selectedDate &&
              (new Date(scripture.selectedDate).toDateString() === today ||
               scripture.selectedDate === today ||
               scripture.selectedDate.includes(today.split(" ")[1]))
          );
          if (selectedScripture) {
            console.log(`✅ Updated with Firebase partner scripture from ${selectedScripture.author}`);
          }
        }
      }).catch(err => console.log("Background Firebase sync error:", err));
    } catch (error) {
      console.log("Error checking Firebase partner scriptures (non-blocking):", error);
    }

    // Default scriptures if no partner scripture is selected
    const scriptures = {
      morning: {
        reference: "Psalm 23:1-3",
        text: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",
      },
      afternoon: {
        reference: "Isaiah 40:31",
        text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
      },
      evening: {
        reference: "Psalm 4:8",
        text: "In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.",
      },
    };

    return scriptures[timeOfDay];
  }

  static async getTimeBasedWord() {
    console.log(`📖 Getting word of the day`);

    // Check for partner words first (LOCAL FIRST for instant display)
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      const partnerWordsJson = await AsyncStorage.getItem("partner_words");
      
      if (partnerWordsJson) {
        const partnerWords = JSON.parse(partnerWordsJson);
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
        
        // Find a partner word selected for today
        const selectedWord = partnerWords.find(
          (word) =>
            word.isSelected === true &&
            word.selectedDate &&
            (word.selectedDate === today ||
             new Date(word.selectedDate).toISOString().split("T")[0] === today)
        );

        if (selectedWord) {
          console.log(`✅ Using partner word from ${selectedWord.author} (local)`);
          return {
            word: selectedWord.title || "Word of the Day",
            definition: selectedWord.text || "",
            verse: selectedWord.scriptureText || "",
            reference: selectedWord.scriptureReference || "",
            reflection: selectedWord.summary || "",
            wallpaper: selectedWord.wallpaper || null,
            textColor: selectedWord.textColor || "black",
            video: selectedWord.video || null,
            author: selectedWord.author,
            isPartnerWord: true,
          };
        }
      }
    } catch (error) {
      console.log("Error checking local partner words:", error);
    }

    // Try Firebase in background (non-blocking)
    try {
      const PartnerFirebaseService = (await import("./PartnerFirebaseService")).default;
      PartnerFirebaseService.getAllPartnerWords().then((partnerWords) => {
        if (partnerWords && partnerWords.length > 0) {
          const today = new Date().toISOString().split("T")[0];
          const selectedWord = partnerWords.find(
            (word) =>
              word.isSelected === true &&
              word.selectedDate &&
              (word.selectedDate === today ||
               new Date(word.selectedDate).toISOString().split("T")[0] === today)
          );
          if (selectedWord) {
            console.log(`✅ Updated with Firebase partner word from ${selectedWord.author}`);
          }
        }
      }).catch(err => console.log("Background Firebase sync error:", err));
    } catch (error) {
      console.log("Error checking Firebase partner words (non-blocking):", error);
    }

    // Default word if no partner word is selected
    return {
      word: "Grace",
      definition:
        "The free and unmerited favor of God, as manifested in the salvation of sinners and the bestowal of blessings.",
      verse:
        "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God.",
      reference: "Ephesians 2:8",
      reflection:
        "Grace is not something we earn or deserve. It's a gift freely given by God, showing His unconditional love for us.",
    };
  }
}

export default TimeBasedPrayerService;
