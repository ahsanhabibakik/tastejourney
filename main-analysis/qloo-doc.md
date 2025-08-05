Below is a ready‑to‑paste **Markdown specification file** (`qloo_api_guide.md`) that explains **exactly which Qloo APIs your TasteJourney MVP must call, every required/optional parameter, and copy‑‑paste‑ready Next.js (Node 18+) examples**.
All sample URLs point at the **hackathon environment** (`https://hackathon.api.qloo.com`) so they will work with your hackathon API key.

---

## 1  What You Get From Each API — Executive Map

| API                                      | Purpose inside TasteJourney                                                                               | Typical Call Pattern                       | Key Output Fields                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Entity Search** (`GET /search`)        | Resolve free‑text names from the creator’s content (cities, brands, artists, etc.) to **Qloo entity IDs** | `?term=kyoto&types=urn:entity:destination` | `entity_id`, `type`, `name` ([Qloo Documentation][1])                                     |
| **Tags Search** (`GET /v2/tags`)         | Convert extracted keywords (“sushi”, “solo travel”) to **tag IDs** for signals/filters                    | `?term=sushi&types=urn:tag:cuisine`        | `id`, `type`, `name` ([Qloo Documentation][2])                                            |
| **Find Audiences** (`GET /v2/audiences`) | Map demographic phrases (“Gen Z gamers”) to **audience IDs** for `signal.demographics.audiences`          | `?term=gen z`                              | `id`, `name`, `sample_size` ([Qloo Documentation][3])                                     |
| **Insights** (`GET /v2/insights`)        | Blend Qloo vectors (90 %) with your site signals (10 %) to score **destinations** and other entities      | see §4 for full parameter matrix           | ranked `entities[]` with `affinity`, `popularity`, tags, images ([Qloo Documentation][4]) |

---

## 2  Authentication & Environment

```bash
# Every request
Header:  X-Api-Key: <YOUR_HACKATHON_KEY>
Base:    https://hackathon.api.qloo.com    # ONLY this host works with hackathon keys
```

The same call against `staging.api.qloo.com` or `api.qloo.com` will return **401** with a hackathon key. ([Qloo Documentation][4], [Qloo Documentation][5])

---

## 3  Lookup APIs (Entity, Tag, Audience)

### 3.1  Entity Search

| Item                | Value                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| **Endpoint**        | `GET /search`                                                         |
| **Core params**     | `term` (string, required), `types` (CSV of entity URNs)               |
| **Supported types** | destination, place, artist, brand, movie, … ([Qloo Documentation][4]) |

> **Next.js example (app router, TypeScript)**
> `app/api/qloo/entity/route.ts`
>
> ```ts
> import { NextRequest, NextResponse } from 'next/server';
>
> export async function GET(req: NextRequest) {
>   const term = req.nextUrl.searchParams.get('q') ?? '';
>   const url  = new URL('/search', process.env.QLOO_API_BASE!);
>   url.searchParams.set('term', term);
>   url.searchParams.set('types', 'urn:entity:destination');
>
>   const r = await fetch(url, {
>     headers: { 'X-Api-Key': process.env.QLOO_API_KEY! }
>   });
>   return NextResponse.json(await r.json());
> }
> ```
>
> Add `QLOO_API_KEY` and `QLOO_API_BASE=https://hackathon.api.qloo.com` to `.env.local`.

### 3.2  Tags Search

Same structure; change endpoint to `/v2/tags`. Typical call:

```bash
GET /v2/tags?term=beach&types=urn:tag:travel_theme
```

### 3.3  Find Audiences

```bash
GET /v2/audiences?term=millennial
```

Use returned IDs inside `signal.demographics.audiences`.

---

## 4  Insights API Cheat‑Sheet (Destinations Focus)

