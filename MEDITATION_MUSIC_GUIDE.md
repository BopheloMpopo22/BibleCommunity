# 🎵 Meditation Music Guide - Getting 5 Songs

## 📋 **Current Setup**

I've added **5 music slots** to your meditation screen:

1. ✅ **Zen Wind** - Already added (your current music)
2. ⏳ **Ambient Peace** - Ready for you to add
3. ⏳ **Nature Sounds** - Ready for you to add
4. ⏳ **Meditation Flow** - Ready for you to add
5. ⏳ **Serene Space** - Ready for you to add

---

## 🎼 **Where to Get Free Meditation Music**

### **1. Pixabay Music** ⭐⭐⭐⭐⭐ (BEST)

**Website:** https://pixabay.com/music/

**Why It's Great:**

- ✅ 100% free
- ✅ No attribution required
- ✅ High quality
- ✅ Perfect for meditation

**How to Use:**

1. Go to https://pixabay.com/music/
2. Search for: "ambient", "meditation", "peaceful", "calm"
3. Click on a track
4. Click "Download" button
5. Choose "MP3" format
6. Save to your `assets/` folder

**Recommended Searches:**

- "ambient meditation"
- "peaceful ambient"
- "calm nature sounds"
- "meditation music"
- "serene ambient"

---

### **2. Freesound.org** ⭐⭐⭐⭐

**Website:** https://freesound.org

**Why It's Great:**

- ✅ Free ambient sounds
- ✅ Nature sounds
- ✅ Creative Commons licensed
- ✅ Good for variety

**How to Use:**

1. Create free account
2. Search for "ambient", "meditation", "nature"
3. Download MP3 files
4. Save to `assets/` folder

---

### **3. YouTube Audio Library** ⭐⭐⭐⭐

**Website:** https://studio.youtube.com/channel/UC.../music

**Why It's Great:**

- ✅ Free to use
- ✅ No copyright issues
- ✅ Large library
- ✅ Good quality

**How to Use:**

1. Go to YouTube Studio
2. Click "Audio Library"
3. Search for "ambient", "meditation"
4. Download MP3 files
5. Save to `assets/` folder

---

### **4. Incompetech** ⭐⭐⭐

**Website:** https://incompetech.com/music/

**Why It's Great:**

- ✅ Kevin MacLeod's music
- ✅ Free with attribution
- ✅ Ambient tracks available

**Note:** Requires attribution (can add in app credits)

---

## 🎯 **Recommended Music Types**

### **Perfect for Meditation:**

1. **Ambient Pads**

   - Warm, enveloping soundscapes
   - No melody, just atmosphere
   - Perfect background

2. **Nature Sounds**

   - Gentle rain
   - Forest ambience
   - Ocean waves
   - Wind through trees

3. **Soft Instrumental**

   - Gentle piano
   - Soft strings
   - Harp music
   - Flute melodies

4. **Binaural Beats**

   - Deep meditation
   - Frequency-based
   - Very calming

5. **Choir Voices**
   - Soft, distant
   - Angelic
   - Ethereal

---

## 📥 **How to Add Music to Your App**

### **Step 1: Download Music**

1. Go to **Pixabay Music** (recommended)
2. Search for "ambient meditation"
3. Download 4 MP3 files (you already have 1)
4. Name them:
   - `ambient-peace.mp3`
   - `nature-sounds.mp3`
   - `meditation-flow.mp3`
   - `serene-space.mp3`

### **Step 2: Add to Assets Folder**

```
assets/
  zen-wind-411951.mp3 (already there)
  ambient-peace.mp3 (add this)
  nature-sounds.mp3 (add this)
  meditation-flow.mp3 (add this)
  serene-space.mp3 (add this)
```

### **Step 3: Update Code**

In `screens/MeditationScreen.js`, update the `MEDITATION_MUSIC` array:

