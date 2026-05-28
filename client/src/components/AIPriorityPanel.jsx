import { useState, useEffect, useCallback } from 'react';
import { Sparkles, X, Loader2, AlertTriangle, ListOrdered, ChevronRight } from 'lucide-react';
import { getAIPriority } from '../api/ai';

// ── Priority badge colours matching the rest of the app ──────────────────────
const PRIORITY_STYLES = {
  high:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  low:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
};

const RANK_COLORS = [
  'bg-indigo-600 text-white',
  'bg-indigo-500 text-white',
  'bg-indigo-400 text-white',
  'bg-indigo-300 text-indigo-900',
];

// Colour-codes reason text based on urgency keywords from the AI
function getReasonStyle(reason = '') {
  if (reason.includes('OVERDUE'))    return 'text-red-500 dark:text-red-400';
  if (reason.includes('TODAY'))      return 'text-orange-500 dark:text-orange-400';
  if (reason.includes('TOMORROW'))   return 'text-amber-500 dark:text-amber-400';
  if (reason.includes('approaching')) return 'text-yellow-500 dark:text-yellow-400';
  return 'text-gray-400 dark:text-gray-500';
}

export default function AIPriorityPanel({ onClose }) {
  const [status, setStatus]           = useState('idle'); // idle | loading | success | error
  const [suggestions, setSuggestions] = useState([]);
  const [errorMsg, setErrorMsg]       = useState('');

  const fetchSuggestions = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await getAIPriority();
      if (data.empty) {
        setStatus('empty');
      } else {
        setSuggestions(data.suggestions);
        setStatus('success');
      }
    } catch {
      setErrorMsg('AI suggestions unavailable, try again.');
      setStatus('error');
    }
  }, []);

  // Auto-fetch when panel mounts
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Side panel ── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="AI Priority Suggestions"
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md flex flex-col
                   bg-white dark:bg-[#13151F]
                   border-l border-gray-200 dark:border-white/8
                   shadow-2xl
                   animate-slide-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white text-[15px] leading-tight">
                AI Priority Suggestions
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Powered by Groq
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="ai-panel-close"
            aria-label="Close AI panel"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Loading ── */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center h-52 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-indigo-400/20 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Analyzing your tasks…</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Groq is thinking</p>
              </div>
            </div>
          )}

          {/* ── Empty ── */}
          {status === 'empty' && (
            <div className="flex flex-col items-center justify-center h-52 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                <ListOrdered className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No tasks yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add some tasks first to get AI suggestions</p>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center h-52 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{errorMsg}</p>
              </div>
              <button
                onClick={fetchSuggestions}
                id="ai-retry-btn"
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* ── Success ── */}
          {status === 'success' && suggestions.length > 0 && (
            <>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                {suggestions.length} task{suggestions.length !== 1 ? 's' : ''} ordered by urgency
              </p>

              <ol className="space-y-3">
                {suggestions.map((item, idx) => (
                  <li
                    key={item._id}
                    className="group relative flex gap-3 p-3.5 rounded-xl
                               bg-gray-50 dark:bg-white/4
                               border border-gray-100 dark:border-white/6
                               hover:border-indigo-200 dark:hover:border-indigo-500/30
                               hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5
                               transition-all duration-150"
                  >
                    {/* Rank badge */}
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm
                        ${idx < RANK_COLORS.length ? RANK_COLORS[idx] : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}
                    >
                      {idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug truncate">
                          {item.title}
                        </p>
                        {item.priority && (
                          <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${PRIORITY_STYLES[item.priority]}`}>
                            {item.priority}
                          </span>
                        )}
                      </div>

                      <p className={`mt-1 text-xs italic leading-relaxed ${getReasonStyle(item.reason)}`}>
                        <ChevronRight className="inline w-3 h-3 -mt-0.5 text-indigo-400 dark:text-indigo-500" />
                        {' '}{item.reason}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        {/* Footer */}
        {(status === 'success' || status === 'error') && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-white/8 flex items-center justify-between gap-3 flex-shrink-0">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              AI suggestions may not always be perfect.
            </p>
            <button
              onClick={fetchSuggestions}
              id="ai-refresh-btn"
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400
                         border border-indigo-200 dark:border-indigo-500/30
                         hover:bg-indigo-50 dark:hover:bg-indigo-500/10
                         px-3 py-1.5 rounded-lg transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              Refresh
            </button>
          </div>
        )}
      </aside>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
        }
      `}</style>
    </>
  );
}
