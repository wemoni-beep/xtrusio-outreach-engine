import { useState } from 'react';
import {
  Sparkles,
  Newspaper,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Download,
  X,
  CheckCircle2,
  Trash2,
  Filter,
} from 'lucide-react';
import CopyButton from '../components/CopyButton';
import PasteArea from '../components/PasteArea';
import { getPrompt } from '../store/promptStore';
import {
  loadNewsData,
  updateEvent,
  deleteEvent,
  parseNewsEventsFromText,
  importEvents,
} from '../store/newsStore';

/**
 * News Radar — daily GCC / B2B news scout.
 * Workflow per event:
 *   1) Article  (Gemini)  — opinion blog in markdown
 *   2) HTML     (Claude)  — convert article markdown → HTML page
 *   3) Image    (Gemini/external) — copy prompt, generate externally, upload manually
 *
 * Follows the app's copy-paste pattern: no API calls, no auto-publish.
 */

const WORKFLOWS = [
  {
    id: 'article',
    title: 'Article',
    ai: 'gemini',
    icon: FileText,
    color: 'text-primary',
    bg: 'bg-primary-light',
    field: 'articleContent',
    promptId: 'newsArticle',
    description: 'Write 900–1,300 word opinion blog.',
  },
  {
    id: 'html',
    title: 'HTML',
    ai: 'claude',
    icon: FileText,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    field: 'articleHtml',
    promptId: 'articleToHtml',
    description: 'Convert article markdown → HTML page.',
  },
  {
    id: 'image',
    title: 'Image Prompt',
    ai: 'gemini',
    icon: ImageIcon,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    field: 'imagePrompt',
    promptId: 'newsImage',
    description: 'Copy prompt → run in image model → upload manually.',
  },
];

