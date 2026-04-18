// Prompt Library — user-editable prompts stored in localStorage
// All 6 prompts can be edited in the UI. Placeholders like {{company}} are replaced at copy time.

const PROMPT_STORAGE_KEY = 'xtrusio_prompts';

export const PROMPT_DEFS = {
  leadGen: {
    id: 'leadGen',
    title: 'Lead Generation Prompt',
    target: 'gemini',
    description: 'Run in Gemini to find recently funded companies matching firmographic criteria.',
    placeholders: [],
    defaultPrompt: `**Role:**
You are an elite B2B Lead Generation Researcher and Technical SEO Strategist. Your goal is to identify high-value sales targets from the last 48 hours of global funding news and immediately construct a "Mirror Pitch" SEO framework for each.

**Step 1: The Live Search Phase (Strict Filtering)**
Identify companies that meet these exact criteria. Do not hallucinate; if only 5 exist, provide 5.
1. **Announcement Window:** Within the strictly preceding 24-48 hours.
2. **Funding Amount:** $20M-$50M USD (Series A or B preferred).
3. **Company Size:** 50 to 1,000 employees.
4. **Industries:** B2B SaaS, FinTech, HealthTech, CyberSecurity, AI Infra, or Hard Tech.
5. **Sources:** TechCrunch, PR Newswire, VentureBeat, and official VC portfolios.

**Step 2: The "Mirror Pitch" SEO Logic**
For every lead identified, you must engineer a "Mirror Pitch." This is a strategy where we rank for a problem the lead solves, positioning ourselves as the authority that recommends them (while capturing the lead's potential customers).

**Step 3: Output Generation (Unified Table)**
Provide a single Markdown table with the following 10 columns:

1. **#**
2. **Company Name (Industry)**
3. **Size / Funding Signal:** (Employee count / exact date & amount).
4. **Likely Decision Maker:** (Founder/CEO for Series A; VP of Marketing/CMO for Series B+).
5. **Quality Score:** (1-10 based on growth urgency).
6. **The "Mirror" Long-Tail Keyword:** A BOFU query (5+ words) focused on a granular technical problem they solve.
7. **Target Article Title:** An "Agnostic Industry Guide" or "Vendor Comparison." (Do not use the company name in the title).
8. **Search Intent (The Buyer Pain):** Define the persona searching and their specific budget-driving crisis.
9. **Primary Conversion Hook:** A specific lead magnet (calculator, template, or audit) to capture the reader's email.
10. **Secondary Technical Pivot:** The technical "Sales Engineering" angle (e.g., API integration, compliance hurdle, or data migration) used to prove deep expertise during outreach.

**Formatting & Tone:**
* Provide precise, definitive answers.
* Zero fluff.
* No introductory filler.
* Use standard text for units/numbers (e.g., $20M).
* **CRITICAL: Output the table inside a markdown code block (triple backticks). Use standard pipe-delimited markdown table format with | separators. Do NOT use any other table format. Each row must be on a single line.**`,
  },

  enrichment: {
    id: 'enrichment',
    title: 'Lead Enrichment Prompt',
    target: 'grok',
    description: 'Run in Grok to find LinkedIn URLs, emails, and key people (CEO + marketing team) for each company.',
    placeholders: ['{{companyList}}'],
    defaultPrompt: `You are a B2B lead research assistant. Your ONLY job is to research companies from their URL and output data in a strict markdown table format. NEVER add any extra text, explanations, greetings, or notes outside the table.

Fixed table headers (exact order, no changes):
| S no. | Company URL | Company Name | Revenue | Founder Name | Founder LinkedIn Link | LinkedIn Email | Email | Email Activity | Report | Follow Up | About Company | Source |

Rules:
- Input will always be one or more company URLs (one per message or listed).
- For each company:
  - Research: Company name, latest revenue (or "Not publicly available" if private/small), short 1-line description of what the company does (put in About Company).
  - Find up to 4 key people (separate row for each): Prioritize CEO/Founder, then marketing roles (CMO, Head of Marketing, Marketing Director/Manager, etc.). Goal: reach CEO and marketing team.
  - For each person row: Put their role + name in "Founder Name" column (e.g., "John Doe (CEO)").
  - Find verified LinkedIn profile URL (put in Founder LinkedIn Link). If none, use company page or leave blank.
  - Find real email if possible, else intelligently guess (common patterns like first.last@domain.com).
  - Repeat company URL, name, revenue, and about company in every row for that company.
  - Fill Source with where info came from (e.g., website, LinkedIn, Crunchbase).
  - Leave LinkedIn Email, Email Activity, Report, Follow Up blank unless you have real data.
- Sequential S no. starting from 1.
- Output ONLY the markdown table, nothing else.
- Use your search/tools to get accurate, up-to-date info.

Here are the companies to research:

{{companyList}}`,
  },

  audit: {
    id: 'audit',
    title: 'SEO / AI Visibility Audit Prompt',
    target: 'claude',
    description: 'Run in Claude (your audit project) to generate a comprehensive SEO + AI citation audit for a target company. Output is used to build the Audit HTML sent to the prospect.',
    placeholders: ['{{company}}', '{{companyUrl}}', '{{industry}}', '{{aboutCompany}}'],
    defaultPrompt: `**Role:**
You are a Senior SEO & AI Visibility Auditor. Your job is to produce a deep, data-driven audit for a single target company. This audit will be sent to the company as proof of capability for an outreach campaign.

**Target Company:**
- Name: {{company}}
- URL: {{companyUrl}}
- Industry: {{industry}}
- About: {{aboutCompany}}

**Audit Structure (produce every section, even if short):**

## 1. Executive Summary
- 3-5 bullet points summarizing their current AI visibility state
- One headline finding (e.g., "Invisible on 73% of their own category queries")

## 2. Target Audience & Persona Analysis
- Define the 3 primary buyer personas
- For each: role, budget range, pain points, decision criteria
- Map each persona to 5 specific questions they would ask an AI (ChatGPT/Gemini/Claude)

## 3. AI Citation Audit
- List 25 high-intent buyer questions in their category (derived from persona analysis)
- For each question: predict whether {{company}} gets cited in AI responses (Likely / Unlikely)
- Estimate AI visibility share: what % of their category's AI queries cite them

## 4. Competitor Visibility Benchmark
- Identify the top 5 direct competitors
- For each: estimate their AI citation rate on the same 25 questions
- Present as a ranked table

## 5. Keyword Difficulty & Content Gap
- For the 25 questions, classify by estimated keyword difficulty (Low / Medium / High)
- Highlight 5-10 LOW difficulty questions as "quick win" topics
- For each quick win: recommend an article title (vendor-agnostic, BOFU intent)

## 6. Content Gap Analysis
- Audit their existing blog/content for coverage of these 25 questions
- Identify specific content gaps (questions they have no content for)

## 7. Backlink & PR Opportunities
- 10 specific PR/backlink angles that would boost their AI citation rate
- For each: target publication + angle + estimated difficulty

## 8. Mirror Pitch Strategy
- Explain how an agency could rank for THEIR buyer queries (capturing top-of-funnel traffic their prospects search)
- Recommend 3 specific "Mirror Pitch" articles to build first

## 9. 90-Day Action Plan
- Week 1-2: Foundation
- Week 3-6: Content sprint
- Week 7-12: PR + authority building
- Expected outcomes: % improvement in AI citation rate

**Formatting:**
- Use markdown throughout
- Use tables wherever comparative data is shown
- Be specific: cite exact numbers, page URLs, and competitor names
- Zero fluff — no "In today's digital landscape" openings
- Write for a CMO or CEO who has 90 seconds to skim`,
  },

  article: {
    id: 'article',
    title: 'BOFU Article Prompt',
    target: 'gemini',
    description: 'Run in Gemini to write a 1,500-word vendor-agnostic BOFU article for a specific lead. This article will be published on your blog.',
    placeholders: ['{{keyword}}', '{{articleTitle}}', '{{searchIntent}}', '{{company}}', '{{conversionHook}}', '{{technicalPivot}}'],
    defaultPrompt: `**Role:**
You are a Senior Technical Content Strategist specializing in Bottom-of-Funnel (BOFU) search intent for B2B Enterprise audiences. Your task is to write a high-authority, "Vendor-Agnostic" industry guide based on a specific "Mirror Pitch" keyword.

**Input Data:**
* **Target Keyword:** {{keyword}}
* **Target Article Title:** {{articleTitle}}
* **Search Intent / Pain Point:** {{searchIntent}}
* **Target Company (The Lead):** {{company}} — Internal Note: Do not mention this name in the article prose.
* **Primary Conversion Hook:** {{conversionHook}}
* **Secondary Technical Pivot:** {{technicalPivot}}

**Article Structure & Rules:**
1. **The "Executive Summary" (TL;DR):** Open with 3 bullet points summarizing the current 2026 landscape of this specific problem. Use zero fluff.
2. **Problem Anatomy:** Devote 300 words to the "Secondary Technical Pivot." Explain why legacy solutions fail at this specific bottleneck (e.g., "Why traditional API gateways throttle multi-agent AI loops").
3. **The "Checklist for Success":** Provide a 5-point technical framework for solving this problem. This framework must align perfectly with the **Target Company's** unique features, without mentioning the company by name.
4. **The Vendor Comparison Table:** Create a Markdown table comparing 3 "Archetypes" of solutions (e.g., "Legacy Giants," "DIY/Open Source," and "Modern Agentic Platforms").
    * *Strategic Note:* Ensure the "Modern" category (which represents the Target Company) is the clear winner for high-growth scenarios.
5. **The Conversion Bridge:** Insert a prominent call-to-action for the **Primary Conversion Hook**.
6. **Tone & Style:**
    * **Persona:** Write as a Lead Architect or CISO for an Enterprise firm.
    * **Constraints:** No "In today's fast-paced world." Use precise industry terminology.
    * **Length:** Aim for 1,200-1,500 words of dense, high-utility value.

If the output is too "bloggy," rewrite as a technical documentation architect speaking to a peer who has 15 years of experience and no time for marketing jargon.`,
  },

  comparison: {
    id: 'comparison',
    title: 'Comparison Blog Prompt',
    target: 'claude',
    description: 'Run in Claude to write a competitor-comparison blog. Comparison articles rank fast and position the target company alongside peers.',
    placeholders: ['{{company}}', '{{competitors}}', '{{industry}}', '{{mirrorKeyword}}'],
    defaultPrompt: `**Role:**
You are a Senior Technical Analyst writing a comparison article for B2B decision makers.

**Target Company:** {{company}}
**Direct Competitors:** {{competitors}}
**Industry:** {{industry}}
**Target Keyword:** {{mirrorKeyword}}

**Article Structure:**

## 1. Executive Summary (TL;DR)
3-4 bullets summarizing who wins for which use case.

## 2. Evaluation Criteria
Define 8-10 technical criteria a buyer should evaluate:
- Feature depth
- Pricing model
- Integration ecosystem
- Scalability
- Compliance/security
- Developer experience
- Support quality
- Time-to-value
(Add industry-specific criteria as relevant)

## 3. Head-to-Head Comparison Table
Create a comprehensive markdown table:
| Criteria | {{company}} | [Competitor 1] | [Competitor 2] | [Competitor 3] |
Rate each on a 5-point scale with a short rationale.

## 4. Use Case Fit
For each tool, identify the "best fit" scenarios:
- Best for enterprise at scale
- Best for fast-growing startups
- Best for regulated industries
- Best for developer teams
- Best for budget-conscious buyers

## 5. Pricing & TCO Analysis
Compare pricing tiers, hidden costs, and estimated TCO for a 100-seat deployment.

## 6. Our Verdict
Objective take: {{company}} excels at [X, Y, Z]. Competitors win when [specific scenarios].

## 7. Interactive Decision Helper
Include a decision tree or scorecard the reader can use to pick the right tool.

**Tone:** Analytical, balanced, and data-rich. Do not appear biased toward {{company}} — authenticity is the point. Length: 1,800-2,200 words.`,
  },

  articleToHtml: {
    id: 'articleToHtml',
    title: 'Article → HTML Conversion Prompt',
    target: 'claude',
    description: 'Run in Claude to convert article markdown/text into publishable HTML matching your site design.',
    placeholders: ['{{articleTitle}}', '{{keyword}}', '{{articleContent}}'],
    defaultPrompt: `Convert the following article into a clean, semantic HTML page. Use the design style of a professional technical whitepaper.

**Article Title:** {{articleTitle}}
**Target Keyword:** {{keyword}}

**HTML Requirements:**
- Use semantic HTML5 tags (article, section, header, aside, blockquote)
- Include responsive meta viewport tag
- Inline CSS styling (no external files) — clean, modern, professional look
- Font: system-ui or Inter
- Color scheme: dark text on white, with accent color #8b5cf6 for headings and callouts
- Tables should be styled with alternating row colors
- Blockquotes/Pro-Tips should have a left border accent and light background
- Include Open Graph meta tags for SEO
- Make it print-friendly

**Article Content:**
{{articleContent}}

**Output:** Just the complete HTML code, nothing else.`,
  },

  newsRadar: {
    id: 'newsRadar',
    title: 'News Radar (Daily Discovery)',
    target: 'gemini',
    description: 'Run each morning in Gemini (with Deep Research / grounding enabled) to find 1–3 high-volume events from the last 24h in Bahrain, UAE, and Saudi Arabia worth writing a fast-publish blog on.',
    placeholders: ['{{today}}'],
    defaultPrompt: `**Role:**
You are a real-time news analyst and SEO opportunity scout for a B2B tech operator based in Bahrain. Your job is to scan the last 24 hours of news and identify 1–3 events that are (a) high-volume/trending and (b) rankable opportunities for a fast-published, opinion-led blog.

**Date context:** {{today}}

**Regional priority (in order):** Bahrain → UAE → Saudi Arabia → wider GCC → global tech with GCC implications.

**Audience profile:**
- Reader: CTOs, CMOs, Heads of Engineering, founders, growth/marketing leaders.
- Distribution edge: fast publishing, strong opinion, local proximity (Bahrain/GCC).
- Core framing we like: "Mirror Pitch / Underdog vs Champion" — we critique large incumbents (e.g., JP Morgan, AWS, Salesforce) by name so smaller regional peers (local banks, boutique firms, mid-market SaaS) read the post and recognize themselves as the underdog we are implicitly championing.

**Sources to scan (use search/grounding — do not hallucinate):**
- Reddit: r/devops, r/selfhosted, r/SaaS, r/startups, r/bahrain, r/dubai, r/saudiarabia, r/MachineLearning
- Google News for: gulf-news.com, thenationalnews.com, arabianbusiness.com, gdnonline.com, khaleejtimes.com, zawya.com, wamda.com
- G2 / Capterra / Product Hunt movement (new category leaders, big drops)
- Official company blogs, VC announcements, regulatory filings (SAMA, CBB, CBUAE, DIFC, ADGM)
- Global tech outlets: TechCrunch, The Information, Rest of World

**Selection criteria (event qualifies ONLY if ALL are true):**
1. Broke or trended within the last 24 hours.
2. Has high search volume potential — either by named entity (company/person/product) OR by broad query (e.g., "UAE AI regulation 2026", "CBB open banking rules").
3. We have an angle we can take: underdog-vs-champion critique, contrarian explainer, "what this means for GCC operators", technical deep-dive.
4. Rankable within 24–72h — low-to-medium keyword difficulty, or breaking news where speed wins.
5. Relevant to B2B tech / SaaS / fintech / regulation / AI / cloud / security / marketing / devops.

**Output (STRICT markdown table, inside a code block):**

| # | Event Headline | Date / Source | Event Type | High-Volume Signal | Target Angle | Underdog/Champion Play | Target Keyword | Suggested Article Title | Quality Score (1-10) |

Rules:
- Provide 1, 2, or 3 rows based on TRUE opportunity. Quality over quantity. If nothing today crosses the bar, return exactly 1 row with Quality Score ≤ 4 and prefix the headline with "[LOW DAY]".
- Date / Source: full source URL + publish time in GMT+3.
- Event Type: Funding / Launch / Regulation / Acquisition / Outage / Leadership / Controversy / Market Move / Partnership / Other.
- High-Volume Signal: concretely why people will search this in the next 48h (e.g., "CBB just announced open banking framework — every GCC fintech founder will search this tomorrow").
- Target Angle: the opinionated take we will write.
- Underdog/Champion Play: name the big incumbent we will critique AND the smaller peer(s) who will identify with our piece.
- Target Keyword: 3–7 word BOFU-ish query someone would type.
- Suggested Article Title: punchy, under 70 chars, no clickbait.
- Quality Score rubric: 10 = instant publish / guaranteed pickup · 7–9 = strong · 5–6 = fine on a slow day · <5 = skip.
- Output ONLY the table inside a markdown code block. No preamble, no closing summary, nothing else.`,
  },

  newsArticle: {
    id: 'newsArticle',
    title: 'News Article (Fast-Publish Blog)',
    target: 'gemini',
    description: 'Run in Gemini to write a 900–1,300 word fast-publish opinion blog for a specific news event. Designed to rank within 24–72h while the news is hot.',
    placeholders: ['{{headline}}', '{{eventType}}', '{{dateSource}}', '{{angle}}', '{{underdogChampion}}', '{{keyword}}', '{{title}}'],
    defaultPrompt: `**Role:**
You are a senior technical writer + editorial strategist. Your job is to write a fast-publish, opinion-led blog post that ranks within 24–72 hours while the news is hot.

**Event context:**
- Headline: {{headline}}
- Event type: {{eventType}}
- Source / date: {{dateSource}}
- Editorial angle: {{angle}}
- Underdog/Champion play: {{underdogChampion}}
- Primary keyword: {{keyword}}
- Working title: {{title}}

**Article rules:**
1. **Length:** 900–1,300 words. Dense. Zero fluff.
2. **Structure (in this exact order):**
   - **TL;DR box (at the top, 3 bullets).** Each bullet should carry its own opinion.
   - **Hook (80–120 words):** Open with the most surprising angle. Not "In today's digital landscape." Not "It is important to note."
   - **What actually happened (~150 words):** Neutral factual summary with date, dollar amount, named people, and source link.
   - **The real story (~400–500 words):** The opinionated take — what the industry is missing. Use Underdog/Champion framing. Critique the incumbent by name where appropriate. Give smaller peers a mirror.
   - **What this means for GCC operators (~200–300 words):** Localize for Bahrain / UAE / Saudi. Concrete implications for CTOs, founders, marketers. Name specific regulatory bodies (CBB, SAMA, CBUAE, DIFC, ADGM) where relevant.
   - **Practical checklist (~100–150 words):** 4–6 actionable bullets a reader implements this week.
3. **Tone:** Sharp, confident, mildly contrarian. Write as the senior in the room calling out what everyone else missed. No hedging.
4. **SEO:** Work the primary keyword naturally into H2s and first paragraph. Include 2–3 related long-tail queries as secondary H2s. Do not stuff.
5. **Attribution:** Link out to the primary source in paragraph 2. Never link to competitors.
6. **No AI tells.** No "In summary." No "It is important to note." Write like a human senior editor with 15 years of experience.

**Output:** Full article in markdown, starting with # {{title}} (or an improved version if you can write a sharper title — put the final title on the first line). Nothing before or after the article.`,
  },

  newsImage: {
    id: 'newsImage',
    title: 'News Article — Image Prompt',
    target: 'gemini',
    description: 'PLACEHOLDER — edit to match your blog\'s visual identity. Generates an image prompt you copy into Imagen / Gemini image / Midjourney, download the image, and upload manually to your blog.',
    placeholders: ['{{title}}', '{{angle}}', '{{eventType}}'],
    defaultPrompt: `[PLACEHOLDER — edit this prompt in the Prompts page to match your blog's visual style.]

Generate a 1600x900 editorial hero image for a fast-publish opinion blog post.

Context:
- Article title: {{title}}
- Editorial angle: {{angle}}
- Event type: {{eventType}}

Style requirements:
- Editorial / magazine cover aesthetic — not clickbaity, not stock-photo generic.
- Dark background preferred, single restrained accent colour (violet #8b5cf6 or deep teal).
- NO embedded text, NO logos, NO watermarks.
- Choose cinematic photoreal OR flat vector — whichever better suits the event type.
- Aspect ratio: 16:9, print-safe.
- Audience: B2B CTOs, founders, senior operators. Serious, not gimmicky.

Output: image only.`,
  },

  outreachMessage: {
    id: 'outreachMessage',
    title: 'LinkedIn Outreach Message Prompt',
    target: 'claude',
    description: 'Run in Claude to generate a personalized LinkedIn connection message for a decision maker. The message references the 3 pieces of content already published for their company.',
    placeholders: ['{{decisionMaker}}', '{{company}}', '{{industry}}', '{{signal}}', '{{technicalPivot}}', '{{searchIntent}}', '{{auditUrl}}', '{{articleUrl}}', '{{comparisonUrl}}'],
    defaultPrompt: `Generate a personalized LinkedIn connection request message (max 300 characters) for the following person.

**Target Person:**
- Name: {{decisionMaker}}
- Company: {{company}}
- Industry: {{industry}}
- Recent signal: {{signal}}
- Their technical pain: {{technicalPivot}}
- Their buyer pain: {{searchIntent}}

**What we've already published about them (link these in follow-up DM, not the connect request):**
- Audit: {{auditUrl}}
- Industry guide article: {{articleUrl}}
- Comparison analysis: {{comparisonUrl}}

**Message Rules:**
1. Lead with THEIR specific pain point, not our pitch
2. Reference the recent signal (funding, new hire, etc.) to show this isn't a mass blast
3. Create curiosity — don't pitch directly in the connect request
4. Sound human, not like a bot
5. Keep under 300 characters

**Also generate a 2nd "follow-up DM" (max 600 characters) that:**
- Acknowledges they accepted the connect
- Shares one of the three published URLs (pick the most relevant: audit if the pain is general, article if it's a specific question, comparison if they have strong competitors)
- Ends with a soft ask for 15 minutes to walk them through the findings

**Output format:**
Connect message: [text]
Follow-up DM: [text]`,
  },
};

