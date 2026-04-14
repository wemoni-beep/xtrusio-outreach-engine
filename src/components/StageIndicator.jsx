import { Check } from 'lucide-react';

const stages = [
  { key: 'generate', label: 'Generate' },
  { key: 'enrich', label: 'Enrich' },
  { key: 'articles', label: 'Articles' },
  { key: 'outreach', label: 'Outreach' },
  { key: 'done', label: 'Done' },
];

const stageOrder = { generate: 0, enrich: 1, articles: 2, outreach: 3, done: 4 };

export default function StageIndicator({ currentStage }) {
  const currentIdx = stageOrder[currentStage] ?? 0;

  return (
    <div className="flex items-center gap-1.5">
      {stages.map((stage, i) => {
        const isComplete = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={stage.key} className="flex items-center gap-1.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.65rem] font-bold transition-all duration-200 ${
                isComplete
                  ? 'bg-success text-white'
                  : isCurrent
                  ? 'bg-primary text-white'
                  : 'bg-surface-tertiary text-text-muted'
              }`}
            >
              {isComplete ? <Check size={12} /> : i + 1}
            </div>
            <span
              className={`text-xs font-semibold ${
                isCurrent ? 'text-text' : 'text-text-muted'
              }`}
            >
              {stage.label}
            </span>
            {i < stages.length - 1 && (
              <div
                className={`w-6 h-0.5 rounded-full ${
                  isComplete ? 'bg-success' : 'bg-surface-tertiary'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
