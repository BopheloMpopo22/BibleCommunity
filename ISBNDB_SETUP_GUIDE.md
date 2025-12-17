# ISBNdb API Setup Guide

## Quick Setup (5 minutes)

### Step 1: Get Your Free API Key

1. **Go to**: https://isbndb.com/
2. **Sign up** for a free account
3. **Navigate to**: Account → API Keys
4. **Copy your API key** (looks like: `YOUR_API_KEY_HERE`)

### Step 2: Add API Key to Your App

**Option A: Add to App.js (Quick Test)**
```javascript
import ISBNdbService from "./services/ISBNdbService";

// Add this in App.js, before your app renders
ISBNdbService.setApiKey("YOUR_API_KEY_HERE");
```

**Option B: Use Environment Variables (Recommended for Production)**
1. Install `react-native-dotenv` or use Expo's environment variables
2. Create `.env` file:
   ```
   ISBNDB_API_KEY=your_api_key_here
   ```
3. Import and use:
   ```javascript
   import { ISBNDB_API_KEY } from '@env';
   ISBNdbService.setApiKey(ISBNDB_API_KEY);
   ```

### Step 3: Test It

The app will automatically use ISBNdb when:
- ✅ API key is set
- ✅ Fetching metadata for curated books
- ✅ Searching for books

## What You Get

### Free Tier Benefits:
- ✅ **500 requests/day** (plenty for most apps)
- ✅ **Better metadata** than Google Books
- ✅ **More reliable** book data
- ✅ **Higher quality covers**

### What ISBNdb Provides:
- Book covers (high quality)
- Descriptions/synopsis
- Publisher information
- Publication dates
- Page counts
- Categories/subjects
- Pricing information (MSRP)

## How It Works

1. **Curated books**: Uses ISBNdb to fetch metadata (better than Google Books)
2. **Fallback**: If ISBNdb fails, uses Google Books
3. **Search**: Searches ISBNdb first, then Google Books

## Rate Limits

- **Free tier**: 500 requests/day
- **Paid tiers**: $10-50/month for more requests

**Note**: The app is smart - it only uses ISBNdb for curated books, so you won't hit limits easily.

## Troubleshooting

### "API key not configured" warning
- Make sure you called `ISBNdbService.setApiKey("your_key")`
- Check that the API key is correct

### 401 Unauthorized error
- Your API key is invalid or expired
- Check your account at isbndb.com

### 429 Too Many Requests
- You've hit the 500/day limit
- Wait 24 hours or upgrade to paid plan

## Next Steps

After setup:
1. **Test**: Reload app and check console logs
2. **Verify**: Books should have better metadata
3. **Monitor**: Check ISBNdb dashboard for usage

---

**Ready to set it up?** Just add your API key to `App.js` and you're done!


