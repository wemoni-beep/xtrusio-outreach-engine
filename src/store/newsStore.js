// News Radar store — daily GCC/B2B news events + their draft articles.
// Independent of campaigns. Follows the same copy-paste pattern as leadStore:
// user runs prompts externally, pastes results back, app parses and stores.

import { pushToCloud } from '../firebase/cloudSync';

const STORAGE_KEY = 'xtrusio_news_data';

const DEFAULT_DATA = {
  events: [], // flat list of all parsed events (each carries runId/runDate)
  runs: [],   // metadata per daily discovery run
};

export function loadNewsData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULT_DATA };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function saveNewsData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  pushToCloud(STORAGE_KEY);
}

export function updateEvent(id, updates) {
  const data = loadNewsData();
  const idx = data.events.findIndex(e => e.id === id);
  if (idx !== -1) {
    data.events[idx] = { ...data.events[idx], ...updates };
    saveNewsData(data);
    return data.events[idx];
  }
  return null;
}

export function deleteEvent(id) {
  const data = loadNewsData();
  data.events = data.events.filter(e => e.id !== id);
  saveNewsData(data);
}

/**
 * Parse the 10-column markdown table output by the newsRadar prompt.
 * Columns: # | Event Headline | Date/Source | Event Type | High-Volume Signal |
 *          Target Angle | Underdog/Champion Play | Target Keyword | Suggested Title | Quality Score
 */
export function parseNewsEventsFromText(text) {
  let cleaned = text.trim()
    .replace(/^```(?:markdown|md|text)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  const lines = cleaned.split('\n');
  const tableLines = lines
    .map(l => l.trim())
    .filter(l => l && (l.match(/\|/g) || []).length >= 2);

  const events = [];
  let pastHeader = false;

  for (const line of tableLines) {
    // Skip separator rows (---|---|---)
    const withoutPipes = line.replace(/\|/g, '').trim();
    if (/^[-:\s]+$/.test(withoutPipes)) { pastHeader = true; continue; }

    // Skip header rows
    const lower = line.toLowerCase().replace(/\*\*/g, '');
    if (
      (lower.includes('event headline') || lower.includes('headline')) &&
      (lower.includes('quality') || lower.includes('keyword') || lower.includes('angle'))
    ) { pastHeader = true; continue; }
    if (lower.includes('underdog') && lower.includes('champion') && lower.includes('|')) {
      pastHeader = true; continue;
    }

    if (!pastHeader && events.length === 0) {
      const firstCell = line.split('|').filter(c => c.trim())[0]?.trim().toLowerCase() || '';
      if (firstCell === '#' || firstCell === 'no.' || firstCell === 'no' || firstCell === 's.no') {
        pastHeader = true;
        continue;
      }
    }

    const cells = line.split('|')
      .map(c => c.trim()
        .replace(/\*\*/g, '')
        .replace(/^\*|\*$/g, '')
        .replace(/^`|`$/g, '')
        .trim()
      )
      .filter(c => c !== '');

    if (cells.length < 5) continue;

    // Skip obvious non-data rows
    if (!/^\d+\.?$/.test(cells[0].trim()) && cells.length < 8) continue;

    const event = {
      number: cells[0] || '',
      headline: cells[1] || '',
      dateSource: cells[2] || '',
      eventType: cells[3] || '',
      signal: cells[4] || '',
      angle: cells[5] || '',
      underdogChampion: cells[6] || '',
      keyword: cells[7] || '',
      title: cells[8] || '',
      qualityScore: cells[9] || '',
    };

    if (
      event.headline &&
      event.headline.toLowerCase() !== 'event headline' &&
      event.headline.toLowerCase() !== 'headline'
    ) {
      events.push(event);
    }
  }

  return events;
}

/**
 * Import parsed events as a new run. Returns the array of stored events with ids.
 */
export function importEvents(parsedEvents) {
  const data = loadNewsData();
  const runId = Date.now().toString();
  const runDate = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const newEvents = parsedEvents.map((e, i) => ({
    ...e,
    id: `${runId}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    runId,
    runDate,
    createdAt: now,
    status: 'new', // new | drafted | html-ready | approved | discarded
    articleContent: '',
    articleHtml: '',
    imagePrompt: '',
    notes: '',
  }));

  data.events.push(...newEvents);
  data.runs.push({
    id: runId,
    date: runDate,
    createdAt: now,
    count: newEvents.length,
  });
  saveNewsData(data);
  return newEvents;
}
