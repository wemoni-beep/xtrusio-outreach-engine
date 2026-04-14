import { useState } from 'react';
import { Copy, Check, ExternalLink, X } from 'lucide-react';

const AI_LINKS = {
  gemini: { label: 'Open Gemini', url: 'https://gemini.google.com/' },
  grok: { label: 'Open Grok', url: 'https://grok.com/' },
  claude: { label: 'Open Claude', url: 'https://claude.ai/' },
};

export default function CopyButton({ text, label = 'Copy Prompt', className = '', aiTarget = null }) {
  const [showModal, setShowModal] = useState(false);

  const copyToClipboard = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const handleClick = async () => {
    await copyToClipboard(text);
    setShowModal(true);
  };

  const handleOpenAI = () => {
    const link = AI_LINKS[aiTarget];
    if (link) {
      window.open(link.url, '_blank');
    }
    setShowModal(false);
  };

  const ai = aiTarget ? AI_LINKS[aiTarget] : null;

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm transition-all duration-200 bg-primary text-white hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-md ${className}`}
      >
        <Copy size={16} />
        {label}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold mb-1">Prompt Copied!</h3>
            <p className="text-sm text-text-muted mb-6">
              The prompt is in your clipboard. {ai ? `Open ${ai.label.replace('Open ', '')} and paste it (Ctrl+V / Cmd+V).` : 'Paste it in your preferred AI tool.'}
            </p>
            <div className="flex gap-3 justify-center">
              {ai && (
                <button
                  onClick={handleOpenAI}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm bg-primary text-white hover:bg-primary-hover transition-all duration-200"
                >
                  <ExternalLink size={16} />
                  {ai.label}
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm bg-surface-tertiary text-text-secondary hover:bg-gray-200 transition-all duration-200"
              >
                {ai ? 'Close' : 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
