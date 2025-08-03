Product Requirements Document (PRD)
Product Name: Creator Journey Chatbot
 Prepared by: AI Buddy Team
 Date: July 29, 2025
 Version: 1.0

Overview
Creator Journey is an AI-powered chatbot designed specifically for content creators who travel frequently. Users provide their personal website URL. The chatbot scrapes and analyzes this website, identifies user preferences and audience insights, integrates this data with Qloo Taste AI™, and recommends tailored travel destinations optimized for:
Audience Engagement


Brand Collaboration Opportunities


Monetization and Product Sales Potential


Creator Collaborations at the Location


Budget Accuracy & Stretch Goals


The chatbot confirms and refines recommendations through brief interactive Q&A and provides detailed reports via email.

User Journey
Step-by-step Interaction Flow:
Initial Interaction


User provides their personal website URL to the chatbot.


Data Extraction & Analysis


System scrapes the user's provided URL to extract:


Dominant content themes


Audience interests & geolocation (via social profiles, OG tags)


Posting frequency & content type performance


Integration of extracted data into Qloo’s taste vectors.


Recommendation Generation


Chatbot generates recommendations based on Qloo Taste AI™ (90%) + extracted website insights (10%).


Additional Data Enrichment (via Free APIs only)


Travel costs and budgeting via:


Amadeus Self-Service API


Numbeo Cost-of-Living API


Creator collaboration opportunities & engagement via:


YouTube Data API


Instagram Graph API


TikTok for Developers (limited use)


Social Searcher (for geo-based creator discovery)


Factual and location-specific details via:


Google Places API


OpenStreetMap Nominatim API


Fact-Checking (Hallucination Checker)


Verify recommendation accuracy through:


Wikipedia & Wikidata APIs (fact retrieval)


Retrieval-Augmented Generation (RAG) fact-checking with secondary lightweight LLM.


Interactive Clarification (Maximum 4 questions, sequentially asked by chatbot)


“Preferred trip length?”


“Rough budget per person (US$)?”


“Primary content format (video/photo/vlog)?”


“Preferred or avoided climates/regions?”


Final Recommendations & Reporting


Top-3 destination summaries in chatbot.


Detailed PDF report sent via SendGrid (free tier: 100 emails/day).



Suggested UI/UX:
https://bolt.new/~/sb1-hy88spdf

Functional Requirements
Core Features:
Website Content Analysis & Extraction


Taste Vector Generation using Qloo Taste AI™


Dynamic Budget Calculations (Travel + Living Expenses)


Creator Discovery & Collaboration Recommendations


Brand Opportunity Insights


Fact-Checking & Validation (Hallucination Checker)


Interactive Clarification Dialogue


Final Report Generation & Email Delivery



Technical Requirements
Technologies & APIs (Free Only):
Component
Free APIs / Tools
Scraping & NLP
Playwright, Puppeteer, SpaCy, BeautifulSoup
Taste Recommendation
Qloo Taste AI™ API
Travel Pricing & Budgeting
Amadeus Self-Service API (Flights, limited hotels), Numbeo Cost-of-Living API
Creator Engagement & Content Analysis
YouTube Data API, Instagram Graph API (Business Accounts), TikTok for Developers
Creator Geo-Discovery
Social Searcher, Instagram Hashtags & Geo-search
Location Details & Maps
Google Places API, OpenStreetMap Nominatim API
Fact Checking
Wikipedia & Wikidata APIs
Report Delivery
SendGrid Email Delivery API (free tier)
Fact-checking LLM
Open-source lightweight model (e.g., GPT-4o with tight token controls)


Algorithm and Filtering Logic
The recommendations generated will follow this scoring logic:
plaintext
CopyEdit
Total_Score = (0.45 × Qloo Affinity) +
              (0.25 × Community Engagement) +
              (0.15 × Brand Collaboration Fit) +
              (0.10 × Budget Alignment) +
              (0.05 × Local Creator Collaboration Potential)

Recommendations falling significantly outside the user's budget, visa eligibility, or explicitly disliked climates or regions are automatically removed.



Hallucination Checker & Accuracy Assurance
Each recommendation undergoes a Retrieval-Augmented Generation (RAG) based verification:


Fact extraction from Wikipedia/Wikidata.


Secondary lightweight LLM checks for discrepancies.


Confidence score < 0.8 triggers re-evaluation or discarding.



Output Specifications
Chatbot Output
Top 3 destinations with brief highlights:


Destination match score


Potential for audience engagement


Identified brand partnerships


Local creators available for collaboration


Budget insights (within user’s budget/stretch goal)


Events:
Combine Google Places, Ticketmaster Discovery (free tier) and Live Nation feeds to auto-embed concerts, comedy nights, or sports fixtures in each itinerary
Email Report
Comprehensive PDF including:


Detailed destination breakdown


Specific recommended experiences/attractions


Cost analysis (flights, accommodation, food, etc.)


Detailed engagement & monetization opportunities


Fact-check confidence markers



User Interface & Interaction
Frontend: Chat-based conversational interface (web or embedded widget)


Backend: Python (FastAPI or Django), integrated with Qloo Taste AI™, APIs listed above, and OpenAI API (for language models)



Assumptions & Constraints
Availability of reliable scraping from user's website.


API quota limitations (careful caching and strategic calls needed).


Dependence on free API limitations, managing rate-limits effectively.


Privacy and compliance (clearly disclosed privacy policy and user consent).
The user will be only giving input twice (URL, and then confirmation that the scraped data is accurate) before the report is generated. After report user can continue chatting.

1. After uesr submits URL, the AI will show key information to confirm. 2. When user confirms, the repot will be shown. Show multiple recommendation items



Success Metrics (KPIs)
User satisfaction (post-interaction surveys, NPS ≥ 8)


Recommendation accuracy (hallucination check success rate ≥ 95%)


Email report open rate (>60%)


API call efficiency (staying within daily free API limits)



Future Roadmap (post MVP)
Integration with paid APIs for deeper data.


Enhanced personalization with user historical feedback.


Monetization via affiliate programs and premium subscription tiers.


Expanded fact-checking database and model refinement.



Next Steps (Immediate)
Finalize data-flow and backend architecture design.


Establish free API integrations and verify limits.


Prototype chatbot UI and basic interaction workflow.


Build initial scraping & NLP processing module.


Test Qloo integration with sample user profiles.



Conclusion
This detailed PRD outlines a clear, actionable path for the creation of the TasteJourney Chatbot, ensuring accurate, tailored recommendations that meet the complex needs of traveling content creators through thoughtful use of free resources and careful algorithm design.
