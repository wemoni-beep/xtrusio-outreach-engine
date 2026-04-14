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
  // Handles various AI output formats (Gemini, Grok, etc.)
  // Columns: # | Company Name (Industry) | Size / Funding Signal | Decision Maker | Quality Score |
  //          Mirror Keyword | Article Title | Search Intent | Conversion Hook | Technical Pivot

  const lines = text.trim().split('\n');
  const leads = [];

  // Find table rows — lines containing | separators
  const tableLines = [];
  let headerFound = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line contains pipe characters (table row)
    if (trimmed.includes('|')) {
      // Skip separator lines (----, :---, etc.)
      const withoutPipes = trimmed.replace(/\|/g, '').trim();
      if (/^[-:\s]+$/.test(withoutPipes)) {
        headerFound = true; // separator means header was just above
        continue;
      }

      // Skip header row (contains column names like "#", "Company", "Quality Score", etc.)
      const lower = trimmed.toLowerCase();
      if (
        (lower.includes('company') && lower.includes('score')) ||
        (lower.includes('#') && lower.includes('industry') && lower.includes('keyword')) ||
        (lower.includes('funding') && lower.includes('decision')) ||
        (lower.includes('company name') && lower.includes('mirror'))
      ) {
        headerFound = true;
        continue;
      }

      // This looks like a data row
      tableLines.push(trimmed);
    }
  }

  for (const line of tableLines) {
    // Split by | and clean up
    const rawCells = line.split('|');
    // Filter out empty strings from leading/trailing pipes
    const cells = rawCells
      .map(c => c.trim().replace(/\*\*/g, '').replace(/^\*|\*$/g, '').trim())
      .filter(c => c !== '');

    if (cells.length < 5) continue;

    // Try to detect if first cell is just a row number
    const firstIsNumber = /^\d+\.?$/.test(cells[0].trim());
    const offset = firstIsNumber ? 0 : 0;

    // Parse "Company Name (Industry)" — could be in various formats
    const companyRaw = cells[1] || cells[0] || '';
    const companyMatch = companyRaw.match(/^(.+?)\s*\((.+?)\)\s*$/);
    const company = companyMatch ? companyMatch[1].trim() : companyRaw.trim();
    const industry = companyMatch ? companyMatch[2].trim() : '';

    // Build lead object — be flexible with column count
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

    // Only add if we got a valid company name
    if (lead.company && lead.company !== '#' && lead.company !== 'N/A') {
      leads.push(lead);
    }
  }

  return leads;
}

export function parseEnrichmentFromText(text, existingLeads) {
  // Parse enrichment data (LinkedIn URLs, emails) and merge with existing leads
  const lines = text.trim().split('\n');
  const enrichments = [];

  for (const line of lines) {
    if (line.startsWith('|') && line.includes('---')) continue;
    if (line.startsWith('| #') || line.startsWith('| **#')) continue;

    if (line.startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim().replace(/\*\*/g, ''));
      if (cells.length >= 3) {
        enrichments.push({
          company: cells[1] || cells[0] || '',
          decisionMaker: cells[2] || '',
          linkedinUrl: cells[3] || '',
          email: cells[4] || '',
          personalLinkedin: cells[5] || '',
        });
      }
    }
  }

  // Match enrichments to leads by company name
  const updatedLeads = existingLeads.map(lead => {
    const match = enrichments.find(e =>
      lead.company.toLowerCase().includes(e.company.toLowerCase()) ||
      e.company.toLowerCase().includes(lead.company.toLowerCase())
    );
    if (match) {
      return {
        ...lead,
        linkedinUrl: match.linkedinUrl || lead.linkedinUrl,
        email: match.email || lead.email,
        personalLinkedin: match.personalLinkedin || lead.personalLinkedin,
        decisionMaker: match.decisionMaker || lead.decisionMaker,
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
