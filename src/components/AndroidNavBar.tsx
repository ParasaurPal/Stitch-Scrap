import React from 'react';
import { BookOpen, Sparkles, Bandage, SmilePlus, Share2, Layers } from 'lucide-react';
import { sounds } from '../utils/sound';

interface AndroidNavBarProps {
  onOpenJournals: () => void;
  onOpenStickers: () => void;
  onOpenTape: () => void;
  onOpenBlogMeta: () => void;
  onExport: () => void;
  journalCount: number;
  themeColor: string;
  isDispenserActive?: boolean;
  onToggleDispenser?: () => void;
}

export const AndroidNavBar: React.FC<AndroidNavBarProps> = ({
  onOpenJournals,
  onOpenStickers,
  onOpenTape,
  onOpenBlogMeta,
  onExport,
  journalCount,
  themeColor,
  isDispenserActive = false,
  onToggleDispenser,
}) => {
  return (
    <div className="w-full bg-stone-900/95 backdrop-blur-md border-t border-stone-800 text-stone-300 px-3 py-2 z-40 select-none">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Journals Switcher */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenJournals();
          }}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-stone-300 hover:text-white active:scale-95 transition"
        >
          <div className="relative p-1 rounded-full bg-stone-800">
            <BookOpen size={18} />
            <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {journalCount}
            </span>
          </div>
          <span className="text-[10px] font-medium">Journals</span>
        </button>

        {/* Nostalgic Blog Meta (Mood & Currents) */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenBlogMeta();
          }}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-stone-300 hover:text-white active:scale-95 transition"
        >
          <div className="p-1 rounded-full bg-stone-800">
            <SmilePlus size={18} className="text-amber-400" />
          </div>
          <span className="text-[10px] font-medium">Mood & Blog</span>
        </button>

        {/* Center Primary Action: Add Sticker (AI & Stash) */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenStickers();
          }}
          className="relative -top-3 flex flex-col items-center group active:scale-95 transition"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ring-4 ring-stone-900 transition transform group-hover:scale-105"
            style={{ backgroundColor: themeColor || '#ec4899' }}
          >
            <Sparkles size={22} className="animate-spin-slow" />
          </div>
          <span className="text-[10px] font-bold text-stone-200 mt-0.5">Stickers</span>
        </button>

        {/* Add Washi Tape / Stylus Dispenser */}
        <button
          onClick={() => {
            sounds.playTapeTear();
            if (onToggleDispenser) {
              onToggleDispenser();
            } else {
              onOpenTape();
            }
          }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl active:scale-95 transition ${
            isDispenserActive
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          <div
            className={`p-1 rounded-full transition ${
              isDispenserActive
                ? 'bg-emerald-500 text-stone-950 ring-2 ring-emerald-400'
                : 'bg-stone-800 text-emerald-400'
            }`}
          >
            <Bandage size={18} className={isDispenserActive ? 'animate-pulse' : ''} />
          </div>
          <span className="text-[10px] font-medium">
            {isDispenserActive ? 'Dispensing' : 'Tape Roll'}
          </span>
        </button>

        {/* Export / Share Spread */}
        <button
          onClick={() => {
            sounds.playClick();
            onExport();
          }}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-stone-300 hover:text-white active:scale-95 transition"
        >
          <div className="p-1 rounded-full bg-stone-800">
            <Share2 size={18} className="text-sky-400" />
          </div>
          <span className="text-[10px] font-medium">Export</span>
        </button>
      </div>

      {/* Android Gesture Bar indicator */}
      <div className="w-24 h-1 bg-stone-600/70 rounded-full mx-auto mt-2.5"></div>
    </div>
  );
};
