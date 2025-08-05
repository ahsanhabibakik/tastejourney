# Product Requirements Document (PRD)

**Product Name:** TasteJourney Chatbot  
**Prepared by:** AI Buddy Team  
**Date:** July 29, 2025  
**Version:** 1.0

---

## Overview

TasteJourney is an AI-powered chatbot designed specifically for content creators who travel frequently. Users provide their personal website URL. The chatbot scrapes and analyzes this website, identifies user preferences and audience insights, integrates this data with Qloo Taste AI™, and recommends tailored travel destinations optimized for:

- **Audience Engagement**
- **Brand Collaboration Opportunities** 
- **Monetization and Product Sales Potential**
- **Creator Collaborations at the Location**
- **Budget Accuracy & Stretch Goals**

The chatbot confirms and refines recommendations through brief interactive Q&A and provides detailed reports via email.

---

## User Journey

### Step-by-step Interaction Flow:

#### 1. Initial Interaction
- User provides their personal website URL to the chatbot.

#### 2. Data Extraction & Analysis
System scrapes the user's provided URL to extract:
- Dominant content themes
- Audience interests & geolocation (via social profiles, OG tags)
- Posting frequency & content type performance
- Integration of extracted data into Qloo's taste vectors.

#### 3. Recommendation Generation
- Chatbot generates recommendations based on **Qloo Taste AI™ (90%) + extracted website insights (10%)**.

#### 4. Additional Data Enrichment (via Free APIs only)

**Travel costs and budgeting via:**
- Amadeus Self-Service API
- Numbeo Cost-of-Living API

**Creator collaboration opportunities & engagement via:**
- YouTube Data API
- Instagram Graph API
- TikTok for Developers (limited use)
- Social Searcher (for geo-based creator discovery)

**Factual and location-specific details via:**
- Google Places API
- OpenStreetMap Nominatim API

#### 5. Fact-Checking (Hallucination Checker)
Verify recommendation accuracy through:
- Wikipedia & Wikidata APIs (fact retrieval)
- Retrieval-Augmented Generation (RAG) fact-checking with secondary lightweight LLM.

#### 6. Interactive Clarification (Maximum 4 questions, sequentially asked by chatbot)
1. "Preferred trip length?"
2. "Rough budget per person (US$)?"
3. "Primary content format (video/photo/vlog)?"
4. "Preferred or avoided climates/regions?"

#### 7. Final Recommendations & Reporting
- Top-3 destination summaries in chatbot.
- Detailed PDF report sent via SendGrid (free tier: 100 emails/day).

---

## Functional Requirements

### Core Features:
- Website Content Analysis & Extraction
- Taste Vector Generation using Qloo Taste AI™
- Dynamic Budget Calculations (Travel + Living Expenses)
- Creator Discovery & Collaboration Recommendations
- Brand Opportunity Insights
- Fact-Checking & Validation (Hallucination Checker)
- Interactive Clarification Dialogue
- Final Report Generation & Email Delivery

---

## Technical Requirements

### Technologies & APIs (Free Only):

| Component | Free APIs / Tools |
|-----------|------------------|
| Scraping & NLP | Playwright, Puppeteer, SpaCy, BeautifulSoup |
| Taste Recommendation | Qloo Taste AI™ API |
| Travel Pricing & Budgeting | Amadeus Self-Service API (Flights, limited hotels), Numbeo Cost-of-Living API |
| Creator Engagement & Content Analysis | YouTube Data API, Instagram Graph API (Business Accounts), TikTok for Developers |
| Creator Geo-Discovery | Social Searcher, Instagram Hashtags & Geo-search |
| Location Details & Maps | Google Places API, OpenStreetMap Nominatim API |
| Fact Checking | Wikipedia & Wikidata APIs |
| Report Delivery | SendGrid Email Delivery API (free tier) |
| Fact-checking LLM | Open-source lightweight model (e.g., GPT-4o with tight token controls) |

---

## Algorithm and Filtering Logic

The recommendations generated will follow this scoring logic:

