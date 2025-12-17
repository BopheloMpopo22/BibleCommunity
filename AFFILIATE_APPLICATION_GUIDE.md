# Affiliate Program Application Guide

## Quick Approval Timeline

| Affiliate Program     | Approval Time      | Easiest to Get?                     |
| --------------------- | ------------------ | ----------------------------------- |
| **Amazon Associates** | 24-48 hours        | ⭐⭐⭐ YES - Fastest                |
| **FaithGateway**      | 3-7 business days  | ⭐⭐ Medium                         |
| **Christianbook.com** | 7-14 business days | ⭐ Slower (requires $313 min sales) |

**Recommendation**: Start with **Amazon Associates** first - it's fastest and you can launch immediately. Add others as they approve.

---

## How Google Books API Works with Affiliate Links

✅ **NO CONFLICT** - They work together perfectly:

- **Google Books API**: Provides book metadata (title, author, cover image, description, ISBN)
- **Affiliate Links**: Separate URLs that redirect users to retailer websites to purchase

**How it works**:

1. Use Google Books API to search and display books
2. When user clicks "Buy Now", generate affiliate link using ISBN/title
3. Affiliate link opens retailer website (Amazon, Christianbook.com, etc.)
4. User purchases on retailer site → You earn commission

**Example Flow**:

```
User sees book (from Google Books API)
  ↓
Clicks "Buy on Amazon"
  ↓
Opens: https://amazon.com/dp/ISBN?tag=YOUR_AFFILIATE_ID
  ↓
User purchases → You earn commission
```

---

## 1. Amazon Associates (FASTEST - Start Here) ⭐

### Application Steps

1. **Go to**: https://affiliate-program.amazon.com
2. **Click**: "Join Now for Free"
3. **Select**: Your country (South Africa)
4. **Fill out form**:
   - Website/App URL: Your app store listing or website
   - Describe your site: "Christian Bible Community mobile app"
   - How do you plan to drive traffic: "Mobile app with Christian content"
   - Primary website language: English
5. **Submit** and wait 24-48 hours

### What You'll Get

- **Affiliate ID**: Format `yourname-20` (e.g., `biblecommunity-20`)
- **Link Builder Tool**: Generate affiliate links easily
- **Dashboard**: Track clicks and earnings

### Approval Requirements

