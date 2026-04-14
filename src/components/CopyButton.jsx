import { useState } from 'react';
import { Copy } from 'lucide-react';

const AI_LINKS = {
  gemini: { label: 'Open Gemini', emoji: '✨', url: 'https://gemini.google.com/', hint: 'Paste the prompt in the chat window and press Send' },
  grok: { label: 'Open Grok', emoji: '🤖', url: 'https://grok.com/', hint: 'Paste the prompt in the chat window and press Send' },
  claude: { label: 'Open Claude', emoji: '🚀', url: 'https://claude.ai/', hint: 'Paste the prompt in the chat window and press Send' },
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-8 text-center shadow-xl"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'fadeInUp 0.2s ease-out' }}
          >
            {/* Big emoji checkmark */}
            <div className="text-5xl mb-4">✅</div>

            <h3 className="text-xl font-bold mb-2">Prompt Copied!</h3>

            <p className="text-sm text-text-muted mb-6">
              {ai
                ? `Click the button below to open ${ai.label.replace('Open ', '')}, then paste (Ctrl+V) and hit Send.`
                : 'Paste it in your preferred AI tool.'}
            </p>

            {/* Open AI button */}
            {ai && (
              <button
                onClick={handleOpenAI}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base bg-primary text-white hover:bg-primary-hover transition-all duration-200 mb-3"
              >
                <span>{ai.emoji}</span> {ai.label}
              </button>
            )}

            {/* Helper text */}
            {ai && (
              <p className="text-xs text-text-muted mb-4">{ai.hint}</p>
            )}

            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="px-5 py-2 rounded-xl font-medium text-sm bg-surface-tertiary text-text-muted hover:bg-gray-200 transition-all duration-200"
            >
              Close
            </button>
          </div>

          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
