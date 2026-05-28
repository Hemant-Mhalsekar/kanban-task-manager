import { useState, useEffect, useCallback, useRef } from 'react';
import { Target, X, Sparkles, Loader2, AlertTriangle, Flag, Calendar, Crosshair } from 'lucide-react';
import { getAIFocus } from '../api/ai';

// ── Helpers ───────────────────────────────────────────────────────────────────
const PRIORITY_BADGE = {
  high:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  low:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
};

const RANK_GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-indigo-400 to-violet-400',
  'from-indigo-300 to-violet-300',
];

function formatDue(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

function isOverdue(iso) {
  if (!iso) return false;
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return due < today;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FocusMode({ onClose, onStartFocus }) {
  const [status, setStatus]   = useState('loading'); // loading | tooFew | success | error
  const [tasks, setTasks]     = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [count, setCount]     = useState(0);
  const overlayRef            = useRef(null);

  const fetchFocus = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await getAIFocus();
      if (data.tooFew) {
        setCount(data.count ?? 0);
        setStatus('tooFew');
      } else {
        setTasks(data.focus);
        setStatus('success');
      }
    } catch {
      setErrorMsg('AI focus unavailable. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => { fetchFocus(); }, [fetchFocus]);

  // Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleStart = () => {
    onStartFocus(tasks.map((t) => t._id));
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/70 backdrop-blur-md"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label="Daily Focus Mode"
    >
      {/* Card */}
      <div className="relative w-full max-w-lg flex flex-col rounded-3xl overflow-hidden
                      bg-white dark:bg-[#13151F]
                      border border-gray-200 dark:border-white/8
                      shadow-2xl shadow-indigo-900/20">

        {/* Decorative top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600
                            flex items-center justify-center shadow-md shadow-indigo-500/30">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                Today's Focus
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Powered by Groq · Llama 3.3
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close focus mode"
            id="focus-close-btn"
            className="w-8 h-8 flex items-center justify-center rounded-xl
                       text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 pb-7">

          {/* ── Loading ── */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20
                                flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                </div>
                <div className="absolute -inset-1.5 rounded-2xl bg-indigo-400/15 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Picking your top 3 tasks…
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Groq is analyzing your board
                </p>
              </div>
            </div>
          )}

          {/* ── Too few tasks ── */}
          {status === 'tooFew' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20
                              flex items-center justify-center">
                <Crosshair className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Not enough tasks
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
                  You have <strong>{count}</strong> incomplete task{count !== 1 ? 's' : ''}.
                  Add at least <strong>3 tasks</strong> to use Focus Mode.
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Got it
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20
                              flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{errorMsg}</p>
              <button
                onClick={fetchFocus}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* ── Success ── */}
          {status === 'success' && tasks.length > 0 && (
            <>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
                AI picked these 3 tasks for you today — stay focused, ship things.
              </p>

              <ol className="space-y-3 mb-6">
                {tasks.map((task, idx) => {
                  const dueFmt    = formatDue(task.dueDate);
                  const overdue   = isOverdue(task.dueDate);
                  const pStyle    = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.medium;
                  const gradient  = RANK_GRADIENTS[idx] ?? RANK_GRADIENTS[2];

                  return (
                    <li
                      key={task._id}
                      className="flex gap-4 p-4 rounded-2xl
                                 bg-gray-50 dark:bg-white/4
                                 border border-gray-100 dark:border-white/6
                                 hover:border-indigo-200 dark:hover:border-indigo-500/30
                                 transition-all duration-150"
                    >
                      {/* Rank circle */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl
                                       bg-gradient-to-br ${gradient}
                                       flex items-center justify-center
                                       shadow-sm text-white font-bold text-sm`}>
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Title + priority */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">
                            {task.title}
                          </p>
                          <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold
                                           uppercase tracking-wide px-2 py-0.5 rounded-full ${pStyle}`}>
                            <Flag className="w-2.5 h-2.5" />
                            {task.priority}
                          </span>
                        </div>

                        {/* Due date */}
                        {dueFmt && (
                          <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                            overdue
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            {overdue ? 'Overdue · ' : ''}{dueFmt}
                          </p>
                        )}

                        {/* AI reason */}
                        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 italic leading-relaxed">
                          {task.reason}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStart}
                  id="focus-start-btn"
                  className="flex-1 flex items-center justify-center gap-2
                             py-2.5 rounded-xl text-sm font-semibold text-white
                             bg-gradient-to-r from-indigo-500 to-violet-500
                             hover:from-indigo-600 hover:to-violet-600
                             shadow-md shadow-indigo-500/25
                             hover:shadow-lg hover:shadow-indigo-500/35
                             transition-all duration-150"
                >
                  <Target className="w-4 h-4" />
                  Start Focus
                </button>

                <button
                  onClick={onClose}
                  id="focus-dismiss-btn"
                  className="px-5 py-2.5 rounded-xl text-sm font-medium
                             text-gray-500 dark:text-gray-400
                             border border-gray-200 dark:border-white/10
                             hover:border-gray-300 dark:hover:border-white/20
                             hover:text-gray-700 dark:hover:text-gray-200
                             transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
