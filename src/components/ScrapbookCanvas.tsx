import React, { useRef, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  Palette,
  Bandage,
  X,
  Sparkles,
  Sliders,
  Clock,
  Lightbulb,
  Shuffle,
} from 'lucide-react';
import { JournalEntry, PlacedSticker, PlacedTape, PaperTextureType, TapePattern, AutoTimestampSetting } from '../types/journal';
import { getPromptForDate, getRandomPrompt, DailyPrompt } from '../data/dailyPrompts';
import { WashiTapeItem } from './WashiTapeItem';
import { StickerItem } from './StickerItem';
import { BlogWidgetsBar } from './BlogWidgetsBar';
import { sounds } from '../utils/sound';

interface ScrapbookCanvasProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: Partial<JournalEntry>) => void;
  onPrevEntry: () => void;
  onNextEntry: () => void;
  onNewEntry: () => void;
  onDeleteEntry: () => void;
  canPrev: boolean;
  canNext: boolean;
  entryIndex: number;
  totalEntries: number;
  onOpenBlogMeta: () => void;
  themeColor: string;
  isDispenserMode?: boolean;
  onToggleDispenser?: (active: boolean) => void;
  autoTimestampPos?: AutoTimestampSetting;
  onChangeAutoTimestampPos?: (pos: AutoTimestampSetting) => void;
}

