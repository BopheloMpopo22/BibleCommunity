import * as Speech from "expo-speech";

class VoiceService {
  // Natural voice options - using actual system voices
  static getAvailableVoices() {
    return [
      {
        id: "system_default",
        name: "System Default",
        voice: null,
        language: "en-US",
        pitch: 1.0,
        rate: 0.8,
        quality: "enhanced",
      },
      {
        id: "ios_alex",
        name: "Alex (iOS Male)",
        voice: "com.apple.ttsbundle.Alex-compact",
        language: "en-US",
        pitch: 1.0,
        rate: 0.8,
        quality: "enhanced",
      },
      {
        id: "ios_daniel",
        name: "Daniel (iOS Male)",
        voice: "com.apple.ttsbundle.Daniel-compact",
        language: "en-GB",
        pitch: 1.0,
        rate: 0.8,
        quality: "enhanced",
      },
      {
        id: "ios_samantha",
        name: "Samantha (iOS Female)",
        voice: "com.apple.ttsbundle.Samantha-compact",
        language: "en-US",
        pitch: 1.0,
        rate: 0.8,
        quality: "enhanced",
      },
      {
        id: "android_male",
        name: "Android Male",
        voice: "en-us-x-sfg#male_1-local",
        language: "en-US",
        pitch: 1.0,
        rate: 0.8,
        quality: "enhanced",
      },
      {
        id: "android_female",
        name: "Android Female",
        voice: "en-us-x-sfg#female_1-local",
        language: "en-US",
        pitch: 1.0,
        rate: 0.8,
        quality: "enhanced",
      },
      {
        id: "google_male",
        name: "Google Male",
        voice: "en-us-x-sfg#male_2-local",
        language: "en-US",
        pitch: 1.0,
        rate: 0.8,
        quality: "enhanced",
      },
    ];
  }

  // Get available voices from the device
  static async getDeviceVoices() {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      console.log("Available device voices:", voices);
      return voices;
    } catch (error) {
      console.error("Error getting device voices:", error);
      return [];
    }
  }

  // Get voice settings by ID
  static getVoiceSettings(voiceId = "samantha") {
    const voices = this.getAvailableVoices();
    const selectedVoice =
      voices.find((voice) => voice.id === voiceId) || voices[0];

    // For default voice, don't specify a voice ID to let the system choose
    const voiceSettings = {
      language: selectedVoice.language,
      pitch: selectedVoice.pitch,
      rate: selectedVoice.rate,
      quality: selectedVoice.quality,
    };

    // Only add voice property if it's not null/undefined
    if (selectedVoice.voice) {
      voiceSettings.voice = selectedVoice.voice;
    }

    return voiceSettings;
  }

  // Get default voice (Samantha)
  static getDefaultVoice() {
    return this.getVoiceSettings("samantha");
  }

  // Get male voice (Alex)
  static getMaleVoice() {
    return this.getVoiceSettings("alex");
  }

  // Get British male voice (Daniel)
  static getBritishMaleVoice() {
    return this.getVoiceSettings("daniel");
  }
}

export default VoiceService;
