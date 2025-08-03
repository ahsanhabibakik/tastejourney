# Product Requirements & Reference (PRD Summary)

## Product Name: Creator Journey Chatbot

**Prepared by:** AI Buddy Team  
**Date:** July 29, 2025  
**Version:** 1.0

### Overview

Creator Journey is an AI-powered chatbot for content creators who travel. It scrapes the user's website, analyzes content, integrates with Qloo Taste AI™, and recommends travel destinations optimized for:

- Audience Engagement
- Brand Collaboration Opportunities
- Monetization & Product Sales Potential
- Creator Collaborations at the Location
- Budget Accuracy & Stretch Goals

#### User Journey

1. User submits website URL
2. System scrapes and analyzes content, themes, audience, and social links
3. User confirms extracted data
4. Qloo Taste AI™ generates taste vector
5. Chatbot asks up to 4 clarification questions (trip length, budget, content format, region)
6. Recommendations generated (Qloo 90% + website 10%)
7. Top 3 destinations shown in chat, PDF report sent via email
8. User can continue chatting for more info

#### Functional Requirements

- Website Content Analysis & Extraction (Playwright, Cheerio)
- Taste Vector Generation (Qloo Taste AI™)
- Budget Calculations (Amadeus, Numbeo)
- Creator/Brand Collaboration Recommendations (YouTube, Instagram, TikTok, Social Searcher)
- Fact-Checking (Wikipedia, Wikidata, RAG)
- Interactive Q&A (max 4 questions)
- PDF Report Generation (Puppeteer)
- Email Delivery (SendGrid)

#### Technical Requirements

##### Scraping Approach for Live Hackathon Deployment

- For local/dev: Use Playwright (free, works locally, not on Vercel).
- For live/Vercel: Use ScraperAPI (free tier) as primary, Tarvily (free tier) as secondary.
- If both APIs are rate-limited/exhausted, fallback to Cheerio + fetch for static/non-JS sites.
- Clearly document API usage limits in README and UI.
- All scraping code must handle API errors and gracefully degrade to next available method.
- No paid APIs required for MVP/hackathon demo.
- See `/lib/scraper.ts` for implementation details.

#### Recommendation Scoring Logic

```
Total_Score = (0.45 × Qloo Affinity) +
              (0.25 × Community Engagement) +
              (0.15 × Brand Collaboration Fit) +
              (0.10 × Budget Alignment) +
              (0.05 × Local Creator Collaboration Potential)
```

Recommendations outside budget, visa, or disliked regions are filtered out.

#### Output

- Chatbot: Top 3 destinations, highlights, engagement, brands, creators, budget, events
- Email: PDF report with detailed breakdown, cost analysis, confidence markers

#### Success Metrics

- User satisfaction (NPS ≥ 8)
- Recommendation accuracy (≥ 95%)
- Email open rate (>60%)
- API call efficiency (within free tier limits)

#### Future Roadmap

- Paid API integrations
- Enhanced personalization
- Monetization via affiliate/premium
- Expanded fact-checking

---

# TasteJourney Implementation Tasks

## Ready-to-Code Task List

### 🎯 TASK 1: API Route Structure

**Priority:** HIGH | **Time:** 2 hours

#### Files to Create:

1. `/app/api/analyze/route.ts`
2. `/app/api/profile-taste/route.ts`
3. `/app/api/recommend/route.ts`
4. `/app/api/send-report/route.ts`

#### Code Template for `/app/api/analyze/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { analyzeWebsite } from '@/lib/scraper'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    const analysis = await analyzeWebsite(url)
    return NextResponse.json(analysis)
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
```

#### Acceptance Criteria:

- [ ] All routes return proper JSON responses
- [ ] Error handling for invalid inputs
- [ ] TypeScript interfaces defined
- [ ] CORS headers if needed

---

### 🎯 TASK 2: Website Scraper Implementation

**Priority:** HIGH | **Time:** 3 hours

#### File to Create: `/lib/scraper.ts`

#### Code Template:

```typescript
import { chromium } from 'playwright'
import * as cheerio from 'cheerio'

export interface WebsiteAnalysis {
  themes: string[]
  hints: string[]
  regionBias: string[]
  socialLinks: string[]
  title: string
  description: string
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto(url, { waitUntil: 'networkidle' })
    const content = await page.content()
    const $ = cheerio.load(content)

    // Extract data logic here
    const analysis: WebsiteAnalysis = {
      themes: extractThemes($),
      hints: extractHints($),
      regionBias: extractRegions($),
      socialLinks: extractSocialLinks($),
      title:
        $('title').text() ||
        $('meta[property="og:title"]').attr('content') ||
        '',
      description: $('meta[name="description"]').attr('content') || ''
    }

