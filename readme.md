- last update : 05/08/2025 : 3.25pm
# TasteJourney App - Complete Technical Architecture & API Documentation

## 🚀 Project Overview

TasteJourney is a Next.js-based travel recommendation platform designed specifically for content creators. It analyzes user websites/profiles to understand their content themes and generates personalized travel destinations optimized for content creation, creator collaboration, and brand partnerships.

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15.4.5 (React 19.1.0)
- **Backend**: Next.js API Routes (Server-side)
- **UI Library**: Tailwind CSS + Radix UI
- **State Management**: Redux Toolkit
- **AI/ML**: Google Gemini AI, Qloo Taste AI™
- **Email**: Nodemailer with Gmail
- **Web Scraping**: Cheerio + Puppeteer
- **PDF Generation**: PDFKit

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Backend API routes
│   ├── page.tsx           # Main application page
│   └── layout.tsx         # Root layout
├── components/            # React components
├── services/              # Business logic services
├── lib/                   # Utility functions
└── store/                 # Redux store
```

## 🔌 API Architecture

### Internal APIs (Built-in)

#### 1. Core Recommendation APIs
- **`POST /api/recommendations`** - Main recommendation engine
- **`POST /api/recommend`** - Legacy recommendation endpoint
- **`POST /api/analyze-website`** - Website content analysis
- **`POST /api/profile-taste`** - Taste profile generation

#### 2. Data Enrichment APIs
- **`GET /api/cost-of-living`** - Living cost calculations
- **`GET /api/creators/youtube`** - Creator discovery
- **`GET /api/flights`** - Flight pricing data
- **`GET /api/hotels`** - Accommodation pricing
- **`GET /api/location-details`** - Location information

#### 3. Communication APIs
- **`POST /api/send-report`** - Email report generation
- **`POST /api/test-email`** - Email testing
- **`POST /api/test-email-mock`** - Mock email testing

#### 4. Utility APIs
- **`POST /api/scrape`** - Web scraping service
- **`POST /api/gemini-chat`** - AI chat interactions
- **`GET /api/serpapi`** - Search results
- **`GET /api/bookmarks`** - Bookmark management

## 🌐 External API Integrations

### 1. Google Gemini AI API
- **Purpose**: Primary AI engine for recommendation generation
- **Environment Variable**: `GEMINI_API_KEY`
- **Usage**: Content analysis, destination recommendations, dynamic content generation
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Features**:
  - Natural language processing
  - Travel recommendation generation
  - Content theme analysis
  - Fallback recommendation system

### 2. Qloo Taste AI™ API
- **Purpose**: Advanced taste profiling and preference analysis
- **Environment Variables**: 
  - `QLOO_API_KEY`
  - `QLOO_API_URL` (default: https://api.qloo.com/v1)
- **Usage**: User taste vector generation, cultural affinity analysis
- **Features**:
  - Taste profile generation
  - Cultural affinity mapping
  - Personality trait analysis
  - Destination affinity scoring

### 3. Amadeus Travel API
- **Purpose**: Flight pricing and availability
- **Environment Variables**:
  - `AMADEUS_API_KEY`
  - `AMADEUS_API_SECRET`
- **Usage**: Real-time flight prices, travel cost calculations
- **Features**:
  - Flight search and pricing
  - Travel cost estimation
  - Route optimization

### 4. Google Places API
- **Purpose**: Location data and points of interest
- **Environment Variable**: `GOOGLE_PLACES_API_KEY`
- **Usage**: Attraction discovery, location verification
- **Features**:
  - Place search and details
  - Attraction discovery
  - Location verification
  - Photo references

### 5. YouTube Data API
- **Purpose**: Creator discovery and analysis
- **Environment Variable**: `YOUTUBE_API_KEY`
- **Usage**: Finding local content creators for collaboration
- **Features**:
  - Creator search by location
  - Channel analytics
  - Content analysis
  - Collaboration potential scoring

### 6. Instagram Basic Display API
- **Purpose**: Instagram creator analysis
- **Environment Variable**: `INSTAGRAM_ACCESS_TOKEN`
- **Usage**: Instagram creator discovery and metrics
- **Features**:
  - Creator profile analysis
  - Engagement metrics
  - Content type analysis

### 7. SerpAPI
- **Purpose**: Search engine results and web research
- **Environment Variable**: `SERPAPI_KEY`
- **Usage**: Web research, fact-checking, trend analysis
- **Features**:
  - Google search results
  - News and trends
  - Location-based searches

### 8. Numbeo API
- **Purpose**: Cost of living data
- **Base URL**: `https://www.numbeo.com/api`
- **Usage**: Living expense calculations
- **Features**:
  - Cost of living indices
  - Price comparisons
  - Local expense data

### 9. Wikipedia/Wikidata APIs
- **Purpose**: Fact-checking and destination verification
- **Base URLs**:
  - Wikipedia: `https://en.wikipedia.org/api/rest_v1`
  - Wikidata: `https://www.wikidata.org/w/api.php`
