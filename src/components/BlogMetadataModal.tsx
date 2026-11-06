import React, { useState } from 'react';
import { X, Smile, Music, BookOpen, MapPin, Coffee, Flame, Check, Sparkles } from 'lucide-react';
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

export const BlogMetadataModal: React.FC<BlogMetadataModalProps> = ({
  isOpen,
  onClose,
  metadata,
  onSave,
  themeColor,
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodItem>(metadata.mood || MOOD_PRESETS[0]);
  const [moodIntensity, setMoodIntensity] = useState<number>(metadata.mood?.intensity || 80);
  const [moodNote, setMoodNote] = useState<string>(metadata.mood?.note || '');

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

  const handleSave = () => {
    sounds.playClick();
    onSave({
      mood: {
        ...selectedMood,
        intensity: moodIntensity,
        note: moodNote,
      },
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-xl bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: themeColor || '#f59e0b' }}
            >
              <Smile size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">Mood & Nostalgic Blog Currents</h2>
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
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smile size={14} /> Mood Tracking
              </span>
              <span className="text-[11px] font-mono font-bold text-stone-300">
                {selectedMood.label} ({moodIntensity}%)
              </span>
            </div>

            {/* Mood Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {MOOD_PRESETS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedMood(m);
                  }}
                  className={`p-2 rounded-xl text-left border transition flex items-center gap-1.5 ${
                    selectedMood.id === m.id
                      ? 'border-amber-500 bg-amber-950/40 text-white font-bold ring-1 ring-amber-500'
                      : 'border-stone-800 bg-stone-950 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                  }`}
                >
                  <span className="text-base">{m.emoji}</span>
                  <span className="text-[10px] truncate">{m.label}</span>
                </button>
              ))}
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
