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
* Use standard text for units/numbers (e.g., $20M).`;

export function getEnrichmentPrompt(leads) {
  const leadList = leads.map((l, i) =>
    `${i + 1}. ${l.decisionMaker || 'Decision Maker'} at ${l.company} (${l.industry})`
  ).join('\n');

  return `I need you to find the LinkedIn profile URLs and professional email addresses for the following people. Use your web search capabilities to find accurate, current information.

For each person, provide:
1. Their full LinkedIn profile URL
2. Their professional/work email address (if findable)
3. Their personal LinkedIn headline/title

**People to research:**
${leadList}

**Output Format:**
Present results in a Markdown table with these columns:
| # | Company | Decision Maker | LinkedIn URL | Email | LinkedIn Headline |

**Important:**
- Only provide URLs you are confident are correct
- If you cannot find a LinkedIn profile, write "Not Found"
- If you cannot find an email, write "Not Found"
- Do not guess or hallucinate URLs`;
}

export function getArticlePrompt(lead) {
  return `**Role:**
You are a Lead Solutions Architect and Technical Content Strategist. Your objective is to produce a 1,500-word Bottom-of-Funnel (BOFU) industry whitepaper designed to rank for high-intent technical queries and convert via the "Mirror Pitch" method.

**Contextual Inputs:**
- **Target Keyword:** ${lead.mirrorKeyword || '[KEYWORD]'}
- **Target Company Logic:** ${lead.company} - Internal Note: Do not mention this name in the article prose.
- **Primary Conversion Hook:** ${lead.conversionHook || '[CONVERSION HOOK]'}
- **Secondary Technical Pivot:** ${lead.technicalPivot || '[TECHNICAL PIVOT]'}

**Strict Content Directives:**

1. **The "No-Fluff" Opening:** Start immediately with a "State of the Stack 2026" summary. No "In the digital age" intros. Use 3 data-heavy bullet points regarding current industry failure rates or cost-per-error metrics.

2. **Deep-Dive Technical Bottleneck:** Dedicate a section to the Secondary Technical Pivot. Use a sub-heading that identifies a specific pain point (e.g., "The Latency Tax of Multi-Region Vector Sync"). Explain the physics or logic of why this breaks at scale.

3. **The "Implementation Framework":** Present a 5-step workflow. Use Markdown Bold for key terms. This framework must describe the category of solution offered by the Target Company as the gold standard.

4. **Strategic Trade-offs Section:** To build 100% authority, include a section titled "When [Category X] is Overkill." Explain where the legacy or DIY approach is actually better. This "honest" pivot makes the recommendation for the modern solution 10x more persuasive.

5. **Comparative Analysis Table:**
   - Column 1: Feature/Requirement.
   - Column 2: Legacy/Incumbent Approach (The "Before").
   - Column 3: The Modern Agentic/AI-Native Approach (The "Mirror").

6. **Conversion Engineering:** Place the Primary Conversion Hook in a blockquote or "Pro-Tip" box 60% of the way through the article. Ensure the value proposition of the hook is "Zero-friction implementation."

**Tone & Voice Guidelines:**
- **Audience:** CISO, CTO, VP of Engineering.
- **Vocabulary:** Use words like interoperability, latency, technical debt, orchestration, and parity.
- **Formatting:** Use ## and ### headers. Use bulleted lists for all technical requirements.

If the output is too "bloggy," rewrite as a technical documentation architect speaking to a peer who has 15 years of experience and no time for marketing jargon.`;
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