```javascript
const MEDITATION_MUSIC = [
  {
    id: "zen-wind",
    name: "Zen Wind",
    description: "Peaceful ambient sounds",
    file: require("../assets/zen-wind-411951.mp3"),
  },
  {
    id: "ambient-1",
    name: "Ambient Peace",
    description: "Calming ambient music",
    file: require("../assets/ambient-peace.mp3"), // Add this
  },
  {
    id: "ambient-2",
    name: "Nature Sounds",
    description: "Gentle nature ambience",
    file: require("../assets/nature-sounds.mp3"), // Add this
  },
  {
    id: "ambient-3",
    name: "Meditation Flow",
    description: "Flowing meditation music",
    file: require("../assets/meditation-flow.mp3"), // Add this
  },
  {
    id: "ambient-4",
    name: "Serene Space",
    description: "Serene ambient atmosphere",
    file: require("../assets/serene-space.mp3"), // Add this
  },
];
```

---

## 🎵 **Music Specifications**

### **Recommended Settings:**

- **Format:** MP3
- **Bitrate:** 128-192 kbps (good quality, small file)
- **Sample Rate:** 44.1kHz
- **Duration:** 2-5 minutes (will loop)
- **File Size:** Under 5MB per track
- **Volume:** Normalized (consistent volume)

### **Why These Specs:**

- **MP3:** Universal support, good compression
- **128-192 kbps:** Good quality, small files
- **2-5 minutes:** Long enough to loop smoothly
- **Under 5MB:** Keeps app size reasonable

---

## 🎛️ **How Users Will Use It**

### **Current Features:**

1. **Tap Music Button** → Opens music selector
2. **Select Music** → Choose from 5 options
3. **Music Plays** → Loops continuously
4. **Change Music** → Long press music button to change

### **User Experience:**

- ✅ Easy to select music
- ✅ Can change during meditation
- ✅ Music loops automatically
- ✅ Volume is balanced (30% volume)

---

## 📋 **Quick Checklist**

**Before Adding Music:**

- [ ] Download 4 MP3 files from Pixabay
- [ ] Name files clearly
- [ ] Check file size (under 5MB each)
- [ ] Test play in media player

**When Adding to App:**

- [ ] Save files to `assets/` folder
- [ ] Update `MEDITATION_MUSIC` array
- [ ] Add `require()` statements
- [ ] Test in app

**After Adding:**

- [ ] Test each music track
- [ ] Verify looping works
- [ ] Check volume levels
- [ ] Test music selector

---

## 🎯 **Recommended Tracks from Pixabay**

### **Search These Terms:**

1. **"Ambient Peace"**

   - Search: "ambient peaceful"
   - Look for: Warm, soft pads

2. **"Nature Sounds"**

   - Search: "nature ambient"
   - Look for: Rain, forest, water

3. **"Meditation Flow"**

   - Search: "meditation music"
   - Look for: Flowing, gentle

4. **"Serene Space"**
   - Search: "serene ambient"
   - Look for: Calm, spacious

---

## 💡 **Pro Tips**

1. **Test Each Track:**

   - Make sure they're not too loud
   - Check if they loop smoothly
   - Ensure they're calming

2. **Variety:**

   - Mix different types (nature, ambient, instrumental)
   - Give users options
   - Match meditation themes

3. **File Size:**

   - Compress if needed
   - Use MP3 compression tools
   - Keep under 5MB each

4. **Naming:**
   - Use clear, descriptive names
   - Match the description in app
   - Keep consistent

---

## 🚀 **Summary**

**What You Need:**

- 4 MP3 files (you have 1 already)
- Download from Pixabay Music (free)
- Save to `assets/` folder
- Update code with file paths

**Recommended Sources:**

1. **Pixabay Music** (best - free, no attribution)
2. **Freesound.org** (good variety)
3. **YouTube Audio Library** (free, large library)

**File Specs:**

- Format: MP3
- Bitrate: 128-192 kbps
- Duration: 2-5 minutes
- File Size: Under 5MB each

**Next Steps:**

1. Go to Pixabay Music
2. Download 4 tracks
3. Add to `assets/` folder
4. Update `MeditationScreen.js`
5. Test in app!

---

**You're all set!** The music selector is already built into your app. Just add the music files and update the code. 🎵
