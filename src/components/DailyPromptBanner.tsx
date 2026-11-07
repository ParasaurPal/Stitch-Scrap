import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X, ChevronDown, ChevronUp, PenTool } from 'lucide-react';
import { DailyPrompt, getPromptForDate, getRandomPrompt } from '../data/prompts';
import { sounds } from '../utils/sound';

interface DailyPromptBannerProps {
  onInsertPrompt: (promptText: string) => void;
  themeColor?: string;
  isNightTheme?: boolean;
}

export const DailyPromptBanner: React.FC<DailyPromptBannerProps> = ({
  onInsertPrompt,
  themeColor = '#ec4899',
  isNightTheme = false,
}) => {
  const [prompt, setPrompt] = useState<DailyPrompt>(() => getPromptForDate());
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Update prompt for current date on mount
  useEffect(() => {
    setPrompt(getPromptForDate(new Date()));
  }, []);

  const handleShuffle = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setPrompt((prev) => getRandomPrompt(prev.id));
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playPageFlip();
    onInsertPrompt(prompt.question);
  };

  if (isDismissed) {
    return (
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => {
            sounds.playClick();
            setIsDismissed(false);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition border shadow-xs ${
            isNightTheme
              ? 'bg-stone-900/80 border-stone-800 text-pink-300 hover:bg-stone-800'
              : 'bg-white/80 border-stone-200/80 text-pink-600 hover:bg-white'
          }`}
        >
          <Sparkles size={12} className="text-pink-500" />
          <span>Show Daily Prompt</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative z-20 mb-3 rounded-2xl border transition shadow-sm overflow-hidden ${
        isNightTheme
          ? 'bg-stone-900/85 border-pink-500/30 text-stone-200'
          : 'bg-pink-50/70 border-pink-200/80 text-stone-800'
      }`}
    >
      <div className="p-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: themeColor }}
            >
              <Sparkles size={11} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-pink-600 dark:text-pink-400">
              Daily Journal Prompt
            </span>
            {prompt.tag && (
              <span className="text-[9px] text-stone-600 dark:text-stone-300">
                · {prompt.tag}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleShuffle}
              title="Shuffle to another creative prompt"
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition"
            >
              <RefreshCw size={12} />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse prompt' : 'Expand prompt'}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition"
            >
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setIsDismissed(true);
              }}
              title="Dismiss prompt banner"
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Prompt Question */}
        {isExpanded && (
          <div className="space-y-1.5 animate-in fade-in duration-150">
            <p className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 leading-snug">
              &ldquo;{prompt.question}&rdquo;
            </p>
            {prompt.subtext && (
              <p className="text-[11px] text-stone-600 dark:text-stone-300 italic">
                {prompt.subtext}
              </p>
            )}

            {/* Actions: Insert into entry */}
            <div className="pt-1 flex justify-end gap-1.5">
              <button
                onClick={handleApply}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-pink-600 hover:bg-pink-500 active:scale-95 text-white font-bold text-[10px] shadow-sm transition"
              >
                <PenTool size={11} />
                <span>Write Response</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
