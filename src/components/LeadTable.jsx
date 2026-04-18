import { ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const statusColors = {
  new: 'bg-gray-100 text-gray-700',
  invite_sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-yellow-100 text-yellow-700',
  replied: 'bg-green-100 text-green-700',
  converted: 'bg-purple-100 text-purple-700',
};

const statusLabels = {
  new: 'New',
  invite_sent: 'Invite Sent',
  accepted: 'Accepted',
  replied: 'Replied',
  converted: 'Converted',
};

export default function LeadTable({ leads, onStatusChange, onMessageCopy, showOutreach = false }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyMessage = async (lead) => {
    if (lead.outreachMessage) {
      await navigator.clipboard.writeText(lead.outreachMessage);
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
    onMessageCopy?.(lead);
  };

  if (!leads.length) {
    return (
      <div className="text-center py-12 text-text-muted">
        <p>No leads yet. Start by generating leads.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-3 font-semibold text-text-muted">#</th>
            <th className="text-left py-3 px-3 font-semibold text-text-muted">Company</th>
            <th className="text-left py-3 px-3 font-semibold text-text-muted">Industry</th>
            <th className="text-left py-3 px-3 font-semibold text-text-muted">Decision Maker</th>
            <th className="text-left py-3 px-3 font-semibold text-text-muted">Signal</th>
            <th className="text-left py-3 px-3 font-semibold text-text-muted">Score</th>
            {leads.some(l => l.linkedinUrl) && (
              <th className="text-left py-3 px-3 font-semibold text-text-muted">LinkedIn</th>
            )}
            {leads.some(l => l.email) && (
              <th className="text-left py-3 px-3 font-semibold text-text-muted">Email</th>
            )}
            {showOutreach && (
              <>
                <th className="text-left py-3 px-3 font-semibold text-text-muted">Message</th>
                <th className="text-left py-3 px-3 font-semibold text-text-muted">Status</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, i) => (
            <tr key={lead.id} className="border-b border-border/50 hover:bg-surface-alt">
              <td className="py-3 px-3 text-text-muted">{i + 1}</td>
              <td className="py-3 px-3 font-medium">{lead.company}</td>
              <td className="py-3 px-3 text-text-muted">{lead.industry}</td>
              <td className="py-3 px-3">{lead.decisionMaker}</td>
              <td className="py-3 px-3 text-text-muted text-xs max-w-48 truncate">{lead.signal}</td>
              <td className="py-3 px-3">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                  parseInt(lead.qualityScore) >= 8 ? 'bg-green-100 text-green-700' :
                  parseInt(lead.qualityScore) >= 5 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {lead.qualityScore}
                </span>
              </td>
              {leads.some(l => l.linkedinUrl) && (
                <td className="py-3 px-3">
                  {lead.linkedinUrl && /^https?:\/\//i.test(lead.linkedinUrl) ? (
                    <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      <ExternalLink size={14} /> Profile
                    </a>
                  ) : (
                    <span className="text-text-muted text-xs">-</span>
                  )}
                </td>
              )}
              {leads.some(l => l.email) && (
                <td className="py-3 px-3 text-xs">{lead.email || '-'}</td>
              )}
              {showOutreach && (
                <>
                  <td className="py-3 px-3">
                    {lead.outreachMessage ? (
                      <button
                        onClick={() => handleCopyMessage(lead)}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary-light text-primary hover:bg-primary hover:text-white transition-colors"
                      >
                        {copiedId === lead.id ? <Check size={12} /> : <Copy size={12} />}
                        {copiedId === lead.id ? 'Copied' : 'Copy Msg'}
                      </button>
                    ) : (
                      <span className="text-text-muted text-xs">No message</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <select
                      value={lead.status}
                      onChange={(e) => onStatusChange?.(lead.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusColors[lead.status]}`}
                    >
                      {Object.entries(statusLabels).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
