# 🎵 Ambient Music & Voice Enhancement Guide

## 🎼 Free Ambient Music Sources

### **Best Free Music Sources for Prayer Apps:**

1. **Pixabay.com** ⭐⭐⭐⭐⭐

   - Royalty-free ambient music
   - Search: "ambient", "meditation", "peaceful", "harp"
   - Direct download links available
   - No attribution required

2. **Freesound.org** ⭐⭐⭐⭐

   - Ambient nature sounds
   - Soft instrumental loops
   - Creative Commons licensed
   - Search: "ambient", "soft", "peaceful"

3. **YouTube Audio Library** ⭐⭐⭐⭐

   - Free to use in apps
   - Ambient and meditation tracks
   - No copyright issues
   - Search: "ambient", "meditation"

4. **Incompetech.com** ⭐⭐⭐⭐

   - Kevin MacLeod's ambient tracks
   - Free with attribution
   - High quality ambient music
   - Perfect for prayer apps

5. **Zapsplat.com** ⭐⭐⭐
   - Free account available
   - Soft instrumental music
   - Ambient soundscapes
   - Requires free registration

## 🎤 Voice Enhancement Settings

### **Current Enhanced Settings:**

```javascript
Speech.speak(fullText, {
  language: "en-US",
  pitch: 0.9, // Lower pitch for warmth
  rate: 0.75, // Slower, contemplative pace
  quality: Speech.VoiceQuality.Enhanced,
  voice: "com.apple.ttsbundle.Samantha-compact", // Warmer voice
});
```

### **Alternative Voice Settings:**

```javascript
// For even warmer voice:
pitch: 0.85,         // Even lower pitch
rate: 0.7,           // Very slow and peaceful

// For more natural voice:
pitch: 1.0,          // Normal pitch
rate: 0.8,           // Slightly slower
```

## 🎵 Recommended Ambient Music Types

### **Perfect for Prayer Apps:**

- **Harp music** - Soft, ethereal, peaceful
- **Nature sounds** - Gentle rain, forest ambience
- **Soft piano** - Contemplative, meditative
- **Ambient pads** - Warm, enveloping soundscapes
- **Choir voices** - Soft, distant, angelic

### **Music Characteristics:**

- **Volume**: 0.15-0.2 (very low, doesn't overpower voice)
- **Tempo**: Slow (0.7-0.8 rate)
- **Loop**: Seamless, no jarring transitions
- **Duration**: 3-5 minutes minimum for looping

## 🔧 Implementation Tips

### **For Better Integration:**

1. **Download music files** to your `assets/audio/` folder
2. **Use local files** instead of external URLs
3. **Test on device** - web URLs may not work on mobile
4. **Provide fallback** - graceful degradation if music fails

### **Example Local File Usage:**

```javascript
const { sound } = await Audio.Sound.createAsync(
  require("../assets/audio/ambient-harp.mp3"),
  {
    shouldPlay: false,
    isLooping: true,
    volume: 0.15,
    rate: 0.7,
  }
);
```

## 🎯 Quick Setup Steps

1. **Find ambient music** from Pixabay or Freesound
2. **Download MP3 files** to your project
3. **Add to assets folder** (`assets/audio/`)
4. **Update the URI** in `loadBackgroundMusic()`
5. **Test the experience** - voice + music together

## 🎨 UI Enhancements

### **Music Control Button:**

- Shows when music is playing
- Allows user to toggle on/off
- Visual feedback for music state

### **Voice Settings:**

- Warmer, slower voice
- More contemplative pace
- Better integration with music

---

**Ready to create a beautiful, immersive prayer experience! 🎵✨**