export default function NewsRadar() {
  const [data, setData] = useState(() => loadNewsData());
  const [filter, setFilter] = useState('today');
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeWf, setActiveWf] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [previewHtml, setPreviewHtml] = useState(null);

  const refresh = () => setData(loadNewsData());

  const handlePasteEvents = (text) => {
    const parsed = parseNewsEventsFromText(text);
    if (parsed.length === 0) {
      alert('Could not parse any events. Make sure the output is the 10-column markdown table.');
      return;
    }
    importEvents(parsed);
    refresh();
  };

  const today = new Date().toISOString().slice(0, 10);
  const filtered = data.events.filter(e => {
    if (filter === 'today') return e.runDate === today;
    if (filter === 'approved') return e.status === 'approved';
    if (filter === 'active') return e.status !== 'discarded';
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    const qa = parseInt(a.qualityScore) || 0;
    const qb = parseInt(b.qualityScore) || 0;
    if (qb !== qa) return qb - qa;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  const getPromptForEvent = (event, wf) => {
    const vars = {
      // newsArticle vars
      headline: event.headline || '',
      eventType: event.eventType || '',
      dateSource: event.dateSource || '',
      angle: event.angle || '',
      underdogChampion: event.underdogChampion || '',
      keyword: event.keyword || '',
      title: event.title || '',
      // articleToHtml reuse
      articleTitle: event.title || '',
      articleContent: event.articleContent || '',
      // image vars share title/angle/eventType
    };
    return getPrompt(wf.promptId, vars);
  };

  const openPanel = (event, wf) => {
    setActiveEvent(event);
    setActiveWf(wf);
    setPasteText(event[wf.field] || '');
  };
  const closePanel = () => {
    setActiveEvent(null);
    setActiveWf(null);
    setPasteText('');
  };

  const handleSavePaste = () => {
    if (!activeEvent || !activeWf) return;
    const merged = { ...activeEvent, [activeWf.field]: pasteText.trim() };
    const updates = { [activeWf.field]: pasteText.trim() };
    // Auto-progress status (never overwrite 'approved' or 'discarded')
    if (merged.status !== 'approved' && merged.status !== 'discarded') {
      if (merged.articleHtml) updates.status = 'html-ready';
      else if (merged.articleContent) updates.status = 'drafted';
    }
    updateEvent(activeEvent.id, updates);
    refresh();
    closePanel();
  };

  const handleApprove = (event) => {
    updateEvent(event.id, { status: 'approved' });
    refresh();
  };
  const handleUnapprove = (event) => {
    updateEvent(event.id, { status: event.articleHtml ? 'html-ready' : (event.articleContent ? 'drafted' : 'new') });
    refresh();
  };
  const handleDiscard = (event) => {
    if (!confirm('Discard this event? (It will stay in history but hidden from active list.)')) return;
    updateEvent(event.id, { status: 'discarded' });
    refresh();
  };
  const handleDelete = (event) => {
    if (!confirm('Delete this event permanently? This cannot be undone.')) return;
    deleteEvent(event.id);
    refresh();
  };

  const handleDownload = (event) => {
    if (!event.articleHtml) return;
    const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
    const filename = `${slug(event.title || event.headline) || 'article'}.html`;
    const blob = new Blob([event.articleHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    today: data.events.filter(e => e.runDate === today).length,
    active: data.events.filter(e => e.status !== 'discarded').length,
    approved: data.events.filter(e => e.status === 'approved').length,
    all: data.events.length,
  };

  const todayFmt = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">News Radar</h1>
        <p className="text-text-muted text-sm mt-1">
          Daily GCC + B2B tech news scout. Find 1–3 high-volume events → write fast, rank fast.
        </p>
      </div>

      {/* Step 1: Discovery prompt */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">1. Copy the News Radar Prompt</h3>
            <p className="text-sm text-text-muted mb-4">
              Run in <strong>Gemini</strong> with Deep Research / grounding enabled. Scans the last 24h of news for SA/UAE/BH B2B tech opportunities.
            </p>
            <CopyButton
              text={getPrompt('newsRadar', { today: todayFmt })}
              label="Copy News Radar Prompt"
              aiTarget="gemini"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Paste events */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-1">2. Paste Today's Events</h3>
        <p className="text-sm text-text-muted mb-4">
          Paste the markdown table output from Gemini. The app will parse it and add events below.
        </p>
        <PasteArea
          onSubmit={handlePasteEvents}
          placeholder="Paste the News Radar markdown table here..."
          buttonLabel="Import Events"
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-text-muted" />
        {[
          { id: 'today', label: `Today (${counts.today})` },
          { id: 'active', label: `Active (${counts.active})` },
          { id: 'approved', label: `Approved (${counts.approved})` },
          { id: 'all', label: `All (${counts.all})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filter === f.id ? 'bg-primary text-white' : 'bg-surface-alt text-text-muted hover:bg-surface-tertiary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <Newspaper size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-muted text-sm">
            {filter === 'today'
              ? 'No events imported yet today. Run the prompt and paste results above.'
              : 'No events match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(event => (
            <div key={event.id} className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold">{event.headline}</h4>
                    {event.eventType && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-alt text-text-muted">
                        {event.eventType}
                      </span>
                    )}
                    <span className="text-xs text-text-muted">{event.runDate}</span>
                    <StatusBadge status={event.status} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                    <p className="text-xs text-text-muted">
                      <strong>Title:</strong> {event.title || '—'}
                    </p>
                    <p className="text-xs text-text-muted">
                      <strong>Keyword:</strong> {event.keyword || '—'}
                    </p>
                    <p className="text-xs text-text-muted md:col-span-2">
                      <strong>Angle:</strong> {event.angle || '—'}
                    </p>
                    {event.underdogChampion && (
                      <p className="text-xs text-text-muted md:col-span-2">
                        <strong>Underdog/Champion:</strong> {event.underdogChampion}
                      </p>
                    )}
                    {event.dateSource && (
                      <p className="text-xs text-text-muted md:col-span-2 truncate">
                        <strong>Source:</strong> {event.dateSource}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold shrink-0 ${
                  parseInt(event.qualityScore) >= 8 ? 'bg-green-100 text-green-700' :
                  parseInt(event.qualityScore) >= 5 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {event.qualityScore || '?'}
                </span>
              </div>

              {/* Workflow buttons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {WORKFLOWS.map(wf => {
                  const done = !!event[wf.field];
                  const Icon = wf.icon;
                  return (
                    <div
                      key={wf.id}
                      className={`rounded-lg border p-3 ${
                        done ? 'border-primary/40 bg-primary-light/30' : 'border-border bg-surface-alt/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Icon size={13} className={wf.color} />
                          <span className="text-xs font-semibold">{wf.title}</span>
                        </div>
                        {done && <CheckCircle2 size={12} className="text-primary" />}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => openPanel(event, wf)}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                            done
                              ? 'bg-white border border-border text-text-secondary hover:bg-surface-alt'
                              : 'bg-primary text-white hover:bg-primary-hover'
                          }`}
                        >
                          {done ? 'Edit' : 'Start'}
                        </button>
                        {wf.id === 'html' && done && (
                          <>
                            <button
                              onClick={() => setPreviewHtml(event.articleHtml)}
                              title="Preview HTML"
                              className="text-xs px-2 py-1 rounded-md font-medium bg-white border border-border text-text-secondary hover:bg-surface-alt transition-colors inline-flex items-center gap-1"
                            >
                              <ExternalLink size={10} /> Preview
                            </button>
                            <button
                              onClick={() => handleDownload(event)}
                              title="Download HTML"
                              className="text-xs px-2 py-1 rounded-md font-medium bg-white border border-border text-text-secondary hover:bg-surface-alt transition-colors inline-flex items-center gap-1"
                            >
                              <Download size={10} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Event-level actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                {event.status === 'approved' ? (
                  <button
                    onClick={() => handleUnapprove(event)}
                    className="text-xs px-3 py-1.5 rounded-md font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors inline-flex items-center gap-1"
                  >
                    <CheckCircle2 size={12} /> Approved — undo
                  </button>
                ) : (
                  event.articleHtml && (
                    <button
                      onClick={() => handleApprove(event)}
                      className="text-xs px-3 py-1.5 rounded-md font-medium bg-primary text-white hover:bg-primary-hover transition-colors inline-flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} /> Approve
                    </button>
                  )
                )}
                {event.status !== 'discarded' && (
                  <button
                    onClick={() => handleDiscard(event)}
                    className="text-xs px-3 py-1.5 rounded-md font-medium text-text-muted hover:bg-surface-alt transition-colors"
                  >
                    Discard
                  </button>
                )}
                <button
                  onClick={() => handleDelete(event)}
                  className="text-xs px-2 py-1.5 rounded-md font-medium text-red-500 hover:bg-red-50 transition-colors inline-flex items-center gap-1"
                  title="Delete permanently"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workflow panel */}
      {activeEvent && activeWf && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closePanel}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white">
              <div className="min-w-0 pr-4">
                <h3 className="font-bold text-lg">{activeWf.title}</h3>
                <p className="text-sm text-text-muted mt-0.5 truncate">
                  {activeEvent.headline} — Runs in {activeWf.ai.charAt(0).toUpperCase() + activeWf.ai.slice(1)}
                </p>
              </div>
              <button onClick={closePanel} className="p-2 rounded-lg hover:bg-surface-alt transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-surface-alt rounded-xl p-4">
                <p className="text-sm font-semibold mb-2">
                  Step 1: Copy the prompt & paste in <strong>{activeWf.ai.charAt(0).toUpperCase() + activeWf.ai.slice(1)}</strong>
                </p>
                <CopyButton
                  text={getPromptForEvent(activeEvent, activeWf)}
                  label={`Copy ${activeWf.title} Prompt`}
                  aiTarget={activeWf.ai}
                />
                {activeWf.id === 'html' && !activeEvent.articleContent && (
                  <p className="text-xs text-amber-700 mt-3">
                    ⚠ Article markdown is empty. Run the Article step first, otherwise this prompt will have nothing to convert.
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">
                  Step 2: Paste the {activeWf.title.toLowerCase()} output below
                </p>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={
                    activeWf.id === 'image'
                      ? 'Optional: paste image URL or notes after you generate & upload the image.'
                      : `Paste the ${activeWf.title.toLowerCase()} output from ${activeWf.ai.charAt(0).toUpperCase() + activeWf.ai.slice(1)} here...`
                  }
                  rows={14}
                  className="w-full border border-border rounded-xl p-4 text-sm font-mono bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y transition-all duration-200"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closePanel}
                  className="px-4 py-2.5 rounded-[10px] text-sm font-medium bg-surface-tertiary text-text-muted hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePaste}
                  className="px-5 py-2.5 rounded-[10px] text-sm font-semibold bg-primary text-white hover:bg-primary-hover transition-all duration-200"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HTML preview modal */}
      {previewHtml && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setPreviewHtml(null)}>
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold">HTML Preview</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const w = window.open('', '_blank');
                    w.document.write(previewHtml);
                    w.document.close();
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium bg-surface-alt text-text-secondary hover:bg-surface-tertiary transition-colors inline-flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Open in new tab
                </button>
                <button onClick={() => setPreviewHtml(null)} className="p-1.5 rounded-lg hover:bg-surface-alt transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="flex-1 w-full border-0"
              sandbox="allow-same-origin"
              title="HTML Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    'new':         'bg-gray-100 text-gray-600',
    'drafted':     'bg-yellow-100 text-yellow-700',
    'html-ready':  'bg-blue-100 text-blue-700',
    'approved':    'bg-green-100 text-green-700',
    'discarded':   'bg-red-50 text-red-400',
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${styles[status] || styles.new}`}>
      {status || 'new'}
    </span>
  );
}