export const ScrapbookCanvas: React.FC<ScrapbookCanvasProps> = ({
  entry,
  onUpdateEntry,
  onPrevEntry,
  onNextEntry,
  onNewEntry,
  onDeleteEntry,
  canPrev,
  canNext,
  entryIndex,
  totalEntries,
  onOpenBlogMeta,
  themeColor,
  isDispenserMode = false,
  onToggleDispenser,
  autoTimestampPos = 'none',
  onChangeAutoTimestampPos,
}) => {
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [selectedTapeId, setSelectedTapeId] = useState<string | null>(null);
  const [showPaperMenu, setShowPaperMenu] = useState<boolean>(false);

  // Fluid 3D Page Turn Animation State
  const [turnAnimation, setTurnAnimation] = useState<'forward' | 'backward' | null>(null);

  // Daily Journal Prompt State
  const [dailyPrompt, setDailyPrompt] = useState<DailyPrompt>(() => getPromptForDate());
  const [showPromptBanner, setShowPromptBanner] = useState<boolean>(true);

  // Tape Dispenser Stylus State
  const [isDispenserActive, setIsDispenserActive] = useState<boolean>(isDispenserMode);
  const [dispenserPattern, setDispenserPattern] = useState<TapePattern>('grid');
  const [dispenserThickness, setDispenserThickness] = useState<number>(36);
  const [dispenserText, setDispenserText] = useState<string>('');

  // Active unrolling state during stylus drag
  const [dispensing, setDispensing] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    startPctX: number;
    startPctY: number;
    currentPctX: number;
    currentPctY: number;
  } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  // Sync external dispenser mode prop
  useEffect(() => {
    setIsDispenserActive(isDispenserMode);
  }, [isDispenserMode]);

  // Sync contentEditable with entry.content when entry changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== entry.content) {
      editorRef.current.innerHTML = entry.content || '';
    }
  }, [entry.id]);

  // Deselect on canvas backdrop click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('scrapbook-surface')) {
      setSelectedStickerId(null);
      setSelectedTapeId(null);
    }
  };

  // Fluid 3D Page Turn Handlers
  const handleFluidTurnNext = () => {
    if (!canNext || turnAnimation) return;
    sounds.playPageFlip();
    setTurnAnimation('forward');
    setTimeout(() => {
      onNextEntry();
    }, 240);
    setTimeout(() => {
      setTurnAnimation(null);
    }, 500);
  };

  const handleFluidTurnPrev = () => {
    if (!canPrev || turnAnimation) return;
    sounds.playPageFlip();
    setTurnAnimation('backward');
    setTimeout(() => {
      onPrevEntry();
    }, 240);
    setTimeout(() => {
      setTurnAnimation(null);
    }, 500);
  };

  // Daily Journal Prompt Handlers
  const handleShufflePrompt = () => {
    sounds.playClick();
    setDailyPrompt(getRandomPrompt(dailyPrompt.id));
  };

  const handleApplyPromptToTitle = () => {
    sounds.playStickerPop();
    onUpdateEntry({ title: dailyPrompt.question });
    setShowPromptBanner(false);
  };

  const handleInsertPromptToContent = () => {
    sounds.playStickerPop();
    const formattedPrompt = `<p><strong><em>Prompt: ${dailyPrompt.question}</em></strong></p><p></p>`;
    const updated = (entry.content || '') + formattedPrompt;
    if (editorRef.current) {
      editorRef.current.innerHTML = updated;
    }
    onUpdateEntry({ content: updated });
    setShowPromptBanner(false);
  };

  // Rich Text Formatting Actions
  const applyFormat = (command: string, value: string | undefined = undefined) => {
    sounds.playClick();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onUpdateEntry({ content: editorRef.current.innerHTML });
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      onUpdateEntry({ content: editorRef.current.innerHTML });
    }
  };

  // Paper texture options
  const paperTextures: { id: PaperTextureType; label: string; class: string }[] = [
    { id: 'lined', label: 'Lined Notebook', class: 'paper-lined' },
    { id: 'grid', label: 'Math Grid', class: 'paper-grid' },
    { id: 'dot', label: 'Dot Grid', class: 'paper-dot' },
    { id: 'kraft', label: 'Kraft Paper', class: 'paper-kraft' },
    { id: 'night', label: 'Starry Night', class: 'paper-night' },
    { id: 'blush', label: 'Blush Lined', class: 'paper-blush' },
  ];

  const currentPaperClass =
    paperTextures.find((p) => p.id === entry.paperTexture)?.class || 'paper-lined';

  const isNightTheme = entry.paperTexture === 'night';

  const getPatternDefaultColor = (pattern: TapePattern) => {
    switch (pattern) {
      case 'grid':
        return '#be185d';
      case 'dots':
        return '#854d0e';
      case 'stripes':
        return '#065f46';
      case 'kraft':
        return '#451a03';
      case 'caution':
        return '#18181b';
      case 'lavender':
        return '#581c87';
      case 'frosted':
        return '#334155';
      case 'cyan':
        return '#0e7490';
      default:
        return '#1c1917';
    }
  };

  // Sticker Handlers
  const handleUpdateSticker = (stickerId: string, updated: Partial<PlacedSticker>) => {
    const updatedStickers = entry.stickers.map((s) => (s.id === stickerId ? { ...s, ...updated } : s));
    onUpdateEntry({ stickers: updatedStickers });
  };

  const handleDeleteSticker = (stickerId: string) => {
    sounds.playClick();
    const updatedStickers = entry.stickers.filter((s) => s.id !== stickerId);
    onUpdateEntry({ stickers: updatedStickers });
    setSelectedStickerId(null);
  };

  const handleDuplicateSticker = (sticker: PlacedSticker) => {
    sounds.playStickerPop();
    const formattedTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const newSticker: PlacedSticker = {
      ...sticker,
      id: `stk-${Date.now()}`,
      x: Math.min(90, sticker.x + 5),
      y: Math.min(90, sticker.y + 5),
      zIndex: (Math.max(...entry.stickers.map((s) => s.zIndex), ...entry.tapes.map((t) => t.zIndex), 10) || 10) + 1,
      timestamp: autoTimestampPos !== 'none' ? formattedTime : sticker.timestamp,
      timestampPosition: autoTimestampPos !== 'none' ? autoTimestampPos : sticker.timestampPosition,
    };
    onUpdateEntry({ stickers: [...entry.stickers, newSticker] });
    setSelectedStickerId(newSticker.id);
  };

  const handleBringStickerForward = (stickerId: string) => {
    const highestZ = Math.max(...entry.stickers.map((s) => s.zIndex), ...entry.tapes.map((t) => t.zIndex), 10);
    handleUpdateSticker(stickerId, { zIndex: highestZ + 1 });
  };

  const handleSendStickerBackward = (stickerId: string) => {
    const lowestZ = Math.min(...entry.stickers.map((s) => s.zIndex), ...entry.tapes.map((t) => t.zIndex), 10);
    handleUpdateSticker(stickerId, { zIndex: Math.max(1, lowestZ - 1) });
  };

  // Tape Handlers
  const handleUpdateTape = (tapeId: string, updated: Partial<PlacedTape>) => {
    const updatedTapes = entry.tapes.map((t) => (t.id === tapeId ? { ...t, ...updated } : t));
    onUpdateEntry({ tapes: updatedTapes });
  };

  const handleDeleteTape = (tapeId: string) => {
    sounds.playClick();
    const updatedTapes = entry.tapes.filter((t) => t.id !== tapeId);
    onUpdateEntry({ tapes: updatedTapes });
    setSelectedTapeId(null);
  };

  const handleDuplicateTape = (tape: PlacedTape) => {
    sounds.playTapeTear();
    const formattedTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const newTape: PlacedTape = {
      ...tape,
      id: `tape-${Date.now()}`,
      x: Math.min(90, tape.x + 4),
      y: Math.min(90, tape.y + 4),
      zIndex: (Math.max(...entry.stickers.map((s) => s.zIndex), ...entry.tapes.map((t) => t.zIndex), 10) || 10) + 1,
      timestamp: autoTimestampPos !== 'none' ? formattedTime : tape.timestamp,
      timestampPosition: autoTimestampPos !== 'none' ? autoTimestampPos : tape.timestampPosition,
    };
    onUpdateEntry({ tapes: [...entry.tapes, newTape] });
    setSelectedTapeId(newTape.id);
  };

  const handleBringTapeForward = (tapeId: string) => {
    const highestZ = Math.max(...entry.stickers.map((s) => s.zIndex), ...entry.tapes.map((t) => t.zIndex), 10);
    handleUpdateTape(tapeId, { zIndex: highestZ + 1 });
  };

  const handleSendTapeBackward = (tapeId: string) => {
    const lowestZ = Math.min(...entry.stickers.map((s) => s.zIndex), ...entry.tapes.map((t) => t.zIndex), 10);
    handleUpdateTape(tapeId, { zIndex: Math.max(1, lowestZ - 1) });
  };

  // STYLUS TAPE DISPENSER POINTER INTERACTIONS
  const handleSurfacePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDispenserActive) return;
    if ((e.target as HTMLElement).closest('.sticker-controls') || (e.target as HTMLElement).closest('.dispenser-hud')) {
      return;
    }

    e.preventDefault();
    if (surfaceRef.current) {
      const rect = surfaceRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pctX = (x / rect.width) * 100;
      const pctY = (y / rect.height) * 100;

      setDispensing({
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        startPctX: Math.max(0, Math.min(100, pctX)),
        startPctY: Math.max(0, Math.min(100, pctY)),
        currentPctX: Math.max(0, Math.min(100, pctX)),
        currentPctY: Math.max(0, Math.min(100, pctY)),
      });

      sounds.playTapeTear();
    }
  };

  const handleSurfacePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dispensing || !surfaceRef.current) return;
    e.preventDefault();
    const rect = surfaceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pctX = (x / rect.width) * 100;
    const pctY = (y / rect.height) * 100;

    setDispensing((prev) =>
      prev
        ? {
            ...prev,
            currentX: x,
            currentY: y,
            currentPctX: Math.max(0, Math.min(100, pctX)),
            currentPctY: Math.max(0, Math.min(100, pctY)),
          }
        : null
    );
  };

  const handleSurfacePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dispensing || !surfaceRef.current) return;
    e.preventDefault();

    const dx = dispensing.currentX - dispensing.startX;
    const dy = dispensing.currentY - dispensing.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const highestZ = Math.max(
      ...entry.stickers.map((s) => s.zIndex),
      ...entry.tapes.map((t) => t.zIndex),
      10
    );

    let width = dist;
    let rotation = 0;
    let centerX = dispensing.startPctX;
    let centerY = dispensing.startPctY;

    if (dist >= 25) {
      width = Math.max(45, Math.round(dist));
      rotation = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      centerX = (dispensing.startPctX + dispensing.currentPctX) / 2;
      centerY = (dispensing.startPctY + dispensing.currentPctY) / 2;
    } else {
      // Quick tap with stylus: dispense a standard 160px horizontal strip at that spot
      width = 160;
      rotation = Math.floor(Math.random() * 8 - 4);
      centerX = dispensing.startPctX;
      centerY = dispensing.startPctY;
    }

    const formattedTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const newTape: PlacedTape = {
      id: `tape-${Date.now()}`,
      x: Math.max(2, Math.min(98, centerX)),
      y: Math.max(2, Math.min(98, centerY)),
      width,
      height: dispenserThickness,
      rotation,
      pattern: dispenserPattern,
      text: dispenserText,
      textColor: getPatternDefaultColor(dispenserPattern),
      fontFamily: 'marker',
      zIndex: highestZ + 1,
      opacity: 0.92,
      timestamp: autoTimestampPos !== 'none' ? formattedTime : undefined,
      timestampPosition: autoTimestampPos !== 'none' ? autoTimestampPos : undefined,
    };

    onUpdateEntry({ tapes: [...entry.tapes, newTape] });
    sounds.playTapeTear();
    setSelectedTapeId(newTape.id);
    setDispensing(null);
  };

  const getFontClass = (font: string) => {
    switch (font) {
      case 'handwriting':
        return 'font-handwriting';
      case 'marker':
        return 'font-marker';
      case 'typewriter':
        return 'font-typewriter';
      case 'doodle':
        return 'font-doodle';
      case 'sans':
      default:
        return 'font-sans';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-stone-900 overflow-hidden select-none relative">
      {/* Top Bar: Entry Navigation, Date, Rich Text & Stylus Dispenser Tool */}
      <div className="bg-stone-900 border-b border-stone-800 px-3 py-1.5 flex flex-wrap items-center justify-between gap-1.5 text-xs z-30">
        {/* Left: Previous / Next Entry & Page Counter */}
        <div className="flex items-center space-x-1">
          <button
            disabled={!canPrev || !!turnAnimation}
            onClick={handleFluidTurnPrev}
            title="Previous Entry"
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-300 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[11px] font-mono text-stone-400 px-1">
            {entryIndex + 1} / {totalEntries}
          </span>
          <button
            disabled={!canNext || !!turnAnimation}
            onClick={handleFluidTurnNext}
            title="Next Entry"
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-300 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => {
              sounds.playPageFlip();
              onNewEntry();
            }}
            title="New Journal Entry"
            className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-xl bg-pink-600 hover:bg-pink-500 text-white ml-1 active:scale-95 transition"
          >
            <Plus size={13} />
            New Page
          </button>
        </div>

        {/* Center: Stylus Tape Dispenser Toggle & Rich Text Formatting Toolbar */}
        <div className="flex items-center space-x-1.5">
          {/* Stylus Tape Dispenser Tool Button */}
          <button
            onClick={() => {
              sounds.playTapeTear();
              const next = !isDispenserActive;
              setIsDispenserActive(next);
              onToggleDispenser?.(next);
            }}
            title="Stylus Tape Dispenser: Touch & drag anywhere to apply washi tape"
            className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-[11px] font-bold transition shadow-sm active:scale-95 ${
              isDispenserActive
                ? 'bg-emerald-600 text-white shadow-emerald-900/40 ring-2 ring-emerald-400'
                : 'bg-stone-950 hover:bg-stone-800 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <Bandage size={14} className={isDispenserActive ? 'animate-pulse' : ''} />
            <span>{isDispenserActive ? 'Dispenser ON' : 'Tape Dispenser'}</span>
          </button>

          {/* Rich Text Formatting Toolbar */}
          <div className="flex items-center space-x-1 bg-stone-950 px-2 py-0.5 rounded-xl border border-stone-800">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormat('bold');
              }}
              title="Bold (Ctrl+B)"
              className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-white font-bold"
            >
              <Bold size={13} />
            </button>

            <button
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormat('italic');
              }}
              title="Italic (Ctrl+I)"
              className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-white italic"
            >
              <Italic size={13} />
            </button>

            <button
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormat('underline');
              }}
              title="Underline (Ctrl+U)"
              className="p-1.5 hover:bg-stone-800 rounded text-stone-300 hover:text-white underline"
            >
              <Underline size={13} />
            </button>

            {/* Highlighter pen */}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormat('hiliteColor', '#fef08a');
              }}
              title="Yellow Highlighter"
              className="p-1.5 hover:bg-stone-800 rounded text-amber-300 hover:text-amber-200"
            >
              <Highlighter size={13} />
            </button>
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormat('hiliteColor', '#fbcfe8');
              }}
              title="Pink Highlighter"
              className="p-1.5 hover:bg-stone-800 rounded text-pink-300 hover:text-pink-200"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-pink-300"></div>
            </button>

            <div className="h-3 w-px bg-stone-800 mx-0.5"></div>

            {/* Font Selector */}
            <select
              value={entry.fontFamily}
              onChange={(e) => {
                sounds.playClick();
                onUpdateEntry({ fontFamily: e.target.value as any });
              }}
              className="bg-transparent text-[11px] text-stone-200 focus:outline-none cursor-pointer"
            >
              <option value="handwriting">Handwriting</option>
              <option value="marker">Marker Pen</option>
              <option value="typewriter">Typewriter</option>
              <option value="doodle">Doodle</option>
              <option value="sans">Modern Sans</option>
            </select>
          </div>
        </div>

        {/* Right: Auto Timestamp Selector, Paper Texture Switcher & Delete Entry */}
        <div className="flex items-center space-x-1.5">
          {/* Auto Creation Timestamp Selector */}
          <div className="flex items-center gap-1 bg-stone-950 px-2 py-0.5 rounded-xl border border-stone-800 text-[11px]">
            <div className="flex items-center gap-1 text-stone-400 mr-0.5">
              <Clock size={12} className={autoTimestampPos !== 'none' ? 'text-pink-400' : 'text-stone-500'} />
              <span className="font-semibold text-[10px] hidden md:inline">Time:</span>
            </div>
            {(
              [
                { id: 'none', label: 'Off' },
                { id: 'left', label: 'Left' },
                { id: 'center', label: 'Mid' },
                { id: 'right', label: 'Right' },
              ] as { id: AutoTimestampSetting; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onChangeAutoTimestampPos?.(opt.id);
                }}
                title={`Automatically stamp creation time at top of page additions: ${opt.label}`}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition ${
                  autoTimestampPos === opt.id
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowPaperMenu(!showPaperMenu)}
              title="Change Notebook Paper"
              className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-300 flex items-center gap-1 text-[11px]"
            >
              <Palette size={13} className="text-amber-400" />
              <span className="hidden sm:inline">Paper</span>
            </button>

            {showPaperMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-44 bg-stone-900 border border-stone-800 rounded-2xl p-2 shadow-2xl z-50 text-xs space-y-1"
              >
                <span className="text-[10px] uppercase font-bold text-stone-400 block px-2 py-1">
                  Notebook Texture
                </span>
                {paperTextures.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      sounds.playPageFlip();
                      onUpdateEntry({ paperTexture: p.id });
                      setShowPaperMenu(false);
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-xl text-left text-[11px] transition flex items-center justify-between ${
                      entry.paperTexture === p.id
                        ? 'bg-pink-600 text-white font-bold'
                        : 'text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className={`w-3.5 h-3.5 rounded border border-stone-600 ${p.class}`}></span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              if (confirm('Delete this journal spread page?')) {
                onDeleteEntry();
              }
            }}
            title="Delete this page"
            className="p-1.5 rounded-xl hover:bg-rose-950 text-stone-500 hover:text-rose-400 transition"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Floating Stylus Tape Dispenser HUD Control Bar */}
      {isDispenserActive && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="dispenser-hud absolute top-12 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-lg bg-stone-900/95 backdrop-blur-md border border-emerald-500/60 rounded-2xl p-2.5 shadow-2xl text-xs space-y-2 animate-in fade-in slide-in-from-top-2"
        >
          {/* Header & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <Bandage size={12} className="animate-pulse" />
              </div>
              <span className="text-xs">Stylus Tape Dispenser</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                Active
              </span>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                setIsDispenserActive(false);
                onToggleDispenser?.(false);
              }}
              title="Close Dispenser"
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          {/* Pattern Ribbon Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['grid', 'dots', 'stripes', 'kraft', 'caution', 'lavender', 'frosted', 'cyan'] as TapePattern[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  sounds.playTapeTear();
                  setDispenserPattern(p);
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-[10px] whitespace-nowrap transition ${
                  dispenserPattern === p
                    ? 'border-emerald-400 bg-emerald-950/70 text-white font-bold ring-1 ring-emerald-400'
                    : 'border-stone-800 bg-stone-950 text-stone-300 hover:bg-stone-800'
                }`}
              >
                <span className={`w-4 h-4 rounded washi-torn-edge tape-pattern-${p}`}></span>
                <span className="capitalize">{p}</span>
              </button>
            ))}
          </div>

          {/* Dispenser Width & Optional Text */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-[11px] text-stone-300">
              <span className="text-stone-400 text-[10px]">Width:</span>
              {[
                { label: 'Slim', val: 24 },
                { label: 'Standard', val: 36 },
                { label: 'Wide', val: 50 },
              ].map((th) => (
                <button
                  key={th.val}
                  onClick={() => {
                    sounds.playClick();
                    setDispenserThickness(th.val);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                    dispenserThickness === th.val
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={dispenserText}
              onChange={(e) => setDispenserText(e.target.value)}
              placeholder="Text on tape (optional)..."
              className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-2.5 py-1 text-[11px] text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Auto Timestamp Position in HUD */}
          <div className="flex items-center justify-between text-[10px] text-stone-300 pt-1 border-t border-emerald-900/40">
            <span className="flex items-center gap-1 text-stone-400">
              <Clock size={11} className="text-emerald-400" />
              Auto Creation Time:
            </span>
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'none', label: 'Off' },
                  { id: 'left', label: 'Left' },
                  { id: 'center', label: 'Middle' },
                  { id: 'right', label: 'Right' },
                ] as { id: AutoTimestampSetting; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    sounds.playClick();
                    onChangeAutoTimestampPos?.(opt.id);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${
                    autoTimestampPos === opt.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-emerald-300/90 bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-900/40 text-center font-medium">
            Touch and drag your stylus anywhere across the page to unroll & apply tape!
          </div>
        </div>
      )}

      {/* Main Canvas Scroll Area with 3D Page Turn Perspective */}
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        className={`flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 flex justify-center items-start bg-stone-950/80 journal-perspective-stage ${
          isDispenserActive ? 'cursor-tape-dispenser' : ''
        }`}
      >
        {/* Physical Paper Page with Texture, Box Shadow, and Fluid 3D Turn */}
        <div
          ref={surfaceRef}
          onPointerDown={handleSurfacePointerDown}
          onPointerMove={handleSurfacePointerMove}
          onPointerUp={handleSurfacePointerUp}
          onPointerCancel={handleSurfacePointerUp}
          className={`scrapbook-surface relative w-full max-w-2xl min-h-[720px] rounded-3xl p-5 sm:p-8 shadow-2xl transition-colors duration-200 overflow-hidden ${currentPaperClass} ${
            isNightTheme ? 'text-stone-100 ring-1 ring-white/10' : 'text-stone-900 ring-1 ring-stone-900/10'
          } ${isDispenserActive ? 'dispenser-active-canvas' : ''} ${
            turnAnimation === 'forward'
              ? 'animate-page-turn-forward'
              : turnAnimation === 'backward'
              ? 'animate-page-turn-backward'
              : ''
          }`}
          style={{ minHeight: '740px' }}
        >
          {/* Authentic Book Spine Binding Crease along Left Margin */}
          <div className="book-spine-crease absolute top-0 bottom-0 left-0 w-8 pointer-events-none z-10" />

          {/* Nostalgic Blog Widgets Header (Mood, Listening To, Reading, Weather) */}
          <BlogWidgetsBar
            metadata={entry.blogMetadata}
            onEdit={onOpenBlogMeta}
            themeColor={themeColor}
          />

          {/* Daily Creative Journal Prompt Card */}
          {showPromptBanner && (
            <div className="relative z-20 mb-3.5 bg-amber-50/95 dark:bg-stone-950/80 border border-amber-300/70 dark:border-amber-500/30 rounded-2xl p-3 shadow-sm backdrop-blur-xs text-xs animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Lightbulb size={12} />
                  </span>
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    Daily Creative Spark
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-200/60 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 capitalize font-medium">
                    {dailyPrompt.category}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleShufflePrompt}
                    title="Shuffle prompt"
                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-amber-700 dark:text-amber-400 flex items-center gap-1 text-[10px] font-semibold"
                  >
                    <Shuffle size={11} />
                    <span className="hidden sm:inline">Shuffle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPromptBanner(false)}
                    title="Dismiss prompt"
                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              <p className="font-semibold text-xs text-stone-800 dark:text-stone-100 leading-snug mb-1">
                "{dailyPrompt.question}"
              </p>

              {dailyPrompt.sparkHint && (
                <p className="text-[10px] text-stone-500 dark:text-stone-400 italic mb-2">
                  ✨ {dailyPrompt.sparkHint}
                </p>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleApplyPromptToTitle}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold text-[10px] transition active:scale-95"
                >
                  Use as Title
                </button>
                <button
                  type="button"
                  onClick={handleInsertPromptToContent}
                  className="px-2.5 py-1 rounded-xl bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-[10px] transition active:scale-95"
                >
                  Insert into Entry
                </button>
              </div>
            </div>
          )}

          {/* Entry Date & Title Editor */}
          <div className="relative z-20 mb-4 border-b border-black/10 dark:border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1 font-mono">
              <Calendar size={12} />
              <input
                type="text"
                value={entry.date}
                onChange={(e) => onUpdateEntry({ date: e.target.value })}
                className="bg-transparent font-medium focus:outline-none w-full"
                placeholder="Date & Time"
              />
            </div>
            <input
              type="text"
              value={entry.title}
              onChange={(e) => onUpdateEntry({ title: e.target.value })}
              placeholder="Entry Title..."
              className={`w-full bg-transparent font-bold text-2xl sm:text-3xl focus:outline-none tracking-tight ${getFontClass(
                entry.fontFamily
              )}`}
              style={{ color: isNightTheme ? '#f8fafc' : entry.textColor || '#1c1917' }}
            />
          </div>

          {/* Rich Text Journal Body (contentEditable) */}
          <div className="relative z-20">
            <div
              ref={editorRef}
              contentEditable={!isDispenserActive}
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
              style={{
                fontSize: `${entry.fontSize || 20}px`,
                lineHeight: '1.7',
                color: isNightTheme ? '#e2e8f0' : entry.textColor || '#292524',
              }}
              className={`min-h-[380px] focus:outline-none whitespace-pre-wrap ${getFontClass(
                entry.fontFamily
              )}`}
              data-placeholder="Start pouring your heart onto the page..."
            />
          </div>

          {/* Interactive Freeform Scrapbook Items Layer: Stickers & Washi Tapes */}
          {/* Stickers */}
          {entry.stickers.map((sticker) => (
            <StickerItem
              key={sticker.id}
              sticker={sticker}
              isSelected={selectedStickerId === sticker.id}
              onSelect={(e) => {
                if (isDispenserActive) return;
                setSelectedTapeId(null);
                setSelectedStickerId(sticker.id);
              }}
              onUpdate={(updated) => handleUpdateSticker(sticker.id, updated)}
              onDelete={() => handleDeleteSticker(sticker.id)}
              onDuplicate={() => handleDuplicateSticker(sticker)}
              onBringForward={() => handleBringStickerForward(sticker.id)}
              onSendBackward={() => handleSendStickerBackward(sticker.id)}
            />
          ))}

          {/* Washi Tapes (can be positioned over stickers or under stickers) */}
          {entry.tapes.map((tape) => (
            <WashiTapeItem
              key={tape.id}
              tape={tape}
              isSelected={selectedTapeId === tape.id}
              onSelect={(e) => {
                if (isDispenserActive) return;
                setSelectedStickerId(null);
                setSelectedTapeId(tape.id);
              }}
              onUpdate={(updated) => handleUpdateTape(tape.id, updated)}
              onDelete={() => handleDeleteTape(tape.id)}
              onDuplicate={() => handleDuplicateTape(tape)}
              onBringForward={() => handleBringTapeForward(tape.id)}
              onSendBackward={() => handleSendTapeBackward(tape.id)}
            />
          ))}

          {/* REAL-TIME STYLUS TAPE DISPENSER UNROLLING PREVIEW */}
          {dispensing && (() => {
            const dx = dispensing.currentX - dispensing.startX;
            const dy = dispensing.currentY - dispensing.startY;
            const dist = Math.max(30, Math.sqrt(dx * dx + dy * dy));
            const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
            const cx = (dispensing.startPctX + dispensing.currentPctX) / 2;
            const cy = (dispensing.startPctY + dispensing.currentPctY) / 2;

            return (
              <div
                style={{
                  left: `${cx}%`,
                  top: `${cy}%`,
                  width: `${dist}px`,
                  height: `${dispenserThickness}px`,
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  zIndex: 999,
                  pointerEvents: 'none',
                }}
                className={`absolute washi-torn-edge shadow-2xl flex items-center justify-center px-3 ring-2 ring-emerald-400 tape-pattern-${dispenserPattern}`}
              >
                <span
                  style={{ color: getPatternDefaultColor(dispenserPattern) }}
                  className="text-xs font-bold font-marker truncate select-none drop-shadow"
                >
                  {dispenserText || '⋯ dispensing washi tape ⋯'}
                </span>
                {/* Tape dispenser stylus head indicator */}
                <div className="absolute -right-3 -top-3 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                  <Bandage size={13} />
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
