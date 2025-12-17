class PrayerBackgroundService {
  // Prayer-specific background mappings
  static getPrayerBackground(prayerData) {
    if (!prayerData) {
      return this.getRandomNatureImage();
    }

    // Check if it's a time-based prayer (has scriptureText and prayer properties)
    if (prayerData.scriptureText && prayerData.prayer) {
      return this.getTimeBasedPrayerBackground(prayerData.title);
    }

    // Check if it's a community prayer (has body or content property)
    if (prayerData.body || prayerData.content) {
      return this.getRandomNatureImage();
    }

    // Fallback to random nature image
    return this.getRandomNatureImage();
  }

  // Get background for time-based prayers based on title
  static getTimeBasedPrayerBackground(title) {
    const titleLower = title?.toLowerCase() || "";

    if (titleLower.includes("morning")) {
      return {
        imagePath:
          "vertical-shot-some-beautiful-trees-sun-setting-background.jpg",
        overlay: "rgba(255, 200, 100, 0.3)",
        primaryColor: "#FFD700",
        secondaryColor: "#FFA500",
      };
    }

    if (titleLower.includes("afternoon")) {
      return {
        imagePath: "vertical-shot-empty-road-greenery-starry-blue-sky.jpg",
        overlay: "rgba(100, 150, 200, 0.3)",
        primaryColor: "#1a365d",
        secondaryColor: "#87CEEB",
      };
    }

    if (titleLower.includes("evening") || titleLower.includes("night")) {
      return {
        imagePath: "3d-tree-against-sunset-sky.jpg",
        overlay: "rgba(255, 150, 50, 0.3)",
        primaryColor: "#FF6B35",
        secondaryColor: "#F7931E",
      };
    }

    // Default to morning background for time-based prayers
    return {
      imagePath:
        "vertical-shot-some-beautiful-trees-sun-setting-background.jpg",
      overlay: "rgba(255, 200, 100, 0.3)",
      primaryColor: "#FFD700",
      secondaryColor: "#FFA500",
    };
  }

  // Get random nature image for community prayers
  static getRandomNatureImage() {
    const natureImagePaths = [
      "closeup-shot-beautiful-butterfly-with-interesting-textures-orange-petaled-flower.jpg",
      "magnificent-view-wave-with-rocksnin-background-captured-lombok-indonesia.jpg",
      "photorealistic-view-tree-nature-with-branches-trunk.jpg",
      "vertical-aerial-shot-sea-waves-hitting-cliff.jpg",
      "beautiful-night-landscape-view-milky-way-galactic-core-etosha-national-park-camping-namibia.jpg",
    ];

    const randomIndex = Math.floor(Math.random() * natureImagePaths.length);
    const imagePath = natureImagePaths[randomIndex];

    return {
      imagePath: imagePath,
      overlay: "rgba(100, 150, 200, 0.3)",
      primaryColor: "#4A90E2",
      secondaryColor: "#87CEEB",
    };
  }
}

export default PrayerBackgroundService;