- **Usage**: Information verification, factual accuracy
- **Features**:
  - Destination fact-checking
  - Historical and cultural data
  - Image and information verification

### 10. Gmail SMTP
- **Purpose**: Email delivery for reports
- **Environment Variables**:
  - `GMAIL_USER`
  - `GMAIL_PASS`
- **Usage**: PDF report delivery, notifications
- **Features**:
  - Report email delivery
  - HTML email templates
  - PDF attachments

## 🔄 Data Flow & Processing Pipeline

### 1. User Input Processing
```
User Input (URL) → Website Analysis → Content Theme Extraction → Taste Profile Generation
```

### 2. Recommendation Generation Flow
```
Taste Profile → Multiple API Calls (Parallel) → Data Enrichment → Scoring → Ranking → Response
```

#### Detailed Flow:
1. **Website Analysis**
   - Scrape user-provided website
   - Extract content themes, social links, keywords
   - Analyze content type and audience

2. **Taste Profile Generation**
   - Use Qloo API for advanced taste profiling
   - Generate cultural affinities and personality traits
   - Create taste vectors for recommendation matching

3. **Destination Discovery** (Parallel Processing)
   - Qloo API: Taste-based destination suggestions
   - Gemini AI: AI-powered destination generation
   - Merge and deduplicate results

4. **Data Enrichment** (Parallel Processing)
   - Budget Service: Flight + accommodation pricing
   - Creator Service: Local creator discovery
   - Places Service: Attractions and POIs
   - Fact-check Service: Information verification

5. **Scoring & Ranking**
   - Multi-factor scoring algorithm
   - Weight factors: Qloo affinity (45%), engagement (20%), brand collaboration (15%), budget alignment (15%), creator collaboration (10%)
   - Sort by total score

6. **Response Generation**
   - Format recommendations with all enriched data
   - Include practical information and content opportunities
   - Cache results for performance

### 3. Fallback System
```
Primary Service Failure → Dynamic Gemini Fallback → Static Fallback → Error Response
```

## 🎯 Service Architecture

### Core Services

#### 1. Integrated Recommendation Service (`integrated-recommendation.ts`)
- **Purpose**: Main orchestrator combining all services
- **Features**:
  - Multi-service coordination
  - Parallel processing
  - Fallback handling
  - Caching integration

#### 2. Dynamic Recommendation Service (`dynamic-recommendation.ts`)
- **Purpose**: AI-powered recommendation generation
- **Features**:
  - Gemini AI integration
  - Dynamic content generation
  - Taste vector processing

#### 3. Budget Service (`budget.ts`)
- **Purpose**: Travel cost calculations
- **APIs Used**: Amadeus, Numbeo
- **Features**:
  - Flight pricing
  - Accommodation costs
  - Living expenses
  - Budget optimization

#### 4. Creator Service (`creator.ts`)
- **Purpose**: Content creator discovery
- **APIs Used**: YouTube, Instagram
- **Features**:
  - Location-based creator search
  - Collaboration potential scoring
  - Engagement analysis

#### 5. Places Service (`places.ts`)
- **Purpose**: Location and attraction data
- **APIs Used**: Google Places
- **Features**:
  - Place search and details
  - Photo references
  - Rating and review data

#### 6. Fact-check Service (`factcheck.ts`)
- **Purpose**: Information verification
- **APIs Used**: Wikipedia, Wikidata
- **Features**:
  - Destination fact verification
  - Source validation
  - Confidence scoring

#### 7. Scoring Service (`scoring.ts`)
- **Purpose**: Multi-factor recommendation scoring
- **Features**:
  - Weighted scoring algorithm
  - Confidence calculation
  - Ranking optimization

### Supporting Services

#### 8. Qloo Service (`qloo.ts`)
- **Purpose**: Taste profiling and preference analysis
- **Features**:
  - Taste profile generation
  - Destination affinity scoring
  - Cultural preference mapping

#### 9. Gemini Service (`gemini.ts`)
- **Purpose**: AI-powered content generation
- **Features**:
  - Natural language processing
  - Content recommendation
  - Dynamic response generation

#### 10. Cache Service (`cache.ts`)
- **Purpose**: Performance optimization
- **Features**:
  - API response caching
  - TTL management
  - Memory optimization

#### 11. Rate Limiter (`rate-limiter.ts`)
- **Purpose**: API rate limit management
- **Features**:
  - Per-service rate limiting
  - Request queuing
  - Automatic retry logic

#### 12. Error Handler (`errorHandler.ts`)
- **Purpose**: Centralized error management
- **Features**:
  - Graceful fallbacks
  - Error logging
  - Recovery strategies

## 🔐 Environment Variables Required

