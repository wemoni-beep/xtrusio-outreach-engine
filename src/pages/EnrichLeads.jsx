import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import CopyButton from '../components/CopyButton';
import PasteArea from '../components/PasteArea';
import LeadTable from '../components/LeadTable';
import StageIndicator from '../components/StageIndicator';
import { getEnrichmentPrompt } from '../prompts/leadGenPrompt';
import { parseEnrichmentFromText } from '../store/leadStore';

export default function EnrichLeads({ campaign, onUpdateCampaign }) {
  const navigate = useNavigate();

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">No campaign selected</p>
        <button onClick={() => navigate('/')} className="text-primary hover:underline text-sm">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (campaign.leads.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">No leads to enrich. Generate leads first.</p>
        <button onClick={() => navigate('/generate')} className="text-primary hover:underline text-sm">
          Go to Generate Leads
        </button>
      </div>
    );
  }

  const enrichmentPrompt = getEnrichmentPrompt(campaign.leads);

  const handlePasteEnrichment = (text) => {
    const updatedLeads = parseEnrichmentFromText(text, campaign.leads);
    const enrichedCount = updatedLeads.filter(l => l.linkedinUrl).length;
    onUpdateCampaign(campaign.id, { leads: updatedLeads });
    if (enrichedCount === 0) {
      alert('Could not match any enrichment data. Make sure the company names in the output match your leads.');
    }
  };

  const handleAdvance = () => {
    onUpdateCampaign(campaign.id, { stage: 'articles' });
    navigate('/articles');
  };

  const enrichedCount = campaign.leads.filter(l => l.linkedinUrl).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-text-muted text-sm mt-1">Step 2: Enrich leads with LinkedIn profiles</p>
        </div>
        <StageIndicator currentStage={campaign.stage} />
      </div>

      {/* Step 1: Copy enrichment prompt */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <Search size={18} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">1. Copy the Enrichment Prompt</h3>
            <p className="text-sm text-text-muted mb-4">
              Copy this prompt and paste it into <strong>Grok</strong> (best for finding LinkedIn profiles).
              The prompt includes all {campaign.leads.length} leads from your pipeline.
            </p>
            <CopyButton text={enrichmentPrompt} label="Copy Enrichment Prompt for Grok" aiTarget="grok" />
          </div>
        </div>
      </div>

      {/* Step 2: Paste results */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-1">2. Paste Grok Output</h3>
        <p className="text-sm text-text-muted mb-4">
          Paste the table with LinkedIn URLs and emails from Grok here.
        </p>
        <PasteArea
          onSubmit={handlePasteEnrichment}
          placeholder="Paste the enrichment markdown table here..."
          buttonLabel="Enrich Leads"
        />
      </div>

      {/* Lead Table */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            {enrichedCount} of {campaign.leads.length} leads enriched
          </h3>
          {enrichedCount > 0 && (
            <button
              onClick={handleAdvance}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              Next: Articles <ArrowRight size={16} />
            </button>
          )}
        </div>
        <LeadTable leads={campaign.leads} />
      </div>
    </div>
  );
}
