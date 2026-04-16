import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, FileSearch, GitCompare, ExternalLink, X, CheckCircle2, Globe, Download, Upload, Package, Loader2 } from 'lucide-react';
import { useState } from 'react';
import CopyButton from '../components/CopyButton';
import StageIndicator from '../components/StageIndicator';
import { getPrompt } from '../store/promptStore';
import { renderAuditHtml, renderArticleHtml, renderComparisonHtml } from '../lib/htmlTemplates';
import { loadPublishConfig, publishToGithub, downloadCampaignZip, urlForContent } from '../lib/publisher';

/**
 * ContentFactory — the core engine. For each lead, run 3 workflows:
 *   1) Audit (Claude) — pre-warm proof of capability
 *   2) Article (Gemini) — vendor-agnostic BOFU post that ranks
 *   3) Comparison (Claude) — head-to-head vs competitors
 *
 * Each workflow: Copy prompt → paste in AI → paste output back → preview → (publish optional)
 */

const WORKFLOWS = [
  {
    id: 'audit',
    title: 'SEO / AI Visibility Audit',
    ai: 'claude',
    icon: FileSearch,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    field: 'auditContent',
    htmlField: 'auditHtml',
    urlField: 'auditUrl',
    promptId: 'audit',
    description: 'Deep audit for outreach. Shows them what they\'re missing.',
  },
  {
    id: 'article',
    title: 'BOFU Article',
    ai: 'gemini',
    icon: FileText,
    color: 'text-primary',
    bg: 'bg-primary-light',
    field: 'articleContent',
    htmlField: 'articleHtml',
    urlField: 'articleUrl',
    promptId: 'article',
    description: '1,500-word vendor-agnostic guide. Ranks and cites them as source.',
  },
  {
    id: 'comparison',
    title: 'Comparison Blog',
    ai: 'claude',
    icon: GitCompare,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    field: 'comparisonContent',
    htmlField: 'comparisonHtml',
    urlField: 'comparisonUrl',
    promptId: 'comparison',
    description: 'Head-to-head vs competitors. Low KD, easy to rank.',
  },
];

