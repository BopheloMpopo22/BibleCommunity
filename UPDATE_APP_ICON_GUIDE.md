# How to Update Your App Icon

## Step-by-Step Instructions

### Step 1: Save Your Icon File

1. **Copy your 1024x1024 PNG icon** to the `assets` folder
2. **Rename it to `icon.png`** (replace the existing one)
3. **Location**: `C:\Users\bophe\BibleCommunity\assets\icon.png`

**Important**: Make sure the file is exactly named `icon.png` (lowercase)

---

### Step 2: Update Android Adaptive Icon (Optional but Recommended)

For Android, you also need an adaptive icon:

1. **Use the same icon** or create a version without background
2. **Save it as `adaptive-icon.png`** in the `assets` folder
3. **Location**: `C:\Users\bophe\BibleCommunity\assets\adaptive-icon.png`

**Note**: The adaptive icon should be 1024x1024 PNG. Android will automatically crop it to a circle/square shape.

---

### Step 3: Clear Cache and Restart

After replacing the icon files, you need to clear the cache and restart:

**Option A: Using Expo CLI (Recommended)**

1. **Stop your current app** (if running)
2. **Clear cache and restart**:
   ```bash
   npx expo start --clear
   ```
3. **Press `a` for Android** or `i` for iOS to reload

**Option B: Manual Cache Clear**

1. **Stop your app**
2. **Delete cache folders**:
   - Delete `node_modules/.cache` (if exists)
   - Delete `.expo` folder (if exists)
3. **Restart**:
   ```bash
   npx expo start
   ```

---

### Step 4: Rebuild the App (For Real Device Testing)

If you're testing on a **real phone** (not simulator), you may need to rebuild:

**For Development Build:**
```bash
npx expo run:android
# or
npx expo run:ios
```

**For EAS Build (Production-like):**
```bash
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

---

### Step 5: Verify the Icon

1. **Check the app icon** on your phone's home screen
2. **Check the app icon** in the app drawer/launcher
3. **Check the app icon** in the app switcher

---

## Troubleshooting

### Icon Not Updating?

1. **Check file name**: Must be exactly `icon.png` (lowercase)
2. **Check file location**: Must be in `assets/` folder
3. **Clear cache**: Use `npx expo start --clear`
4. **Rebuild app**: Icons sometimes require a full rebuild
5. **Uninstall and reinstall**: Sometimes needed for real devices

### Icon Looks Blurry?

- Make sure your icon is exactly 1024x1024 pixels
- Use PNG format (not JPG)
- Ensure high quality (not compressed)

### Icon Not Showing on Android?

- Check `adaptive-icon.png` exists
- Make sure both `icon.png` and `adaptive-icon.png` are in assets folder
- Rebuild the Android app

---

## Quick Commands Reference

```bash
# Clear cache and start
npx expo start --clear

# Rebuild for Android
npx expo run:android

# Rebuild for iOS
npx expo run:ios

# EAS Build (if using)
eas build --profile development --platform android
```

---

## File Structure

Your `assets` folder should have:
```
assets/
  ├── icon.png (1024x1024 - your new icon)
  ├── adaptive-icon.png (1024x1024 - for Android)
  └── ... (other assets)
```

---

## Next Steps

Once your icon is working:
1. ✅ Test on both iOS and Android if possible
2. ✅ Verify it looks good at different sizes
3. ✅ Make sure it's readable on the home screen
4. ✅ Proceed with app store submission!

Good luck! 🎉