- ✅ Functional website/app (your app qualifies)
- ✅ Content that matches Amazon's policies
- ✅ No adult content (you're good!)

### After Approval

1. Log into Amazon Associates dashboard
2. Go to "Tools" → "Link Builder"
3. Search for books by ISBN or title
4. Copy affiliate links

**Link Format**:

```
https://amazon.com/dp/ISBN?tag=YOUR_AFFILIATE_ID
```

### Commission Rates

- Books: 4.5% commission
- Cookie duration: 24 hours
- Payment: Monthly (if you earn $10+)

---

## 2. FaithGateway (3-7 Days)

### Application Steps

1. **Go to**: https://faithgateway.com/pages/affiliate
2. **Click**: "Apply Now" or "Join Program"
3. **Fill out application**:
   - Website/App URL
   - Describe your audience: "Christian mobile app users seeking books and devotionals"
   - Expected monthly traffic
   - How you'll promote: "In-app bookstore feature"
4. **Submit** and wait 3-7 business days

### What You'll Get

- **Affiliate Dashboard**: Track performance
- **Link Generator**: Create affiliate links
- **Marketing Materials**: Banners and graphics

### Approval Requirements

- ✅ Christian-focused content (you qualify!)
- ✅ Active website/app
- ✅ Aligns with their values

### After Approval

1. Log into affiliate dashboard
2. Search for books
3. Generate affiliate links

**Link Format**:

```
https://faithgateway.com/product/BOOK_ID?ref=YOUR_AFFILIATE_ID
```

### Commission Rates

- Varies by product (typically 5-10%)
- Cookie duration: 60 days
- Payment: Monthly

---

## 3. Christianbook.com (7-14 Days - Requires Sales Minimum)

### Application Steps

1. **Go to**: https://www.christianbook.com/page/affiliate-program
2. **Click**: "Join Now" or "Apply"
3. **Fill out application**:
   - Website/app URL
   - Describe your site: "Christian Bible Community mobile app"
   - Expected monthly visitors
   - How you'll promote: "In-app bookstore"
4. **Submit** and wait 7-14 business days

### What You'll Get

- **Affiliate Dashboard**: Performance tracking
- **Product Feed**: Access to 550,000+ products
- **Link Builder**: Generate affiliate links

### Approval Requirements

⚠️ **IMPORTANT**:

- Must generate **$313 minimum in sales annually** (about $26/month)
- If you don't meet this, they may reject or suspend your account
- **Recommendation**: Start with Amazon/FaithGateway first, then apply once you have some traffic

### After Approval

1. Log into affiliate dashboard
2. Search products
3. Generate affiliate links

**Link Format**:

```
https://www.christianbook.com/product/BOOK_ID?p=YOUR_AFFILIATE_ID
```

### Commission Rates

- Varies by product category (typically 5-8%)
- Cookie duration: 30-60 days
- Payment: Monthly (if you earn $25+)

---

## Application Checklist

### Amazon Associates (Do First - Fastest)

- [ ] Go to https://affiliate-program.amazon.com
- [ ] Click "Join Now for Free"
- [ ] Fill out application (takes 10 minutes)
- [ ] Submit
- [ ] Wait 24-48 hours for approval
- [ ] Once approved, get your affiliate ID

### FaithGateway (Do Second)

- [ ] Go to https://faithgateway.com/pages/affiliate
- [ ] Click "Apply Now"
- [ ] Fill out application
- [ ] Submit
- [ ] Wait 3-7 business days
- [ ] Check email for approval

### Christianbook.com (Do Last - After Traffic)

- [ ] Wait until you have some app users
- [ ] Go to https://www.christianbook.com/page/affiliate-program
- [ ] Apply (mention you already have Amazon/FaithGateway)
- [ ] Wait 7-14 business days
- [ ] Note: May need to prove $313 annual sales potential

---

## What to Put in Applications

### Website/App URL

- If you have a website: Use that
- If not: Use your app store listing URL (Google Play/App Store)
- Or: Use a simple landing page URL

### Description Examples

**For Amazon**:

> "Bible Community is a mobile app for Christians featuring daily prayers, scripture readings, meditation, and community features. We plan to add a bookstore section where users can discover and purchase Christian books."

**For FaithGateway**:

> "Our Christian mobile app serves thousands of users seeking spiritual growth. We're adding a bookstore feature to help users discover quality Christian books from trusted publishers like Zondervan and Thomas Nelson."

**For Christianbook.com**:

> "Bible Community app provides daily Christian content to a growing user base. We're integrating a bookstore to help users find Christian books, Bibles, and resources. We expect steady growth in book referrals."

---

## After Approval - Integration Steps

### 1. Store Affiliate IDs Securely

Create a config file (don't commit to git):

```javascript
// config/affiliateConfig.js (add to .gitignore)
export const AFFILIATE_IDS = {
  amazon: "YOUR_AMAZON_ID", // e.g., 'biblecommunity-20'
  faithgateway: "YOUR_FAITHGATEWAY_ID",
  christianbook: "YOUR_CHRISTIANBOOK_ID",
};
```

### 2. Generate Affiliate Links

```javascript
// services/AffiliateService.js
export function generateAmazonLink(isbn) {
  return `https://amazon.com/dp/${isbn}?tag=${AFFILIATE_IDS.amazon}`;
}

export function generateFaithGatewayLink(productId) {
  return `https://faithgateway.com/product/${productId}?ref=${AFFILIATE_IDS.faithgateway}`;
}

export function generateChristianbookLink(productId) {
  return `https://www.christianbook.com/product/${productId}?p=${AFFILIATE_IDS.christianbook}`;
}
```

### 3. Display Multiple Options

Show all available retailers:

- "Buy on Amazon" (if available)
- "Buy on FaithGateway" (if available)
- "Buy on Christianbook.com" (if available)

Let users choose their preferred retailer!

---

## Timeline for Production Launch

### Week 1 (This Week)

**Day 1-2**:

- ✅ Apply to Amazon Associates (instant application)
- ✅ Build bookstore screen (can work without affiliate IDs)
- ✅ Integrate Google Books API

**Day 3-4**:

- ✅ Wait for Amazon approval (24-48 hours)
- ✅ Once approved, integrate Amazon affiliate links
- ✅ Apply to FaithGateway

**Day 5-7**:

- ✅ Test bookstore feature
- ✅ Add affiliate disclosure
- ✅ Launch app (with Amazon links working)

### Week 2 (Next Week)

- ✅ FaithGateway approval (3-7 days) → Add their links
- ✅ Apply to Christianbook.com (if you want)
- ✅ Monitor performance

---

## Important Notes

1. **You can launch without all affiliates**: Start with Amazon, add others as they approve
2. **Google Books API is free**: No approval needed, just get API key
3. **No conflict**: Google Books provides data, affiliates provide purchase links
4. **Disclosure required**: Add "We may earn commission from purchases" text
5. **Test links**: Make sure affiliate links work before launch

---

## Quick Start Checklist

- [ ] Apply to Amazon Associates NOW (takes 10 minutes)
- [ ] Get Google Books API key (instant)
- [ ] Build bookstore screen (this week)
- [ ] Once Amazon approves, add affiliate links
- [ ] Apply to FaithGateway (can wait a few days)
- [ ] Launch app with Amazon links working
- [ ] Add FaithGateway links when approved

---

**Bottom Line**: Apply to Amazon Associates today - you'll likely be approved by tomorrow or the next day. You can launch your app with Amazon affiliate links working, then add others as they approve!
