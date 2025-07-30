# TasteJourney Development Plan

## Developer-First Implementation Guide

### 📁 Project Structure (Next.js 15 /app Directory)

```
/app
├── page.tsx                      # Entry point: renders Chat UI
├── api/
│   ├── analyze/route.ts          # Scrape user website
│   ├── profile-taste/route.ts    # Qloo API integration
│   ├── recommend/route.ts        # Generate destinations
│   ├── enrich-destination/route.ts # Optional: event/POI enrichment
│   └── send-report/route.ts      # PDF + email delivery

/components
├── URLForm.tsx                   # Enter website URL
├── ConfirmationDialog.tsx        # Show extracted info, ask confirmation
├── ChatInterface.tsx             # Chat-style clarification Q&A
├── RecommendationsScreen.tsx     # Display travel suggestions
├── Loading.tsx                   # Skeleton or spinner
└── Toasts.tsx                    # Success/error messages

/lib
├── scraper.ts                    # Playwright logic
├── qloo.ts                       # Qloo API helper
├── travel.ts                     # Numbeo + Google Places helpers
├── report.ts                     # PDF generation
└── email.ts                      # SendGrid email logic

/styles
└── globals.css
```

### 🪄 Step-by-Step Build Plan

#### 1. User Input (Frontend)

**File:** `/components/URLForm.tsx`

- Use `<Input />` and `<Button />` from shadcn/ui
- On submit, call `POST /api/analyze`
- Add URL validation and loading states

#### 2. Scraping & Website Analysis

**File:** `/app/api/analyze/route.ts`

- Use Playwright + cheerio
- Extract: `og:title`, `og:image`, meta keywords, social links
- Return: `{ themes: string[], hints: string[], regionBias: string[] }`

#### 3. Confirmation Step (Frontend)

**File:** `/components/ConfirmationDialog.tsx`

- Accept user confirmation: "Is this analysis correct?"
- On confirm: POST to `/api/profile-taste`

#### 4. Profile via Qloo API

**File:** `/app/api/profile-taste/route.ts`

- Send themes & hints to Qloo
- Return: Taste vector (array or object of interests/locations)
- Mock this if you don't yet have API access

#### 5. Ask Follow-up Questions (Frontend)

**File:** `/components/ChatInterface.tsx`

- Ask sequentially (client-side logic):
  - Trip length?
  - Budget?
  - Preferred format?
  - Preferred/avoided regions?
- Save answers to local state or pass to final request

#### 6. Generate Travel Recommendations

**File:** `/app/api/recommend/route.ts`

- Accept `tasteVector`, `budget`, `followUps`
- Use scoring formula:
  ```
  score = 0.45 * qlooAffinity +
          0.25 * creatorDensity +
          0.15 * brandFit +
          0.10 * budgetMatch +
          0.05 * regionFit
  ```
- Return top 3 destinations with:
  `{ name, score, budgetRange, creatorsNearby, brandPartners[] }`

#### 7. Show Recommendations

**File:** `/components/RecommendationsScreen.tsx` (Already Enhanced)

- Use shadcn `<Card />` or `<Tabs />` to list destinations
- Display key stats: engagement, budget, brands

#### 8. Send Final Report (Optional)

**File:** `/app/api/send-report/route.ts`

- Button: "Send me full report"
- Call `/api/send-report` with: email, destinations, userProfile
- In `/lib/report.ts`: Build PDF using puppeteer
- In `/lib/email.ts`: Send via SendGrid

#### 9. Enrichment (Optional)

**File:** `/app/api/enrich-destination/route.ts`

- Use Google Places + Ticketmaster + YouTube API
- Add events, creators, and things to do per city

### 🔧 Dependencies to Install

#### Backend

```bash
pnpm install playwright cheerio axios openai @sendgrid/mail puppeteer
```

#### Frontend / UI

```bash
pnpm install lucide-react tailwindcss @tailwindcss/forms clsx
```

#### Dev & Linting

```bash
pnpm install -D eslint prettier @types/node
```

### 🧪 Development Phases

#### Phase 1: Core Flow (MVP)

1. Hardcode mock response for Qloo and destinations
2. Wire up chat logic to send data to recommend
3. Confirm `/analyze`, `/recommend`, and `/send-report` all return real data
4. Add skeleton loaders or spinner during fetch

#### Phase 2: API Integration

1. Integrate real Qloo API
2. Add Google Places for location data
3. Implement Numbeo for budget information
4. Connect SendGrid for email delivery

#### Phase 3: Enhancement

1. Add PDF report generation
2. Implement destination enrichment
3. Add user authentication
4. Deploy to Vercel for hackathon

### 📋 Implementation Tasks

#### High Priority

- [ ] Set up API routes structure
- [ ] Implement website scraping logic
- [ ] Create chat interface with Q&A flow
- [ ] Build recommendation scoring algorithm
- [ ] Add loading states and error handling

#### Medium Priority

- [ ] Integrate Qloo API for taste profiling
- [ ] Add budget calculation with Numbeo
- [ ] Implement PDF report generation
- [ ] Set up email delivery system
- [ ] Add destination enrichment

#### Low Priority

- [ ] User authentication system
- [ ] Analytics and tracking
- [ ] Advanced filtering options
- [ ] Social sharing features
- [ ] Mobile app considerations

### 🔑 Environment Variables Needed

```env
# API Keys
QLOO_API_KEY=your_qloo_api_key
GOOGLE_PLACES_API_KEY=your_google_places_key
SENDGRID_API_KEY=your_sendgrid_key
OPENAI_API_KEY=your_openai_key

# Database (if needed)
DATABASE_URL=your_database_url

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 🚀 Deployment Checklist

#### Pre-deployment

- [ ] All API routes return proper responses
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Environment variables configured
- [ ] Build process works locally

#### Deployment

- [ ] Deploy to Vercel
- [ ] Configure environment variables
- [ ] Test all API endpoints
- [ ] Verify email delivery works
- [ ] Check mobile responsiveness

### 📊 Data Flow Architecture

```
User Input (URL)
    ↓
Website Analysis (Scraping)
    ↓
Confirmation Dialog
    ↓
Taste Profiling (Qloo API)
    ↓
Chat Q&A (Budget, Preferences)
    ↓
Recommendation Engine
    ↓
Display Results
    ↓
Optional: Send PDF Report
```

### 🎯 Success Metrics

#### Technical

- [ ] All API routes respond within 5 seconds
- [ ] Website scraping works for 90% of URLs
- [ ] Recommendation accuracy > 80%
- [ ] Zero critical bugs in production

#### User Experience

- [ ] Complete flow takes < 3 minutes
- [ ] Users understand each step
- [ ] Recommendations feel personalized
- [ ] PDF reports are actionable

### 🔧 Next Immediate Steps

1. **Create API Route Structure**

   - Set up all route files with basic structure
   - Add proper TypeScript interfaces
   - Implement error handling patterns

2. **Build Chat Interface Logic**

   - Implement step-by-step Q&A flow
   - Add state management for user responses
   - Create smooth transitions between steps

3. **Implement Recommendation Algorithm**
   - Create scoring formula
   - Add mock data for testing
   - Build response formatting

Would you like me to generate any specific files from this plan?
