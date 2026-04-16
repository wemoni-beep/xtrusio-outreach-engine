import { useState, useEffect } from 'react';
import { FileText, Save, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { loadPrompts, savePrompt, resetPrompt, PROMPT_DEFS } from '../store/promptStore';

const TARGET_COLORS = {
  gemini: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Gemini' },
  grok: { bg: 'bg-gray-900', text: 'text-white', label: 'Grok' },
  claude: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Claude' },
};

export default function Prompts() {
  const [prompts, setPrompts] = useState({});
  const [drafts, setDrafts] = useState({});
  const [expanded, setExpanded] = useState({});
  const [savedFlash, setSavedFlash] = useState(null);

  useEffect(() => {
    const loaded = loadPrompts();
    setPrompts(loaded);
    const d = {};
    for (const key of Object.keys(loaded)) {
      d[key] = loaded[key].prompt;
    }
    setDrafts(d);
  }, []);

  const handleSave = (id) => {
    savePrompt(id, drafts[id]);
    const loaded = loadPrompts();
    setPrompts(loaded);
    setSavedFlash(id);
    setTimeout(() => setSavedFlash(null), 1500);
  };

  const handleReset = (id) => {
    if (!confirm(`Reset "${PROMPT_DEFS[id].title}" to default? Your edits will be lost.`)) return;
    resetPrompt(id);
    const loaded = loadPrompts();
    setPrompts(loaded);
    setDrafts(prev => ({ ...prev, [id]: loaded[id].prompt }));
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isDirty = (id) => drafts[id] !== prompts[id]?.prompt;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Prompt Library</h1>
        <p className="text-text-muted text-sm mt-1">
          Edit your AI prompts here. Changes save to your browser — refresh-safe, no code changes needed.
          Placeholders like <code className="bg-surface-alt px-1 rounded text-xs">{'{{company}}'}</code> are filled automatically when you use them.
        </p>
      </div>

      <div className="space-y-4">
        {Object.values(prompts).map((p) => {
          const target = TARGET_COLORS[p.target] || TARGET_COLORS.claude;
          const dirty = isDirty(p.id);
          const isOpen = expanded[p.id];
          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-border overflow-hidden"
            >
              <div className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{p.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${target.bg} ${target.text}`}>
                      → {target.label}
                    </span>
                    {dirty && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                        Unsaved changes
                      </span>
                    )}
                    {savedFlash === p.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
                        ✓ Saved
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">{p.description}</p>
                  {p.placeholders?.length > 0 && (
                    <p className="text-xs text-text-muted mt-2">
                      <span className="font-medium">Placeholders:</span>{' '}
                      {p.placeholders.map((ph, i) => (
                        <code key={i} className="bg-surface-alt px-1.5 py-0.5 rounded text-xs mr-1">
                          {ph}
                        </code>
                      ))}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleExpand(p.id)}
                  className="text-text-muted hover:text-text text-sm flex items-center gap-1 shrink-0"
                >
                  {isOpen ? <><EyeOff size={14} /> Hide</> : <><Eye size={14} /> Edit</>}
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-border p-5 bg-surface-alt/30">
                  <textarea
                    value={drafts[p.id] || ''}
                    onChange={(e) => setDrafts(prev => ({ ...prev, [p.id]: e.target.value }))}
                    rows={16}
                    className="w-full px-4 py-3 rounded-lg border border-border font-mono text-xs leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                    placeholder="Prompt text..."
                    spellCheck={false}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleSave(p.id)}
                      disabled={!dirty}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save size={14} /> Save Changes
                    </button>
                    <button
                      onClick={() => handleReset(p.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-text-muted hover:bg-surface-alt transition-colors"
                    >
                      <RotateCcw size={14} /> Reset to Default
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
