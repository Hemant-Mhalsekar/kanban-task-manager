import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Target, X, Sparkles, Loader2, AlertTriangle, Flag, Calendar,
  Crosshair, ArrowLeftRight, Check, Play, Pause, Square, Trophy,
  ChevronLeft,
} from 'lucide-react';
import { getAIFocus } from '../api/ai';

// ── Shared helpers ────────────────────────────────────────────────────────────
const PRIORITY_BADGE = {
  high:   'bg-red-500/20 text-red-400 border border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  low:    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
};
const PRIORITY_BADGE_LIGHT = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-emerald-100 text-emerald-700',
};

const PRESET_DURATIONS = [25, 45, 60, 90];

function formatDue(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function isOverdue(iso) {
  if (!iso) return false;
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return due < today;
}
function fmtTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function FocusMode({ onClose, onStartFocus, onSessionEnd, allCards = [] }) {
  // screen: 'select' | 'timer'
  const [screen, setScreen] = useState('select');
  // Task selection state
  const [status, setStatus]     = useState('loading'); // loading | tooFew | error | ready
  const [slots, setSlots]       = useState([null, null, null]); // up to 3 selected task objects
  const [errorMsg, setErrorMsg] = useState('');
  const [tooFewCount, setTooFewCount] = useState(0);
  const [duration, setDuration] = useState(25);         // minutes
  const [customMode, setCustomMode] = useState(false);
  const [customVal, setCustomVal]   = useState('');
  // Timer session state (only used when screen === 'timer')
  const [sessionTasks, setSessionTasks] = useState([]);
  const [totalSecs, setTotalSecs] = useState(0);
  const [secsLeft, setSecsLeft]   = useState(0);
  const [running, setRunning]     = useState(false);
  const [done, setDone]           = useState(false);
  const [checked, setChecked]     = useState({}); // { id: bool }
  const [confirmEnd, setConfirmEnd] = useState(false);

  const intervalRef = useRef(null);

  // Non-done cards for swap picker
  const incompletCards = allCards.filter((c) => c.column !== 'done');

  // ── Fetch AI focus ──────────────────────────────────────────────
  const fetchFocus = useCallback(async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await getAIFocus();
      if (data.tooFew) {
        // 0 incomplete tasks
        setTooFewCount(data.count ?? 0);
        setStatus('tooFew');
      } else if (data.fewTasks) {
        // 1-2 tasks: backend returned them all directly, no AI selection
        const tasks = data.focus;
        // Pad slots to 3 with nulls so the slot UI still renders
        setSlots([...tasks, ...Array(Math.max(0, 3 - tasks.length)).fill(null)]);
        setStatus('ready');
      } else {
        setSlots(data.focus.slice(0, 3));
        setStatus('ready');
      }
    } catch {
      setErrorMsg('AI focus unavailable. Please try again.');
      setStatus('error');
    }
  }, []);

  useEffect(() => { fetchFocus(); }, [fetchFocus]);

  // ── Escape to close (only on select screen) ─────────────────────
  useEffect(() => {
    if (screen !== 'select') return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, screen]);

  // ── Timer tick ─────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'timer') return;
    if (!running || done) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setSecsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setDone(true);
          // Natural timer expiry — clear board highlights
          onSessionEnd?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, done, screen]);

  // ── Tab title ──────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'timer') return;
    const original = document.title;
    if (done) { document.title = 'Session Complete! 🎉 — TaskPilot'; }
    else       { document.title = `${fmtTime(secsLeft)} — TaskPilot`; }
    return () => { document.title = original; };
  }, [secsLeft, done, screen]);

  // ── Start session ──────────────────────────────────────────────
  const handleStartSession = () => {
    const mins = customMode ? (parseInt(customVal, 10) || 25) : duration;
    const secs = mins * 60;
    const activeTasks = slots.filter(Boolean);
    setSessionTasks(activeTasks);
    setTotalSecs(secs);
    setSecsLeft(secs);
    setRunning(true);
    setDone(false);
    setChecked({});
    setConfirmEnd(false);
    onStartFocus(activeTasks.map((t) => t._id));
    setScreen('timer');
  };

  // ── Render ─────────────────────────────────────────────────────
  if (screen === 'timer') {
    return (
      <TimerScreen
        tasks={sessionTasks}
        totalSecs={totalSecs}
        secsLeft={secsLeft}
        running={running}
        done={done}
        checked={checked}
        confirmEnd={confirmEnd}
        onToggleRun={() => setRunning((r) => !r)}
        onToggleCheck={(id) => setChecked((c) => ({ ...c, [id]: !c[id] }))}
        onRequestEnd={() => setConfirmEnd(true)}
        onCancelEnd={() => setConfirmEnd(false)}
        onConfirmEnd={() => {
          clearInterval(intervalRef.current);
          setRunning(false);
          setDone(true);
          setConfirmEnd(false);
          onSessionEnd?.(); // clear board highlights
        }}
        onBackToBoard={() => {
          onSessionEnd?.(); // clear board highlights
          onClose();
        }}
      />
    );
  }

  // ── SELECT SCREEN ──────────────────────────────────────────────
  const activeDuration = customMode ? (parseInt(customVal, 10) || 0) : duration;
  // canStart: all non-null slots must be filled; allow 1-3 tasks
  const filledSlots = slots.filter(Boolean);
  const canStart = status === 'ready' && filledSlots.length > 0 && activeDuration > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/75 backdrop-blur-md"
      aria-modal="true"
      role="dialog"
      aria-label="Focus Mode Setup"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl overflow-hidden
                      bg-white dark:bg-[#0F1117]
                      border border-gray-200/80 dark:border-white/8
                      shadow-2xl shadow-indigo-900/30">

        {/* Top gradient strip */}
        <div className="h-1 flex-shrink-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600
                            flex items-center justify-center shadow-md shadow-indigo-500/30">
              <Target className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                Focus Mode
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> AI-powered · Groq Llama 3.3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="focus-close-btn"
            aria-label="Close focus mode"
            className="w-8 h-8 flex items-center justify-center rounded-xl
                       text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 pb-7 space-y-6 min-h-0">

          {/* ── Loading ── */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20
                                flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                </div>
                <div className="absolute -inset-2 rounded-2xl bg-indigo-400/15 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Picking your top 3 tasks…</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Groq is analyzing your board</p>
              </div>
            </div>
          )}

          {/* ── Too few (0 tasks) ── */}
          {status === 'tooFew' && (
            <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20
                              flex items-center justify-center">
                <Crosshair className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No incomplete tasks</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
                  All your tasks are done, or you haven't created any yet.
                  Add tasks to your board to use Focus Mode.
                </p>
              </div>
              <button onClick={onClose}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                Got it
              </button>
            </div>
          )}

          {/* ── Error ── */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20
                              flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{errorMsg}</p>
              <button onClick={fetchFocus}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                Try again
              </button>
            </div>
          )}

          {/* ── Ready ── */}
          {status === 'ready' && (
            <>
              {/* Section label */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  AI-suggested tasks · tap ⇄ to swap
                </p>
                <div className="space-y-2.5">
                  {slots.map((task, idx) => (
                    task !== null && (
                      <SwapSlot
                        key={idx}
                        idx={idx}
                        task={task}
                        allTasks={incompletCards}
                        onSwap={(newTask) => {
                          setSlots((prev) => {
                            const next = [...prev];
                            next[idx] = newTask;
                            return next;
                          });
                        }}
                      />
                    )
                  ))}
                </div>
              </div>

              {/* Timer duration */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                  Session duration
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_DURATIONS.map((min) => (
                    <button
                      key={min}
                      onClick={() => { setDuration(min); setCustomMode(false); }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        !customMode && duration === min
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                          : 'bg-gray-100 dark:bg-white/6 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      {min} min
                    </button>
                  ))}
                  <button
                    onClick={() => setCustomMode((c) => !c)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      customMode
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                        : 'bg-gray-100 dark:bg-white/6 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {customMode && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={480}
                      value={customVal}
                      onChange={(e) => setCustomVal(e.target.value)}
                      placeholder="e.g. 30"
                      className="w-28 text-sm font-semibold text-gray-800 dark:text-gray-100
                                 bg-gray-50 dark:bg-white/6
                                 border border-gray-200 dark:border-white/10
                                 rounded-xl px-3 py-2
                                 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      autoFocus
                    />
                    <span className="text-sm text-gray-400 dark:text-gray-500">minutes</span>
                  </div>
                )}
              </div>

              {/* Start button */}
              <button
                onClick={handleStartSession}
                disabled={!canStart}
                id="focus-start-btn"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                           text-sm font-bold text-white
                           bg-gradient-to-r from-indigo-500 to-violet-500
                           hover:from-indigo-600 hover:to-violet-600
                           shadow-lg shadow-indigo-500/25
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all duration-150"
              >
                <Target className="w-4 h-4" />
                Start Focus Session
                {activeDuration > 0 && (
                  <span className="ml-1 opacity-80 font-medium">· {activeDuration} min</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SWAP SLOT — one of the 3 task cards with a swap picker
// ─────────────────────────────────────────────────────────────────────────────
function SwapSlot({ idx, task, allTasks, onSwap }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const dueFmt  = task ? formatDue(task.dueDate) : null;
  const overdue = task ? isOverdue(task.dueDate) : false;
  const pBadge  = task ? (PRIORITY_BADGE_LIGHT[task.priority] ?? PRIORITY_BADGE_LIGHT.medium) : '';

  return (
    <div ref={ref} className="relative">
      {/* Task card */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl
                      bg-gray-50 dark:bg-white/5
                      border border-gray-200 dark:border-white/8
                      hover:border-indigo-200 dark:hover:border-indigo-500/30
                      transition-all duration-150">
        {/* Rank badge */}
        <div className="flex-shrink-0 w-8 h-8 rounded-xl
                        bg-gradient-to-br from-indigo-500 to-violet-500
                        flex items-center justify-center
                        text-white text-xs font-bold shadow-sm">
          {idx + 1}
        </div>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug truncate">
            {task ? task.title : <span className="text-gray-400 italic">No task</span>}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {task && (
              <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${pBadge}`}>
                {task.priority}
              </span>
            )}
            {dueFmt && (
              <span className={`flex items-center gap-0.5 text-[10px] font-medium ${
                overdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
              }`}>
                <Calendar className="w-2.5 h-2.5" />
                {overdue ? 'Overdue · ' : ''}{dueFmt}
              </span>
            )}
          </div>
        </div>

        {/* Swap button */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Swap task"
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl
                     text-xs font-semibold
                     text-gray-500 dark:text-gray-400
                     border border-gray-200 dark:border-white/10
                     hover:border-indigo-300 dark:hover:border-indigo-500/40
                     hover:text-indigo-600 dark:hover:text-indigo-400
                     hover:bg-indigo-50 dark:hover:bg-indigo-500/10
                     transition-all duration-100"
        >
          <ArrowLeftRight className="w-3 h-3" />
          Swap
        </button>
      </div>

      {/* Dropdown picker */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-10
                        bg-white dark:bg-[#1A1D2E]
                        border border-gray-200 dark:border-white/10
                        rounded-2xl shadow-xl shadow-black/20
                        overflow-hidden">
          <p className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider
                        text-gray-400 dark:text-gray-500
                        border-b border-gray-100 dark:border-white/6">
            Pick a replacement
          </p>
          <ul className="max-h-52 overflow-y-auto">
            {allTasks.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">No other tasks</li>
            )}
            {allTasks.map((t) => {
              const isCurrentSlot = task && t._id === task._id;
              return (
                <li key={t._id}>
                  <button
                    onClick={() => { onSwap(t); setOpen(false); }}
                    disabled={isCurrentSlot}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5
                                transition-colors duration-100 ${
                      isCurrentSlot
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 cursor-default'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {t.title}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">
                        {t.column === 'inprogress' ? 'In Progress' : t.column} · {t.priority}
                      </p>
                    </div>
                    {isCurrentSlot && (
                      <Check className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMER SCREEN — always dark, full screen
// ─────────────────────────────────────────────────────────────────────────────
function TimerScreen({
  tasks, totalSecs, secsLeft, running, done, checked, confirmEnd,
  onToggleRun, onToggleCheck, onRequestEnd, onCancelEnd, onConfirmEnd, onBackToBoard,
}) {
  const progress = totalSecs > 0 ? (secsLeft / totalSecs) : 0;
  const durationMins = Math.round(totalSecs / 60);
  const checkedCount = tasks.filter((t) => checked[t._id]).length;

  // Circumference of the SVG ring
  const R = 130;
  const CIRC = 2 * Math.PI * R;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between
                    bg-[#07090F] text-white select-none"
         style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Subtle animated background blobs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* ── Top bar ── */}
      <div className="relative z-10 w-full flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">
            Focus Session
          </p>
          <p className="text-sm text-white/40 mt-0.5">
            {durationMins} minute session
          </p>
        </div>
        {!done && (
          <button
            onClick={onRequestEnd}
            className="flex items-center gap-1.5 text-sm font-medium text-white/40
                       hover:text-white/70 transition-colors px-3 py-1.5
                       border border-white/10 hover:border-white/20 rounded-xl"
          >
            <Square className="w-3.5 h-3.5" />
            End Session
          </button>
        )}
      </div>

      {/* ── Centre: timer ring + display ── */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {!done ? (
          <>
            {/* SVG ring */}
            <div className="relative flex items-center justify-center">
              <svg width="300" height="300" className="-rotate-90">
                {/* Track */}
                <circle cx="150" cy="150" r={R}
                  fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                {/* Progress */}
                <circle cx="150" cy="150" r={R}
                  fill="none"
                  stroke="url(#timerGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
                <defs>
                  <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Timer digits inside ring */}
              <div className="absolute flex flex-col items-center">
                <span className="text-7xl font-mono font-bold tracking-tight text-white tabular-nums"
                      style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fmtTime(secsLeft)}
                </span>
                <span className="text-sm text-white/30 mt-1">remaining</span>
              </div>
            </div>

            {/* Pause / Resume */}
            <button
              onClick={onToggleRun}
              id="timer-pause-btn"
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl
                         text-sm font-bold text-white
                         bg-white/10 hover:bg-white/16
                         border border-white/10 hover:border-white/20
                         transition-all duration-150"
            >
              {running
                ? <><Pause className="w-4 h-4" /> Pause</>
                : <><Play  className="w-4 h-4" /> Resume</>
              }
            </button>
          </>
        ) : (
          /* ── Completion ── */
          <div className="flex flex-col items-center gap-5 text-center px-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-500
                            flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <Trophy className="w-9 h-9 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Session Complete! 🎉</h2>
              <p className="text-white/50 mt-2 text-sm">
                {checkedCount} of {tasks.length} tasks checked off
              </p>
            </div>
            {tasks.length > 0 && (
              <div className="flex flex-col gap-2 w-full max-w-xs">
                {tasks.map((t) => (
                  <div key={t._id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/6 border border-white/8">
                    {checked[t._id]
                      ? <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      : <div className="w-4 h-4 rounded border border-white/20 flex-shrink-0" />
                    }
                    <span className={`text-sm truncate ${checked[t._id] ? 'line-through text-white/30' : 'text-white/70'}`}>
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={onBackToBoard}
              id="focus-back-btn"
              className="flex items-center gap-2 px-8 py-3 rounded-2xl mt-2
                         text-sm font-bold text-white
                         bg-gradient-to-r from-indigo-500 to-violet-500
                         hover:from-indigo-600 hover:to-violet-600
                         shadow-lg shadow-indigo-500/30
                         transition-all duration-150"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Board
            </button>
          </div>
        )}
      </div>

      {/* ── Task checklist ── */}
      {!done && (
        <div className="relative z-10 w-full max-w-sm px-6 pb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3 text-center">
            Today's Focus Tasks
          </p>
          <div className="space-y-2">
            {tasks.map((t) => {
              const pBadge = PRIORITY_BADGE[t.priority] ?? PRIORITY_BADGE.medium;
              return (
                <button
                  key={t._id}
                  onClick={() => onToggleCheck(t._id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                             bg-white/5 border border-white/8
                             hover:bg-white/8 hover:border-white/14
                             transition-all duration-100 text-left"
                >
                  {/* Checkbox */}
                  <div className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    checked[t._id]
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-white/25 hover:border-indigo-400'
                  }`}>
                    {checked[t._id] && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`flex-1 text-sm font-medium truncate transition-colors ${
                    checked[t._id] ? 'line-through text-white/25' : 'text-white/80'
                  }`}>
                    {t.title}
                  </span>
                  <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${pBadge}`}>
                    {t.priority}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Confirm end dialog ── */}
      {confirmEnd && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111420] border border-white/10 rounded-3xl px-8 py-7 shadow-2xl
                          flex flex-col items-center gap-5 max-w-xs w-full mx-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center">
              <Square className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white">End session early?</p>
              <p className="text-sm text-white/40 mt-1">Your progress won't be saved to the board.</p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={onCancelEnd}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                           text-white/60 border border-white/10
                           hover:border-white/20 hover:text-white/80 transition-colors"
              >
                Keep going
              </button>
              <button
                onClick={onConfirmEnd}
                id="confirm-end-btn"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold
                           bg-red-500/80 hover:bg-red-500 text-white transition-colors"
              >
                End it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
