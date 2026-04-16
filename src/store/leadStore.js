const STORAGE_KEY = 'xtrusio_outreach_data';

const DEFAULT_DATA = {
  campaigns: [],
  currentCampaignId: null,
};

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULT_DATA };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createCampaign(name) {
  const data = loadData();
  const campaign = {
    id: Date.now().toString(),
    name,
    createdAt: new Date().toISOString(),
    stage: 'generate', // generate | enrich | outreach | done
    leads: [],
  };
  data.campaigns.push(campaign);
  data.currentCampaignId = campaign.id;
  saveData(data);
  return campaign;
}

export function getCampaign(id) {
  const data = loadData();
  return data.campaigns.find(c => c.id === id) || null;
}

export function updateCampaign(id, updates) {
  const data = loadData();
  const idx = data.campaigns.findIndex(c => c.id === id);
  if (idx !== -1) {
    data.campaigns[idx] = { ...data.campaigns[idx], ...updates };
    saveData(data);
    return data.campaigns[idx];
  }
  return null;
}

export function deleteCampaign(id) {
  const data = loadData();
  data.campaigns = data.campaigns.filter(c => c.id !== id);
  if (data.currentCampaignId === id) {
    data.currentCampaignId = data.campaigns[0]?.id || null;
  }
  saveData(data);
}

export function parseLeadsFromText(text) {
  // Parse unified 10-column markdown table into lead objects
  // Handles various AI output formats: Gemini, Grok, ChatGPT, etc.
  // Supports: code blocks, bold markers, wrapped text, various table styles

  // Step 1: Strip markdown code block fences if present
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:markdown|md|text)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();

  const lines = cleaned.split('\n');
  const leads = [];

  // Step 2: Find all pipe-delimited table lines
  const allTableLines = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Must contain at least 2 pipe characters to be a table row
    if ((trimmed.match(/\|/g) || []).length >= 2) {
      allTableLines.push(trimmed);
    }
  }

  if (allTableLines.length === 0) return leads;

  // Step 3: Separate header, separator, and data rows
  const dataRows = [];
  let pastHeader = false;

  for (const line of allTableLines) {
    // Check if this is a separator line (---|---|--- or :---:|:---:)
    const withoutPipes = line.replace(/\|/g, '').trim();
    if (/^[-:\s]+$/.test(withoutPipes)) {
      pastHeader = true;
      continue;
    }

    // Check if this is a header row
    const lower = line.toLowerCase().replace(/\*\*/g, '');
    if (
      (lower.includes('#') && (lower.includes('company') || lower.includes('industry'))) ||
      (lower.includes('decision maker') || lower.includes('quality score')) ||
      (lower.includes('mirror') && lower.includes('keyword')) ||
      (lower.includes('funding') && lower.includes('signal')) ||
      (lower.includes('conversion') && lower.includes('hook')) ||
      (lower.includes('search intent') && lower.includes('pivot'))
    ) {
      pastHeader = true;
      continue;
    }

    // If we haven't seen a separator yet and this is the first row,
    // it might be a header without a separator — check if next line is separator
    if (!pastHeader && dataRows.length === 0) {
      // Peek: if this looks like it starts with "#" or "No." header text, skip
      const firstCell = line.split('|').filter(c => c.trim())[0]?.trim().toLowerCase() || '';
      if (firstCell === '#' || firstCell === 'no.' || firstCell === 'no' || firstCell === 's.no') {
        pastHeader = true;
        continue;
      }
    }

    dataRows.push(line);
  }

  // Step 4: Parse each data row
  for (const line of dataRows) {
    const rawCells = line.split('|');
    const cells = rawCells
      .map(c => c.trim()
        .replace(/\*\*/g, '')      // Remove bold markers **text**
        .replace(/^\*|\*$/g, '')   // Remove italic markers *text*
        .replace(/^`|`$/g, '')     // Remove inline code markers
        .replace(/^\[|\]$/g, '')   // Remove bracket wrappers
        .trim()
      )
      .filter(c => c !== '');

    // Need at least 5 cells for a valid lead row
    if (cells.length < 5) continue;

    // Skip if first cell doesn't look like a row number
    const firstCell = cells[0].trim();
    if (!/^\d+\.?$/.test(firstCell) && cells.length < 7) continue;

    // Parse "Company Name (Industry)" — handles various formats:
    // "Acme (SaaS)", "Acme Inc. (FinTech)", "Acme - SaaS", etc.
    const companyRaw = cells[1] || '';
    let company = companyRaw;
    let industry = '';

    // Try parentheses format: "Company (Industry)"
    const parenMatch = companyRaw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (parenMatch) {
      company = parenMatch[1].trim();
      industry = parenMatch[2].trim();
    } else {
      // Try dash format: "Company - Industry"
      const dashMatch = companyRaw.match(/^(.+?)\s*[-–—]\s*(.+)$/);
      if (dashMatch) {
        company = dashMatch[1].trim();
        industry = dashMatch[2].trim();
      }
    }

    const lead = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      number: cells[0] || '',
      company,
      industry,
      signal: cells[2] || '',
      decisionMaker: cells[3] || '',
      qualityScore: cells[4] || '',
      mirrorKeyword: cells[5] || '',
      articleTitle: cells[6] || '',
      searchIntent: cells[7] || '',
      conversionHook: cells[8] || '',
      technicalPivot: cells[9] || '',
      // Enrichment fields
      linkedinUrl: '',
      email: '',
      personalLinkedin: '',
      // Outreach fields
      outreachMessage: '',
      status: 'new',
      notes: '',
    };

    // Only add if we got a valid company name (not a header fragment)
    if (
      lead.company &&
      lead.company !== '#' &&
      lead.company !== 'N/A' &&
      lead.company.toLowerCase() !== 'company name' &&
      lead.company.toLowerCase() !== 'company'
    ) {
      leads.push(lead);
    }
  }

  return leads;
}

