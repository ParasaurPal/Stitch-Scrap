import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  BookOpen,
  Check,
  Trash2,
  Archive,
  ArchiveRestore,
  Search,
  Calendar,
  Smile,
  Music,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Journal, JournalEntry, PaperTextureType } from '../types/journal';
import { sounds } from '../utils/sound';

interface JournalSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  journals: Journal[];
  currentJournalId: string;
  onSelectJournal: (id: string) => void;
  onCreateJournal: (journal: Omit<Journal, 'createdAt'>) => void;
  onDeleteJournal: (id: string) => void;
  onToggleArchiveJournal: (id: string) => void;
  entries?: JournalEntry[];
  onSelectEntry?: (journalId: string, entryId: string) => void;
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
  onToggleArchiveJournal,
  entries = [],
  onSelectEntry,
  themeColor,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#ec4899');
  const [selectedIcon, setSelectedIcon] = useState('heart');
  const [selectedPaper, setSelectedPaper] = useState<PaperTextureType>('lined');

  // Filter journals by archive status
  const activeJournals = useMemo(() => journals.filter((j) => !j.isArchived), [journals]);
  const archivedJournals = useMemo(() => journals.filter((j) => j.isArchived), [journals]);

  // Global search across all entries
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return entries
      .filter((entry) => {
        const textContent = entry.content.replace(/<[^>]*>/g, ' ').toLowerCase();
        const title = entry.title.toLowerCase();
        const date = entry.date.toLowerCase();
        const mood = entry.blogMetadata?.mood?.label?.toLowerCase() || '';
        const moodNote = entry.blogMetadata?.mood?.note?.toLowerCase() || '';
        const song = entry.blogMetadata?.currentlyListening?.song?.toLowerCase() || '';
        const artist = entry.blogMetadata?.currentlyListening?.artist?.toLowerCase() || '';
        const book = entry.blogMetadata?.currentlyReading?.title?.toLowerCase() || '';
        const location = entry.blogMetadata?.location?.toLowerCase() || '';
        const obsession = entry.blogMetadata?.currentObsession?.toLowerCase() || '';

        return (
          title.includes(q) ||
          textContent.includes(q) ||
          date.includes(q) ||
          mood.includes(q) ||
          moodNote.includes(q) ||
          song.includes(q) ||
          artist.includes(q) ||
          book.includes(q) ||
          location.includes(q) ||
          obsession.includes(q)
        );
      })
      .map((entry) => {
        const parentJournal = journals.find((j) => j.id === entry.journalId);
        const plainText = entry.content.replace(/<[^>]*>/g, ' ').trim();
        return {
          entry,
          parentJournal,
          snippet: plainText.slice(0, 110),
        };
      });
  }, [searchQuery, entries, journals]);

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
      isArchived: false,
    });

    setName('');
    setDescription('');
    setIsCreating(false);
    onSelectJournal(newId);
    onClose();
  };

  const handleSelectSearchResult = (journalId: string, entryId: string) => {
    sounds.playPageFlip();
    if (onSelectEntry) {
      onSelectEntry(journalId, entryId);
    } else {
      onSelectJournal(journalId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: themeColor || '#ec4899' }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">Journals Library</h2>
              <p className="text-[11px] text-stone-400">Manage multiple journals, search & archive</p>
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

        {/* Global Search Bar Across All Journals */}
        <div className="p-3 pb-2 border-b border-stone-800/80 bg-stone-950/60">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories across all journals..."
              className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-8 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-pink-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {/* SEARCH MODE RESULTS */}
          {searchQuery.trim().length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
                <span>
                  Found <strong className="text-pink-400 font-mono">{searchResults.length}</strong> matching entries:
                </span>
                <span className="text-[10px]">Tap to open</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-8 text-center bg-stone-950/50 rounded-2xl border border-stone-800/60 space-y-1.5">
                  <Search size={24} className="mx-auto text-stone-600 mb-1" />
                  <p className="font-semibold text-stone-300">No memories found</p>
                  <p className="text-[11px] text-stone-500">
                    Try searching for a song title, mood, date, or a different word.
                  </p>
                </div>
              ) : (
                searchResults.map(({ entry, parentJournal, snippet }) => (
                  <div
                    key={entry.id}
                    onClick={() => handleSelectSearchResult(entry.journalId, entry.id)}
                    className="p-3 rounded-2xl border border-stone-800 bg-stone-950 hover:bg-stone-850 hover:border-pink-500/50 transition cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-white shrink-0"
                          style={{ backgroundColor: parentJournal?.themeColor || '#ec4899' }}
                        >
                          {parentJournal?.coverPattern || '📖'}
                        </span>
                        <span className="font-bold text-xs text-stone-200 group-hover:text-pink-300 transition">
                          {entry.title || 'Untitled Page'}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono flex items-center gap-1">
                        <Calendar size={10} />
                        {entry.date}
                      </span>
                    </div>

                    {snippet && (
                      <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed bg-stone-900/60 p-1.5 rounded-lg border border-stone-800/40">
                        {snippet}...
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-0.5 text-[10px] text-stone-500">
                      <span className="text-stone-400 font-medium">{parentJournal?.name}</span>
                      {entry.blogMetadata?.mood && (
                        <span className="flex items-center gap-0.5 text-amber-300 bg-amber-950/30 px-1.5 py-0.2 rounded">
                          <Smile size={10} />
                          {entry.blogMetadata.mood.label}
                        </span>
                      )}
                      {entry.blogMetadata?.currentlyListening?.song && (
                        <span className="flex items-center gap-0.5 text-pink-300 bg-pink-950/30 px-1.5 py-0.2 rounded truncate max-w-[140px]">
                          <Music size={10} />
                          {entry.blogMetadata.currentlyListening.song}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : !isCreating ? (
            /* NORMAL BROWSING MODE: ACTIVE VS ARCHIVED TABS */
            <>
              {/* Segmented Tab Switcher: Active vs Archive */}
              <div className="flex items-center p-1 bg-stone-950 rounded-2xl border border-stone-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('active');
                  }}
                  className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'active'
                      ? 'bg-stone-800 text-stone-100 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <BookOpen size={13} />
                  <span>Active Journals</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-stone-700/60 text-[10px] font-mono">
                    {activeJournals.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('archived');
                  }}
                  className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'archived'
                      ? 'bg-stone-800 text-amber-300 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Archive size={13} />
                  <span>Archive</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-stone-700/60 text-[10px] font-mono">
                    {archivedJournals.length}
                  </span>
                </button>
              </div>

              {/* ACTIVE JOURNALS LIST */}
              {activeTab === 'active' && (
                <div className="space-y-2">
                  {activeJournals.map((journal) => {
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

                          {/* Move to Archive button */}
                          <button
                            type="button"
                            title="Move to hidden Archive section"
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playClick();
                              onToggleArchiveJournal(journal.id);
                            }}
                            className="p-1.5 rounded-lg opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-amber-950/60 text-stone-400 hover:text-amber-300 transition"
                          >
                            <Archive size={14} />
                          </button>

                          {/* Delete journal button */}
                          {journals.length > 1 && (
                            <button
                              type="button"
                              title="Delete journal"
                              onClick={(e) => {
                                e.stopPropagation();
                                sounds.playClick();
                                if (confirm(`Delete "${journal.name}" and all its entries?`)) {
                                  onDeleteJournal(journal.id);
                                }
                              }}
                              className="p-1.5 rounded-lg opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

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
                </div>
              )}

              {/* ARCHIVED JOURNALS LIST */}
              {activeTab === 'archived' && (
                <div className="space-y-2">
                  {archivedJournals.length === 0 ? (
                    <div className="p-8 text-center bg-stone-950/50 rounded-2xl border border-stone-800/60 space-y-1.5">
                      <Archive size={26} className="mx-auto text-amber-500/70 mb-1" />
                      <p className="font-semibold text-stone-300">Archive is empty</p>
                      <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                        Move older or completed journals here to declutter your active view while keeping all memories safe.
                      </p>
                    </div>
                  ) : (
                    archivedJournals.map((journal) => (
                      <div
                        key={journal.id}
                        className="p-3 rounded-2xl border border-amber-950/50 bg-stone-950/80 hover:bg-stone-900 transition flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3 opacity-80 group-hover:opacity-100">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white shadow-sm shrink-0 grayscale-[0.3]"
                            style={{ backgroundColor: journal.themeColor }}
                          >
                            {journal.coverPattern || '📖'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-stone-200">{journal.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Archived
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-500 line-clamp-1">
                              {journal.description || 'Archived notebook'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Unarchive / Restore button */}
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              onToggleArchiveJournal(journal.id);
                            }}
                            title="Restore back to Active Journals"
                            className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[10px] flex items-center gap-1 transition active:scale-95"
                          >
                            <ArchiveRestore size={12} />
                            <span>Restore</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            title="Delete permanently"
                            onClick={() => {
                              sounds.playClick();
                              if (confirm(`Permanently delete "${journal.name}"?`)) {
                                onDeleteJournal(journal.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-rose-950/60 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            /* CREATION FORM */
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
