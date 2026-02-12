import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

// Keep this list small and metadata-only so audio files are NOT bundled into the app.
// Upload these files to Firebase Storage at the matching paths (see `storagePath`).
export const MEDITATION_MUSIC_CATALOG = [
  {
    id: "zen-wind",
    name: "Zen Wind",
    description: "Peaceful ambient sounds",
    storagePath: "meditation_music/zen-wind-411951.mp3",
  },
  {
    id: "heavenly-energy",
    name: "Heavenly Energy",
    description: "Uplifting celestial music",
    storagePath: "meditation_music/heavenly-energy-188908.mp3",
  },
  {
    id: "inner-peace",
    name: "Inner Peace",
    description: "Calming meditation music",
    storagePath: "meditation_music/inner-peace-339640.mp3",
  },
  {
    id: "prayer-meditation",
    name: "Prayer Meditation",
    description: "Holy grace piano music",
    storagePath:
      "meditation_music/prayer-meditation-piano-holy-grace-heavenly-celestial-music-393549.mp3",
  },
  {
    id: "worship-piano",
    name: "Worship Piano",
    description: "Peaceful prayer instrumental",
    storagePath:
      "meditation_music/worship-piano-instrumental-peaceful-prayer-music-223373.mp3",
  },
];

const URL_CACHE_KEY = "meditation_music_url_cache_v1";

async function getCachedUrlMap() {
  try {
    const raw = await AsyncStorage.getItem(URL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.urls || typeof parsed.urls !== "object") return null;
    return parsed.urls;
  } catch {
    return null;
  }
}

async function setCachedUrlMap(urls) {
  try {
    await AsyncStorage.setItem(
      URL_CACHE_KEY,
      JSON.stringify({ urls, updatedAt: Date.now() })
    );
  } catch {
    // ignore cache write failures
  }
}

async function fetchUrlForTrack(track) {
  const r = ref(storage, track.storagePath);
  return await getDownloadURL(r);
}

class MeditationMusicService {
  static async getUrlMap() {
    const cached = await getCachedUrlMap();
    const hasAll = !!cached?.zen-wind; // quick sanity check (keys are track ids)
    if (cached && hasAll) return cached;

    const urls = {};
    await Promise.all(
      MEDITATION_MUSIC_CATALOG.map(async (track) => {
        try {
          urls[track.id] = await fetchUrlForTrack(track);
        } catch (e) {
          // leave missing; caller can handle
          console.warn(
            `[MeditationMusicService] Failed to get URL for ${track.id}:`,
            e?.message || e
          );
        }
      })
    );

    await setCachedUrlMap(urls);
    return urls;
  }

  static async getTrackUrlById(trackId) {
    if (!trackId) return null;
    const urls = await MeditationMusicService.getUrlMap();
    return urls?.[trackId] || null;
  }

  static async getTracksWithUrls() {
    const urls = await MeditationMusicService.getUrlMap();
    return MEDITATION_MUSIC_CATALOG.map((t) => ({
      ...t,
      uri: urls?.[t.id] || null,
    }));
  }
}

export default MeditationMusicService;




