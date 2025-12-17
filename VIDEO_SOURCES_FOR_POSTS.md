# 🎬 Video Sources for Community Posts

## 🐰 About the "Bunny Video"

The bunny video you saw (`BigBuckBunny.mp4`) is a **test/demo video** from Google's sample video bucket. It's used for testing video playback functionality, not for real posts.

**URL:** `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`

---

## ✅ **BEST FREE Video Sources for Your App**

### **1. Pexels Videos** ⭐ (Recommended)

**Website:** https://www.pexels.com/videos/

**Why it's great:**

- ✅ 100% free for commercial use
- ✅ No attribution required
- ✅ High quality (1080p, 4K available)
- ✅ Huge library of nature, lifestyle, abstract videos
- ✅ Easy to download

**How to use:**

1. Search for videos (e.g., "nature", "peaceful", "community")
2. Click on a video
3. Click "Download" button
4. Choose quality (1080p recommended)
5. Save to your `assets/` folder or upload to your storage

**Good searches for Bible Community:**

- "peaceful nature"
- "community gathering"
- "sunset landscape"
- "calm water"
- "forest walk"
- "prayer hands"
- "church service"
- "worship music"

---

### **2. Pixabay Videos**

**Website:** https://pixabay.com/videos/

**Why it's great:**

- ✅ Free for commercial use
- ✅ No attribution required
- ✅ Good quality videos
- ✅ Similar to Pexels

**How to use:**

- Same process as Pexels
- Download and use in your app

---

### **3. Coverr** (Free Stock Videos)

**Website:** https://coverr.co/

**Why it's great:**

- ✅ Free for commercial use
- ✅ Curated collection
- ✅ Good for backgrounds
- ✅ No signup required

---

### **4. Videvo** (Free & Paid)

**Website:** https://www.videvo.net/

**Why it's great:**

- ✅ Free tier available
- ✅ Large library
- ⚠️ Some require attribution (check license)
- ⚠️ Some are paid

**Note:** Filter by "Free" and check license type

---

## 📱 **How to Add Videos to Posts**

### **Option 1: Store Videos Locally (Small App)**

```javascript
// In your assets folder
assets/
  videos/
    nature-video-1.mp4
    community-video-1.mp4
    prayer-video-1.mp4

// In your code
media: {
  type: "video",
  uri: require("../assets/videos/nature-video-1.mp4")
}
```

**Pros:**

- Fast loading
- No internet needed
- Full control

**Cons:**

- Increases app size
- Limited storage

---

### **Option 2: Use Video URLs (Recommended)**

```javascript
// Direct URL from Pexels/Pixabay
media: {
  type: "video",
  uri: "https://videos.pexels.com/video-files/1234567/pexels-video-1234567.mp4"
}
```

**Pros:**

- No app size increase
- Easy to update
- Can use CDN for faster loading

**Cons:**

- Requires internet
- Need to ensure URLs stay active

---

### **Option 3: Upload to Your Own Storage**

**Best for Production:**

1. **Firebase Storage** (if using Firebase)

   - Upload videos to Firebase Storage
   - Get download URLs
   - Store URLs in Firestore

2. **AWS S3 / CloudFront**

   - Professional solution
   - Fast CDN delivery
   - Pay per storage/bandwidth

3. **Cloudinary** (Free tier available)
   - Video hosting & optimization
   - Automatic format conversion
   - Free tier: 25GB storage, 25GB bandwidth/month

---

## 🎯 **Recommended Workflow**

### **For Development/Testing:**

1. Use **Pexels/Pixabay** direct URLs
2. Quick and easy
3. No storage costs

### **For Production:**

1. Download videos from Pexels/Pixabay
2. Upload to **Firebase Storage** or **Cloudinary**
3. Store URLs in your database
4. Users upload their own videos → store in your storage

---

## 📋 **Video Specifications**

**Recommended Settings:**

- **Format:** MP4 (H.264 codec)
- **Resolution:** 1080p (1920x1080) or 720p
- **Duration:** 10-60 seconds (shorter = better)
- **File Size:** Under 10MB per video (for mobile)
- **Aspect Ratio:** 16:9 (landscape) or 9:16 (vertical)

---

## 🔍 **Finding the Right Videos**

### **For Community Posts:**

- Nature scenes
- People gathering
- Peaceful landscapes
- Daily life moments
- Abstract/artistic videos

### **For Testimonies:**

- Inspirational nature
- Sunrise/sunset
- Calm waters
- Peaceful scenes

### **For Prayer/Meditation:**

- Gentle nature
- Flowing water
- Cloud movements
- Forest scenes

---

## ⚠️ **Important Notes**

1. **Always Check License:**

   - Pexels/Pixabay = Free for commercial use ✅
   - Some sites require attribution
   - Some are paid only

2. **Video URLs Can Expire:**

   - Direct Pexels URLs might change
   - Better to download and host yourself for production

3. **File Size Matters:**

   - Large videos = slow loading
   - Compress if needed
   - Consider different qualities (HD, SD)

4. **User-Generated Content:**
   - Users can record/upload their own videos
   - Store in your Firebase/Cloudinary storage
   - Validate file size/format before upload

---

## 🚀 **Quick Start**

1. **Go to Pexels Videos:** https://www.pexels.com/videos/
2. **Search:** "peaceful nature" or "community"
3. **Download:** Click download, choose 1080p
4. **Use in App:**
   - Option A: Save to `assets/` and use `require()`
   - Option B: Upload to Firebase Storage and use URL
   - Option C: Use Pexels direct URL (for testing)

---

## 💡 **Pro Tips**

1. **Create a Video Library:**

   - Download 10-20 videos per category
   - Organize by theme (nature, community, prayer)
   - Store in organized folders

2. **Optimize Videos:**

   - Use tools like HandBrake (free) to compress
   - Reduce file size without losing quality
   - Faster loading = better UX

3. **Test on Real Devices:**

   - Videos can be heavy
   - Test on slower connections
   - Consider loading states

4. **Fallback Images:**
   - Show thumbnail while video loads
   - Better user experience
   - Already implemented in your `MediaPostCard`

---

## 📝 **Example: Adding a Video to Sample Posts**

```javascript
// In CommunityScreen.js, update samplePosts:
{
  id: "7",
  community: "Worship & Music",
  author: "David Thompson",
  title: "New worship song I wrote",
  content: "I've been working on this song...",
  type: "video",
  media: {
    type: "video",
    // Replace with real Pexels video URL
    uri: "https://videos.pexels.com/video-files/1234567/pexels-video.mp4",
    // Or use local asset
    // uri: require("../assets/videos/worship-video.mp4")
  },
  // ... rest of post data
}
```

---

**You're all set!** 🎉 Use Pexels/Pixabay for free, high-quality videos that match your app's theme.