    return analysis
  } finally {
    await browser.close()
  }
}
```

#### Acceptance Criteria:

- [ ] Extracts og:title, og:description, meta keywords
- [ ] Finds social media links
- [ ] Identifies content themes
- [ ] Handles errors gracefully
- [ ] Works with 90% of websites

---

### 🎯 TASK 3: Enhanced Chat Interface

**Priority:** HIGH | **Time:** 4 hours

#### File to Update: `/components/ChatInterface.tsx`

#### Required Features:

1. **Sequential Q&A Flow:**

   - Trip duration (1-3 days, 4-7 days, 1-2 weeks, 2+ weeks)
   - Budget range ($500-1000, $1000-2500, $2500-5000, $5000+)
   - Travel style (Adventure, Luxury, Cultural, Beach, Urban)
   - Content focus (Photography, Food, Lifestyle, Adventure)

2. **State Management:**

```typescript
interface ChatState {
  step: 'url' | 'confirmation' | 'questions' | 'recommendations'
  currentQuestion: number
  answers: {
    duration?: string
    budget?: string
    style?: string
    contentFocus?: string
  }
  websiteData?: WebsiteAnalysis
}
```

#### Acceptance Criteria:

- [ ] Smooth transitions between questions
- [ ] Progress indicator
- [ ] Can go back to previous questions
- [ ] Validates all answers before proceeding
- [ ] Typing indicators for realistic chat feel

---

### 🎯 TASK 4: Recommendation Engine

**Priority:** HIGH | **Time:** 5 hours

#### File to Create: `/app/api/recommend/route.ts`

#### Scoring Algorithm:

```typescript
interface RecommendationInput {
  tasteVector: number[]
  budget: string
  duration: string
  style: string
  contentFocus: string
  websiteThemes: string[]
}

function calculateScore(
  destination: Destination,
  input: RecommendationInput
): number {
  const qlooAffinity = calculateQlooMatch(destination.tags, input.tasteVector)
  const creatorDensity = destination.activeCreators / 1000 // Normalize
  const brandFit = calculateBrandMatch(destination.brands, input.contentFocus)
  const budgetMatch = calculateBudgetMatch(destination.avgCost, input.budget)
  const regionFit = calculateRegionMatch(
    destination.region,
    input.websiteThemes
  )

  return (
    0.45 * qlooAffinity +
    0.25 * creatorDensity +
    0.15 * brandFit +
    0.1 * budgetMatch +
    0.05 * regionFit
  )
}
```

#### Mock Data Structure:

```typescript
const mockDestinations: Destination[] = [
  {
    id: 1,
    name: 'Bali, Indonesia',
    tags: ['adventure', 'culture', 'food', 'beach'],
    activeCreators: 142,
    avgCost: 1500,
    brands: ['adventure-gear', 'food-tours', 'hotels'],
    region: 'southeast-asia'
    // ... other properties
  }
]
```

#### Acceptance Criteria:

- [ ] Returns top 3 scored destinations
- [ ] Includes all required data for frontend
- [ ] Scoring algorithm is tunable
- [ ] Mock data covers various destination types

---

### 🎯 TASK 5: Qloo API Integration

**Priority:** MEDIUM | **Time:** 3 hours

#### File to Create: `/lib/qloo.ts`

#### Code Template:

```typescript
interface QlooRequest {
  themes: string[]
  hints: string[]
  demographics?: {
    age?: string
    location?: string
  }
}

interface QlooResponse {
  tasteVector: number[]
  recommendations: string[]
  confidence: number
}

export async function getQlooProfile(data: QlooRequest): Promise<QlooResponse> {
  // Mock implementation first
  return {
    tasteVector: [0.8, 0.6, 0.9, 0.4, 0.7],
    recommendations: ['adventure', 'culture', 'food'],
    confidence: 0.85
  }

  // Real implementation:
  // const response = await fetch('https://api.qloo.com/v1/taste', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.QLOO_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify(data)
  // })
}
```

#### Acceptance Criteria:

- [ ] Mock version works for development
- [ ] Real API integration ready
- [ ] Error handling for API failures
- [ ] Rate limiting considerations

---

### 🎯 TASK 6: PDF Report Generation

**Priority:** MEDIUM | **Time:** 4 hours

#### File to Create: `/lib/report.ts`

#### Features Required:

1. **PDF Structure:**

   - Cover page with user's website info
   - Executive summary
   - Top 3 destinations with details
   - Budget breakdowns
   - Brand collaboration contacts
   - Content creation tips

2. **Code Template:**

```typescript
import puppeteer from 'puppeteer'