| Parameter Group            | Key Fields (‡ = common in TasteJourney)                                                                         | Notes                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **filter.**\*              | `type‡` (must be `urn:entity:destination`), `location`, `tags`, `exclude.entities`, … ([Qloo Documentation][6]) | Narrows the candidate list.                   |
| **signal.interests.**\*    | `entities‡`, `tags`                                                                                             | Seed list from creator’s site + Qloo vectors. |
| **signal.demographics.**\* | `audiences`, `age`, `gender`                                                                                    | Optional but boosts relevance.                |
| **output**                 | `take` (max results), `offset`, `sort`                                                                          | Use `take=50` then post‑score locally.        |

Minimal GET request:

```bash
GET /v2/insights?filter.type=urn:entity:destination
                 &signal.interests.entities=<comma‑separated-IDs>
                 &take=100
```

For complex JSON bodies (e.g., `filter.exclude.entities.query`) switch to **POST** as documented. ([Qloo Documentation][7])

---

## 5  Weighted Scoring Inside Your App

The API already returns an `affinity` score (0–1). Combine it with your own metrics exactly as in the PRD:

```
Total_Score = 0.45*affinity   +
              0.25*communityEngagement +
              0.15*brandFit +
              0.10*budgetAlignment +
              0.05*localCollab
```

Filter out destinations failing hard constraints (visa, climate, budget) before picking the **top 3**.

---

## 6  End‑to‑End Flow in Next.js / Fastify‑style Route Handlers

1. **/api/qloo/search** – resolve entities (see §3.1)
2. **/api/qloo/tags** – resolve tags
3. **/api/qloo/audiences** – resolve audiences
4. **/api/qloo/insights** – request ranked destinations
5. Apply formula, run hallucination check, return top 3.

> **Tip:** Wrap fetch in a small utility that automatically injects the headers and retries on 429.

---

## 7  Advanced Tips & Gotchas

* **Pagination:** combine `take` and `offset`—the API will not stream. ([Qloo Documentation][7])
* **Rate limits:** plan for \~10 req/s. Cache lookup results in Redis for 5 h.
* **POST vs GET:** use POST only when parameters like `filter.exclude.entities.query` demand JSON arrays; otherwise GET is faster and cacheable. ([Qloo Documentation][4])
* **Entity vs Filter Types:** `/search` `types` list is **not** identical to `filter.type`; always cross‑check. ([Qloo Documentation][4])
* **Supported destination filters:** geohash, radius, popularity range, external rating counts (Tripadvisor, Resy). ([Qloo Documentation][6])

---

## 8  Why Qloo? (Business Context)

Qloo’s graph blends taste, metadata and content‑based signals to surface non‑obvious connections—ideal for creator monetisation, personalisation and location strategy. ([Qloo Documentation][8])

---

### Appendix A  Full List of Supported Destination Parameters

The **Entity Type Parameter Guide** lists every allowed field for destinations (required vs optional). ([Qloo Documentation][6])

---

*Document generated from Qloo’s official Hackathon Developer Guide, Parameter Reference, Lookup API docs and Solutions Overview.* ([Qloo Documentation][9], [Qloo Documentation][7], [Qloo Documentation][1], [Qloo Documentation][3], [Qloo Documentation][2], [Qloo Documentation][5], [Qloo Documentation][8], [Qloo Documentation][6], [Qloo Documentation][4])

[1]: https://docs.qloo.com/reference/get-search "Entity Search"
[2]: https://docs.qloo.com/reference/get-tags-1 "Tags Search"
[3]: https://docs.qloo.com/reference/get-audiences-1 "Find Audiences"
[4]: https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide "Qloo LLM Hackathon Developer Guide"
[5]: https://docs.qloo.com/reference/api-onboarding "API Onboarding and Authentication"
[6]: https://docs.qloo.com/reference/available-parameters-by-entity-type "Entity Type Parameter Guide"
[7]: https://docs.qloo.com/reference/parameters "Parameter Reference"
[8]: https://docs.qloo.com/docs/solutions-overview "Solutions Overview"
[9]: https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide?utm_source=chatgpt.com "docs.qloo.com"