```
Total_Score = (0.45 × Qloo Affinity) +  
              (0.25 × Community Engagement) +  
              (0.15 × Brand Collaboration Fit) +  
              (0.10 × Budget Alignment) +  
              (0.05 × Local Creator Collaboration Potential)
```

Recommendations falling significantly outside the user's budget, visa eligibility, or explicitly disliked climates or regions are automatically removed.

---

## Hallucination Checker & Accuracy Assurance

Each recommendation undergoes a Retrieval-Augmented Generation (RAG) based verification:
- Fact extraction from Wikipedia/Wikidata.
- Secondary lightweight LLM checks for discrepancies.
- Confidence score < 0.8 triggers re-evaluation or discarding.

---

## Output Specifications

### Chatbot Output
Top 3 destinations with brief highlights:
- Destination match score
- Potential for audience engagement
- Identified brand partnerships
- Local creators available for collaboration
- Budget insights (within user's budget/stretch goal)
- **Events:** Combine Google Places, Ticketmaster Discovery (free tier) and Live Nation feeds to auto-embed concerts, comedy nights, or sports fixtures in each itinerary

### Email Report
Comprehensive PDF including:
- Detailed destination breakdown
- Specific recommended experiences/attractions
- Cost analysis (flights, accommodation, food, etc.)
- Detailed engagement & monetization opportunities
- Fact-check confidence markers

---

## User Interface & Interaction

- **Frontend:** Chat-based conversational interface (web or embedded widget)
- **Backend:** Python (FastAPI or Django), integrated with Qloo Taste AI™, APIs listed above, and OpenAI API (for language models)

---

## Assumptions & Constraints

- Availability of reliable scraping from user's website.
- API quota limitations (careful caching and strategic calls needed).
- Dependence on free API limitations, managing rate-limits effectively.
- Privacy and compliance (clearly disclosed privacy policy and user consent).
- The user will be only giving input twice (URL, and then confirmation that the scraped data is accurate) before the report is generated. After report user can continue chatting.

**Flow:**
1. After user submits URL, the AI will show key information to confirm.
2. When user confirms, the report will be shown. Show multiple recommendation items.

---

## Success Metrics (KPIs)

- User satisfaction (post-interaction surveys, NPS ≥ 8)
- Recommendation accuracy (hallucination check success rate ≥ 95%)
- Email report open rate (>60%)
- API call efficiency (staying within daily free API limits)

---

## Initial Draft Concept

### Core Concept:
- **Travel and entertainment**
- **Content Creator focus**
- **Qloo integration** - to match user with destinations

### User Journey:
- User gives a platform URL - Website
- Gets:
  - Travel destination
  - Maximum community engagement
  - Brands that can be targeted
  - Product sales probability improves
  - Spots that they would enjoy visiting
  - Creators in the same location to collab
  - Budget calculation
  - Stretch goal
  - Purchase Point
  - Send me the report

### How we're filtering:
- **Hallucination checker**

### Output:
- Chatbot
- Landing Page
- Demo Video

---

## Judge-Focused Story: TasteJourney - Where Taste Meets Precision

### The Monica Story

Imagine Monica—a rising YouTube creator known for vibrant storytelling, indie music reviews, and her eclectic fashion sense. She's planning her next big trip. But this time, rather than hours of tedious research and uncertainty, she inputs just one thing: her website URL.

### How TasteJourney Works (and Why It Matters):

The moment Monica hits "enter," something special happens. Unlike ordinary recommendation engines that depend solely on generic user-inputs or broad demographic data, TasteJourney first scrapes Monica's website. Within seconds, the chatbot builds a snapshot of her creative personality: indie pop music preferences, Scandinavian aesthetics in fashion, video-centric content style, and a fanbase concentrated in major metropolitan areas. This snapshot contributes a refined yet lightweight **10% weighting** to her eventual recommendations.

Now enters the real magic: **Qloo's Taste AI™**. Drawing from a decade's worth of multi-domain consumer data—over 3.7 billion lifestyle entities and trillions of anonymized interactions—Qloo carefully constructs Monica's unique taste profile.

### Qloo's Deep Analysis:
- **Person's Taste is figured out**
- Movies
- Books  
- Cultural elements
- **Matching with Travel**
- **Matching Product for Brand connect**
- **Matching with creators in that local area**

### Deep API Integration for Superior Recommendations:

But TasteJourney doesn't stop at theoretical recommendations—it integrates free, powerful APIs to turn these insights into tangible, actionable plans:

1. **Using Amadeus Self-Service API** - Monica's recommendations include real-time budget insights on flights and affordable accommodations
2. **The Numbeo Cost-of-Living API** adds hyperlocal precision, ensuring she won't encounter unexpected budget surprises
3. **TasteJourney accesses the YouTube Data API and Instagram Graph API** to determine her content's engagement sweet spots
4. **Social Searcher API** provides geo-tagged discovery of fellow creators at recommended destinations
5. **Wikipedia and Wikidata APIs** maintain accuracy and trust through meticulous fact-checking pipeline

### The Result—A Comprehensive, Accurate Report:

After brief, engaging follow-up questions to further clarify Monica's preferences, the chatbot delivers precise recommendations optimized for:

- **Maximum Audience Engagement** (validated by actual platform data)
- **Brand Partnerships with Clear Monetization Potential**
- **Local Creator Collaborations**
- **Detailed Budget Breakdown and Stretch Goals**

TasteJourney then emails Monica a beautifully organized PDF report—each recommendation transparently scored and explained.

### Why Judges Should Celebrate TasteJourney:

- **Jason Calacanis:** Will see TasteJourney's clear business model and monetization potential
- **Nicole Seligman:** Will appreciate its ethical use of anonymized data, fact-checked outputs, and responsible AI implementation
- **Cedric The Entertainer:** Will be impressed by its strong cultural relevance, engaging narrative style, and potential for community and creator collaboration
- **Todd Boehly:** Recognizes the strategic integration of budget-friendly APIs ensuring practical, real-world applicability
- **Michael Abrams:** Immediately understands the implications for live entertainment ecosystems, especially the strategic benefit to creators
- **Coby Santos:** As the steward of Qloo's product vision, he'll recognize how TasteJourney highlights and significantly amplifies the strengths of Qloo's own Taste AI™

---

## Future Roadmap (Post MVP)

### Immediate Enhancements:
- **Further LLM enhancements**

### Product Roadmap:
- **Booking agent for travel and hotels** (with booking.com integration)
- Integration with paid APIs for deeper data
- Enhanced personalization with user historical feedback
- Monetization via affiliate programs and premium subscription tiers
- Expanded fact-checking database and model refinement

---

## Implementation Status

### Currently Implemented:
- ✅ `analyze/route.ts` - Website analysis
- ✅ `profile-taste/route.ts` - Taste profiling  
- ✅ `recommendations/route.ts` - Main recommendations
- ✅ `send-report/route.ts` - Email reports

### Need to Add (from PRD requirements):
- ❌ `flights/route.ts` - Amadeus flight API
- ❌ `hotels/route.ts` - Amadeus hotel API  
- ❌ `creators/route.ts` - YouTube/Instagram creator discovery
- ❌ `location-details/route.ts` - Google Places integration
- ❌ `budget/route.ts` - Numbeo cost-of-living
- ❌ `events/route.ts` - Events and activities

---

## Next Steps (Immediate)

1. Finalize data-flow and backend architecture design
2. Establish free API integrations and verify limits
3. Prototype chatbot UI and basic interaction workflow
4. Build initial scraping & NLP processing module
5. Test Qloo integration with sample user profiles

---

## Conclusion

This detailed PRD outlines a clear, actionable path for the creation of the TasteJourney Chatbot, ensuring accurate, tailored recommendations that meet the complex needs of traveling content creators through thoughtful use of free resources and careful algorithm design.

**TasteJourney is not just another recommendation app; it's a carefully crafted fusion of precise personalization, strategic API augmentation, and responsible AI—uniquely addressing the practical, financial, and creative needs of today's content creators.**
