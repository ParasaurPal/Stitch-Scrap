import React, { useState } from 'react';
import { Music, BookOpen, MapPin, CloudRain, Sun, Moon, Flame, Play, Pause, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { BlogMetadata } from '../types/journal';
import { sounds } from '../utils/sound';

interface BlogWidgetsBarProps {
  metadata: BlogMetadata;
  onEdit: () => void;
  themeColor: string;
}

export const BlogWidgetsBar: React.FC<BlogWidgetsBarProps> = ({
  metadata,
  onEdit,
  themeColor,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(metadata.currentlyListening?.isPlaying ?? true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setIsPlaying(!isPlaying);
  };

  const getWeatherIcon = (iconName?: string) => {
    switch (iconName) {
      case 'cloud-rain':
        return <CloudRain size={13} className="text-blue-500" />;
      case 'moon':
        return <Moon size={13} className="text-indigo-400" />;
      case 'sun':
      default:
        return <Sun size={13} className="text-amber-500" />;
    }
  };

  return (
    <div className="w-full select-none mb-3 px-1">
      {/* Blog status container with nostalgic early-2000s blog look */}
      <div
        onClick={() => {
          sounds.playClick();
          setIsExpanded(!isExpanded);
        }}
        className="w-full bg-amber-50/80 dark:bg-stone-800/80 backdrop-blur border border-amber-200/60 dark:border-stone-700/60 rounded-2xl p-2.5 shadow-sm transition hover:shadow cursor-pointer"
      >
        {/* Top Row: Mood & Music Player Sticker */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Mood Pill */}
          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-stone-900/90 px-2.5 py-1 rounded-xl shadow-xs border border-stone-200/50 dark:border-stone-700">
            <span className="text-base">{metadata.mood.emoji}</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-600 dark:text-stone-300 uppercase tracking-wider font-semibold">
                Mood
              </span>
              <span className="font-bold text-stone-800 dark:text-stone-100 flex items-center gap-1">
                {metadata.mood.label}
                <span className="text-[10px] px-1 py-0.2 bg-stone-100 dark:bg-stone-800 rounded font-mono text-stone-600 dark:text-stone-400">
                  {metadata.mood.intensity}%
                </span>
              </span>
            </div>
          </div>

          {/* Retro Mini Music Player */}
          {metadata.currentlyListening?.song && (
            <div className="flex-1 flex items-center justify-end max-w-[210px] gap-1.5 bg-stone-900 text-stone-100 px-2.5 py-1 rounded-xl shadow-inner border border-stone-700">
              <button
                onClick={togglePlay}
                className="w-5 h-5 rounded-full bg-pink-500 hover:bg-pink-400 flex items-center justify-center text-white transition shrink-0"
              >
                {isPlaying ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
              </button>
              <div className="overflow-hidden flex flex-col flex-1">
                <span className="text-[9px] text-pink-300 font-mono flex items-center gap-1">
                  <Music size={9} />
                  <span>LISTENING TO</span>
                </span>
                <span className="text-[11px] font-semibold truncate text-stone-100">
                  {metadata.currentlyListening.song}
                  <span className="text-stone-400 text-[10px] font-normal"> • {metadata.currentlyListening.artist}</span>
                </span>
              </div>
              {/* Animated Equalizer */}
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3 shrink-0">
                  <span className="w-0.5 bg-pink-400 h-3 animate-pulse"></span>
                  <span className="w-0.5 bg-pink-300 h-1.5 animate-bounce"></span>
                  <span className="w-0.5 bg-pink-400 h-2.5 animate-pulse"></span>
                </div>
              )}
            </div>
          )}

          {/* Expand toggle */}
          <button className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-stone-500">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Collapsible details: Currently Reading, Weather, Location, Obsession */}
        {isExpanded && (
          <div className="mt-2.5 pt-2 border-t border-stone-200/70 dark:border-stone-700/70 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {metadata.currentlyReading?.title && (
              <div className="flex items-start gap-1.5 text-stone-700 dark:text-stone-300">
                <BookOpen size={13} className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-[11px]">Reading: {metadata.currentlyReading.title}</span>
                  <span className="text-[10px] text-stone-600 dark:text-stone-300">
                    by {metadata.currentlyReading.author} ({metadata.currentlyReading.progress})
                  </span>
                </div>
              </div>
            )}

            {(metadata.weather || metadata.location) && (
              <div className="flex items-start gap-1.5 text-stone-700 dark:text-stone-300">
                <MapPin size={13} className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-[11px]">{metadata.location || 'Cozy sanctuary'}</span>
                  {metadata.weather && (
                    <span className="text-[10px] text-stone-600 dark:text-stone-300 flex items-center gap-1">
                      {getWeatherIcon(metadata.weather.icon)} {metadata.weather.condition} • {metadata.weather.temp}
                    </span>
                  )}
                </div>
              </div>
            )}

            {metadata.currentObsession && (
              <div className="flex items-start gap-1.5 text-stone-700 dark:text-stone-300 sm:col-span-2">
                <Flame size={13} className="mt-0.5 text-rose-500 shrink-0" />
                <span className="text-[10px]">
                  <strong className="font-semibold">Current Obsession:</strong> {metadata.currentObsession}
                </span>
              </div>
            )}

            <div className="sm:col-span-2 flex justify-end pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.playClick();
                  onEdit();
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline"
              >
                <Edit3 size={11} />
                Edit Mood & Currents
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
