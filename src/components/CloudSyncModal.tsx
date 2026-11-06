import React, { useState } from 'react';
import { X, Cloud, CloudCheck, RefreshCw, LogIn, LogOut, ShieldCheck, Check, Smartphone, AlertCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser } from '../services/firebase';
import { sounds } from '../utils/sound';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  lastSynced: string | null;
  isSyncing: boolean;
  onManualSync: () => Promise<void>;
  onRestoreFromCloud: () => Promise<void>;
  themeColor: string;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  lastSynced,
  isSyncing,
  onManualSync,
  onRestoreFromCloud,
  themeColor,
}) => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setAuthError(null);
    sounds.playClick();
    try {
      await signInWithGoogle();
      sounds.playStickerPop();
    } catch (err: any) {
      console.error(err);
      setAuthError(err?.message || 'Failed to sign in with Google');
    }
  };

  const handleSignOut = async () => {
    sounds.playClick();
    try {
      await signOutUser();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleTriggerSync = async () => {
    sounds.playClick();
    setSyncSuccessMsg(null);
    try {
      await onManualSync();
      sounds.playStickerPop();
      setSyncSuccessMsg('Cloud backup completed! All entries, stickers & mood logs synced.');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setAuthError(err?.message || 'Sync failed');
    }
  };

  const handleTriggerRestore = async () => {
    sounds.playClick();
    setSyncSuccessMsg(null);
    try {
      await onRestoreFromCloud();
      sounds.playPageFlip();
      setSyncSuccessMsg('Restored successfully from Cloud!');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setAuthError(err?.message || 'Restore failed');
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
              style={{ backgroundColor: themeColor || '#0284c7' }}
            >
              <Cloud size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">Cloud Backup & Sync</h2>
              <p className="text-[11px] text-stone-400">Sync journals, stickers & mood across devices</p>
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
          {/* Account Status Card */}
          {user ? (
            <div className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-sky-500/50 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sky-900/60 text-sky-200 font-bold flex items-center justify-center">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-stone-100">{user.displayName || 'Journalist'}</span>
                    <span className="flex items-center text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Connected
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 block truncate max-w-[210px]">
                    {user.email}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-rose-400 transition"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-950/60 text-sky-400 flex items-center justify-center mx-auto border border-sky-800/50">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-stone-100 text-sm">Sign in with Google</h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Back up all your journals, custom stickers, and mood logs to your account to access them on any phone, tablet, or browser.
                </p>
              </div>
              <button
                onClick={handleSignIn}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
              >
                <LogIn size={16} />
                Connect Google Account
              </button>
            </div>
          )}

          {/* Sync Status Banner */}
          <div className="bg-stone-950/80 p-3 rounded-2xl border border-stone-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                Backup Status:
              </span>
              <span className="font-mono text-stone-200">
                {user ? (lastSynced ? `Synced: ${new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Ready to sync') : 'Local Storage Only'}
              </span>
            </div>

            {user && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  disabled={isSyncing}
                  onClick={handleTriggerSync}
                  className="py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
                >
                  <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                  Backup Now
                </button>

                <button
                  disabled={isSyncing}
                  onClick={handleTriggerRestore}
                  className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 font-semibold flex items-center justify-center gap-1.5 transition active:scale-98"
                >
                  <Cloud size={13} />
                  Restore Cloud
                </button>
              </div>
            )}
          </div>

          {syncSuccessMsg && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-[11px] text-emerald-200 flex items-center gap-1.5">
              <Check size={14} className="shrink-0 text-emerald-400" />
              {syncSuccessMsg}
            </div>
          )}

          {authError && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-[11px] text-rose-200 flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0 text-rose-400" />
              {authError}
            </div>
          )}

          {/* Sync Features List */}
          <div className="p-3 bg-stone-950/40 rounded-xl border border-stone-800/40 space-y-1.5 text-[11px] text-stone-400">
            <span className="font-bold text-stone-300 block mb-1">What gets synced?</span>
            <div className="flex items-center gap-1.5">
              <Check size={12} className="text-pink-400" />
              <span>All multi-journal notebooks & entries</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check size={12} className="text-amber-400" />
              <span>Mood tracking history & intensity levels</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check size={12} className="text-emerald-400" />
              <span>Washi tape placements with custom text</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check size={12} className="text-purple-400" />
              <span>AI-generated custom stickers & uploaded photos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
