import React from 'react';
import { Plus, Trash2, BookOpen, Cloud } from 'lucide-react';
import { Journal, JournalEntry } from '../types/journal';

interface HomeDashboardProps {
  journals: Journal[];
  entries: JournalEntry[];
  onOpenJournal: (id: string) => void;
  onNewJournal: () => void;
  onDeleteJournal: (id: string) => void;
  onOpenBackup: () => void;
}

const coverGradients: Record<string, string> = {
  '#f472b6': 'linear-gradient(145deg,#f472b6,#c94c9b)',
  '#818cf8': 'linear-gradient(145deg,#818cf8,#5b62c8)',
  '#f59e0b': 'linear-gradient(145deg,#f59e0b,#c47b05)',
  '#10b981': 'linear-gradient(145deg,#10b981,#087f62)',
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  journals, entries, onOpenJournal, onNewJournal, onDeleteJournal, onOpenBackup,
}) => {
  const activeJournals = journals.filter((journal) => !journal.isArchived);
  const totalPages = entries.length;

  return (
    <main className="relative flex-1 min-h-0 overflow-y-auto bg-[#11131b] text-[#f2edf3] px-5 pt-8 pb-28">
      <header className="mb-10">
        <div className="text-[29px] leading-none tracking-[0.045em] font-extrabold">STITCH &amp; SCRAP</div>
        <div className="mt-2 text-[13px] tracking-[0.18em] font-semibold text-[#c8bdcf]">YOUR CREATIVE SPACE</div>
        <h1 className="mt-12 text-[27px] leading-tight font-extrabold">Make room for memories.</h1>
        <p className="mt-3 text-[17px] leading-[1.55] text-[#c9c3d0]">
          Every journal is a little world of its own. Open one to decorate a page, collect photos, and tell your story.
        </p>
        <div className="mt-3 flex gap-3">
          <span className="rounded-full bg-[#494057] px-4 py-2 text-[13px] font-extrabold tracking-wide">{activeJournals.length} JOURNALS</span>
          <span className="rounded-full bg-[#613848] px-4 py-2 text-[13px] font-extrabold tracking-wide">{totalPages} PAGES</span>
        </div>
      </header>

      <section className="space-y-5" aria-label="Your journals">
        {activeJournals.map((journal) => {
          const journalEntries = entries.filter((entry) => entry.journalId === journal.id);
          const latest = journalEntries[0];
          return (
            <article key={journal.id} className="relative flex min-h-[260px] gap-4 rounded-[34px] bg-[#2c2634] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.22)]">
              <button
                type="button"
                onClick={() => onOpenJournal(journal.id)}
                aria-label={`Open ${journal.name}`}
                className="flex w-[34%] max-w-[165px] shrink-0 flex-col items-center justify-center rounded-[17px] px-3 py-5 text-white shadow-[5px_7px_0_rgba(0,0,0,0.16)]"
                style={{ background: coverGradients[journal.themeColor] || `linear-gradient(145deg,${journal.themeColor},#45384f)` }}
              >
                <span className="mb-5 text-[43px] leading-none">{journal.coverPattern || '📖'}</span>
                <span className="w-full break-words text-left text-[13px] font-extrabold uppercase leading-tight tracking-wide">{journal.name}</span>
                <span className="my-5 h-[3px] w-14 rounded-full bg-white/80" />
                <span className="text-[8px] tracking-[0.2em]">STITCH &amp; SCRAP</span>
              </button>

              <div className="min-w-0 flex-1 py-1 pr-1">
                <button type="button" onClick={() => onOpenJournal(journal.id)} className="text-left text-[19px] font-extrabold leading-tight text-[#f3edf4]">
                  {journal.name}
                </button>
                <p className="mt-3 text-[15px] leading-[1.45] text-[#c9c2d0]">{journal.description || 'A little world of your own'}</p>
                <p className="mt-3 text-[14px] font-extrabold" style={{ color: journal.themeColor }}>{journalEntries.length} {journalEntries.length === 1 ? 'page' : 'pages'}</p>
                <p className="mt-3 text-[14px] leading-snug text-[#c9c2d0]">{latest ? `Latest: ${latest.title || 'Untitled memory'}` : 'Ready for your first memory'}</p>
                <button type="button" onClick={() => onOpenJournal(journal.id)} className="mt-6 text-[14px] font-extrabold tracking-wide" style={{ color: journal.themeColor }}>
                  OPEN JOURNAL&nbsp; →
                </button>
              </div>
              <button
                type="button"
                title={`Delete ${journal.name}`}
                onClick={() => { if (confirm(`Delete "${journal.name}" and all its pages?`)) onDeleteJournal(journal.id); }}
                className="absolute bottom-6 right-5 rounded-lg p-1 text-[#f0b8c1] hover:bg-white/10"
              >
                <Trash2 size={21} />
              </button>
            </article>
          );
        })}
      </section>

      <button
        type="button"
        onClick={onNewJournal}
        className="fixed bottom-8 right-5 z-20 flex items-center gap-4 rounded-[28px] bg-[#52368d] px-7 py-5 text-[16px] font-bold text-white shadow-[0_10px_26px_rgba(0,0,0,0.35)] active:scale-95"
      >
        <Plus size={30} strokeWidth={2.5} />
        New journal
      </button>

      <button type="button" onClick={onOpenBackup} className="absolute right-5 top-7 rounded-full bg-white/5 p-2 text-[#c9c2d0]" aria-label="Backup and sync">
        <Cloud size={18} />
      </button>
    </main>
  );
};