interface ReportData {
  userWebsite: string
  destinations: Recommendation[]
  userProfile: any
  generatedAt: Date
}

export async function generatePDF(data: ReportData): Promise<Buffer> {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  const html = generateReportHTML(data)
  await page.setContent(html)

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' }
  })

  await browser.close()
  return pdf
}
```

#### Acceptance Criteria:

- [ ] Professional-looking PDF design
- [ ] All recommendation data included
- [ ] Actionable insights and tips
- [ ] Branded with TasteJourney styling

---

### 🎯 TASK 7: Email Delivery System

**Priority:** MEDIUM | **Time:** 2 hours

#### File to Create: `/lib/email.ts`

#### Code Template:

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendReportEmail(
  email: string,
  pdfBuffer: Buffer,
  userName: string
): Promise<boolean> {
  const msg = {
    to: email,
    from: 'reports@tastejourney.ai',
    subject: 'Your Personalized Travel Recommendations',
    html: getEmailTemplate(userName),
    attachments: [
      {
        content: pdfBuffer.toString('base64'),
        filename: 'travel-recommendations.pdf',
        type: 'application/pdf',
        disposition: 'attachment'
      }
    ]
  }

  try {
    await sgMail.send(msg)
    return true
  } catch (error) {
    console.error('Email send failed:', error)
    return false
  }
}
```

#### Acceptance Criteria:

- [ ] Professional email template
- [ ] PDF attachment works
- [ ] Error handling for failed sends
- [ ] Unsubscribe link included

---

### 🎯 TASK 8: Loading States & Error Handling

**Priority:** HIGH | **Time:** 2 hours

#### Files to Create/Update:

1. `/components/Loading.tsx`
2. `/components/Toasts.tsx`
3. Update all components with loading states

#### Loading Component Template:

```typescript
export function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className='flex flex-col items-center justify-center p-8'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      <p className='mt-4 text-muted-foreground'>{message}</p>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className='animate-pulse'>
      <div className='h-48 bg-muted rounded-lg mb-4'></div>
      <div className='h-4 bg-muted rounded w-3/4 mb-2'></div>
      <div className='h-4 bg-muted rounded w-1/2'></div>
    </div>
  )
}
```

#### Acceptance Criteria:

- [ ] Loading states for all async operations
- [ ] Skeleton screens for better UX
- [ ] Toast notifications for success/error
- [ ] Graceful error recovery

---

### 🎯 TASK 9: Environment Setup & Deployment

**Priority:** HIGH | **Time:** 1 hour

#### Environment Variables:

```env
# Required for MVP
QLOO_API_KEY=mock_for_development
SENDGRID_API_KEY=your_sendgrid_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional for enhancement
GOOGLE_PLACES_API_KEY=your_google_key
OPENAI_API_KEY=your_openai_key
```

#### Deployment Checklist:

- [ ] Vercel deployment configured
- [ ] Environment variables set in production
- [ ] Build process works without errors
- [ ] All API routes accessible
- [ ] Error monitoring setup

---

### 🎯 TASK 10: Testing & QA

**Priority:** MEDIUM | **Time:** 3 hours

#### Test Cases:

1. **Happy Path:**

   - User enters valid URL
   - Completes all chat questions
   - Receives recommendations
   - Gets PDF report via email

2. **Error Cases:**

   - Invalid URL handling
   - Network failures
   - API timeouts
   - Email delivery failures

3. **Edge Cases:**
   - Very long website analysis
   - Unusual website structures
   - Non-English content

#### Acceptance Criteria:

- [ ] All happy path scenarios work
- [ ] Error messages are user-friendly
- [ ] Performance is acceptable (< 30s total)
- [ ] Mobile experience is good

---

## 🚀 Implementation Order

### Week 1 (MVP):

1. TASK 1: API Route Structure
2. TASK 2: Website Scraper
3. TASK 3: Chat Interface
4. TASK 4: Recommendation Engine
5. TASK 8: Loading States

### Week 2 (Enhancement):

6. TASK 5: Qloo Integration
7. TASK 6: PDF Reports
8. TASK 7: Email Delivery
9. TASK 9: Deployment
10. TASK 10: Testing

## 📋 Daily Standup Template

**What I completed yesterday:**

- [ ] Task X: Specific accomplishment

**What I'm working on today:**

- [ ] Task Y: Specific goal

**Blockers:**

- [ ] Issue Z: What help is needed

**Next up:**

- [ ] Task A: Tomorrow's priority
