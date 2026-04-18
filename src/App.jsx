import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useCallback } from 'react';
import AuthGate from './components/AuthGate';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import GenerateLeads from './pages/GenerateLeads';
import EnrichLeads from './pages/EnrichLeads';
import ContentFactory from './pages/ContentFactory';
import Outreach from './pages/Outreach';
import Prompts from './pages/Prompts';
import PublishSettings from './pages/PublishSettings';
import NewsRadar from './pages/NewsRadar';
import { loadData, saveData, createCampaign, updateCampaign, deleteCampaign } from './store/leadStore';

export default function App() {
  const [data, setData] = useState(() => loadData());

  const refresh = useCallback(() => setData(loadData()), []);

  const currentCampaign = data.campaigns.find(c => c.id === data.currentCampaignId) || null;

  const handleCreateCampaign = (name) => {
    const campaign = createCampaign(name);
    refresh();
    return campaign;
  };

  const handleDeleteCampaign = (id) => {
    if (confirm('Delete this campaign and all its leads?')) {
      deleteCampaign(id);
      refresh();
    }
  };

  const handleSelectCampaign = (id) => {
    const d = loadData();
    d.currentCampaignId = id;
    saveData(d);
    refresh();
  };

  const handleUpdateCampaign = (id, updates) => {
    updateCampaign(id, updates);
    refresh();
  };

  return (
    <AuthGate>
    <BrowserRouter basename="/xtrusio-outreach-engine">
      <Routes>
        <Route element={<Layout onDataChange={refresh} />}>
          <Route
            path="/"
            element={
              <Dashboard
                campaigns={data.campaigns}
                onCreateCampaign={handleCreateCampaign}
                onDeleteCampaign={handleDeleteCampaign}
                onSelectCampaign={handleSelectCampaign}
              />
            }
          />
          <Route
            path="/generate"
            element={
              <GenerateLeads
                campaign={currentCampaign}
                onUpdateCampaign={handleUpdateCampaign}
              />
            }
          />
          <Route
            path="/enrich"
            element={
              <EnrichLeads
                campaign={currentCampaign}
                onUpdateCampaign={handleUpdateCampaign}
              />
            }
          />
          <Route
            path="/content"
            element={
              <ContentFactory
                campaign={currentCampaign}
                onUpdateCampaign={handleUpdateCampaign}
              />
            }
          />
          <Route
            path="/outreach"
            element={
              <Outreach
                campaign={currentCampaign}
                onUpdateCampaign={handleUpdateCampaign}
              />
            }
          />
          <Route path="/news-radar" element={<NewsRadar />} />
          <Route path="/prompts" element={<Prompts />} />
          <Route path="/publish-settings" element={<PublishSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthGate>
  );
}