### Core APIs
```env
# AI Services
GEMINI_API_KEY=your_gemini_api_key
QLOO_API_KEY=your_qloo_api_key
QLOO_API_URL=https://api.qloo.com/v1

# Travel APIs
AMADEUS_API_KEY=your_amadeus_key
AMADEUS_API_SECRET=your_amadeus_secret
GOOGLE_PLACES_API_KEY=your_google_places_key

# Social Media APIs
YOUTUBE_API_KEY=your_youtube_api_key
INSTAGRAM_ACCESS_TOKEN=your_instagram_token

# Utility APIs
SERPAPI_KEY=your_serpapi_key

# Email Configuration
GMAIL_USER=your_gmail_address
GMAIL_PASS=your_gmail_app_password

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

## 🚦 Application Flow

### 1. Initial User Interaction
- User provides website URL
- System analyzes website content
- Extracts themes, content type, social links
- Generates initial user profile

### 2. User Preference Collection
- Interactive questionnaire system
- Budget, duration, style preferences
- Content focus and climate preferences
- Multi-select and single-select options

### 3. AI Processing Phase
- Taste profile generation (Qloo + Gemini)
- Destination discovery (multi-source)
- Parallel data enrichment
- Comprehensive scoring and ranking

### 4. Results Presentation
- Interactive destination cards
- Detailed budget breakdowns
- Creator collaboration opportunities
- Content creation suggestions
- Practical travel information

### 5. Report Generation
- PDF report compilation
- Email delivery system
- Comprehensive travel plans
- Actionable recommendations

## 🔄 Caching Strategy

### Cache Layers
1. **API Response Cache**: 15-minute TTL for external API calls
2. **Recommendation Cache**: 1-hour TTL for full recommendations
3. **User Profile Cache**: 30-minute TTL for taste profiles
4. **Static Data Cache**: 24-hour TTL for destination data

### Cache Keys
- User profiles: `user-${hash(websiteData)}`
- Recommendations: `rec-${hash(userProfile+preferences)}`
- Budget data: `budget-${origin}-${destination}-${duration}`
- Creator data: `creator-${location}-${contentType}`

## 🚨 Error Handling & Fallbacks

### Fallback Hierarchy
1. **Primary Service**: Integrated recommendation with all APIs
2. **Dynamic Fallback**: Gemini-powered recommendations
3. **Static Fallback**: Pre-defined recommendation set
4. **Error Response**: User-friendly error message

### Error Recovery
- Automatic retry with exponential backoff
- Service degradation (partial features)
- Graceful error messages
- Fallback data sources

## 📊 Performance Optimizations

### 1. Parallel Processing
- Concurrent API calls for data enrichment
- Parallel service execution
- Non-blocking operations

### 2. Caching Strategy
- Multi-layer caching system
- Intelligent cache invalidation
- Memory-efficient storage

### 3. Rate Limiting
- Per-service rate limit management
- Request queuing and throttling
- Automatic backoff strategies

### 4. Data Optimization
- Selective data fetching
- Response compression
- Minimal data transfer

## 🔮 AI Integration Details

### Gemini AI Usage
- **Model**: gemini-2.0-flash
- **Temperature**: 0.8 (creative but focused)
- **Max Tokens**: 3000
- **Use Cases**:
  - Dynamic recommendation generation
  - Content analysis and theme extraction
  - Natural language processing
  - Fallback recommendation system

### Qloo Taste AI Usage
- **Features**: Cultural affinity mapping, taste vector generation
- **Integration**: Primary taste profiling service
- **Fallback**: Rule-based taste profiling when API unavailable

## 🔧 Development & Deployment

### Build Process
```bash
# Development
pnpm dev

# Production Build
pnpm build

# Type Checking
npx tsc --noEmit
```

### Key Dependencies
- **@google/generative-ai**: Gemini AI integration
- **cheerio**: Web scraping and HTML parsing
- **puppeteer**: Browser automation for complex scraping
- **nodemailer**: Email functionality
- **pdfkit**: PDF report generation
- **@reduxjs/toolkit**: State management

### API Rate Limits & Quotas
- **Gemini API**: 60 requests/minute
- **YouTube API**: 10,000 units/day
- **Google Places**: 1000 requests/day (free tier)
- **Amadeus**: Varies by endpoint and subscription

## 🎯 Unique Value Propositions

### 1. Content Creator Focus
- Specialized for travel content creators
- Creator collaboration opportunities
- Brand partnership potential analysis
- Content creation suggestions

### 2. Multi-Service Integration
- 10+ external APIs working in harmony
- Comprehensive data enrichment
- Intelligent fallback systems
- Real-time data processing

### 3. AI-Powered Intelligence
- Advanced taste profiling
- Dynamic recommendation generation
- Natural language processing
- Continuous learning and improvement

### 4. Professional Reporting
- PDF report generation
- Email delivery system
- Comprehensive travel plans
- Actionable business insights

## 🔄 Future Enhancement Opportunities

### 1. Additional APIs
- Booking.com for accommodation
- TripAdvisor for reviews and ratings
- Weather APIs for seasonal recommendations
- Currency exchange rate APIs

### 2. Advanced Features
- Real-time collaboration matching
- Social media integration
- Mobile app development
- AI-powered itinerary planning

### 3. Business Intelligence
- Analytics dashboard
- User behavior tracking
- ROI measurement tools
- Performance metrics

---

**Last Updated**: January 2025  
**Documentation Version**: 1.0  
**Application Version**: 0.1.0