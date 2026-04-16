export const LEAD_GEN_PROMPT = `**Role:**
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
* **CRITICAL: Output the table inside a markdown code block (triple backticks). Use standard pipe-delimited markdown table format with | separators. Do NOT use any other table format. Each row must be on a single line.**`;

export function getEnrichmentPrompt(leads) {
  const companyUrls = leads.map((l) => {
    // Try to construct a URL from company name if we don't have one
    const name = l.company || '';
    return name;
  }).filter(Boolean);

  const companyList = companyUrls.join('\n');

  return `You are a B2B lead research assistant. Your ONLY job is to research companies from their URL and output data in a strict markdown table format. NEVER add any extra text, explanations, greetings, or notes outside the table.

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

${companyList}`;
}

export function getArticlePrompt(lead) {
  return `**Role:**
You are a Senior Technical Content Strategist specializing in Bottom-of-Funnel (BOFU) search intent for B2B Enterprise audiences. Your task is to write a high-authority, "Vendor-Agnostic" industry guide based on a specific "Mirror Pitch" keyword.

**Input Data:**
* **Target Keyword:** ${lead.mirrorKeyword || '[KEYWORD]'}
* **Target Article Title:** ${lead.articleTitle || '[TITLE]'}
* **Search Intent / Pain Point:** ${lead.searchIntent || '[DESCRIBE THE PAIN]'}
* **Target Company (The Lead):** ${lead.company} — Internal Note: Do not mention this name in the article prose.
* **Primary Conversion Hook:** ${lead.conversionHook || '[CONVERSION HOOK]'}
* **Secondary Technical Pivot:** ${lead.technicalPivot || '[TECHNICAL PIVOT]'}

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
    * **Length:** Aim for 1,200+ words of dense, high-utility value.

If the output is too "bloggy," rewrite this as a technical documentation architect speaking to a peer who has 15 years of experience and no time for marketing jargon.`;
}

export function getArticleToHtmlPrompt(lead) {
  return `Convert the following article into a clean, semantic HTML page. Use the design style of a professional technical whitepaper.

**Article Title:** ${lead.articleTitle || 'Technical Whitepaper'}
**Target Keyword:** ${lead.mirrorKeyword || ''}

**HTML Requirements:**
- Use semantic HTML5 tags (article, section, header, aside, blockquote)
- Include a responsive meta viewport tag
- Inline CSS styling (no external files) - clean, modern, professional look
- Font: system-ui or Inter
- Color scheme: dark text on white, with accent color #8b5cf6 for headings and callouts
- Tables should be styled with alternating row colors
- Blockquotes/Pro-Tips should have a left border accent and light background
- Include Open Graph meta tags for SEO
- Make it print-friendly

**Article Content:**
[PASTE THE ARTICLE TEXT HERE]

**Output:** Just the complete HTML code, nothing else.`;
}

export function getOutreachMessagePrompt(lead) {
  return `Generate a personalized LinkedIn connection request message (max 300 characters) for the following person.

**Target Person:**
- Name: ${lead.decisionMaker || 'Decision Maker'}
- Company: ${lead.company}
- Industry: ${lead.industry}
- Role: ${lead.decisionMaker || 'Executive'}
- Their pain point / signal: ${lead.signal}
- Technical pivot angle: ${lead.technicalPivot || 'N/A'}
- Buyer pain: ${lead.searchIntent || 'N/A'}

**Our Value Proposition:**
Xtrusio helps companies build authority through AI-powered content strategy and programmatic SEO. We create "Mirror Pitch" content that positions our clients as thought leaders alongside their target prospects.

**Message Rules:**
1. Lead with THEIR specific pain point, not our pitch
2. Reference something specific about their company or recent funding
3. Do NOT mention "I saw your profile" or generic openers
4. Do NOT pitch directly - create curiosity
5. Keep it under 300 characters
6. Sound human, not like a bot

**Output:** Just the message text, nothing else.`;
}
