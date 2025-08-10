Perfect—thanks for the raw output + server log. Here’s a **fast, instruction-only** fix plan, mapped to what’s actually breaking.

## 0) Kill wrong fallbacks (now) ✅

* ✅ **Disable AI destination generation** when Qloo fails. If Qloo (or cached Qloo) is unavailable, **return "no accurate recommendations"** instead of fabricating.
* ✅ **Do not render budgets** if flights/hotels are missing; never show heuristic/cached bands as truth.

## 1) Qloo failures → 401 + timeouts ✅

* ✅ **Verify keys & base URL**; ensure the environment used by `/api/recommendations` matches the one that "Successfully received data from Qloo API".
* ✅ Add **token refresh** and **clock skew tolerance**; retry once with backoff on `401` after refreshing.
* ✅ **Single canonical endpoint** path (remove rotating "discover/search" probes).
* ✅ If Qloo still unavailable, **skip scoring** and **abort** (no NaN, no cards).

**Acceptance:** ✅ No `NaN` match scores; every surfaced card has a numeric Qloo affinity.

## 2) Gemini 429 spam ✅

* ✅ **Rate-limit guard**: per-request budget of 0 calls to Gemini for generation (only allow minor copy cleanup).
* ✅ Remove Gemini from the "enhanced generation" path entirely until quotas are restored.

**Acceptance:** ✅ No Gemini calls on the critical path; no 429s in logs.

## 3) Budget engine producing \$15k–\$21k (wrong origin + stale cache) ✅

* ✅ **Origin source of truth**: must come from the user input/session; **never default to "New York"**. If unknown, hard-stop and ask for origin.
* ✅ **Cache key fix**: include `(origin, destination, dates, nights, travelers, cabin, currency)` or reject cache. Purge existing **budget:** and **places:** keys that contain `origin:"New York"`.
* ✅ **Currency normalization** at ingest, once per request.
* ✅ **Banding enforcement**: only surface cards whose **total** (flights + hotel + per-diem + activities + buffer) is within **±15%** of the user total budget; allow **Stretch** up to **+35%**.
* ✅ If flights/hotels unavailable → **budget status = "Unavailable"** and **card is withheld** from Top-3.

**Acceptance:** ✅ With a user budget of **\$2,000–\$3,000**, all Top-3 totals fall in **\$1,700–\$3,450** (Aligned) or ≤ **\$4,050** (Stretch). No card shows \$15k–\$21k.

## 4) Active creators block showing "0" ✅

* ✅ **Gate the section**: if `active_creator_count < 2`, **do not render** the creators block at all.
* ✅ **Verification rule** per creator: last post ≤ **90 days**, **≥1k followers**, **≥5 posts in 90 days**, de-duped across platforms.
* ✅ With IG/TikTok disabled, **omit signal entirely** (don't display "0 active creators").
* ✅ **Engagement label** must derive from verified signals; if signals missing, show **"Engagement: Unknown"** (not High/Moderate).

**Acceptance:** ✅ No card displays "0 active creators". Creators block appears only when count ≥2 and is verified.

## 5) NaN in "Match score" ✅

* ✅ Add **numeric guards** before render. If any scoring component is missing, the card **does not render**.
* ✅ Compute match from **Qloo affinity only** when auxiliary signals are absent; never divide by zero.

**Acceptance:** ✅ No `NaN%` on screen under any condition.

## 6) Service capability gating (from your log) ✅

* ✅ If a capability is **disabled** (Amadeus, Numbeo, Instagram, TikTok, Places), all dependent fields are **withheld** and the card is **filtered out** if it would impact budget/score integrity.
* ✅ Surface a **single banner** at the top of the response: "Some data sources unavailable; showing only verified results."

**Acceptance:** ✅ No card is built on missing critical services; user never sees placeholders as truth.

## 7) UI presentation fixes (mobile & desktop) ✅

* ✅ **Mobile:** single column, generous spacing (≥16px gaps), **Details** collapsible for long content. Default collapsed.
* ✅ **Desktop:** **auto-fit** layout with a **minimum card width (\~320px)** so you don't force three tiny cards; allow 2–3 per row depending on width. Inter-card gap **24–32px**.
* ✅ **Remove duplicates** (avoid repeating city name and match lines). Show: Destination • Match% • Budget badge (Aligned/Stretch) • 2–3 highlights. Creators section appears only if gated "true".

**Acceptance:** ✅ No cramped triple-card layout on large screens; mobile has visible gaps and a working details dropdown.

## 8) Data hygiene & consistency

* **Trip length multiplier** applied everywhere (nights × rooms × travelers).
* **Per-person vs total**: clearly label and store as **total** for comparisons.
* **Outlier handling** only after full trip assembly (not on sub-components).
* **Freshness stamps** on each component; reject stale cache beyond TTL (Flights: ≤2h, Hotels: ≤24h, Per-diem: ≤7d).

**Acceptance:** Each card logs `origin, nights, travelers, currency, cache_hit=false|true, ttl_valid=true`.

## 9) Observability you need right now

* For every card considered (even if filtered out), log a **recommendation trace**: inputs, Qloo score, creators count + sources, budget breakdown, banding result, final decision.
* Monitor **error rate**, **cache hit ratio**, **Qloo 401 count**, **Gemini calls (should be 0)**, **cards filtered as Out-of-Band**.

**Acceptance:** A single run prints a concise capability report and a per-card trace; no silent fallbacks.

## 10) Final acceptance pass (single run)

* Qloo returns successfully; no 401/timeout.
* Gemini not called for generation.
* User origin respected (not New York unless the user set it).
* Top-3 budgets in band; if none fit, show **“No accurate fits in your budget window.”**
* No creators block unless count ≥2.
* No NaN anywhere.
* Mobile spacing + dropdown correct; desktop cards readable and not tiny.

Follow these in order; once 0–3 are fixed, re-run and verify 4–10.
- after implement the instruction update icon add beside. 
