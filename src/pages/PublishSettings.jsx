import { useState, useEffect } from 'react';
import { Save, GitBranch, Eye, EyeOff, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { loadPublishConfig, savePublishConfig } from '../lib/publisher';

export default function PublishSettings() {
  const [config, setConfig] = useState(loadPublishConfig());
  const [showToken, setShowToken] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    setConfig(loadPublishConfig());
  }, []);

  const handleSave = () => {
    savePublishConfig(config);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const handleTest = async () => {
    setTestResult({ status: 'testing', message: 'Testing GitHub connection...' });
    try {
      const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}`, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github+json',
        },
      });
      if (!res.ok) {
        const err = await res.text();
        setTestResult({ status: 'error', message: `Failed: ${res.status} — ${err.slice(0, 200)}` });
        return;
      }
      const data = await res.json();
      setTestResult({
        status: 'success',
        message: `✓ Connected to ${data.full_name} (${data.default_branch} branch). Write access: ${data.permissions?.push ? 'YES' : 'NO — your token may lack write scope'}`,
      });
    } catch (e) {
      setTestResult({ status: 'error', message: e.message });
    }
  };

  const update = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Publish Settings</h1>
        <p className="text-text-muted text-sm mt-1">
          Configure where generated HTML content gets published. Once set up, every piece of content has a one-click "Publish" button.
        </p>
      </div>

      {/* Provider select */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-3">Publishing Target</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-surface-alt">
            <input
              type="radio"
              checked={config.provider === 'github'}
              onChange={() => update('provider', 'github')}
            />
            <GitBranch size={18} />
            <div>
              <div className="font-medium text-sm">GitHub Push</div>
              <div className="text-xs text-text-muted">Commit HTML files to your site's Git repo. Cloudflare/Vercel auto-deploys.</div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-surface-alt">
            <input
              type="radio"
              checked={config.provider === 'download'}
              onChange={() => update('provider', 'download')}
            />
            <div>
              <div className="font-medium text-sm">Download only</div>
              <div className="text-xs text-text-muted">Download HTML files manually and upload to your site yourself.</div>
            </div>
          </label>
        </div>
      </div>

      {/* GitHub config */}
      {config.provider === 'github' && (
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <GitBranch size={18} />
            <h3 className="font-semibold">GitHub Configuration</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Repo Owner (user or org)</label>
              <input
                type="text"
                value={config.owner}
                onChange={(e) => update('owner', e.target.value)}
                placeholder="wemoni-beep"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Repo Name</label>
              <input
                type="text"
                value={config.repo}
                onChange={(e) => update('repo', e.target.value)}
                placeholder="imapro-site"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Branch</label>
              <input
                type="text"
                value={config.branch}
                onChange={(e) => update('branch', e.target.value)}
                placeholder="main"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Site Base URL</label>
              <input
                type="text"
                value={config.siteBaseUrl}
                onChange={(e) => update('siteBaseUrl', e.target.value)}
                placeholder="https://gaurav.imapro.in"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1">
              Personal Access Token (<a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">generate one →</a>)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={config.token}
                onChange={(e) => update('token', e.target.value)}
                placeholder="ghp_..."
                className="w-full px-3 py-2 pr-10 rounded-lg border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text"
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Token needs <code className="bg-surface-alt px-1 rounded">repo</code> scope for private repos or <code className="bg-surface-alt px-1 rounded">public_repo</code> for public. Stored only in your browser — never sent anywhere except directly to GitHub.
            </p>
          </div>

          {/* Content paths */}
          <div className="pt-4 border-t border-border">
            <h4 className="font-semibold text-sm mb-2">Content paths in repo</h4>
            <p className="text-xs text-text-muted mb-3">
              Where HTML files land in your repo. Using Next.js <code>public/</code> convention — files at <code>public/research/company-slug/index.html</code> serve at <code>yoursite.com/research/company-slug/</code>.
            </p>
            <div className="space-y-2">
              {[
                { key: 'auditsPath', label: 'Audits path' },
                { key: 'articlesPath', label: 'Articles path' },
                { key: 'comparisonsPath', label: 'Comparisons path' },
              ].map(f => (
                <div key={f.key} className="flex items-center gap-2">
                  <label className="text-xs font-medium w-32 shrink-0">{f.label}:</label>
                  <input
                    type="text"
                    value={config[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Test connection */}
          <div className="pt-2 flex gap-2">
            <button
              onClick={handleTest}
              disabled={!config.owner || !config.repo || !config.token}
              className="text-sm px-4 py-2 rounded-lg font-medium border border-border hover:bg-surface-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Test Connection
            </button>
          </div>
          {testResult && (
            <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
              testResult.status === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              testResult.status === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {testResult.status === 'success' ? <Check size={16} className="shrink-0 mt-0.5" /> :
               testResult.status === 'error' ? <AlertCircle size={16} className="shrink-0 mt-0.5" /> : null}
              <span className="break-all">{testResult.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm bg-primary text-white hover:bg-primary-hover transition-colors"
        >
          <Save size={16} /> Save Settings
        </button>
        {savedFlash && (
          <span className="text-sm text-green-700 font-medium inline-flex items-center gap-1">
            <Check size={14} /> Saved
          </span>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <p className="font-semibold mb-1">⚠️ Token safety</p>
        <p>Your GitHub token is stored only in localStorage on this device. Never commit it. Never share your browser profile. Revoke it from <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">GitHub settings</a> when no longer needed.</p>
      </div>
    </div>
  );
}
