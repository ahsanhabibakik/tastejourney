## 🚦 Where We’re Stuck — Quick Recap

1. **Hard-coded Q-list** → same five questions for every creator.
2. **No constraint-checking** → user can pick **\$500** *and* **Luxury** and the engine still runs.
3. **Budget parsing is rigid** (“\$1000-2500” strings only).
4. **Brand / creator intel exists in the backend but never surfaces in UI or scoring.**

---

## 🧠 Big-Picture Fix — Dynamic Decision-Tree Powered by Rules + LLM

> *Target:* Ask **only** the questions we need, validate answers in real time, and auto-resolve impossible combos before the recommendation call.

### 1 ⃣ Move from **Static Array → Question Graph**

| Field            | Purpose                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| `id`             | unique key (`budget`, `style`, …)                                                                         |
| `promptTemplate` | can reference previous answers *e.g.* “You mentioned **{style}** – what’s a comfortable budget per day?”. |
| `type`           | `single`, `multi`, `numeric`, `freeText`                                                                  |
| `options`        | optional list; can be generated at runtime                                                                |
| `dependsOn`      | list of `(id, operator, value)` tuples                                                                    |
| `validator`      | TS/JSONSchema or Zod rule                                                                                 |
| `llmAssist`      | flag → if `true`, pass user free-text to Gemini for parsing/normalising                                   |

Store this graph in JSON (easier A/B, no redeploy).

### 2 ⃣ Mini Rule-Engine before Gemini

**Why?** Cheap, deterministic checks catch 80 % of contradictions without hitting the token wall.

```pseudo
// very light pseudo-code
if budget < STYLE_MIN[style]:
    nextQuestion = "Your budget seems tight for a {style} trip. \
                   Would you like to (a) raise budget, (b) switch to Premium-Economy, or (c) keep both?"
```

Rules live in one file; unit-testable.

### 3 ⃣ LLM “Issue Resolver” for Edge-Cases

When rules flag “conflict = true”, call **Gemini** with a short system prompt:

```
You are a travel-budget reasoning assistant.
Given:
  style = Luxury
  budget = 500
Return either:
  { "resolution": "ask_clarify", "clarify_question": "..."}
  { "resolution": "auto_adjust", "new_budget": 3500 }
  { "resolution": "switch_style", "new_style": "Premium" }
```

### 4 ⃣ Open-Ended Input Parsing

*One* Gemini function for all free-text answers:

```json
{
 "user_input": "Around two grand, three-four nights, need sun but not humid",
 "fields": ["budget","duration","climate"]
}
→
{ "budget":"$1800-2200", "duration":"3-4 days", "climate":["Tropical/Sunny","Avoid Humid"] }
```

Use that to populate `UserAnswers` without extra UI steps.

### 5 ⃣ Continuous Question Selection API

Front-end now calls:

```
POST /api/next-question
body: { answers: {…}, lastQuestionId, conflict: bool }
→  { nextQuestion, done: bool }
```

Back-end algorithm:

1. Merge current answers into context.
2. Run rule-engine; maybe call Gemini resolver.
3. Pick the **highest-priority unanswered** node whose `dependsOn` are satisfied.
4. If none left → `done = true`.

### 6 ⃣ Scoring Pipeline Upgrade

*Input:* cleaned `answers` + Qloo vector + scraped site.
*New steps:*

1. **Price Feasibility Filter** – pull real CPM/day estimates from Numbeo 🡆 drop destinations that need ≥ 1.4× user budget.
2. **Creator-Availability Gate** – require `totalActiveCreators > threshold` (config).
3. **Brand-Match Boost** – if at least one brand in destination overlaps user’s existing or aspirational sponsor list, add +10 to `Total_Score`.
4. **Final RAG check** stays the same.

### 7 ⃣ Surface Brand & Creator Intel in UI

Add two accordions under each card:

```
🔗 Brand Matches (3)
• Hyatt Journeys – Affiliate rate up to 7 %
• GoPro – Gear loan partnerships
• Klook – Commissioned city passes

🤝 Creators to DM (2)
• @BaliBound (85 k) – collab reply rate 35 %
• @EatPrayLens (44 k) – open for joint reel
```

### 8 ⃣ Accept Arbitrary Budgets

*Frontend:* replace button set with **numeric/slider** + “Custom” chip.
*Parser:* regex `\d{2,}` → int, store as USD per trip *or* per-day after dividing by trip length.

---

## 🛠️ Implementation Checklist

| Task                                 | Owner | Est (h) |
| ------------------------------------ | ----- | ------- |
| JSON question graph + loader         | BE    | 4       |
| Rule-engine (TS)                     | BE    | 3       |
| Gemini “Resolver” function           | BE    | 2       |
| `/next-question` endpoint            | BE    | 3       |
| Front-end hook `useDynamicQuestions` | FE    | 4       |
| Custom budget input component        | FE    | 2       |
| Brand & creator accordions           | FE    | 3       |
| Destination filter upgrades          | BE    | 4       |
| Unit tests for rules & parser        | QA    | 3       |

---

## 🔑 Key Design Decisions & Rationale

1. **Rule-first, LLM-second** → cheaper, faster, explains itself.
2. **Question graph** keeps UX modular; future PMs can reorder or A/B without code.
3. **Single LLM parsing function** avoids “one-prompt-per-field” cost spiral.
4. **Early feasibility filter** saves tokens by never describing Dubai to a \$500 traveller.

---

## 🧩 Next after MVP

* Auto-learn friction: log every conflict → fine-tune rule thresholds.
* Incremental profiling: ask deeper, niche-specific questions **after** first destination batch (“Want more luxury food spots?”).
* Multilingual prompts; Bangladesh target market 😊.

---
### TL;DR (English)

We’ll replace the fixed questionnaire with a **dynamic question bank** driven by a lightweight **rule engine** that catches obvious conflicts (e.g. “\$500 budget + Luxury style”) and only escalates to the Gemini LLM for intelligent resolution when needed. User inputs—including free-text answers like “around two grand” or “three nights”—will be parsed in one unified LLM call. We’ll surface real brand-match and creator collaboration data directly in the UI under each destination. This approach keeps the conversation fluid, reduces unnecessary LLM calls, and ensures highly relevant, budget-appropriate recommendations. 👍
