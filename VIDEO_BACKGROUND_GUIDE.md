# 🎬 Video Background Setup Guide

## 🎥 Adding Your Nature Videos

### Step 1: Download Free Nature Videos

**Recommended Sources:**

1. **Freepik.com** (Your choice!)

   - Search: "nature drone video", "peaceful forest", "flowing water"
   - Filter: Free content
   - Download: MP4 format, 10-20 seconds
   - Resolution: 1080p or higher

2. **Pixabay.com/videos/**

   - Search: "nature", "forest", "ocean", "mountain"
   - All free, no attribution required
   - Perfect for prayer backgrounds

3. **Pexels.com/videos/**
   - High quality nature videos
   - Search: "peaceful nature", "calm water", "sunset"
   - Free for commercial use

### Step 2: Prepare Your Videos

**Recommended Video Specs:**

- **Format**: MP4
- **Duration**: 10-30 seconds (loops automatically)
- **Resolution**: 1080p (1920x1080) or 720p
- **Size**: Under 10MB for better performance

**Good Nature Themes:**

- 🌊 Gentle ocean waves
- 🌲 Peaceful forest scenes
- 🏔️ Mountain landscapes
- ☁️ Soft cloud movements
- 🌸 Flower fields swaying
- 💧 Flowing streams
- 🌅 Sunrise/sunset time-lapses

### Step 3: Add Videos to Your App

1. **Place your video file** in the `assets` folder
2. **Rename it** to `nature-background.mp4`
3. **Restart the app** with `npx expo start --clear`

### Step 4: Multiple Videos (Advanced)

You can add different videos for different times of day:

```javascript
// In TimeBasedPrayerService.js, add video paths:
morning: {
  video: require('../assets/sunrise-nature.mp4'),
  // ... other properties
},
afternoon: {
  video: require('../assets/forest-nature.mp4'),
  // ... other properties
},
evening: {
  video: require('../assets/sunset-nature.mp4'),
  // ... other properties
}
```

## 🎨 Current Implementation

**What's Already Done:**

- ✅ Video background component added
- ✅ Transparent overlay for text readability
- ✅ Removed white card background
- ✅ Auto-looping and muted video
- ✅ Fallback to color background if video fails

**What You Need to Do:**

1. Download a nature video from Freepik/Pixabay
2. Save it as `assets/nature-background.mp4`
3. Restart the app

## 🔧 Technical Details

**Video Settings:**

- **Muted**: Yes (so it doesn't interfere with prayer audio)
- **Looping**: Yes (seamless background)
- **Auto-play**: Yes (starts immediately)
- **Resize Mode**: Cover (fills screen without distortion)

**Overlay Settings:**

- **Background**: Semi-transparent black (30% opacity)
- **Text**: White with shadows for readability
- **Cards**: Dark semi-transparent instead of white

## 💡 Pro Tips

1. **Choose calming videos** - avoid fast movements
2. **Test on device** - videos look different on phone vs computer
3. **Keep file size small** - under 10MB for smooth performance
4. **Loop-friendly** - videos that transition smoothly from end to start
5. **No audio needed** - video will be muted anyway

## 🆘 Troubleshooting

**If video doesn't load:**

- Check file name is exactly `nature-background.mp4`
- Ensure file is in `assets` folder
- Try a smaller file size (under 5MB)
- Restart expo with `npx expo start --clear`

**If text is hard to read:**

- Adjust overlay opacity in `contentOverlay` style
- Choose videos with less bright/busy content
- Test on actual device, not just simulator

---

**Ready to add your peaceful nature video? Just download and place it in the assets folder! 🎬🙏**


