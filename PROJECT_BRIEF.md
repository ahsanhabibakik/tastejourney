# 📘 PROJECT BRIEF: TasteJourney (for AI Coding Assistants)

## Project Overview

**TasteJourney** is an AI-powered travel recommendation chatbot designed for content creators, influencers, or solo creatives who want personalized, culturally aligned, and monetizable travel destinations — based on their content, audience, and preferences.

It analyzes the creator's public website (portfolio, blog, or social profile page), understands what type of content they make and for whom, and then suggests destinations with high engagement potential, brand collaboration opportunities, and accurate budget fit — powered by Qloo Taste AI™, GPT, and free travel APIs.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18 (TypeScript), Tailwind CSS 4, shadcn/ui
- **Backend**: Node.js (API routes via /app/api)
- **Scraping**: Playwright (website scraping)
- **AI/ML**: Qloo Taste AI™ API (cultural/taste vector matching), OpenAI GPT-4o (optional)
- **Data**: Numbeo API (cost-of-living), Google Places API, Ticketmaster + YouTube APIs
- **Output**: SendGrid (email), Puppeteer (PDF generation)

## User Flow (Frontend Logic)

1. User enters their website URL
2. App scrapes site and analyzes tags, social links, content themes
3. Extracted data shown to user for confirmation
4. On confirmation, backend sends data to Qloo API for 'taste vector'
5. Chatbot asks 3–4 clarification questions (budget, trip duration, content format)
6. Using taste vector + user answers, system calculates destination scores
7. Returns 3 best destination matches with creator communities, brand partners, budgets
8. Final report can be sent via email as styled PDF

## Backend API Breakdown

- `/api/analyze` → Scrapes site using Playwright & cheerio. Extracts meta tags, OG tags, social links
- `/api/profile-taste` → Sends keywords/themes to Qloo Taste AI™. Returns cultural affinities & taste vector
- `/api/recommend` → Combines taste vector + user answers to score and return top destinations
- `/api/send-report` → Generates PDF and emails to user using SendGrid
- `/api/enrich-destination` → Adds event info and local context (optional)

## Scoring Logic (inside /api/recommend)

```
score = (0.45 * qlooAffinity) +
        (0.25 * creatorCommunity) +
        (0.15 * brandFit) +
        (0.10 * budgetFit) +
        (0.05 * geoFit)
```

## Frontend Component Summary

- `/components/URLForm.tsx` → shadcn form to input URL
- `/components/ConfirmationDialog.tsx` → User confirms scraped data
- `/components/ChatInterface.tsx` → Sequentially asks 3–4 clarification questions
- `/components/RecommendationsScreen.tsx` → Shows travel matches in styled cards
- `/components/Toasts.tsx` → Feedback and loading states
- `/components/Loading.tsx` → Skeleton and spinners

## Deployment Targets

- **Dev**: Localhost
- **Hackathon**: Deploy via Vercel
- **Testing**: Use mock responses for Qloo or PDF gen if API access limited

## AI Assistant Guidelines

- Respect the step-by-step UX flow
- Keep backend modules stateless and focused (no business logic in UI)
- Generate Tailwind-optimized UI components using shadcn
- Validate API input/output schemas
- Handle LLM/chat logic on frontend unless specified server-side

## Priority Implementation Tasks

1. Implement `/api/recommend` scoring logic
2. Create `ChatInterface.tsx` that captures each clarification step
3. Render destination cards with dynamic content and CTA buttons
4. Generate email-ready PDF using puppeteer

## Current Status

✅ Enhanced RecommendationsScreen with advanced features
✅ Project structure and development plan created
✅ Next.js configuration optimized for all required features
🔄 Ready to implement core API routes and chat interface
