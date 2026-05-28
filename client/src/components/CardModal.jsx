import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Trash2, CheckSquare, Square, Calendar, Tag, Flag } from 'lucide-react';
import { addSubtask, toggleSubtask, deleteSubtask } from '../api/cards';
import { ALL_LABELS, LABEL_STYLES } from '../constants/labels';

// ── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_STYLES = {
  high:   { badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',   dot: 'bg-red-500' },
  medium: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', dot: 'bg-amber-400' },
  low:    { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400', dot: 'bg-emerald-500' },
};

const PRIORITY_BORDER = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' };

function formatDue(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDueStatus(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (due < today) return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  return 'future';
}

const DUE_CHIP = {
  overdue: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  today:   'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  future:  'bg-gray-100 text-gray-500 dark:bg-white/6 dark:text-gray-400',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function CardModal({ card: initialCard, onClose, onUpdate }) {
  const [card, setCard]               = useState(initialCard);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal]       = useState(initialCard.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descVal, setDescVal]         = useState(initialCard.description ?? '');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [savingField, setSavingField] = useState(null); // 'title' | 'desc' | null

  const titleRef    = useRef(null);
  const descRef     = useRef(null);
  const inputRef    = useRef(null);
  const overlayRef  = useRef(null);

  // Sync card if parent updates it (e.g. via socket)
  useEffect(() => { setCard(initialCard); }, [initialCard]);

  // Focus title input when entering edit
  useEffect(() => { if (editingTitle) titleRef.current?.focus(); }, [editingTitle]);
  useEffect(() => { if (editingDesc)  descRef.current?.focus();  }, [editingDesc]);

  // Escape closes modal (unless editing a field)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && !editingTitle && !editingDesc) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, editingTitle, editingDesc]);

  // ── Field save helpers ──────────────────────────────────────────
  const saveTitle = useCallback(async () => {
    const trimmed = titleVal.trim();
    setEditingTitle(false);
    if (!trimmed || trimmed === card.title) { setTitleVal(card.title); return; }
    setSavingField('title');
    try {
      const updated = await onUpdate(card._id, { title: trimmed });
      setCard((c) => ({ ...c, title: trimmed, ...(updated ?? {}) }));
    } finally { setSavingField(null); }
  }, [titleVal, card, onUpdate]);

  const saveDesc = useCallback(async () => {
    setEditingDesc(false);
    if (descVal === (card.description ?? '')) return;
    setSavingField('desc');
    try {
      const updated = await onUpdate(card._id, { description: descVal });
      setCard((c) => ({ ...c, description: descVal, ...(updated ?? {}) }));
    } finally { setSavingField(null); }
  }, [descVal, card, onUpdate]);

  // ── Subtask handlers ────────────────────────────────────────────
  const handleAddSubtask = useCallback(async () => {
    const title = subtaskInput.trim();
    if (!title) return;
    setAddingSubtask(true);
    try {
      const updated = await addSubtask(card._id, title);
      setCard(updated);
      onUpdate(card._id, null, updated); // sync parent state
      setSubtaskInput('');
    } catch { /* silent — server errors show in console */ }
    finally { setAddingSubtask(false); inputRef.current?.focus(); }
  }, [card._id, subtaskInput, onUpdate]);

  const handleToggle = useCallback(async (subtaskId) => {
    // Optimistic update
    setCard((c) => ({
      ...c,
      subtasks: c.subtasks.map((s) =>
        String(s._id) === String(subtaskId) ? { ...s, completed: !s.completed } : s
      ),
    }));
    try {
      const updated = await toggleSubtask(card._id, subtaskId);
      setCard(updated);
      onUpdate(card._id, null, updated);
    } catch {
      // Revert on failure
      setCard((c) => ({
        ...c,
        subtasks: c.subtasks.map((s) =>
          String(s._id) === String(subtaskId) ? { ...s, completed: !s.completed } : s
        ),
      }));
    }
  }, [card._id, onUpdate]);

  const handleDeleteSubtask = useCallback(async (subtaskId) => {
    // Optimistic update
    setCard((c) => ({ ...c, subtasks: c.subtasks.filter((s) => String(s._id) !== String(subtaskId)) }));
    try {
      const updated = await deleteSubtask(card._id, subtaskId);
      setCard(updated);
      onUpdate(card._id, null, updated);
    } catch {
      setCard((c) => ({ ...c })); // parent will resync via socket
    }
  }, [card._id, onUpdate]);

  // ── Derived ─────────────────────────────────────────────────────
  const subtasks       = card.subtasks ?? [];
  const completedCount = subtasks.filter((s) => s.completed).length;
  const progress       = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;
  const dueFmt         = formatDue(card.dueDate);
  const dueStatus      = getDueStatus(card.dueDate);
  const priorityStyle  = PRIORITY_STYLES[card.priority] ?? PRIORITY_STYLES.medium;
  const borderColor    = PRIORITY_BORDER[card.priority] ?? PRIORITY_BORDER.medium;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[3px] flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        aria-modal="true"
        role="dialog"
        aria-label={`Card: ${card.title}`}
      >
        {/* Modal panel */}
        <div
          className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl overflow-hidden
                     bg-white dark:bg-[#13151F]
                     border border-gray-200 dark:border-white/8
                     shadow-2xl"
          style={{ borderTop: `4px solid ${borderColor}` }}
        >
          {/* ── Header ── */}
          <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/6 flex-shrink-0">
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <input
                  ref={titleRef}
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')  { e.preventDefault(); saveTitle(); }
                    if (e.key === 'Escape') { setEditingTitle(false); setTitleVal(card.title); }
                  }}
                  className="w-full text-lg font-bold text-gray-900 dark:text-white
                             bg-indigo-50 dark:bg-indigo-500/10
                             border border-indigo-300 dark:border-indigo-500/50
                             rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              ) : (
                <h2
                  onClick={() => setEditingTitle(true)}
                  title="Click to edit title"
                  className={`text-lg font-bold text-gray-900 dark:text-white cursor-text
                              hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors
                              ${savingField === 'title' ? 'opacity-60' : ''}`}
                >
                  {card.title}
                </h2>
              )}

              {/* Meta chips row */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* Priority */}
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${priorityStyle.badge}`}>
                  <Flag className="w-2.5 h-2.5" />
                  {card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}
                </span>

                {/* Due date */}
                {dueFmt && (
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${DUE_CHIP[dueStatus]}`}>
                    <Calendar className="w-2.5 h-2.5" />
                    {dueStatus === 'overdue' ? 'Overdue · ' : dueStatus === 'today' ? 'Due today · ' : ''}{dueFmt}
                  </span>
                )}

                {/* Labels */}
                {(card.labels ?? []).map((label) => (
                  <span key={label} className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${LABEL_STYLES[label]?.chip ?? ''}`}>
                    <Tag className="w-2.5 h-2.5" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              id="card-modal-close"
              aria-label="Close card detail"
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
                         text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                         hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Description */}
            <section>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Description
              </p>
              {editingDesc ? (
                <textarea
                  ref={descRef}
                  value={descVal}
                  onChange={(e) => setDescVal(e.target.value)}
                  onBlur={saveDesc}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setEditingDesc(false); setDescVal(card.description ?? ''); }
                  }}
                  rows={4}
                  placeholder="Add a description…"
                  className="w-full text-sm text-gray-700 dark:text-gray-200
                             bg-indigo-50 dark:bg-indigo-500/10
                             border border-indigo-300 dark:border-indigo-500/50
                             rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400
                             resize-none"
                />
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  title="Click to edit description"
                  className={`min-h-[2.5rem] text-sm rounded-xl px-3 py-2 cursor-text
                              text-gray-600 dark:text-gray-400
                              border border-transparent
                              hover:border-gray-200 dark:hover:border-white/8
                              hover:bg-gray-50 dark:hover:bg-white/4
                              transition-colors
                              ${savingField === 'desc' ? 'opacity-60' : ''}`}
                >
                  {card.description
                    ? <span className="whitespace-pre-wrap">{card.description}</span>
                    : <span className="text-gray-300 dark:text-gray-600 italic">No description — click to add one</span>
                  }
                </div>
              )}
            </section>

            {/* ── Subtasks ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  Subtasks
                  {subtasks.length > 0 && (
                    <span className="font-normal normal-case tracking-normal text-gray-400 dark:text-gray-500">
                      · {completedCount}/{subtasks.length}
                    </span>
                  )}
                </p>
              </div>

              {/* Progress bar */}
              {subtasks.length > 0 && (
                <div className="mb-3 h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Subtask list */}
              {subtasks.length > 0 && (
                <ul className="space-y-1.5 mb-3">
                  {subtasks.map((subtask) => (
                    <SubtaskRow
                      key={subtask._id}
                      subtask={subtask}
                      onToggle={() => handleToggle(subtask._id)}
                      onDelete={() => handleDeleteSubtask(subtask._id)}
                    />
                  ))}
                </ul>
              )}

              {/* Add subtask input */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  ref={inputRef}
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                  placeholder="Add a subtask…"
                  disabled={addingSubtask}
                  className="flex-1 text-sm text-gray-800 dark:text-gray-100
                             placeholder-gray-300 dark:placeholder-gray-600
                             bg-gray-50 dark:bg-white/4
                             border border-gray-200 dark:border-white/8
                             rounded-xl px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
                             disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={addingSubtask || !subtaskInput.trim()}
                  id="add-subtask-btn"
                  aria-label="Add subtask"
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl
                             bg-indigo-600 hover:bg-indigo-700
                             text-white shadow-sm
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

// ── SubtaskRow ────────────────────────────────────────────────────────────────
function SubtaskRow({ subtask, onToggle, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <li
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2.5 group rounded-lg px-2.5 py-2
                 hover:bg-gray-50 dark:hover:bg-white/4 transition-colors"
    >
      <button
        onClick={onToggle}
        aria-label={subtask.completed ? 'Mark incomplete' : 'Mark complete'}
        className={`flex-shrink-0 transition-colors ${
          subtask.completed
            ? 'text-indigo-500 dark:text-indigo-400'
            : 'text-gray-300 dark:text-gray-600 hover:text-indigo-400'
        }`}
      >
        {subtask.completed
          ? <CheckSquare className="w-4 h-4" />
          : <Square className="w-4 h-4" />
        }
      </button>

      <span className={`flex-1 text-sm leading-snug transition-colors ${
        subtask.completed
          ? 'line-through text-gray-300 dark:text-gray-600'
          : 'text-gray-700 dark:text-gray-200'
      }`}>
        {subtask.title}
      </span>

      {/* Delete — visible on row hover */}
      <button
        onClick={onDelete}
        aria-label="Delete subtask"
        className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md
                    text-gray-300 dark:text-gray-600
                    hover:text-red-500 dark:hover:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-500/10
                    transition-all duration-100
                    ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}
