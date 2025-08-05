# API Integration Guide for TasteJourney

This guide will help you set up all the APIs required for TasteJourney according to the PRD.

## 🚀 API Status Overview

### ✅ Already Implemented
- `analyze/route.ts` - Website analysis
- `profile-taste/route.ts` - Qloo Taste profiling  
- `recommendations/route.ts` - Main recommendations
- `send-report/route.ts` - Email reports
- `creators/youtube/route.ts` - YouTube creator discovery
- `flights/route.ts` - Amadeus flight API
- `hotels/route.ts` - Hotel booking API
- `location-details/route.ts` - Google Places integration
- `cost-of-living/route.ts` - Numbeo cost data

### 🔑 API Keys Required

Below are the API keys you need to obtain. I'll provide signup links and implementation details for each.

---

## 1. 🎯 Core APIs (REQUIRED)

### Qloo Taste AI™ (Already configured)
- **Status:** ✅ CONFIGURED
- **Purpose:** Core taste profiling and recommendation engine (90% weight)
- **Current Key:** `[CONFIGURED - Check .env.local]`
- **URL:** https://hackathon.api.qloo.com
- **Docs:** https://docs.qloo.com/

### SendGrid Email API (Already configured)
- **Status:** ✅ CONFIGURED  
- **Purpose:** PDF report delivery
- **Current Key:** `[CONFIGURED - Check .env.local]`
- **Free Tier:** 100 emails/day

---

## 2. ✈️ Travel & Budget APIs

### Amadeus API (Flights & Hotels)
- **Status:** ❌ NEEDS API KEY
- **Purpose:** Real-time flight prices, hotel booking
- **Signup:** https://developers.amadeus.com/register
- **Free Tier:** 10,000 API calls/month
- **Required Credentials:**
  ```env
  AMADEUS_API_KEY=your_amadeus_api_key_here
  AMADEUS_API_SECRET=your_amadeus_api_secret_here
  ```
- **Implementation:** ✅ Already coded in `/api/flights/route.ts`

### Numbeo Cost of Living API
- **Status:** ❌ NEEDS API KEY
- **Purpose:** Local cost data for budget calculations
- **Signup:** https://www.numbeo.com/common/api.jsp
- **Free Tier:** Limited requests
- **Required Credentials:**
  ```env
  NUMBEO_API_KEY=your_numbeo_api_key_here
  ```
- **Implementation:** ✅ Already coded in `/api/cost-of-living/route.ts`

---

## 3. 🎥 Social Media & Creator APIs

### YouTube Data API v3
- **Status:** ❌ NEEDS API KEY
- **Purpose:** Creator discovery, channel analytics
- **Signup:** https://console.developers.google.com/
- **Free Tier:** 10,000 quota units/day
- **Setup Steps:**
  1. Create Google Cloud Project
  2. Enable YouTube Data API v3
  3. Create API Key
  4. Restrict to YouTube Data API
- **Required Credentials:**
  ```env
  YOUTUBE_API_KEY=your_youtube_api_key_here
  ```
- **Implementation:** ✅ Already coded in `/api/creators/youtube/route.ts`

### Instagram Graph API (Optional)
- **Status:** ❌ NEEDS IMPLEMENTATION
- **Purpose:** Instagram creator discovery
- **Signup:** https://developers.facebook.com/
- **Free Tier:** Limited
- **Required Credentials:**
  ```env
  INSTAGRAM_ACCESS_TOKEN=your_instagram_token_here
  ```
- **Implementation:** ❌ Need to create `/api/creators/instagram/route.ts`

---

## 4. 🗺️ Location & Mapping APIs

### Google Places API
- **Status:** ❌ NEEDS API KEY
- **Purpose:** Location details, attractions, events
- **Signup:** https://console.developers.google.com/
- **Free Tier:** $200 credit/month
- **Setup Steps:**
  1. Same Google Cloud Project as YouTube
  2. Enable Places API
  3. Use same API Key (add Places API restriction)
- **Required Credentials:**
  ```env
  GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
  ```
- **Implementation:** ✅ Already coded in `/api/location-details/route.ts`

---

## 5. 🔍 Web Scraping APIs

### ScraperAPI (Already configured)
- **Status:** ✅ CONFIGURED
- **Purpose:** Website scraping for content analysis
- **Current Key:** `[CONFIGURED - Check .env.local]`
- **Free Tier:** 1,000 requests/month

### SerpAPI (Already configured)
- **Status:** ✅ CONFIGURED
- **Purpose:** Search results and web data
- **Current Key:** `[CONFIGURED - Check .env.local]`
- **Free Tier:** 100 searches/month

---

## 6. 🤖 AI & Language APIs (Optional)

### OpenAI API
- **Status:** ❌ NEEDS API KEY
- **Purpose:** Enhanced fact-checking, content analysis
- **Signup:** https://platform.openai.com/signup
- **Free Tier:** $5 credit for new accounts
- **Required Credentials:**
  ```env
  OPENAI_API_KEY=your_openai_api_key_here
  ```

### Gemini API (Alternative to OpenAI)
- **Status:** ❌ NEEDS API KEY
- **Purpose:** Alternative LLM for fact-checking
- **Signup:** https://makersuite.google.com/
- **Free Tier:** Generous free tier
- **Required Credentials:**
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  ```

---

## 🚀 Quick Setup Instructions

### Step 1: Priority API Keys (Get These First)
1. **YouTube Data API** - Essential for creator discovery
2. **Google Places API** - Essential for location data  
3. **Amadeus API** - Essential for travel pricing

### Step 2: Setup Commands
1. Get API keys from the signup links above
2. Update your `.env.local` file
3. Test each API route individually

### Step 3: Testing Each API

#### Test YouTube Creators API:
```bash
curl "http://localhost:3000/api/creators/youtube?location=Tokyo&keyword=travel"
```

#### Test Flights API:
```bash
curl "http://localhost:3000/api/flights?origin=NYC&destination=NRT&departureDate=2025-09-01"
```

#### Test Location Details API:
```bash
curl "http://localhost:3000/api/location-details?place=Tokyo"
```

#### Test Cost of Living API:
```bash
curl "http://localhost:3000/api/cost-of-living?city=Tokyo"
```

---

## 📋 Implementation Checklist

### Required for MVP:
- [ ] Get YouTube Data API key
- [ ] Get Google Places API key  
- [ ] Get Amadeus API credentials
- [ ] Test all core API routes
- [ ] Update frontend to use real API data

### Optional Enhancements:
- [ ] Get Numbeo API key
- [ ] Get OpenAI/Gemini API key
- [ ] Implement Instagram creator discovery
- [ ] Add TikTok creator discovery
- [ ] Implement event discovery (Ticketmaster)

---

## 🔧 Troubleshooting

### Common Issues:
1. **API Key Invalid:** Double-check the key in .env.local
2. **Rate Limits:** Most APIs have daily limits - implement caching
3. **CORS Issues:** Add proper headers in API routes
4. **Quota Exceeded:** Monitor usage in API dashboards

### Fallback Strategy:
Each API route includes mock data fallbacks when APIs are unavailable, ensuring the demo works even without all keys.

---

## 📊 API Usage Monitoring

Monitor your API usage to stay within free tiers:
- **YouTube:** https://console.developers.google.com/apis/api/youtube.googleapis.com/quotas
- **Google Places:** https://console.developers.google.com/apis/api/places-backend.googleapis.com/quotas
- **Amadeus:** https://developers.amadeus.com/my-apps
- **SendGrid:** https://app.sendgrid.com/stats

---

Let me know which API keys you'd like to set up first, and I can guide you through the specific process for each one!
