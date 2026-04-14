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
  // Columns: # | Company Name (Industry) | Size / Funding Signal | Decision Maker | Quality Score |
  //          Mirror Keyword | Article Title | Search Intent | Conversion Hook | Technical Pivot
  const lines = text.trim().split('\n');
  const leads = [];

  for (const line of lines) {
    // Skip header lines and separators
    if (line.startsWith('|') && line.includes('---')) continue;
    if (line.startsWith('| #') || line.startsWith('| **#')) continue;

    if (line.startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim().replace(/\*\*/g, ''));
      if (cells.length >= 5) {
        // Parse "Company Name (Industry)" from column 2
        const companyMatch = (cells[1] || '').match(/^(.+?)\s*\((.+?)\)\s*$/);
        const company = companyMatch ? companyMatch[1].trim() : (cells[1] || '');
        const industry = companyMatch ? companyMatch[2].trim() : '';

        leads.push({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
          number: cells[0] || '',
          company,
          industry,
          signal: cells[2] || '',        // Size / Funding Signal
          decisionMaker: cells[3] || '',  // Likely Decision Maker
          qualityScore: cells[4] || '',   // Quality Score
          // SEO fields from unified table
          mirrorKeyword: cells[5] || '',  // Mirror Long-Tail Keyword
          articleTitle: cells[6] || '',   // Target Article Title
          searchIntent: cells[7] || '',   // Search Intent (Buyer Pain)
          conversionHook: cells[8] || '', // Primary Conversion Hook
          technicalPivot: cells[9] || '', // Secondary Technical Pivot
          // Enrichment fields
          linkedinUrl: '',
          email: '',
          personalLinkedin: '',
          // Outreach fields
          outreachMessage: '',
          status: 'new', // new | invite_sent | accepted | replied | converted
          notes: '',
        });
      }
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
