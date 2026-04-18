import { useNavigate } from 'react-router-dom';
import { MessageSquare, Copy, Check, ExternalLink, FileSearch, FileText, GitCompare } from 'lucide-react';
import { useState } from 'react';
import CopyButton from '../components/CopyButton';
import PasteArea from '../components/PasteArea';
import StageIndicator from '../components/StageIndicator';
import { getPrompt } from '../store/promptStore';

export default function Outreach({ campaign, onUpdateCampaign }) {
  const navigate = useNavigate();
  const [selectedLead, setSelectedLead] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showMessageInput, setShowMessageInput] = useState(null);
  const [messageText, setMessageText] = useState('');

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

  const handleStatusChange = (leadId, newStatus) => {
    const updatedLeads = campaign.leads.map(l =>
      l.id === leadId ? { ...l, status: newStatus } : l
    );
    onUpdateCampaign(campaign.id, { leads: updatedLeads });
  };

  const handleSaveMessage = (leadId) => {
    if (!messageText.trim()) return;
    const updatedLeads = campaign.leads.map(l =>
      l.id === leadId ? { ...l, outreachMessage: messageText.trim() } : l
    );
    onUpdateCampaign(campaign.id, { leads: updatedLeads });
    setShowMessageInput(null);
    setMessageText('');
  };

  const handleCopyMessage = async (lead) => {
    if (lead.outreachMessage) {
      try {
        await navigator.clipboard.writeText(lead.outreachMessage);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = lead.outreachMessage;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleBulkPasteMessages = (text) => {
    // Parse bulk messages - expect format: "Company: message" or numbered list
    const lines = text.split('\n').filter(l => l.trim());
    let currentLeadIdx = 0;
    const messages = [];
    let currentMessage = '';

    for (const line of lines) {
      // Check if line starts a new entry (number or company name match)
      const numMatch = line.match(/^\d+[\.\)]\s*/);
      const companyMatch = campaign.leads.find(l =>
        line.toLowerCase().includes(l.company.toLowerCase())
      );

      if (numMatch || companyMatch) {
        if (currentMessage.trim()) {
          messages.push(currentMessage.trim());
        }
        currentMessage = line.replace(/^\d+[\.\)]\s*/, '').replace(/^.*?:\s*/, '');
      } else {
        currentMessage += ' ' + line;
      }
    }
    if (currentMessage.trim()) messages.push(currentMessage.trim());

    // Apply messages to leads
    const updatedLeads = campaign.leads.map((lead, i) => ({
      ...lead,
      outreachMessage: messages[i] || lead.outreachMessage,
    }));
    onUpdateCampaign(campaign.id, { leads: updatedLeads });
  };

  const statusColors = {
    new: 'bg-gray-100 text-gray-700 border-gray-200',
    invite_sent: 'bg-blue-50 text-blue-700 border-blue-200',
    accepted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    replied: 'bg-green-50 text-green-700 border-green-200',
    converted: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const statusLabels = {
    new: 'New',
    invite_sent: 'Invite Sent',
    accepted: 'Accepted',
    replied: 'Replied',
    converted: 'Converted',
  };

  // Stats
  const stats = {
    total: campaign.leads.length,
    sent: campaign.leads.filter(l => l.status !== 'new').length,
    accepted: campaign.leads.filter(l => ['accepted', 'replied', 'converted'].includes(l.status)).length,
    replied: campaign.leads.filter(l => ['replied', 'converted'].includes(l.status)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-text-muted text-sm mt-1">Step 3: Personalized outreach</p>
        </div>
        <StageIndicator currentStage={campaign.stage} />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700' },
          { label: 'Invites Sent', value: stats.sent, color: 'text-blue-700' },
          { label: 'Accepted', value: stats.accepted, color: 'text-yellow-700' },
          { label: 'Replied', value: stats.replied, color: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-border p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color.replace('text-', '') }}>{s.value}</p>
            <p className="text-xs text-text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Generate Messages Section */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <MessageSquare size={18} className="text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Generate Personalized Messages</h3>
            <p className="text-sm text-text-muted mb-4">
              Click on any lead below to copy a message generation prompt. Paste it in AI, get the message, then paste it back.
              Or use bulk mode to paste all messages at once.
            </p>
          </div>
        </div>

        {/* Bulk paste */}
        <details className="mb-4">
          <summary className="text-sm text-primary cursor-pointer font-medium">Bulk paste messages</summary>
          <div className="mt-3">
            <PasteArea
              onSubmit={handleBulkPasteMessages}
              placeholder="Paste all generated messages here (numbered list or Company: message format)..."
              buttonLabel="Apply Messages to Leads"
            />
          </div>
        </details>
      </div>

      {/* Lead Cards */}
      <div className="space-y-3">
        {campaign.leads.map((lead, i) => (
          <div key={lead.id} className={`bg-white rounded-xl border p-5 ${statusColors[lead.status].replace(/bg-\S+/, '').replace(/text-\S+/, '')} border-border`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-text-muted">#{i + 1}</span>
                  <h4 className="font-semibold truncate">{lead.company}</h4>
                  <span className="text-xs text-text-muted">{lead.industry}</span>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border cursor-pointer ${statusColors[lead.status]}`}
                  >
                    {Object.entries(statusLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-text-muted mb-1">
                  <strong>{lead.decisionMaker}</strong> &middot; {lead.signal}
                </p>
                {lead.linkedinUrl && /^https?:\/\//i.test(lead.linkedinUrl) && (
                  <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mb-2">
                    <ExternalLink size={12} /> Open LinkedIn Profile
                  </a>
                )}

                {/* Published content badges */}
                {(lead.auditUrl || lead.articleUrl || lead.comparisonUrl) && (
                  <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
                    {lead.auditUrl && (
                      <a href={lead.auditUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors">
                        <FileSearch size={10} /> Audit Live
                      </a>
                    )}
                    {lead.articleUrl && (
                      <a href={lead.articleUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
                        <FileText size={10} /> Article Live
                      </a>
                    )}
                    {lead.comparisonUrl && (
                      <a href={lead.comparisonUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                        <GitCompare size={10} /> Comparison Live
                      </a>
                    )}
                  </div>
                )}

                {/* Message area */}
                {lead.outreachMessage ? (
                  <div className="mt-3 p-3 bg-surface-alt rounded-lg border border-border/50">
                    <p className="text-sm mb-2">{lead.outreachMessage}</p>
                    <button
                      onClick={() => handleCopyMessage(lead)}
                      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        copiedId === lead.id
                          ? 'bg-success text-white'
                          : 'bg-primary text-white hover:bg-primary-hover'
                      }`}
                    >
                      {copiedId === lead.id ? <Check size={12} /> : <Copy size={12} />}
                      {copiedId === lead.id ? 'Copied!' : 'Copy Message'}
                    </button>
                  </div>
                ) : showMessageInput === lead.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Paste the generated message here..."
                      rows={3}
                      className="w-full border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveMessage(lead.id)}
                        disabled={!messageText.trim()}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition-colors"
                      >
                        Save Message
                      </button>
                      <button
                        onClick={() => { setShowMessageInput(null); setMessageText(''); }}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-100 text-text-muted hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <CopyButton
                      text={getPrompt('outreachMessage', {
                        decisionMaker: lead.decisionMaker || 'Decision Maker',
                        company: lead.company,
                        industry: lead.industry,
                        signal: lead.signal,
                        technicalPivot: lead.technicalPivot || 'N/A',
                        searchIntent: lead.searchIntent || 'N/A',
                        auditUrl: lead.auditUrl || '[audit not yet published]',
                        articleUrl: lead.articleUrl || '[article not yet published]',
                        comparisonUrl: lead.comparisonUrl || '[comparison not yet published]',
                      })}
                      label="Copy Message Prompt"
                      aiTarget="claude"
                      className="!text-xs !px-3 !py-1.5"
                    />
                    <button
                      onClick={() => { setShowMessageInput(lead.id); setMessageText(''); }}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-100 text-text-muted hover:bg-gray-200 transition-colors"
                    >
                      Paste Message
                    </button>
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                  parseInt(lead.qualityScore) >= 8 ? 'bg-green-100 text-green-700' :
                  parseInt(lead.qualityScore) >= 5 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {lead.qualityScore}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