export function loadPrompts() {
  try {
    const raw = localStorage.getItem(PROMPT_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    // Merge stored with defaults so new prompt types added in code show up
    const merged = {};
    for (const key of Object.keys(PROMPT_DEFS)) {
      merged[key] = {
        ...PROMPT_DEFS[key],
        prompt: stored[key]?.prompt ?? PROMPT_DEFS[key].defaultPrompt,
      };
    }
    return merged;
  } catch {
    return Object.fromEntries(
      Object.entries(PROMPT_DEFS).map(([k, v]) => [k, { ...v, prompt: v.defaultPrompt }])
    );
  }
}

export function savePrompt(id, promptText) {
  try {
    const raw = localStorage.getItem(PROMPT_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[id] = { prompt: promptText };
    localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch (e) {
    console.error('Failed to save prompt', e);
    return false;
  }
}

export function resetPrompt(id) {
  try {
    const raw = localStorage.getItem(PROMPT_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    delete stored[id];
    localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

export function resetAllPrompts() {
  try {
    localStorage.removeItem(PROMPT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fill a prompt template with variables.
 * @param {string} promptText - the prompt template with {{placeholders}}
 * @param {Object} vars - key/value pairs for replacement
 * @returns {string} filled prompt
 */
export function fillPrompt(promptText, vars = {}) {
  let result = promptText;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(placeholder, value ?? '');
  }
  return result;
}

/**
 * Get a prompt by id (with any user edits applied) and fill placeholders.
 */
export function getPrompt(id, vars = {}) {
  const prompts = loadPrompts();
  const def = prompts[id];
  if (!def) return '';
  return fillPrompt(def.prompt, vars);
}