export function parseEnrichmentFromText(text, existingLeads) {
  // Parse Grok enrichment data in 13-column format and merge with existing leads
  // Columns: S no. | Company URL | Company Name | Revenue | Founder Name | Founder LinkedIn Link |
  //          LinkedIn Email | Email | Email Activity | Report | Follow Up | About Company | Source

  // Step 1: Strip code block fences
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:markdown|md|text)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();

  const lines = cleaned.split('\n');
  const enrichments = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || (trimmed.match(/\|/g) || []).length < 2) continue;

    // Skip separator lines
    const withoutPipes = trimmed.replace(/\|/g, '').trim();
    if (/^[-:\s]+$/.test(withoutPipes)) continue;

    // Skip header rows
    const lower = trimmed.toLowerCase().replace(/\*\*/g, '');
    if (
      lower.includes('s no') || lower.includes('company url') ||
      lower.includes('company name') || lower.includes('founder name') ||
      lower.includes('linkedin link') || lower.includes('email activity') ||
      lower.includes('about company')
    ) continue;

    const cells = trimmed.split('|')
      .map(c => c.trim().replace(/\*\*/g, '').replace(/^\*|\*$/g, '').trim())
      .filter(c => c !== '');

    if (cells.length < 5) continue;

    // Map to 13-column Grok format:
    // 0: S no, 1: Company URL, 2: Company Name, 3: Revenue, 4: Founder Name,
    // 5: Founder LinkedIn Link, 6: LinkedIn Email, 7: Email, 8: Email Activity,
    // 9: Report, 10: Follow Up, 11: About Company, 12: Source
    enrichments.push({
      companyUrl: cells[1] || '',
      companyName: cells[2] || '',
      revenue: cells[3] || '',
      founderName: cells[4] || '',
      linkedinUrl: cells[5] || '',
      linkedinEmail: cells[6] || '',
      email: cells[7] || '',
      emailActivity: cells[8] || '',
      report: cells[9] || '',
      followUp: cells[10] || '',
      aboutCompany: cells[11] || '',
      source: cells[12] || '',
    });
  }

  if (enrichments.length === 0) return existingLeads;

  // Match enrichments to leads by company name (fuzzy match)
  const updatedLeads = existingLeads.map(lead => {
    const leadName = lead.company.toLowerCase().trim();

    // Find all enrichment rows for this company
    const matches = enrichments.filter(e => {
      const eName = e.companyName.toLowerCase().trim();
      return leadName.includes(eName) || eName.includes(leadName) ||
        leadName.split(' ')[0] === eName.split(' ')[0]; // Match first word
    });

    if (matches.length > 0) {
      // Use the first match (usually CEO/Founder) for primary fields
      const primary = matches[0];
      // Collect all LinkedIn URLs and emails from all people found
      const allPeople = matches.map(m => ({
        name: m.founderName,
        linkedin: m.linkedinUrl,
        email: m.email || m.linkedinEmail,
      })).filter(p => p.name);

      return {
        ...lead,
        linkedinUrl: primary.linkedinUrl || lead.linkedinUrl,
        email: primary.email || primary.linkedinEmail || lead.email,
        decisionMaker: primary.founderName || lead.decisionMaker,
        personalLinkedin: primary.linkedinUrl || lead.personalLinkedin,
        companyUrl: primary.companyUrl || lead.companyUrl || '',
        revenue: primary.revenue || lead.revenue || '',
        aboutCompany: primary.aboutCompany || lead.aboutCompany || '',
        // Store all enriched people for outreach
        enrichedPeople: allPeople.length > 0 ? allPeople : (lead.enrichedPeople || []),
      };
    }
    return lead;
  });

  return updatedLeads;
}

export function exportData() {
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `xtrusio-outreach-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.campaigns) {
          saveData(data);
          resolve(data);
        } else {
          reject(new Error('Invalid data format'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
}
