# Bookstore Setup Instructions

## ✅ What's Already Built

The bookstore feature is fully integrated into your app! Here's what's ready:

1. ✅ **BookstoreScreen** - Browse and search Christian books
2. ✅ **BookDetailScreen** - View book details and purchase links
3. ✅ **Google Books API Service** - Fetches book data (no API key needed!)
4. ✅ **Affiliate Service** - Generates affiliate links (ready for your IDs)
5. ✅ **Navigation** - Added to Prayer screen (full-width box after Community Prayers)

## 🚀 Quick Start (To Launch This Week)

### Step 1: Apply to Amazon Associates (Do This First - Fastest!)

1. Go to: https://affiliate-program.amazon.com
2. Click "Join Now for Free"
3. Select South Africa as your country
4. Fill out the form:
   - Website/App URL: Your app store listing or website
   - Description: "Christian Bible Community mobile app"
   - How you'll drive traffic: "Mobile app with Christian content"
5. Submit (takes 10 minutes)
6. **Wait 24-48 hours for approval**

### Step 2: Once Amazon Approves

1. Log into Amazon Associates dashboard
2. Find your affiliate ID (format: `yourname-20`)
3. Open `services/AffiliateService.js`
4. Find line 9: `amazon: null,`
5. Replace `null` with your affiliate ID: `amazon: 'yourname-20',`
6. Save the file

**Example:**

```javascript
const AFFILIATE_IDS = {
  amazon: "biblecommunity-20", // ← Your ID here
  faithgateway: null,
  christianbook: null,
};
```

### Step 3: Test the Bookstore

1. Run your app
2. Go to Prayer tab
3. Scroll down to "Bookstore" box (full width, after Community Prayers)
4. Tap it
5. Browse books - they should load from Google Books API
6. Tap a book to see details
7. Tap "Buy on Amazon" - should open Amazon with your affiliate link

### Step 4: Apply to Other Affiliates (Optional - Can Wait)

**FaithGateway** (3-7 days approval):

- Go to: https://faithgateway.com/pages/affiliate
- Apply (similar process)
- Once approved, add ID to `AffiliateService.js`

**Christianbook.com** (7-14 days, requires $313 annual sales):

- Wait until you have some traffic
- Go to: https://www.christianbook.com/page/affiliate-program
- Apply
- Once approved, add ID to `AffiliateService.js`

## 📱 How It Works

### For Users:

1. User taps "Bookstore" on Prayer screen
2. Sees featured books and can search
3. Taps a book to see details
4. Taps "Buy on Amazon" (or other retailer)
5. Opens Amazon website with your affiliate link
6. User purchases → You earn commission!

### Technical Flow:

```
User → BookstoreScreen → Google Books API (free, no key needed)
                      → BookDetailScreen → AffiliateService
                      → Generates affiliate link → Opens browser
```

## 🎨 Customization

### Change Bookstore Box Color

In `screens/PrayerScreen.js`, find:

```javascript
bookstoreBox: { backgroundColor: "rgba(101, 67, 33, 0.2)" },
```

Change the color values to match your design.

### Change Icon

Currently using Ionicons "library" icon. To use an image instead:

1. Add a bookstore icon image to `assets/`
2. Import it in `PrayerScreen.js`
3. Replace `<Ionicons name="library" ... />` with `<Image source={BookstoreIcon} ... />`

## ⚠️ Important Notes

1. **Google Books API**: No API key needed! It's free and works immediately.

2. **Affiliate Links**: Work even without affiliate IDs - they just won't have your ID attached. Users can still buy, you just won't earn commission.

3. **Launch Ready**: You can launch the app NOW with Amazon links (once approved). Other affiliates can be added later.

4. **Disclosure**: The app already includes affiliate disclosure text at the bottom of bookstore screens.

5. **Privacy**: Users are redirected to external sites (Amazon, etc.) - your app never handles payment info.

## 🐛 Troubleshooting

### Books Not Loading?

- Check internet connection
- Google Books API might be rate-limited (1,000 requests/day)
- Try searching for a specific book title

### Affiliate Links Not Working?

- Make sure you added your affiliate ID to `AffiliateService.js`
- Check that the ID format is correct (no extra spaces)
- Test the link manually in a browser

### App Crashes When Opening Bookstore?

- Check console logs for errors
- Make sure `BookstoreScreen` and `BookDetailScreen` are imported in `App.js`
- Verify navigation route names match

## 📊 Next Steps (After Launch)

1. **Monitor Performance**: Check Amazon Associates dashboard for clicks/sales
2. **Add More Affiliates**: Apply to FaithGateway and Christianbook.com
3. **Curate Books**: Consider adding a "Featured" section with hand-picked books
4. **User Feedback**: Ask users what books they want to see
5. **Categories**: Filter by categories (Devotionals, Theology, etc.) - UI is ready, just needs filtering logic

## ✅ Launch Checklist

- [ ] Applied to Amazon Associates
- [ ] Got Amazon affiliate ID
- [ ] Added affiliate ID to `AffiliateService.js`
- [ ] Tested bookstore navigation
- [ ] Tested book search
- [ ] Tested affiliate link (opens Amazon)
- [ ] Verified disclosure text is visible
- [ ] Ready to launch! 🚀

---

**You're ready to launch!** The bookstore works immediately with Google Books API. Once Amazon approves (24-48 hours), add your affiliate ID and you're earning commissions!
