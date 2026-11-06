import React, { useState } from 'react';
import { X, Plus, BookOpen, Check, Trash2, Heart, Moon, Compass, Palette, Coffee, Sparkles } from 'lucide-react';
import { Journal, PaperTextureType } from '../types/journal';
import { sounds } from '../utils/sound';

interface JournalSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  journals: Journal[];
  currentJournalId: string;
  onSelectJournal: (id: string) => void;
  onCreateJournal: (journal: Omit<Journal, 'createdAt'>) => void;
  onDeleteJournal: (id: string) => void;
  themeColor: string;
}

export const JournalSwitcherModal: React.FC<JournalSwitcherModalProps> = ({
  isOpen,
  onClose,
  journals,
  currentJournalId,
  onSelectJournal,
  onCreateJournal,
  onDeleteJournal,
  themeColor,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#ec4899');
  const [selectedIcon, setSelectedIcon] = useState('heart');
  const [selectedPaper, setSelectedPaper] = useState<PaperTextureType>('lined');

  if (!isOpen) return null;

  const colorPalette = [
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#8b5cf6', // Violet
    '#6366f1', // Indigo
    '#0ea5e9', // Sky
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#78350f', // Warm Kraft Brown
  ];

  const icons = [
    { id: 'heart', label: 'Heart', icon: '🌸' },
    { id: 'moon', label: 'Moon', icon: '🌙' },
    { id: 'coffee', label: 'Coffee', icon: '☕' },
    { id: 'compass', label: 'Compass', icon: '✈️' },
    { id: 'palette', label: 'Art', icon: '🎨' },
    { id: 'sparkles', label: 'Magic', icon: '✨' },
    { id: 'book', label: 'Book', icon: '📖' },
  ];

  const paperTypes: { id: PaperTextureType; label: string }[] = [
    { id: 'lined', label: 'Lined Notebook' },
    { id: 'grid', label: 'Math Grid' },
    { id: 'dot', label: 'Bullet Dot Grid' },
    { id: 'kraft', label: 'Vintage Kraft Paper' },
    { id: 'night', label: 'Starry Midnight' },
    { id: 'blush', label: 'Blush Pink Lined' },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sounds.playPageFlip();
    const newId = `journal-${Date.now()}`;
    const iconObj = icons.find((i) => i.id === selectedIcon) || icons[0];

    onCreateJournal({
      id: newId,
      name: name.trim(),
      description: description.trim(),
      themeColor: selectedColor,
      icon: selectedIcon,
      defaultPaper: selectedPaper,
      coverPattern: iconObj.icon,
    });

    setName('');
    setDescription('');
    setIsCreating(false);
    onSelectJournal(newId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: themeColor || '#ec4899' }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">My Journals Library</h2>
              <p className="text-[11px] text-stone-400">Multiple journals in one native Android app</p>
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

        {/* List of journals or Create Form */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {!isCreating ? (
            <>
              <div className="space-y-2">
                {journals.map((journal) => {
                  const isCurrent = journal.id === currentJournalId;
                  return (
                    <div
                      key={journal.id}
                      onClick={() => {
                        sounds.playPageFlip();
                        onSelectJournal(journal.id);
                        onClose();
                      }}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between group ${
                        isCurrent
                          ? 'border-pink-500 bg-pink-950/30 ring-1 ring-pink-500/50'
                          : 'border-stone-800 bg-stone-950 hover:bg-stone-850 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white shadow-sm shrink-0"
                          style={{ backgroundColor: journal.themeColor }}
                        >
                          {journal.coverPattern || '📖'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-stone-100">{journal.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/30 text-pink-300 font-semibold">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-stone-400 line-clamp-1">
                            {journal.description || 'Personal digital notebook'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isCurrent && <Check size={16} className="text-pink-400 mr-1" />}
                        {journals.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playClick();
                              if (confirm(`Delete "${journal.name}" and all its entries?`)) {
                                onDeleteJournal(journal.id);
                              }
                            }}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-950/60 text-stone-500 hover:text-rose-400 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Journal Button */}
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsCreating(true);
                }}
                className="w-full py-2.5 rounded-2xl border border-dashed border-stone-700 hover:border-pink-500 text-stone-300 hover:text-white flex items-center justify-center gap-2 font-bold transition hover:bg-stone-950 mt-2"
              >
                <Plus size={16} />
                Create New Journal
              </button>
            </>
          ) : (
            /* Creation Form */
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Journal Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Travel Atlas, Poetry Sparks, Daily Log..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1">
                  Description / Subtitle
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short note about this journal's purpose"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Theme Color */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1.5">
                  Theme Color
                </label>
                <div className="flex gap-2">
                  {colorPalette.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-full transition transform ${
                        selectedColor === c ? 'scale-110 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon / Cover Badge */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1.5">
                  Cover Icon
                </label>
                <div className="flex gap-2">
                  {icons.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIcon(item.id)}
                      className={`w-9 h-9 rounded-xl text-base flex items-center justify-center border transition ${
                        selectedIcon === item.id
                          ? 'border-pink-500 bg-pink-950/50'
                          : 'border-stone-800 bg-stone-950 hover:bg-stone-800'
                      }`}
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Paper Texture */}
              <div>
                <label className="text-[11px] font-semibold text-stone-300 block mb-1.5">
                  Default Paper Texture
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {paperTypes.map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setSelectedPaper(pt.id)}
                      className={`py-1.5 px-2 rounded-xl text-left truncate transition ${
                        selectedPaper === pt.id
                          ? 'bg-pink-600 text-white font-bold'
                          : 'bg-stone-950 text-stone-400 hover:bg-stone-800 border border-stone-800'
                      }`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold shadow-lg"
                >
                  Create Journal
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
