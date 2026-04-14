import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Code, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import CopyButton from '../components/CopyButton';
import StageIndicator from '../components/StageIndicator';
import { getArticlePrompt, getArticleToHtmlPrompt } from '../prompts/leadGenPrompt';

export default function Articles({ campaign, onUpdateCampaign }) {
  const navigate = useNavigate();
  const [activeLead, setActiveLead] = useState(null);
  const [activeStep, setActiveStep] = useState(null); // 'article' | 'html'
  const [pasteText, setPasteText] = useState('');

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

  const openModal = (lead, step) => {
    setActiveLead(lead);
    setActiveStep(step);
    setPasteText('');
  };

  const closeModal = () => {
    setActiveLead(null);
    setActiveStep(null);
    setPasteText('');
  };

  const handleSave = () => {
    if (!pasteText.trim() || !activeLead) return;
    const field = activeStep === 'article' ? 'articleContent' : 'articleHtml';
    const updatedLeads = campaign.leads.map(l =>
      l.id === activeLead.id ? { ...l, [field]: pasteText.trim() } : l
    );
    onUpdateCampaign(campaign.id, { leads: updatedLeads });
    closeModal();
  };

  const handleAdvance = () => {
    onUpdateCampaign(campaign.id, { stage: 'outreach' });
    navigate('/outreach');
  };

  const articlesWritten = campaign.leads.filter(l => l.articleContent).length;
  const htmlGenerated = campaign.leads.filter(l => l.articleHtml).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-text-muted text-sm mt-1">Step 3: Write Mirror Pitch articles for each lead</p>
        </div>
        <StageIndicator currentStage={campaign.stage} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <p className="text-2xl font-bold text-text">{campaign.leads.length}</p>
          <p className="text-xs text-text-muted mt-1">Total Leads</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <p className="text-2xl font-bold text-primary">{articlesWritten}</p>
          <p className="text-xs text-text-muted mt-1">Articles Written</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 text-center">
          <p className="text-2xl font-bold text-success">{htmlGenerated}</p>
          <p className="text-xs text-text-muted mt-1">HTML Generated</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-2">Workflow for each lead:</h3>
        <ol className="text-sm text-text-secondary space-y-1.5 list-decimal list-inside">
          <li><strong>Write Article</strong> — Copy prompt → Paste in <strong>Gemini</strong> → Paste article back</li>
          <li><strong>Generate HTML</strong> — Copy prompt → Paste in <strong>Claude</strong> → Paste HTML back</li>
        </ol>
      </div>

      {/* Lead Cards */}
      <div className="space-y-3">
        {campaign.leads.map((lead, i) => (
          <div key={lead.id} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-text-muted">#{i + 1}</span>
                  <h4 className="font-semibold">{lead.company}</h4>
                  <span className="text-xs text-text-muted">{lead.industry}</span>
                </div>
                <p className="text-sm text-text-muted mb-1">
                  <strong>Keyword:</strong> {lead.mirrorKeyword || 'N/A'}
                </p>
                <p className="text-sm text-text-muted mb-3">
                  <strong>Article Title:</strong> {lead.articleTitle || 'N/A'}
                </p>

                <div className="flex items-center gap-3">
                  {/* Step 1: Article */}
                  {lead.articleContent ? (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-green-50 text-green-700 border border-green-200">
                      <FileText size={12} /> Article Done
                    </span>
                  ) : (
                    <button
                      onClick={() => openModal(lead, 'article')}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold bg-primary text-white hover:bg-primary-hover transition-all duration-200"
                    >
                      <FileText size={12} /> Write Article
                    </button>
                  )}

                  {/* Step 2: HTML */}
                  {lead.articleHtml ? (
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-green-50 text-green-700 border border-green-200">
                      <Code size={12} /> HTML Done
                    </span>
                  ) : (
                    <button
                      onClick={() => openModal(lead, 'html')}
                      disabled={!lead.articleContent}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <Code size={12} /> Generate HTML
                    </button>
                  )}

                  {/* Preview HTML */}
                  {lead.articleHtml && (
                    <button
                      onClick={() => {
                        const w = window.open('', '_blank');
                        w.document.write(lead.articleHtml);
                        w.document.close();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-surface-alt text-text-secondary hover:bg-surface-tertiary transition-all duration-200"
                    >
                      <ExternalLink size={12} /> Preview
                    </button>
                  )}
                </div>
              </div>

              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${
                parseInt(lead.qualityScore) >= 8 ? 'bg-green-100 text-green-700' :
                parseInt(lead.qualityScore) >= 5 ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {lead.qualityScore}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Advance button */}
      {articlesWritten > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleAdvance}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm bg-primary text-white hover:bg-primary-hover transition-all duration-200"
          >
            Next: Outreach <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Modal */}
      {activeLead && activeStep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="font-bold text-lg">
                  {activeStep === 'article' ? 'Write Article' : 'Generate HTML'}
                </h3>
                <p className="text-sm text-text-muted mt-0.5">
                  {activeLead.company} — {activeLead.articleTitle || activeLead.mirrorKeyword}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-surface-alt transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Step 1: Copy prompt */}
              <div className="bg-surface-alt rounded-xl p-4">
                <p className="text-sm font-semibold mb-2">
                  Step 1: Copy the prompt and paste in{' '}
                  <strong>{activeStep === 'article' ? 'Gemini' : 'Claude'}</strong>
                </p>
                <CopyButton
                  text={
                    activeStep === 'article'
                      ? getArticlePrompt(activeLead)
                      : getArticleToHtmlPrompt(activeLead)
                  }
                  label={activeStep === 'article' ? 'Copy Article Prompt' : 'Copy HTML Prompt'}
                />
              </div>

              {/* Step 2: Paste output */}
              <div>
                <p className="text-sm font-semibold mb-2">
                  Step 2: Paste the {activeStep === 'article' ? 'article' : 'HTML'} output below
                </p>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={
                    activeStep === 'article'
                      ? 'Paste the article content from Gemini here...'
                      : 'Paste the HTML code from Claude here...'
                  }
                  rows={12}
                  className="w-full border border-border rounded-xl p-4 text-sm font-mono bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y transition-all duration-200"
                />
              </div>

              {/* Save */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-[10px] text-sm font-medium bg-surface-tertiary text-text-muted hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!pasteText.trim()}
                  className="px-5 py-2.5 rounded-[10px] text-sm font-semibold bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Save {activeStep === 'article' ? 'Article' : 'HTML'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
