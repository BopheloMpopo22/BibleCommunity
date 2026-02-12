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

    // Check Firebase FIRST for synced content across devices
    try {
      const PartnerFirebaseService = (await import("./PartnerFirebaseService")).default;
      const partnerPrayers = await PartnerFirebaseService.getAllPartnerPrayers();
      
      if (partnerPrayers && partnerPrayers.length > 0) {
        // Use ISO date format (YYYY-MM-DD) for consistent comparison
        const today = new Date().toISOString().split("T")[0];
        console.log(`🔍 Looking for ${timeOfDay} prayer scheduled for ${today}`);
        console.log(`📋 Total partner prayers: ${partnerPrayers.length}`);
        
        // Filter prayers for this time of day and log them
        const prayersForTime = partnerPrayers.filter(p => p.time === timeOfDay);
        console.log(`📋 Prayers for ${timeOfDay}: ${prayersForTime.length}`);
        prayersForTime.forEach(p => {
          console.log(`  - Prayer by ${p.author}: isSelected=${p.isSelected}, selectedDate=${p.selectedDate}`);
        });
        
        const selectedPrayer = partnerPrayers.find(
          (prayer) => {
            const matchesTime = prayer.time === timeOfDay;
            const isSelected = prayer.isSelected === true;
            const hasDate = !!prayer.selectedDate;
            
            if (!matchesTime || !isSelected || !hasDate) {
              return false;
            }
            
            // Normalize selectedDate to ISO format for comparison
            let normalizedSelectedDate = prayer.selectedDate;
            try {
              // Handle string dates
              if (typeof normalizedSelectedDate === 'string') {
                // If already in ISO format (YYYY-MM-DD), use as is
                if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedSelectedDate.trim())) {
                  normalizedSelectedDate = normalizedSelectedDate.trim();
                } else {
                  // Try to parse and convert to ISO format
                  const dateObj = new Date(normalizedSelectedDate);
                  if (!isNaN(dateObj.getTime())) {
                    normalizedSelectedDate = dateObj.toISOString().split("T")[0];
                  } else {
                    console.warn(`⚠️ Could not parse prayer date: ${normalizedSelectedDate}`);
                    return false;
                  }
                }
              } else if (normalizedSelectedDate instanceof Date) {
                // Handle Date objects
                normalizedSelectedDate = normalizedSelectedDate.toISOString().split("T")[0];
              } else {
                console.warn(`⚠️ Unexpected prayer date type: ${typeof normalizedSelectedDate}, value: ${normalizedSelectedDate}`);
                return false;
              }
            } catch (e) {
              console.warn(`⚠️ Error normalizing prayer date: ${normalizedSelectedDate}`, e);
              return false;
            }
            
            const matchesDate = normalizedSelectedDate === today;
            console.log(`  Checking ${timeOfDay} prayer "${prayer.author}": normalizedDate=${normalizedSelectedDate}, today=${today}, matches=${matchesDate}`);
            
            if (matchesDate) {
              console.log(`✅ Found matching prayer: ${prayer.author}, date: ${normalizedSelectedDate}, today: ${today}`);
            }
            
            return matchesDate;
          }
        );
        
        if (selectedPrayer) {
          console.log(`✅ Using partner prayer from ${selectedPrayer.author} (Firebase)`);
          
          // TEMPORARY DEBUG: Show alert on device (remove after testing)
          try {
            const { Alert } = require("react-native");
            Alert.alert(
              "DEBUG: Prayer Found ✅",
              `${timeOfDay} prayer found!\n\nDate: ${selectedPrayer.selectedDate}\nToday: ${today}\nAuthor: ${selectedPrayer.author}\n\nMatch: ${selectedPrayer.selectedDate === today ? 'YES' : 'NO'}`
            );
          } catch (e) {}
          
          // Also save to local cache for offline access
          try {
            const AsyncStorage = require("@react-native-async-storage/async-storage").default;
            const localPrayers = partnerPrayers.filter(p => p.time === timeOfDay);
            await AsyncStorage.setItem("partner_prayers", JSON.stringify(localPrayers));
          } catch (e) {
            console.log("Error caching to local:", e);
          }
          
          return {
            title: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Prayer`,
            scripture: "",
            scriptureText: "",
            prayer: selectedPrayer.prayer,
            theme: "Partner Prayer",
            wallpaper: selectedPrayer.wallpaper || null,
            textColor: selectedPrayer.textColor || "black",
            timeLabel: `Good ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}`,
            video: selectedPrayer.video || null,
            author: selectedPrayer.author,
            isPartnerPrayer: true,
          };
        }
      }
    } catch (error) {
      console.log("Error checking Firebase partner prayers:", error);
    }

    // Fallback to local storage if Firebase fails
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      const partnerPrayersJson = await AsyncStorage.getItem("partner_prayers");
      
      if (partnerPrayersJson) {
        const partnerPrayers = JSON.parse(partnerPrayersJson);
        // Use ISO date format (YYYY-MM-DD) for consistent comparison
        const today = new Date().toISOString().split("T")[0];
        
        const selectedPrayer = partnerPrayers.find(
          (prayer) =>
            prayer.time === timeOfDay &&
            prayer.isSelected === true &&
            prayer.selectedDate &&
            (prayer.selectedDate === today ||
             new Date(prayer.selectedDate).toISOString().split("T")[0] === today)
        );

        if (selectedPrayer) {
          console.log(`✅ Using partner prayer from ${selectedPrayer.author} (local fallback)`);
          return {
            title: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Prayer`,
            scripture: "",
            scriptureText: "",
            prayer: selectedPrayer.prayer,
            theme: "Partner Prayer",
            wallpaper: selectedPrayer.wallpaper || null,
            textColor: selectedPrayer.textColor || "black",
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

    // Check Firebase FIRST for synced content across devices
    try {
      const PartnerFirebaseService = (await import("./PartnerFirebaseService")).default;
      const partnerScriptures = await PartnerFirebaseService.getAllPartnerScriptures();
      
      if (partnerScriptures && partnerScriptures.length > 0) {
        // Use ISO date format (YYYY-MM-DD) for consistent comparison
        const today = new Date().toISOString().split("T")[0];
        console.log(`🔍 Looking for ${timeOfDay} scripture scheduled for ${today}`);
        
        const selectedScripture = partnerScriptures.find(
          (scripture) => {
            const matchesTime = scripture.time === timeOfDay;
            const isSelected = scripture.isSelected === true;
            const hasDate = !!scripture.selectedDate;
            
            if (!matchesTime || !isSelected || !hasDate) {
              return false;
            }
            
            // Normalize selectedDate to ISO format for comparison
            let normalizedSelectedDate = scripture.selectedDate;
            try {
              // Handle string dates
              if (typeof normalizedSelectedDate === 'string') {
                // If already in ISO format (YYYY-MM-DD), use as is
                if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedSelectedDate.trim())) {
                  normalizedSelectedDate = normalizedSelectedDate.trim();
                } else {
                  // Try to parse and convert to ISO format
                  const dateObj = new Date(normalizedSelectedDate);
                  if (!isNaN(dateObj.getTime())) {
                    normalizedSelectedDate = dateObj.toISOString().split("T")[0];
                  } else {
                    console.warn(`⚠️ Could not parse scripture date: ${normalizedSelectedDate}`);
                    return false;
                  }
                }
              } else if (normalizedSelectedDate instanceof Date) {
                // Handle Date objects
                normalizedSelectedDate = normalizedSelectedDate.toISOString().split("T")[0];
              } else {
                console.warn(`⚠️ Unexpected scripture date type: ${typeof normalizedSelectedDate}, value: ${normalizedSelectedDate}`);
                return false;
              }
            } catch (e) {
              console.warn(`⚠️ Error normalizing scripture date: ${normalizedSelectedDate}`, e);
              return false;
            }
            
            const matchesDate = normalizedSelectedDate === today;
            console.log(`  Checking ${timeOfDay} scripture "${scripture.author}": normalizedDate=${normalizedSelectedDate}, today=${today}, matches=${matchesDate}`);
            
            return matchesDate;
          }
        );
        
        if (selectedScripture) {
          console.log(`✅ Using partner scripture from ${selectedScripture.author} (Firebase)`);
          // Also save to local cache for offline access
          try {
            const AsyncStorage = require("@react-native-async-storage/async-storage").default;
            const localScriptures = partnerScriptures.filter(s => s.time === timeOfDay);
            await AsyncStorage.setItem("partner_scriptures", JSON.stringify(localScriptures));
          } catch (e) {
            console.log("Error caching to local:", e);
          }
          
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
      console.log("Error checking Firebase partner scriptures:", error);
    }

    // Fallback to local storage if Firebase fails
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      const partnerScripturesJson = await AsyncStorage.getItem("partner_scriptures");
      
      if (partnerScripturesJson) {
        const partnerScriptures = JSON.parse(partnerScripturesJson);
        // Use ISO date format (YYYY-MM-DD) for consistent comparison
        const today = new Date().toISOString().split("T")[0];
        
        const selectedScripture = partnerScriptures.find(
          (scripture) =>
            scripture.time === timeOfDay &&
            scripture.isSelected === true &&
            scripture.selectedDate &&
            (scripture.selectedDate === today ||
             new Date(scripture.selectedDate).toISOString().split("T")[0] === today)
        );

        if (selectedScripture) {
          console.log(`✅ Using partner scripture from ${selectedScripture.author} (local fallback)`);
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

    // Check Firebase FIRST for synced content across devices
    try {
      const PartnerFirebaseService = (await import("./PartnerFirebaseService")).default;
      const partnerWords = await PartnerFirebaseService.getAllPartnerWords();
      
      if (partnerWords && partnerWords.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        console.log(`🔍 Looking for word scheduled for ${today}`);
        console.log(`📋 Total partner words fetched: ${partnerWords.length}`);
        
        // Log all words with their scheduling status
        partnerWords.forEach((word, index) => {
          console.log(`  Word ${index + 1}: ${word.title || 'Untitled'} by ${word.author || 'Unknown'}`);
          console.log(`    - isSelected: ${word.isSelected}`);
          console.log(`    - selectedDate: ${word.selectedDate || 'none'}`);
          console.log(`    - id: ${word.id || 'no id'}`);
        });
        
        // Find words that are selected
        const selectedWords = partnerWords.filter(w => w.isSelected === true && w.selectedDate);
        console.log(`📅 Found ${selectedWords.length} words with isSelected=true and selectedDate`);
        
        selectedWords.forEach((word, index) => {
          console.log(`  Selected word ${index + 1}: ${word.title || 'Untitled'} scheduled for ${word.selectedDate}`);
        });
        
        const selectedWord = partnerWords.find(
          (word) => {
            const isSelected = word.isSelected === true;
            const hasDate = !!word.selectedDate;
            
            if (!isSelected || !hasDate) {
              return false;
            }
            
            // Normalize selectedDate to ISO format for comparison
            let normalizedSelectedDate = word.selectedDate;
            try {
              // Handle string dates
              if (typeof normalizedSelectedDate === 'string') {
                // If already in ISO format (YYYY-MM-DD), use as is
                if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedSelectedDate.trim())) {
                  normalizedSelectedDate = normalizedSelectedDate.trim();
                } else {
                  // Try to parse and convert to ISO format
                  const dateObj = new Date(normalizedSelectedDate);
                  if (!isNaN(dateObj.getTime())) {
                    normalizedSelectedDate = dateObj.toISOString().split("T")[0];
                  } else {
                    console.warn(`⚠️ Could not parse date: ${normalizedSelectedDate}`);
                    return false;
                  }
                }
              } else if (normalizedSelectedDate instanceof Date) {
                // Handle Date objects
                normalizedSelectedDate = normalizedSelectedDate.toISOString().split("T")[0];
              } else {
                console.warn(`⚠️ Unexpected date type: ${typeof normalizedSelectedDate}, value: ${normalizedSelectedDate}`);
                return false;
              }
            } catch (e) {
              console.warn(`⚠️ Error normalizing date: ${normalizedSelectedDate}`, e);
              return false;
            }
            
            const matchesDate = normalizedSelectedDate === today;
            console.log(`  Checking word "${word.title || 'Untitled'}": normalizedDate=${normalizedSelectedDate}, today=${today}, matches=${matchesDate}`);
            
            return matchesDate;
          }
        );
        
        if (selectedWord) {
          console.log(`✅ FOUND MATCHING WORD: ${selectedWord.title || 'Untitled'} by ${selectedWord.author} (Firebase)`);
          console.log(`   Scheduled for: ${selectedWord.selectedDate}`);
          
          // TEMPORARY DEBUG: Show alert on device (remove after testing)
          try {
            const { Alert } = require("react-native");
            Alert.alert(
              "DEBUG: Word Found ✅",
              `Word found!\n\nTitle: ${selectedWord.title || 'Untitled'}\nDate: ${selectedWord.selectedDate}\nToday: ${today}\nAuthor: ${selectedWord.author}\n\nMatch: ${selectedWord.selectedDate === today ? 'YES' : 'NO'}`
            );
          } catch (e) {}
          
          // Also save to local cache for offline access
          try {
            const AsyncStorage = require("@react-native-async-storage/async-storage").default;
            await AsyncStorage.setItem("partner_words", JSON.stringify(partnerWords));
          } catch (e) {
            console.log("Error caching to local:", e);
          }
          
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
        } else {
          console.log(`❌ No word found matching today's date (${today})`);
          
          // TEMPORARY: Show alert for debugging (remove after testing)
          if (__DEV__) {
            const { Alert } = require("react-native");
            const scheduledWordsList = selectedWords.map(w => `- ${w.title} (${w.selectedDate})`).join('\n');
            Alert.alert(
              "DEBUG: No Word Found",
              `Today: ${today}\n\nScheduled words:\n${scheduledWordsList || 'None'}\n\nTotal words: ${partnerWords.length}`
            );
          }
        }
      } else {
        console.log(`⚠️ No partner words found in Firebase`);
      }
    } catch (error) {
      console.error("❌ Error checking Firebase partner words:", error);
      console.error(error.stack);
    }

    // Fallback to local storage if Firebase fails
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      const partnerWordsJson = await AsyncStorage.getItem("partner_words");
      
      if (partnerWordsJson) {
        const partnerWords = JSON.parse(partnerWordsJson);
        const today = new Date().toISOString().split("T")[0];
        
        const selectedWord = partnerWords.find(
          (word) =>
            word.isSelected === true &&
            word.selectedDate &&
            (word.selectedDate === today ||
             new Date(word.selectedDate).toISOString().split("T")[0] === today)
        );

        if (selectedWord) {
          console.log(`✅ Using partner word from ${selectedWord.author} (local fallback)`);
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
