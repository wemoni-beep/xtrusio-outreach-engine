import { useState } from 'react';
import { ClipboardPaste } from 'lucide-react';

export default function PasteArea({ onSubmit, placeholder = 'Paste the AI output here...', buttonLabel = 'Process Data' }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={10}
        className="w-full border border-border rounded-xl p-4 text-sm font-mono bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y transition-all duration-200"
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm bg-primary text-white hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all duration-200"
      >
        <ClipboardPaste size={16} />
        {buttonLabel}
      </button>
    </div>
  );
}
