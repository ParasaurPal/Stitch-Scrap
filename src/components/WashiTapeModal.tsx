import React, { useState } from 'react';
import { X, Bandage, Check, Sparkles } from 'lucide-react';
import { TapePattern } from '../types/journal';
import { sounds } from '../utils/sound';

interface WashiTapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTape: (tapeData: {
    pattern: TapePattern;
    text: string;
    textColor: string;
    fontFamily: 'handwriting' | 'marker' | 'typewriter' | 'mono' | 'doodle';
    width: number;
    height: number;
  }) => void;
  themeColor: string;
}

export const WashiTapeModal: React.FC<WashiTapeModalProps> = ({
  isOpen,
  onClose,
  onAddTape,
  themeColor,
}) => {
  const [selectedPattern, setSelectedPattern] = useState<TapePattern>('grid');
  const [tapeText, setTapeText] = useState('★ FAVORITE MEMORY ★');
  const [textColor, setTextColor] = useState('#be185d');
  const [fontFamily, setFontFamily] = useState<'handwriting' | 'marker' | 'typewriter' | 'mono' | 'doodle'>(
    'marker'
  );

  if (!isOpen) return null;

  const patterns: { id: TapePattern; label: string; defaultColor: string }[] = [
    { id: 'grid', label: 'Pastel Grid', defaultColor: '#be185d' },
    { id: 'dots', label: 'Vintage Polka', defaultColor: '#854d0e' },
    { id: 'stripes', label: 'Mint Stripes', defaultColor: '#065f46' },
    { id: 'kraft', label: 'Kraft Paper', defaultColor: '#451a03' },
    { id: 'caution', label: 'Caution Tape', defaultColor: '#18181b' },
    { id: 'lavender', label: 'Lavender Blossom', defaultColor: '#581c87' },
    { id: 'frosted', label: 'Frosted Matte', defaultColor: '#334155' },
    { id: 'cyan', label: 'Cyan Wave', defaultColor: '#0e7490' },
  ];

  const quickPhrases = [
    '★ FAVORITE MEMORY ★',
    'TOP SECRET 🔒',
    'CHAPTER ONE',
    'DO NOT TOUCH',
    'COZY VIBES ONLY',
    'LIVEJOURNAL 2004',
    'LOVE THIS SONG ♫',
    'AUTUMN DAYS',
  ];

  const handleSelectPattern = (p: { id: TapePattern; label: string; defaultColor: string }) => {
    sounds.playTapeTear();
    setSelectedPattern(p.id);
    setTextColor(p.defaultColor);
  };

  const handleCreate = () => {
    sounds.playTapeTear();
    onAddTape({
      pattern: selectedPattern,
      text: tapeText,
      textColor,
      fontFamily,
      width: Math.max(150, Math.min(260, tapeText.length * 11 + 60)),
      height: 36,
    });
    onClose();
  };

  const getFontClass = (font: string) => {
    switch (font) {
      case 'handwriting':
        return 'font-handwriting';
      case 'marker':
        return 'font-marker';
      case 'typewriter':
        return 'font-typewriter';
      case 'mono':
        return 'font-mono-code';
      case 'doodle':
        return 'font-doodle';
      default:
        return 'font-handwriting';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: themeColor || '#10b981' }}
            >
              <Bandage size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">Virtual Washi Tape</h2>
              <p className="text-[11px] text-stone-400">Torn-edge decorative tape you can write on</p>
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
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Live Preview */}
          <div className="p-6 bg-stone-950 rounded-2xl border border-stone-800 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase font-bold text-stone-500 mb-3">Live Tape Preview</span>
            <div
              className={`w-64 h-10 washi-torn-edge shadow-lg flex items-center justify-center px-4 tape-pattern-${selectedPattern}`}
            >
              <span
                style={{ color: textColor }}
                className={`text-sm font-bold truncate select-none ${getFontClass(fontFamily)}`}
              >
                {tapeText || 'click to write...'}
              </span>
            </div>
          </div>

          {/* Tape Pattern Options */}
          <div>
            <label className="text-[11px] font-semibold text-stone-300 block mb-1.5">
              Choose Tape Pattern
            </label>
            <div className="grid grid-cols-2 gap-2">
              {patterns.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPattern(p)}
                  className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                    selectedPattern === p.id
                      ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold ring-1 ring-emerald-500/50'
                      : 'border-stone-800 bg-stone-950 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md washi-torn-edge tape-pattern-${p.id} shrink-0`}></div>
                  <span className="text-[11px] truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text to write on tape */}
          <div>
            <label className="text-[11px] font-semibold text-stone-300 block mb-1">
              Write on this Tape
            </label>
            <input
              type="text"
              value={tapeText}
              onChange={(e) => setTapeText(e.target.value)}
              placeholder="Write your note or title..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>

          {/* Quick Phrases */}
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
              Quick Phrases
            </span>
            <div className="flex flex-wrap gap-1">
              {quickPhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sounds.playClick();
                    setTapeText(phrase);
                  }}
                  className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded-lg"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="text-[11px] font-semibold text-stone-300 block mb-1">
              Handwriting / Marker Font
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'marker', label: 'Marker Pen' },
                { id: 'handwriting', label: 'Handwriting' },
                { id: 'typewriter', label: 'Typewriter' },
                { id: 'doodle', label: 'Doodle' },
                { id: 'mono', label: 'Code Mono' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    sounds.playClick();
                    setFontFamily(f.id as any);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-center text-[10px] transition ${
                    fontFamily === f.id
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-stone-950 text-stone-300 hover:bg-stone-800 border border-stone-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add Tape Button */}
          <button
            onClick={handleCreate}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Bandage size={15} />
            Stick Washi Tape on Page
          </button>
        </div>
      </div>
    </div>
  );
};
