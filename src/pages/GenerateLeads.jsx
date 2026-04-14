import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import CopyButton from '../components/CopyButton';
import PasteArea from '../components/PasteArea';
import LeadTable from '../components/LeadTable';
import StageIndicator from '../components/StageIndicator';
import { LEAD_GEN_PROMPT } from '../prompts/leadGenPrompt';
import { parseLeadsFromText } from '../store/leadStore';

export default function GenerateLeads({ campaign, onUpdateCampaign }) {
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

  const handlePasteLeads = (text) => {
    const newLeads = parseLeadsFromText(text);
    if (newLeads.length === 0) {
      alert('Could not parse any leads from the pasted text. Make sure it\'s a markdown table format.');
      return;
    }
    const updatedLeads = [...campaign.leads, ...newLeads];
    onUpdateCampaign(campaign.id, { leads: updatedLeads });
  };

  const handleAdvance = () => {
    onUpdateCampaign(campaign.id, { stage: 'enrich' });
    navigate('/enrich');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-text-muted text-sm mt-1">Step 1: Generate leads using AI</p>
        </div>
        <StageIndicator currentStage={campaign.stage} />
      </div>

      {/* Step 1: Copy prompt */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">1. Copy the Lead Generation Prompt</h3>
            <p className="text-sm text-text-muted mb-4">
              Click below to copy the prompt, then paste it into <strong>Grok</strong> (recommended — has live web search for funding news).
            </p>
            <CopyButton text={LEAD_GEN_PROMPT} label="Copy Prompt for Grok" aiTarget="grok" />
          </div>
        </div>
      </div>

      {/* Step 2: Paste results */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-1">2. Paste AI Output</h3>
        <p className="text-sm text-text-muted mb-4">
          Paste the markdown table output from the AI here. The software will parse it into your lead pipeline.
        </p>
        <PasteArea
          onSubmit={handlePasteLeads}
          placeholder="Paste the Lead Matrix markdown table here..."
          buttonLabel="Import Leads"
        />
      </div>

      {/* Lead Table */}
      {campaign.leads.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{campaign.leads.length} Leads Imported</h3>
            <button
              onClick={handleAdvance}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              Next: Enrich Leads <ArrowRight size={16} />
            </button>
          </div>
          <LeadTable leads={campaign.leads} />
        </div>
      )}
    </div>
  );
}
