import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, syncAllToCloud, fetchAllFromCloud, subscribeToUserData } from './services/firebase';
import { Journal, JournalEntry, PlacedSticker, PlacedTape, BlogMetadata, AutoTimestampSetting } from './types/journal';
import { INITIAL_JOURNALS, INITIAL_ENTRIES, MOOD_PRESETS } from './data/defaultData';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { AndroidNavBar } from './components/AndroidNavBar';
import { ScrapbookCanvas } from './components/ScrapbookCanvas';
import { HomeDashboard } from './components/HomeDashboard';
import { StickerModal } from './components/StickerModal';
import { WashiTapeModal } from './components/WashiTapeModal';
import { BlogMetadataModal } from './components/BlogMetadataModal';
import { JournalSwitcherModal } from './components/JournalSwitcherModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ExportModal } from './components/ExportModal';
import { CloudCheck, Cloud, Sparkles } from 'lucide-react';
import { sounds } from './utils/sound';

export default function App() {
  // Persistence Keys
  const STORAGE_JOURNALS_KEY = 'stitch_scrap_journals_v2';
  const STORAGE_ENTRIES_KEY = 'stitch_scrap_entries_v2';
  const STORAGE_STICKERS_KEY = 'stitch_scrap_custom_stickers_v2';
  const STORAGE_LAST_SYNC_KEY = 'stitch_scrap_last_sync_v2';
  const STORAGE_AUTO_TIMESTAMP_KEY = 'stitch_scrap_auto_timestamp_pos_v2';

  // Auto Timestamp Setting: 'none' | 'left' | 'center' | 'right'
  const [autoTimestampPos, setAutoTimestampPos] = useState<AutoTimestampSetting>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_AUTO_TIMESTAMP_KEY);
      return (saved as AutoTimestampSetting) || 'none';
    } catch {
      return 'none';
    }
  });

  const handleSetAutoTimestampPos = (pos: AutoTimestampSetting) => {
    setAutoTimestampPos(pos);
    try {
      localStorage.setItem(STORAGE_AUTO_TIMESTAMP_KEY, pos);
    } catch (e) {
      console.error(e);
    }
  };

  // State: Journals & Entries
  const [journals, setJournals] = useState<Journal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_JOURNALS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_JOURNALS;
    } catch {
      return INITIAL_JOURNALS;
    }
  });

  const [currentJournalId, setCurrentJournalId] = useState<string>(journals[0]?.id || 'journal-scrapbook');

  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ENTRIES_KEY);
      return saved ? JSON.parse(saved) : INITIAL_ENTRIES;
    } catch {
      return INITIAL_ENTRIES;
    }
  });

  const [customStickers, setCustomStickers] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_STICKERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Current Entry navigation
  const journalEntries = entries.filter((e) => e.journalId === currentJournalId);
  const [currentEntryIndex, setCurrentEntryIndex] = useState<number>(0);

  // Authentication & Cloud Sync
  const [user, setUser] = useState<User | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_LAST_SYNC_KEY);
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Layout Viewport mode: Phone Frame vs Immersive
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [isHome, setIsHome] = useState<boolean>(true);

  // Modals & Tools
  const [isDispenserMode, setIsDispenserMode] = useState<boolean>(false);
  const [isJournalsOpen, setIsJournalsOpen] = useState(false);
  const [isStickersOpen, setIsStickersOpen] = useState(false);
  const [isTapeOpen, setIsTapeOpen] = useState(false);
  const [isBlogMetaOpen, setIsBlogMetaOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Active Journal & Current Entry references
  const currentJournal = journals.find((j) => j.id === currentJournalId) || journals[0];
  const currentEntry =
    journalEntries[currentEntryIndex] ||
    journalEntries[0] || {
      id: `entry-${Date.now()}`,
      journalId: currentJournalId,
      title: 'Blank Page',
      date: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
      content: '<p>Start writing your thoughts...</p>',
      fontFamily: 'handwriting',
      fontSize: 20,
      textColor: '#292524',
      paperTexture: currentJournal.defaultPaper || 'lined',
      blogMetadata: {
        mood: MOOD_PRESETS[1],
        moods: [MOOD_PRESETS[1]],
        currentlyListening: { song: '', artist: '', isPlaying: false },
        currentlyReading: { title: '', author: '', progress: '' },
      },
      stickers: [],
      tapes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  // Ensure current entry index stays in bounds
  useEffect(() => {
    if (currentEntryIndex >= journalEntries.length && journalEntries.length > 0) {
      setCurrentEntryIndex(journalEntries.length - 1);
    }
  }, [currentJournalId, journalEntries.length]);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_JOURNALS_KEY, JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ENTRIES_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_STICKERS_KEY, JSON.stringify(customStickers));
  }, [customStickers]);

  // Auth State Listener & Real-time Subscription
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Subscribe to real-time changes from cloud
        const unsubscribeCloud = subscribeToUserData(
          currentUser.uid,
          (cloudJournals) => {
            if (cloudJournals && cloudJournals.length > 0) {
              setJournals(cloudJournals);
            }
          },
          (cloudEntries) => {
            if (cloudEntries && cloudEntries.length > 0) {
              setEntries(cloudEntries);
            }
          },
          (cloudStickers) => {
            if (cloudStickers) {
              setCustomStickers(cloudStickers);
            }
          }
        );

        return () => {
          unsubscribeCloud();
        };
      }
    });

    return () => unsub();
  }, []);

  // Cloud Sync Actions
  const handleManualSync = async () => {
    if (!user) {
      setIsCloudSyncOpen(true);
      return;
    }
    setIsSyncing(true);
    try {
      await syncAllToCloud(user.uid, journals, entries, customStickers);
      const now = new Date().toISOString();
      setLastSynced(now);
      localStorage.setItem(STORAGE_LAST_SYNC_KEY, now);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const data = await fetchAllFromCloud(user.uid);
      if (data.journals.length > 0) setJournals(data.journals);
      if (data.entries.length > 0) setEntries(data.entries);
      if (data.customStickers.length > 0) setCustomStickers(data.customStickers);
      const now = new Date().toISOString();
      setLastSynced(now);
      localStorage.setItem(STORAGE_LAST_SYNC_KEY, now);
    } finally {
      setIsSyncing(false);
    }
  };

  // Entry Update Handler
  const handleUpdateEntry = (updated: Partial<JournalEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === currentEntry.id ? { ...e, ...updated, updatedAt: new Date().toISOString() } : e))
    );
  };

  // Create New Entry in current journal
  const handleNewEntry = () => {
    sounds.playPageFlip();
    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      journalId: currentJournalId,
      title: 'New Page',
      date: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
      content: '<p>Pour your heart onto the page...</p>',
      fontFamily: 'handwriting',
      fontSize: 20,
      textColor: '#292524',
      paperTexture: currentJournal.defaultPaper || 'lined',
      blogMetadata: {
        mood: MOOD_PRESETS[1],
        moods: [MOOD_PRESETS[1]],
        currentlyListening: { song: '', artist: '', isPlaying: false },
        currentlyReading: { title: '', author: '', progress: '' },
      },
      stickers: [],
      tapes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEntries((prev) => [newEntry, ...prev]);
    setCurrentEntryIndex(0);
  };

  // Delete current entry
  const handleDeleteCurrentEntry = () => {
    sounds.playClick();
    if (journalEntries.length <= 1) {
      // Just clear content instead of deleting last entry
      handleUpdateEntry({
        title: 'Fresh Page',
        content: '<p></p>',
        stickers: [],
        tapes: [],
      });
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== currentEntry.id));
    setCurrentEntryIndex((prev) => Math.max(0, prev - 1));
  };

  // Add Sticker to current entry
  const handleAddStickerToCurrent = (stickerData: {
    src: string;
    alt: string;
    width: number;
    height: number;
    borderStyle: 'diecut' | 'polaroid' | 'stamp' | 'gold' | 'neon' | 'none';
    texture: 'none' | 'glossy' | 'holographic' | 'matte' | 'crinkled' | 'glitter' | 'acetate';
    borderWidth?: number;
    borderColor?: string;
    borderPattern?: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';
  }) => {
    const highestZ = Math.max(
      ...currentEntry.stickers.map((s) => s.zIndex),
      ...currentEntry.tapes.map((t) => t.zIndex),
      10
    );
    const formattedTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const newSticker: PlacedSticker = {
      id: `stk-${Date.now()}`,
      src: stickerData.src,
      alt: stickerData.alt,
      x: 35 + Math.random() * 20,
      y: 35 + Math.random() * 20,
      width: stickerData.width,
      height: stickerData.height,
      rotation: Math.floor(Math.random() * 30 - 15),
      scale: 1,
      zIndex: highestZ + 1,
      filter: 'none',
      texture: stickerData.texture,
      borderStyle: stickerData.borderStyle,
      borderWidth: stickerData.borderWidth ?? 4,
      borderColor: stickerData.borderColor ?? '#ffffff',
      borderPattern: stickerData.borderPattern ?? 'solid',
      timestamp: autoTimestampPos !== 'none' ? formattedTime : undefined,
      timestampPosition: autoTimestampPos !== 'none' ? autoTimestampPos : undefined,
    };
    handleUpdateEntry({ stickers: [...currentEntry.stickers, newSticker] });
  };

  // Add Washi Tape to current entry
  const handleAddTapeToCurrent = (tapeData: {
    pattern: any;
    text: string;
    textColor: string;
    fontFamily: any;
    width: number;
    height: number;
  }) => {
    const highestZ = Math.max(
      ...currentEntry.stickers.map((s) => s.zIndex),
      ...currentEntry.tapes.map((t) => t.zIndex),
      10
    );
    const formattedTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const newTape: PlacedTape = {
      id: `tape-${Date.now()}`,
      x: 40 + Math.random() * 15,
      y: 20 + Math.random() * 15,
      width: tapeData.width,
      height: tapeData.height,
      rotation: Math.floor(Math.random() * 20 - 10),
      pattern: tapeData.pattern,
      text: tapeData.text,
      textColor: tapeData.textColor,
      fontFamily: tapeData.fontFamily,
      zIndex: highestZ + 1,
      opacity: 0.92,
      timestamp: autoTimestampPos !== 'none' ? formattedTime : undefined,
      timestampPosition: autoTimestampPos !== 'none' ? autoTimestampPos : undefined,
    };
    handleUpdateEntry({ tapes: [...currentEntry.tapes, newTape] });
  };

  // Save custom AI sticker to stash
  const handleSaveToStash = (sticker: any) => {
    setCustomStickers((prev) => [sticker, ...prev]);
  };

  return (
    <div className="w-screen h-screen bg-stone-950 flex flex-col items-center justify-center overflow-hidden p-0 sm:p-3">
      {/* Outer Phone Shell or Full-Width Tablet Canvas */}
      <div
        className={`w-full h-full flex flex-col bg-stone-900 overflow-hidden transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[430px] sm:max-h-[920px] sm:rounded-[42px] android-shadow border border-stone-700/60'
            : 'max-w-5xl rounded-none sm:rounded-3xl border border-stone-800'
        }`}
      >
        {/* Android Native Status Bar */}
        <AndroidStatusBar
          isPhoneFrame={isPhoneFrame}
          onToggleFrame={() => setIsPhoneFrame(!isPhoneFrame)}
          journalName={currentJournal.name}
          themeColor={currentJournal.themeColor}
        />

        {isHome ? (
          <HomeDashboard
            journals={journals}
            entries={entries}
            onOpenJournal={(id) => {
              setCurrentJournalId(id);
              setCurrentEntryIndex(0);
              setIsHome(false);
            }}
            onNewJournal={() => setIsJournalsOpen(true)}
            onDeleteJournal={(id) => {
              setJournals((prev) => prev.filter((journal) => journal.id !== id));
              if (currentJournalId === id) {
                const remaining = journals.filter((journal) => journal.id !== id);
                if (remaining.length > 0) setCurrentJournalId(remaining[0].id);
              }
            }}
            onOpenBackup={() => setIsCloudSyncOpen(true)}
          />
        ) : (
          <>
        {/* Top App Header with Journal Switcher Pill & Cloud Sync Badge */}
        <div className="px-4 py-2 bg-stone-900 border-b border-stone-800/80 flex items-center justify-between text-xs select-none z-30">
          {/* Journal Switcher Pill */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsJournalsOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-stone-800/90 hover:bg-stone-750 text-stone-100 font-bold transition border border-stone-700/60 shadow-sm active:scale-95"
          >
            <span className="text-base">{currentJournal.coverPattern || '📖'}</span>
            <span className="truncate max-w-[140px]">{currentJournal.name}</span>
            <span className="text-[10px] text-pink-400 font-normal">▼</span>
          </button>

          {/* Cloud Sync Status Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsCloudSyncOpen(true);
            }}
            title="Cloud Backup & Synchronization"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition border border-stone-700/50 text-[11px]"
          >
            {user ? (
              <>
                <CloudCheck size={14} className="text-emerald-400" />
                <span className="hidden sm:inline font-medium">Cloud Synced</span>
              </>
            ) : (
              <>
                <Cloud size={14} className="text-stone-400" />
                <span className="hidden sm:inline font-medium">Backup</span>
              </>
            )}
          </button>
        </div>

        {/* Scrapbook Canvas Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <ScrapbookCanvas
            entry={currentEntry}
            onUpdateEntry={handleUpdateEntry}
            onPrevEntry={() => setCurrentEntryIndex((prev) => Math.max(0, prev - 1))}
            onNextEntry={() => setCurrentEntryIndex((prev) => Math.min(journalEntries.length - 1, prev + 1))}
            onNewEntry={handleNewEntry}
            onDeleteEntry={handleDeleteCurrentEntry}
            canPrev={currentEntryIndex > 0}
            canNext={currentEntryIndex < journalEntries.length - 1}
            entryIndex={currentEntryIndex}
            totalEntries={journalEntries.length}
            onOpenBlogMeta={() => setIsBlogMetaOpen(true)}
            themeColor={currentJournal.themeColor}
            isDispenserMode={isDispenserMode}
            onToggleDispenser={(active) => setIsDispenserMode(active)}
            autoTimestampPos={autoTimestampPos}
            onChangeAutoTimestampPos={handleSetAutoTimestampPos}
          />
        </div>

        {/* Android Material 3 Navigation Bar & Floating Action Center */}
        <AndroidNavBar
          onOpenJournals={() => setIsJournalsOpen(true)}
          onOpenStickers={() => setIsStickersOpen(true)}
          onOpenTape={() => setIsTapeOpen(true)}
          onOpenBlogMeta={() => setIsBlogMetaOpen(true)}
          onExport={() => setIsExportOpen(true)}
          journalCount={journals.length}
          themeColor={currentJournal.themeColor}
          isDispenserActive={isDispenserMode}
          onToggleDispenser={() => {
            sounds.playTapeTear();
            setIsDispenserMode((prev) => !prev);
          }}
        />
          </>
        )}
      </div>

      {/* Modals */}
      <JournalSwitcherModal
        isOpen={isJournalsOpen}
        onClose={() => setIsJournalsOpen(false)}
        journals={journals}
        currentJournalId={currentJournalId}
        onSelectJournal={(id) => {
          setCurrentJournalId(id);
          setCurrentEntryIndex(0);
          setIsHome(false);
        }}
        onCreateJournal={(newJ) => {
          setJournals((prev) => [...prev, { ...newJ, createdAt: new Date().toISOString() }]);
        }}
        onDeleteJournal={(id) => {
          setJournals((prev) => prev.filter((j) => j.id !== id));
          if (currentJournalId === id) {
            const remaining = journals.filter((j) => j.id !== id);
            if (remaining.length > 0) setCurrentJournalId(remaining[0].id);
          }
        }}
        themeColor={currentJournal.themeColor}
      />

      <StickerModal
        isOpen={isStickersOpen}
        onClose={() => setIsStickersOpen(false)}
        onAddSticker={handleAddStickerToCurrent}
        customStickers={customStickers}
        onSaveToStash={handleSaveToStash}
        themeColor={currentJournal.themeColor}
      />

      <WashiTapeModal
        isOpen={isTapeOpen}
        onClose={() => setIsTapeOpen(false)}
        onAddTape={handleAddTapeToCurrent}
        themeColor={currentJournal.themeColor}
      />

      <BlogMetadataModal
        isOpen={isBlogMetaOpen}
        onClose={() => setIsBlogMetaOpen(false)}
        metadata={currentEntry.blogMetadata}
        onSave={(updatedMeta: BlogMetadata) => handleUpdateEntry({ blogMetadata: updatedMeta })}
        themeColor={currentJournal.themeColor}
      />

      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        user={user}
        lastSynced={lastSynced}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        onRestoreFromCloud={handleRestoreFromCloud}
        themeColor={currentJournal.themeColor}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        entry={currentEntry}
        journal={currentJournal}
        themeColor={currentJournal.themeColor}
      />
    </div>
  );
}
