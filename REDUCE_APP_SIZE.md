# 📦 How to Reduce App Size (Under 200 MB)

## ⚠️ Problem: App Bundle Exceeds 200 MB

Your app bundle is too large. Here's how to fix it:

---

## 🔍 What's Making It Large

Looking at your assets folder, you have:
- **Large image files** (1920px versions are very large - can be 5-10 MB each)
- **Multiple audio files** (MP3 files can be 2-5 MB each)
- **Many high-resolution images**

---

## ✅ Solution: Optimize Assets

### Option 1: Use Smaller Image Versions (Quickest Fix)

**Replace large images with smaller versions:**

1. **For 1920px images**, use the 640px versions instead:
   - `field-3629120_1920.jpg` → Use `field-3629120_640.jpg`
   - `sea-4242303_1920.jpg` → Use `sea-4242303_640.jpg`

2. **Compress other large images:**
   - Use online tools like TinyPNG or Squoosh to compress images
   - Target: Keep images under 500 KB each

3. **Remove duplicate/unused images:**
   - You have multiple versions of some images (e.g., Peace.jpg, Peace photo.jpg, Peace Cover letter.jpg)
   - Keep only the ones you actually use

### Option 2: Move Assets to Firebase Storage (Better Long-term)

**Move large assets to Firebase Storage and load them dynamically:**

1. **Upload large images/videos to Firebase Storage**
2. **Load them from URLs instead of bundling**
3. **Cache them locally after first download**

**Benefits:**
- ✅ Reduces app size significantly
- ✅ Can update assets without app update
- ✅ Faster initial app download

---

## 🎯 Quick Fix Steps (Do This Now)

### Step 1: Remove/Replace Large Files

**Files to check and optimize:**

1. **Large images (1920px):**
   - `field-3629120_1920.jpg` - Replace with 640px version
   - `sea-4242303_1920.jpg` - Replace with 640px version
   - Any other `_1920.jpg` files

2. **Compress all JPG files:**
   - Use TinyPNG: https://tinypng.com/
   - Upload each image
   - Download compressed version
   - Replace in assets folder

3. **Check audio files:**
   - MP3 files should be under 2 MB each
   - If larger, compress them or use shorter versions

### Step 2: Update Code to Use Smaller Images

**In `AssetPreloadService.js` and other files:**

Replace:
```javascript
field-3629120_1920.jpg
```
With:
```javascript
field-3629120_640.jpg
```

### Step 3: Rebuild

After optimizing assets:
```bash
eas build --platform android --profile production
```

---

## 📊 Target Sizes

**Aim for:**
- **Images:** Under 500 KB each (preferably 100-300 KB)
- **Audio:** Under 2 MB each
- **Total app size:** Under 150 MB (to be safe)

---

## 🚀 Recommended Approach

**For now (quick fix):**
1. Replace `_1920.jpg` with `_640.jpg` versions
2. Compress all images using TinyPNG
3. Rebuild

**Later (better solution):**
1. Move large assets to Firebase Storage
2. Load them dynamically
3. Cache locally

---

## 💡 Tools to Help

1. **TinyPNG** - Compress images: https://tinypng.com/
2. **Squoosh** - Advanced image compression: https://squoosh.app/
3. **Audacity** - Compress audio files (if needed)

---

## ✅ After Optimizing

1. **Rebuild your app:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Check the new size** - should be under 200 MB

3. **Upload to Google Play** - should work now!

---

**Start by replacing the large 1920px images with 640px versions - that alone should save significant space!**

