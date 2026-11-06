import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Volume2, VolumeX, Smartphone, Monitor } from 'lucide-react';
import { sounds } from '../utils/sound';

interface AndroidStatusBarProps {
  isPhoneFrame: boolean;
  onToggleFrame: () => void;
  journalName: string;
  themeColor: string;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({
  isPhoneFrame,
  onToggleFrame,
  journalName,
  themeColor,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('12:26');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundEnabled(sounds.enabled);
    if (sounds.enabled) {
      sounds.playClick();
    }
  };

  return (
    <div className="w-full bg-stone-900/90 backdrop-blur-md text-stone-200 px-4 py-1.5 flex items-center justify-between text-xs font-medium tracking-tight select-none border-b border-white/5 z-50">
      {/* Left: Clock & Notifications */}
      <div className="flex items-center space-x-2">
        <span className="font-semibold text-stone-100">{currentTime}</span>
        <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="hidden sm:inline-block text-[11px] text-stone-400 font-normal truncate max-w-[130px]">
          {journalName}
        </span>
      </div>

      {/* Center: Camera Notch simulation for phone frame */}
      {isPhoneFrame && (
        <div className="hidden sm:flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-stone-800 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-900 ring-1 ring-sky-900/60"></div>
          </div>
        </div>
      )}

      {/* Right: Android Status Icons & Applet Controls */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Mute scrapbook sounds' : 'Enable scrapbook sounds'}
          className="p-1 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white transition"
        >
          {soundEnabled ? <Volume2 size={13} className="text-pink-400" /> : <VolumeX size={13} />}
        </button>

        <button
          onClick={onToggleFrame}
          title={isPhoneFrame ? 'Switch to Fullscreen Android Tablet' : 'Switch to Android Phone View'}
          className="p-1 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white transition flex items-center gap-1 text-[11px]"
        >
          {isPhoneFrame ? <Monitor size={13} /> : <Smartphone size={13} />}
          <span className="hidden md:inline">{isPhoneFrame ? 'Expand' : 'Phone'}</span>
        </button>

        <div className="h-3 w-px bg-stone-700 mx-0.5"></div>

        <span className="text-[10px] font-bold text-stone-300">5G</span>
        <Wifi size={13} className="text-stone-300" />
        <div className="flex items-center space-x-0.5">
          <span className="text-[10px] font-mono">94%</span>
          <Battery size={13} className="text-emerald-400 fill-emerald-400/40" />
        </div>
      </div>
    </div>
  );
};
