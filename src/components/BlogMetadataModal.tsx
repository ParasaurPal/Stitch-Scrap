import React, { useState } from 'react';
import { X, Smile, Music, BookOpen, MapPin, Coffee, Flame, Check, Sparkles, Plus, Trash2, Palette } from 'lucide-react';
import { BlogMetadata, MoodItem } from '../types/journal';
import { MOOD_PRESETS } from '../data/defaultData';
import { sounds } from '../utils/sound';

interface BlogMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: BlogMetadata;
  onSave: (updated: BlogMetadata) => void;
  themeColor: string;
}

const CUSTOM_MOODS_STORAGE_KEY = 'stitch_scrap_custom_moods_v2';

const EMOJI_PRESETS = ['✨', '☕', '🎧', '🌙', '🧸', '🍄', '⚡', '🌸', '🪐', '🔮', '🎨', '🍕', '🐱', '🌿', '💤', '🔥', '📚', '🕯️', '🦋', '🥑'];
const COLOR_PRESETS = [
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#ef4444', // rose
  '#f97316', // orange
  '#6366f1', // indigo
];

export const BlogMetadataModal: React.FC<BlogMetadataModalProps> = ({
  isOpen,
  onClose,
  metadata,
  onSave,
  themeColor,
}) => {
  const [customMoods, setCustomMoods] = useState<MoodItem[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_MOODS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const initialMoods: MoodItem[] =
    metadata.moods && metadata.moods.length > 0
      ? metadata.moods
      : metadata.mood
      ? [metadata.mood]
      : [MOOD_PRESETS[0]];

  const [selectedMoods, setSelectedMoods] = useState<MoodItem[]>(initialMoods);
  const [moodIntensity, setMoodIntensity] = useState<number>(initialMoods[0]?.intensity || 80);
  const [moodNote, setMoodNote] = useState<string>(initialMoods[0]?.note || '');

  // Custom mood builder state
  const [isCreatingMood, setIsCreatingMood] = useState<boolean>(false);
  const [newMoodLabel, setNewMoodLabel] = useState<string>('');
  const [newMoodEmoji, setNewMoodEmoji] = useState<string>('✨');
  const [newMoodColor, setNewMoodColor] = useState<string>('#ec4899');

  const [song, setSong] = useState(metadata.currentlyListening?.song || '');
  const [artist, setArtist] = useState(metadata.currentlyListening?.artist || '');
  const [isPlaying, setIsPlaying] = useState(metadata.currentlyListening?.isPlaying ?? true);

  const [bookTitle, setBookTitle] = useState(metadata.currentlyReading?.title || '');
  const [bookAuthor, setBookAuthor] = useState(metadata.currentlyReading?.author || '');
  const [bookProgress, setBookProgress] = useState(metadata.currentlyReading?.progress || '');

  const [watching, setWatching] = useState(metadata.currentlyWatching || '');
  const [location, setLocation] = useState(metadata.location || '');
  const [weatherCondition, setWeatherCondition] = useState(metadata.weather?.condition || 'Sunny & Mild');
  const [weatherTemp, setWeatherTemp] = useState(metadata.weather?.temp || '68°F');
  const [weatherIcon, setWeatherIcon] = useState(metadata.weather?.icon || 'sun');

  const [eating, setEating] = useState(metadata.currentlyEating || '');
  const [obsession, setObsession] = useState(metadata.currentObsession || '');

  if (!isOpen) return null;

  const handleToggleMood = (moodItem: MoodItem) => {
    sounds.playClick();
    const isAlreadySelected = selectedMoods.some((m) => m.id === moodItem.id);
    if (isAlreadySelected) {
      if (selectedMoods.length > 1) {
        setSelectedMoods(selectedMoods.filter((m) => m.id !== moodItem.id));
      }
    } else {
      setSelectedMoods([
        ...selectedMoods,
        { ...moodItem, intensity: moodIntensity, note: moodNote },
      ]);
    }
  };

  const handleCreateCustomMood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMoodLabel.trim()) return;

    sounds.playStickerPop();
    const created: MoodItem = {
      id: `custom-mood-${Date.now()}`,
      label: newMoodLabel.trim(),
      emoji: newMoodEmoji || '✨',
      color: newMoodColor,
      intensity: 85,
      isCustom: true,
    };

    const updatedList = [created, ...customMoods];
    setCustomMoods(updatedList);
    try {
      localStorage.setItem(CUSTOM_MOODS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to save custom mood', e);
    }

    setSelectedMoods([...selectedMoods, created]);
    setNewMoodLabel('');
    setIsCreatingMood(false);
  };

  const handleDeleteCustomMood = (moodId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    const updatedList = customMoods.filter((m) => m.id !== moodId);
    setCustomMoods(updatedList);
    try {
      localStorage.setItem(CUSTOM_MOODS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to update custom moods', e);
    }

    const remaining = selectedMoods.filter((m) => m.id !== moodId);
    setSelectedMoods(remaining.length > 0 ? remaining : [MOOD_PRESETS[0]]);
  };

  const handleSave = () => {
    sounds.playClick();
    const finalMoods = selectedMoods.length > 0 ? selectedMoods : [MOOD_PRESETS[0]];
    const updatedMoods = finalMoods.map((m) => ({
      ...m,
      intensity: moodIntensity,
      note: moodNote,
    }));

    onSave({
      mood: updatedMoods[0],
      moods: updatedMoods,
      currentlyListening: {
        song,
        artist,
        isPlaying,
      },
      currentlyReading: {
        title: bookTitle,
        author: bookAuthor,
        progress: bookProgress,
      },
      currentlyWatching: watching,
      location,
      weather: {
        condition: weatherCondition,
        temp: weatherTemp,
        icon: weatherIcon,
      },
      currentlyEating: eating,
      currentObsession: obsession,
    });
    onClose();
  };

  const allMoods = [...customMoods, ...MOOD_PRESETS];
  const primaryMood = selectedMoods[0] || MOOD_PRESETS[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-xl bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: primaryMood.color || themeColor || '#f59e0b' }}
            >
              <Smile size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 flex items-center gap-1.5">
                <span>Moods</span>
                <span className="text-xs font-normal text-stone-400">
                  ({selectedMoods.map((m) => m.emoji).join(' ')})
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">LiveJournal & early blog style status stamps</p>
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
        <div className="p-4 overflow-y-auto space-y-5 text-xs">
          {/* SECTION 1: MOOD TRACKING */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Smile size={14} /> Mood Tracking
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {selectedMoods.length} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setIsCreatingMood(!isCreatingMood);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                    isCreatingMood
                      ? 'bg-stone-700 text-stone-200'
                      : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                  }`}
                >
                  <Plus size={11} />
                  <span>{isCreatingMood ? 'Close Creator' : 'New Custom Mood'}</span>
                </button>
                <span className="text-[11px] font-mono font-bold text-stone-300">
                  {moodIntensity}%
                </span>
              </div>
            </div>

            {/* Active Selected Mood Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-950 p-2 rounded-xl border border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase font-semibold mr-0.5">Active Moods:</span>
              {selectedMoods.map((m) => (
                <div
                  key={m.id}
                  style={{ borderColor: m.color || '#f59e0b' }}
                  className="flex items-center gap-1 bg-stone-900 border px-2 py-0.5 rounded-lg text-stone-200 text-[11px] font-bold shadow-xs"
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                  {selectedMoods.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMood(m);
                      }}
                      title={`Deselect ${m.label}`}
                      className="p-0.5 hover:bg-stone-800 rounded-full text-stone-400 hover:text-white ml-0.5 transition"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Mood Creator Drawer */}
            {isCreatingMood && (
              <form
                onSubmit={handleCreateCustomMood}
                className="bg-stone-950 p-3 rounded-2xl border border-amber-500/40 shadow-inner space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <Sparkles size={12} /> Design Your Custom Mood
                  </span>
                  <span className="text-[10px] text-stone-400">Available across all journals</span>
                </div>

                {/* Mood Name Input */}
                <div className="flex gap-2 items-center">
                  <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center text-xl shrink-0 border border-stone-700">
                    {newMoodEmoji || '✨'}
                  </div>
                  <input
                    type="text"
                    required
                    value={newMoodLabel}
                    onChange={(e) => setNewMoodLabel(e.target.value)}
                    placeholder="Mood name (e.g. Goblin Mode, Nostalgic, Hyped)..."
                    className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Quick Emoji Selector */}
                <div>
                  <span className="text-[10px] text-stone-400 block mb-1">Pick an Emoji or type your own:</span>
                  <div className="flex flex-wrap gap-1 items-center">
                    {EMOJI_PRESETS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setNewMoodEmoji(em)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition ${
                          newMoodEmoji === em ? 'bg-amber-500/40 border border-amber-400 scale-110' : 'bg-stone-900 hover:bg-stone-800'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                    <input
                      type="text"
                      maxLength={4}
                      value={newMoodEmoji}
                      onChange={(e) => setNewMoodEmoji(e.target.value)}
                      placeholder="Custom"
                      className="w-14 text-center bg-stone-900 border border-stone-700 rounded-lg py-0.5 text-xs text-stone-200"
                    />
                  </div>
                </div>

                {/* Color Swatches */}
                <div>
                  <span className="text-[10px] text-stone-400 block mb-1">Mood Theme Color:</span>
                  <div className="flex items-center gap-1.5">
                    {COLOR_PRESETS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewMoodColor(col)}
                        style={{ backgroundColor: col }}
                        className={`w-6 h-6 rounded-full border-2 transition ${
                          newMoodColor === col ? 'border-white scale-110 shadow-md' : 'border-stone-800 opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                    <input
                      type="color"
                      value={newMoodColor}
                      onChange={(e) => setNewMoodColor(e.target.value)}
                      className="w-6 h-6 rounded bg-transparent cursor-pointer ml-1"
                      title="Custom color"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
                  >
                    <Plus size={13} />
                    <span>Save Custom Mood</span>
                  </button>
                </div>
              </form>
            )}

            {/* Mood Grid (Custom Moods + Presets) */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {allMoods.map((m) => {
                const isSelected = selectedMoods.some((item) => item.id === m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMood(m)}
                    className={`p-2 rounded-xl text-left border transition flex items-center justify-between gap-1 cursor-pointer group relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/50 text-white font-bold ring-1 ring-amber-500'
                        : 'border-stone-800 bg-stone-950 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="text-base shrink-0">{m.emoji}</span>
                      <span className="text-[10px] truncate">{m.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isSelected && <Check size={12} className="text-amber-400" />}

                      {/* Custom mood badge / delete button */}
                      {m.isCustom && (
                        <button
                          type="button"
                          title="Delete custom mood"
                          onClick={(e) => handleDeleteCustomMood(m.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-rose-400 hover:bg-rose-950/60 transition"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Intensity Slider */}
            <div className="bg-stone-950 p-2.5 rounded-xl border border-stone-800 space-y-1">
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>Vibe Intensity / Energy:</span>
                <span className="font-mono text-amber-400 font-bold">{moodIntensity}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={moodIntensity}
                onChange={(e) => setMoodIntensity(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Mood Note */}
            <input
              type="text"
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              placeholder="Why this mood? (e.g. Rainy window, nostalgic playlist...)"
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none"
            />
          </div>

          {/* SECTION 2: CURRENTLY LISTENING TO */}
          <div className="space-y-2 border-t border-stone-800 pt-3">
            <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
              <Music size={14} /> Currently Listening To
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={song}
                onChange={(e) => setSong(e.target.value)}
                placeholder="Song Title (e.g. Fade Into You)"
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
              />
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist (e.g. Mazzy Star)"
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-400">
              <input
                type="checkbox"
                id="isPlaying"
                checked={isPlaying}
                onChange={(e) => setIsPlaying(e.target.checked)}
                className="accent-pink-500"
              />
              <label htmlFor="isPlaying">Show animated retro equalizer sticker on page</label>
            </div>
          </div>

          {/* SECTION 3: CURRENTLY READING */}
          <div className="space-y-2 border-t border-stone-800 pt-3">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} /> Currently Reading
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="Book Title"
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
              />
              <input
                type="text"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder="Author"
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
              />
              <input
                type="text"
                value={bookProgress}
                onChange={(e) => setBookProgress(e.target.value)}
                placeholder="Progress (e.g. Pg 214)"
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 4: LOCATION & WEATHER */}
          <div className="space-y-2 border-t border-stone-800 pt-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} /> Location & Atmosphere
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g. Corner coffee shop)"
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
              />
              <input
                type="text"
                value={weatherCondition}
                onChange={(e) => setWeatherCondition(e.target.value)}
                placeholder="Weather (e.g. Soft rain)"
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
              />
              <input
                type="text"
                value={weatherTemp}
                onChange={(e) => setWeatherTemp(e.target.value)}
                placeholder="Temp (e.g. 58°F)"
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
              />
            </div>
          </div>

          {/* SECTION 5: OBSESSION & COMFORT FOOD */}
          <div className="space-y-2 border-t border-stone-800 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Flame size={14} /> Current Obsession
                </span>
                <input
                  type="text"
                  value={obsession}
                  onChange={(e) => setObsession(e.target.value)}
                  placeholder="e.g. Collecting vintage stamps"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
                />
              </div>

              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Coffee size={14} /> Eating / Drinking
                </span>
                <input
                  type="text"
                  value={eating}
                  onChange={(e) => setEating(e.target.value)}
                  placeholder="e.g. Iced matcha latte"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Check size={16} />
            Update Blog Status Stamps
          </button>
        </div>
      </div>
    </div>
  );
};
