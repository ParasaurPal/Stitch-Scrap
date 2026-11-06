import React, { useRef, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  Type,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Palette,
} from 'lucide-react';
import { JournalEntry, PlacedSticker, PlacedTape, PaperTextureType } from '../types/journal';
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
}) => {
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [selectedTapeId, setSelectedTapeId] = useState<string | null>(null);
  const [showPaperMenu, setShowPaperMenu] = useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

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
    const newSticker: PlacedSticker = {
      ...sticker,
      id: `stk-${Date.now()}`,
      x: Math.min(90, sticker.x + 5),
      y: Math.min(90, sticker.y + 5),
      zIndex: (Math.max(...entry.stickers.map((s) => s.zIndex), ...entry.tapes.map((t) => t.zIndex), 10) || 10) + 1,
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
    const newTape: PlacedTape = {
      ...tape,
      id: `tape-${Date.now()}`,
      x: Math.min(90, tape.x + 4),
      y: Math.min(90, tape.y + 4),
      zIndex: (Math.max(...entry.stickers.map((s) => s.zIndex), ...entry.tapes.map((t) => t.zIndex), 10) || 10) + 1,
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
    <div className="w-full h-full flex flex-col bg-stone-900 overflow-hidden select-none">
      {/* Top Bar: Entry Navigation, Date & Rich Text Tools */}
      <div className="bg-stone-900 border-b border-stone-800 px-3 py-1.5 flex flex-wrap items-center justify-between gap-1.5 text-xs z-30">
        {/* Left: Previous / Next Entry & Page Counter */}
        <div className="flex items-center space-x-1">
          <button
            disabled={!canPrev}
            onClick={() => {
              sounds.playPageFlip();
              onPrevEntry();
            }}
            title="Previous Entry"
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-300 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[11px] font-mono text-stone-400 px-1">
            {entryIndex + 1} / {totalEntries}
          </span>
          <button
            disabled={!canNext}
            onClick={() => {
              sounds.playPageFlip();
              onNextEntry();
            }}
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

        {/* Center: Rich Text Formatting Toolbar */}
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

        {/* Right: Paper Texture Switcher & Delete Entry */}
        <div className="flex items-center space-x-1">
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

      {/* Main Canvas Scroll Area */}
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 flex justify-center items-start bg-stone-950/80"
      >
        {/* Physical Paper Page with Texture and Box Shadow */}
        <div
          className={`scrapbook-surface relative w-full max-w-2xl min-h-[720px] rounded-3xl p-5 sm:p-8 shadow-2xl transition-colors duration-200 overflow-hidden ${currentPaperClass} ${
            isNightTheme ? 'text-stone-100 ring-1 ring-white/10' : 'text-stone-900 ring-1 ring-stone-900/10'
          }`}
          style={{ minHeight: '740px' }}
        >
          {/* Nostalgic Blog Widgets Header (Mood, Listening To, Reading, Weather) */}
          <BlogWidgetsBar
            metadata={entry.blogMetadata}
            onEdit={onOpenBlogMeta}
            themeColor={themeColor}
          />

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
              contentEditable
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
        </div>
      </div>
    </div>
  );
};