export default function ContentFactory({ campaign, onUpdateCampaign }) {
  const navigate = useNavigate();
  const [activeLead, setActiveLead] = useState(null);
  const [activeWf, setActiveWf] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [previewHtml, setPreviewHtml] = useState(null);
  const [publishingKey, setPublishingKey] = useState(null); // `${leadId}-${wfId}` while publishing
  const [zipping, setZipping] = useState(false);

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">No campaign selected</p>
        <button onClick={() => navigate('/')} className="text-primary hover:underline text-sm">Go to Dashboard</button>
      </div>
    );
  }

  if (campaign.leads.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">No leads yet. Generate and enrich leads first.</p>
        <button onClick={() => navigate('/generate')} className="text-primary hover:underline text-sm">Go to Generate Leads</button>
      </div>
    );
  }

  const getPromptForLead = (lead, wf) => {
    const vars = {
      // Audit vars
      company: lead.company,
      companyUrl: lead.companyUrl || lead.company,
      industry: lead.industry || '',
      aboutCompany: lead.aboutCompany || lead.signal || '',
      // Article vars
      keyword: lead.mirrorKeyword || '',
      articleTitle: lead.articleTitle || '',
      searchIntent: lead.searchIntent || '',
      conversionHook: lead.conversionHook || '',
      technicalPivot: lead.technicalPivot || '',
      // Comparison vars
      competitors: lead.competitors || 'competitors (to be identified)',
      mirrorKeyword: lead.mirrorKeyword || '',
    };
    return getPrompt(wf.promptId, vars);
  };

  const openPanel = (lead, wf) => {
    setActiveLead(lead);
    setActiveWf(wf);
    setPasteText(lead[wf.field] || '');
  };

  const closePanel = () => {
    setActiveLead(null);
    setActiveWf(null);
    setPasteText('');
  };

  const handleSavePaste = () => {
    if (!pasteText.trim() || !activeLead || !activeWf) return;
    const updatedLeads = campaign.leads.map(l => {
      if (l.id !== activeLead.id) return l;
      // Auto-generate HTML from the content
      const updated = { ...l, [activeWf.field]: pasteText.trim() };
      try {
        let html = '';
        if (activeWf.id === 'audit') html = renderAuditHtml(updated);
        else if (activeWf.id === 'article') html = renderArticleHtml(updated);
        else if (activeWf.id === 'comparison') html = renderComparisonHtml(updated);
        updated[activeWf.htmlField] = html;
      } catch (err) {
        console.error('HTML generation failed', err);
      }
      return updated;
    });
    onUpdateCampaign(campaign.id, { leads: updatedLeads });
    closePanel();
  };

  const handlePreview = (lead, wf) => {
    const html = lead[wf.htmlField];
    if (!html) return;
    setPreviewHtml(html);
  };

  const handleDownload = (lead, wf) => {
    const html = lead[wf.htmlField];
    if (!html) return;
    const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const filename = `${slug(lead.company)}-${wf.id}.html`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublish = async (lead, wf) => {
    const config = loadPublishConfig();
    if (config.provider !== 'github' || !config.token || !config.owner || !config.repo) {
      alert('GitHub not configured. Go to Publish Settings to set up your repo + token.');
      return;
    }
    const key = `${lead.id}-${wf.id}`;
    setPublishingKey(key);
    try {
      const url = await publishToGithub(lead, wf.id, config);
      const updatedLeads = campaign.leads.map(l =>
        l.id === lead.id ? { ...l, [wf.urlField]: url } : l
      );
      onUpdateCampaign(campaign.id, { leads: updatedLeads });
      alert(`Published! Live at ${url}\n\n(Cloudflare may take 30-60s to rebuild.)`);
    } catch (e) {
      alert(`Publish failed: ${e.message}`);
    } finally {
      setPublishingKey(null);
    }
  };

  const handleDownloadZip = async () => {
    setZipping(true);
    try {
      const count = await downloadCampaignZip(campaign);
      alert(`Downloaded ${count} HTML files as ZIP.`);
    } catch (e) {
      alert(e.message);
    } finally {
      setZipping(false);
    }
  };

  const handleAdvance = () => {
    onUpdateCampaign(campaign.id, { stage: 'outreach' });
    navigate('/outreach');
  };

  const counts = WORKFLOWS.map(wf => ({
    ...wf,
    done: campaign.leads.filter(l => l[wf.field]).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-text-muted text-sm mt-1">
            Content Factory — for each lead, produce 3 pieces that pre-warm the outreach
          </p>
        </div>
        <StageIndicator currentStage={campaign.stage} />
      </div>

      {/* Workflow stats */}
      <div className="grid grid-cols-3 gap-4">
        {counts.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.id} className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}>
                  <Icon size={16} className={c.color} />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wide">{c.title}</p>
                  <p className="text-lg font-bold">{c.done}/{campaign.leads.length} done</p>
                </div>
              </div>
              <p className="text-xs text-text-muted">{c.description}</p>
            </div>
          );
        })}
      </div>

      {/* Instructions + batch actions */}
      <div className="bg-white rounded-xl border border-border p-5 flex items-start justify-between gap-4">
        <div className="text-sm text-text-secondary flex-1">
          <strong className="text-text">How this works:</strong> For each lead below, click the button for each content type.
          You'll get a prompt pre-filled with the lead's data → paste it into the AI → paste the output back.
          HTML is auto-generated. Preview, download, or publish to your site.
        </div>
        <button
          onClick={handleDownloadZip}
          disabled={zipping}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-surface-alt border border-border text-text hover:bg-surface-tertiary disabled:opacity-40 transition-colors shrink-0"
          title="Download all HTMLs as a ZIP (for manual upload)"
        >
          {zipping ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
          Download All (ZIP)
        </button>
      </div>

      {/* Lead rows */}
      <div className="space-y-3">
        {campaign.leads.map((lead, i) => (
          <div key={lead.id} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono text-text-muted">#{i + 1}</span>
                  <h4 className="font-semibold truncate">{lead.company}</h4>
                  <span className="text-xs text-text-muted">{lead.industry}</span>
                </div>
                <p className="text-xs text-text-muted truncate">
                  {lead.mirrorKeyword ? <><strong>Keyword:</strong> {lead.mirrorKeyword}</> : <span>No keyword yet</span>}
                </p>
              </div>
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${
                parseInt(lead.qualityScore) >= 8 ? 'bg-green-100 text-green-700' :
                parseInt(lead.qualityScore) >= 5 ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {lead.qualityScore}
              </span>
            </div>

            {/* Workflow buttons */}
            <div className="grid grid-cols-3 gap-2">
              {WORKFLOWS.map(wf => {
                const done = !!lead[wf.field];
                const hasHtml = !!lead[wf.htmlField];
                const published = !!lead[wf.urlField];
                const Icon = wf.icon;
                return (
                  <div
                    key={wf.id}
                    className={`rounded-lg border p-3 ${
                      published ? 'border-green-300 bg-green-50/40' :
                      done ? 'border-primary/40 bg-primary-light/30' :
                      'border-border bg-surface-alt/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Icon size={13} className={wf.color} />
                        <span className="text-xs font-semibold">{wf.title}</span>
                      </div>
                      {published ? (
                        <Globe size={12} className="text-green-600" />
                      ) : done ? (
                        <CheckCircle2 size={12} className="text-primary" />
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => openPanel(lead, wf)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                          done
                            ? 'bg-white border border-border text-text-secondary hover:bg-surface-alt'
                            : 'bg-primary text-white hover:bg-primary-hover'
                        }`}
                      >
                        {done ? 'Edit' : 'Start'}
                      </button>
                      {hasHtml && (
                        <>
                          <button
                            onClick={() => handlePreview(lead, wf)}
                            title="Preview HTML"
                            className="text-xs px-2 py-1 rounded-md font-medium bg-white border border-border text-text-secondary hover:bg-surface-alt transition-colors inline-flex items-center gap-1"
                          >
                            <ExternalLink size={10} /> Preview
                          </button>
                          <button
                            onClick={() => handleDownload(lead, wf)}
                            title="Download HTML"
                            className="text-xs px-2 py-1 rounded-md font-medium bg-white border border-border text-text-secondary hover:bg-surface-alt transition-colors inline-flex items-center gap-1"
                          >
                            <Download size={10} />
                          </button>
                          {published ? (
                            <a
                              href={lead[wf.urlField]}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open published URL"
                              className="text-xs px-2 py-1 rounded-md font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors inline-flex items-center gap-1"
                            >
                              <Globe size={10} /> Live
                            </a>
                          ) : (
                            <button
                              onClick={() => handlePublish(lead, wf)}
                              disabled={publishingKey === `${lead.id}-${wf.id}`}
                              title="Publish to your site"
                              className="text-xs px-2 py-1 rounded-md font-medium bg-primary text-white hover:bg-primary-hover disabled:opacity-60 transition-colors inline-flex items-center gap-1"
                            >
                              {publishingKey === `${lead.id}-${wf.id}` ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <Upload size={10} />
                              )}
                              Publish
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleAdvance}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm bg-primary text-white hover:bg-primary-hover transition-all duration-200"
        >
          Next: Outreach <ArrowRight size={16} />
        </button>
      </div>

      {/* Panel for content workflow */}
      {activeLead && activeWf && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closePanel}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white">
              <div>
                <h3 className="font-bold text-lg">{activeWf.title}</h3>
                <p className="text-sm text-text-muted mt-0.5">
                  {activeLead.company} — Runs in {activeWf.ai.charAt(0).toUpperCase() + activeWf.ai.slice(1)}
                </p>
              </div>
              <button onClick={closePanel} className="p-2 rounded-lg hover:bg-surface-alt transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-surface-alt rounded-xl p-4">
                <p className="text-sm font-semibold mb-2">
                  Step 1: Copy the prompt & paste in <strong>{activeWf.ai.charAt(0).toUpperCase() + activeWf.ai.slice(1)}</strong>
                </p>
                <CopyButton
                  text={getPromptForLead(activeLead, activeWf)}
                  label={`Copy ${activeWf.title} Prompt`}
                  aiTarget={activeWf.ai}
                />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">
                  Step 2: Paste the {activeWf.id === 'audit' ? 'audit' : activeWf.id === 'article' ? 'article' : 'comparison blog'} output below
                </p>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`Paste the ${activeWf.id} content from ${activeWf.ai.charAt(0).toUpperCase() + activeWf.ai.slice(1)} here...`}
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
                  disabled={!pasteText.trim()}
                  className="px-5 py-2.5 rounded-[10px] text-sm font-semibold bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Save & Generate HTML
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HTML Preview Modal */}
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
