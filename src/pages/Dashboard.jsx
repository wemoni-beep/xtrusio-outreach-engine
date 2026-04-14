import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import StageIndicator from '../components/StageIndicator';

const statusLabels = {
  new: 'New',
  invite_sent: 'Invite Sent',
  accepted: 'Accepted',
  replied: 'Replied',
  converted: 'Converted',
};

export default function Dashboard({ campaigns, onCreateCampaign, onDeleteCampaign, onSelectCampaign }) {
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = () => {
    if (name.trim()) {
      const campaign = onCreateCampaign(name.trim());
      setName('');
      setShowNew(false);
      navigate('/generate');
    }
  };

  const handleSelect = (campaign) => {
    onSelectCampaign(campaign.id);
    const routes = { generate: '/generate', enrich: '/enrich', articles: '/articles', outreach: '/outreach', done: '/outreach' };
    navigate(routes[campaign.stage] || '/generate');
  };

  // Stats
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads.length, 0);
  const totalEnriched = campaigns.reduce((sum, c) => sum + c.leads.filter(l => l.linkedinUrl).length, 0);
  const totalReplied = campaigns.reduce((sum, c) => sum + c.leads.filter(l => l.status === 'replied' || l.status === 'converted').length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">Manage your outreach campaigns</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-primary text-white hover:bg-primary-hover transition-colors"
        >
          <Plus size={16} />
          New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Campaigns', value: campaigns.length, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Total Leads', value: totalLeads, color: 'bg-blue-50 text-blue-700' },
          { label: 'Enriched', value: totalEnriched, color: 'bg-amber-50 text-amber-700' },
          { label: 'Replied', value: totalReplied, color: 'bg-green-50 text-green-700' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-5">
            <p className="text-text-muted text-xs font-medium uppercase tracking-wide">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* New Campaign Modal */}
      {showNew && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-3">Create New Campaign</h3>
          <div className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Campaign name (e.g., Q2 SaaS Outreach)"
              className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
            />
            <button onClick={handleCreate} disabled={!name.trim()} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover disabled:opacity-40 transition-colors">
              Create
            </button>
            <button onClick={() => { setShowNew(false); setName(''); }} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-text-muted hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-border">
          <p className="text-text-muted mb-2">No campaigns yet</p>
          <p className="text-sm text-text-muted">Click "New Campaign" to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{campaign.name}</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {campaign.leads.length} leads &middot; Created {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDeleteCampaign(campaign.id)}
                    className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => handleSelect(campaign)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary-light text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    Continue <ArrowRight size={14} />
                  </button>
                </div>
              </div>
              <StageIndicator currentStage={campaign.stage} />
              {/* Mini status breakdown */}
              {campaign.leads.length > 0 && (
                <div className="flex gap-3 mt-3 pt-3 border-t border-border/50">
                  {Object.entries(statusLabels).map(([key, label]) => {
                    const count = campaign.leads.filter(l => l.status === key).length;
                    return count > 0 ? (
                      <span key={key} className="text-xs text-text-muted">
                        {label}: <strong>{count}</strong>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
