import React from 'react';
import { X, Download, Printer, Copy, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { JournalEntry, Journal } from '../types/journal';
import { sounds } from '../utils/sound';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
  journal: Journal;
  themeColor: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  entry,
  journal,
  themeColor,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    sounds.playClick();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    window.print();
  };

  const handleCopyText = () => {
    sounds.playClick();
    // Strip HTML tags for clean clipboard text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = entry.content;
    const plainText = `${entry.title}\n${entry.date}\nJournal: ${journal.name}\nMood: ${entry.blogMetadata?.mood?.label || 'Cozy'}\n\n${tempDiv.textContent || tempDiv.innerText || ''}`;
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom duration-200 text-xs">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: themeColor || '#ec4899' }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">Export Scrapbook Page</h2>
              <p className="text-[11px] text-stone-400">Save, print, or share your digital spread</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-stone-300">
              <span className="font-bold text-stone-100 text-sm truncate max-w-[200px]">{entry.title}</span>
              <span className="text-[10px] text-stone-500 font-mono">{entry.date}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-400">
              <span>{journal.name}</span>
              <span>•</span>
              <span>{entry.stickers.length} stickers</span>
              <span>•</span>
              <span>{entry.tapes.length} tapes</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handlePrint}
              className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 active:scale-98 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition"
            >
              <Printer size={15} />
              Print / Save as PDF Page
            </button>

            <button
              onClick={handleCopyText}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-98 text-stone-200 font-semibold flex items-center justify-center gap-2 transition"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Journal Text & Mood'}
            </button>
          </div>

          <p className="text-[10px] text-stone-500 text-center">
            Tip: You can take a screenshot on your Android device or print this page to keep a physical scrapbook copy!
          </p>
        </div>
      </div>
    </div>
  );
};
