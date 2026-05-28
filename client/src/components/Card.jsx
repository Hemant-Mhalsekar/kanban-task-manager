import { useState, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { ALL_LABELS, LABEL_STYLES } from '../constants/labels';
import CardModal from './CardModal';

// 3px left border color by priority
const PRIORITY_BORDER = {
  high:   '#EF4444',
  medium: '#F59E0B',
  low:    '#22C55E',
};

// Small dot color next to title
const PRIORITY_DOT = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-green-500',
};

// ── Due date helpers ─────────────────────────────────────────────
function formatDueDate(isoString) {
  if (!isoString) return null;
  const [year, month, day] = isoString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
  });
}

function getDueDateStatus(isoString) {
  if (!isoString) return null;
  const [year, month, day] = isoString.split('T')[0].split('-').map(Number);
  const due   = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due < today)                      return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  return 'future';
}

const DUE_TEXT_STYLES = {
  overdue: 'text-red-500 dark:text-red-400',
  today:   'text-amber-500 dark:text-amber-400',
  future:  'text-gray-400 dark:text-gray-600',
};

export default function Card({ card, index, onDelete, onUpdate, isFocused }) {
  const [hovered, setHovered]       = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [marking, setMarking]       = useState(false); // marking done/undone
  const [editing, setEditing]       = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [titleVal, setTitleVal]     = useState(card.title);
  const [dueDateVal, setDueDateVal] = useState(
    card.dueDate ? card.dueDate.split('T')[0] : ''
  );
  const [labelsVal, setLabelsVal]   = useState(card.labels ?? []);
  const [saving, setSaving]         = useState(false);
  const inputRef                    = useRef(null);

  const isDone         = card.column === 'done';
  const priorityBorder = isDone ? '#10B981' : (PRIORITY_BORDER[card.priority] ?? PRIORITY_BORDER.medium);
  const dueDateStatus  = getDueDateStatus(card.dueDate);
  const dueDateLabel   = formatDueDate(card.dueDate);

  // ── Subtask progress ─────────────────────────────────────────────
  const subtasks       = card.subtasks ?? [];
  const completedCount = subtasks.filter((s) => s.completed).length;
  const progress       = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  // ── Mark as Done / Move back ────────────────────────────────
  const handleMarkDone = async (e) => {
    e.stopPropagation();
    setMarking(true);
    try {
      const targetColumn = isDone ? 'todo' : 'done';
      await onUpdate(card._id, { column: targetColumn });
    } finally {
      setMarking(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try { await onDelete(card._id); }
    finally { setDeleting(false); }
  };

  // ── Inline edit ─────────────────────────────────────────────
  const startEdit = (e) => {
    e.stopPropagation();
    setTitleVal(card.title);
    setDueDateVal(card.dueDate ? card.dueDate.split('T')[0] : '');
    setLabelsVal(card.labels ?? []);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const toggleEditLabel = (e, label) => {
    e.preventDefault();
    e.stopPropagation();
    setLabelsVal((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const commitEdit = async () => {
    const trimmed = titleVal.trim();
    if (!trimmed) {
      setEditing(false);
      setTitleVal(card.title);
      setDueDateVal(card.dueDate ? card.dueDate.split('T')[0] : '');
      setLabelsVal(card.labels ?? []);
      return;
    }

    const rawCardDue    = card.dueDate ? card.dueDate.split('T')[0] : '';
    const titleChanged  = trimmed !== card.title;
    const dueChanged    = dueDateVal !== rawCardDue;
    const sortedOld     = [...(card.labels ?? [])].sort().join(',');
    const sortedNew     = [...labelsVal].sort().join(',');
    const labelsChanged = sortedOld !== sortedNew;

    if (!titleChanged && !dueChanged && !labelsChanged) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      if (titleChanged)  payload.title   = trimmed;
      if (dueChanged)    payload.dueDate = dueDateVal || null;
      if (labelsChanged) payload.labels  = labelsVal;
      await onUpdate(card._id, payload);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') {
      setEditing(false);
      setTitleVal(card.title);
      setDueDateVal(card.dueDate ? card.dueDate.split('T')[0] : '');
      setLabelsVal(card.labels ?? []);
    }
  };

  // ── Modal update bridge ──────────────────────────────────────
  // CardModal calls this with (id, payload, fullCard?)
  // If fullCard is provided (from subtask mutations), skip the API and just
  // propagate the updated doc straight to Dashboard state.
  const handleModalUpdate = async (id, payload, fullCard) => {
    if (fullCard) {
      // Subtask API already saved — just sync parent state
      onUpdate(id, null, fullCard);
      return fullCard;
    }
    // Normal field edit (title / description)
    return await onUpdate(id, payload);
  };

  return (
    <>
      <Draggable draggableId={card._id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              ...provided.draggableProps.style,
              borderLeft: `4px solid ${priorityBorder}`,
              background: isDone ? '#1b1b2e' : '#252540',
              border: snapshot.isDragging
                ? '1px solid rgba(99,102,241,0.5)'
                : isDone
                  ? '1px solid rgba(16,185,129,0.2)'
                  : '1px solid rgba(99,102,241,0.15)',
              opacity: isDone ? 0.75 : 1,
              ...(isFocused && !snapshot.isDragging ? {
                boxShadow: '0 0 0 2px #6366f1, 0 0 20px 4px rgba(99,102,241,0.35)',
              } : {}),
            }}
            className={`relative rounded-xl px-3.5 py-3 select-none transition-all duration-200
              ${snapshot.isDragging
                ? 'shadow-xl rotate-1 scale-[1.03]'
                : 'shadow-sm hover:shadow-lg hover:shadow-indigo-900/30 hover:scale-[1.01]'
              }`}
          >
            {/* Focus badge */}
            {isFocused && !snapshot.isDragging && (
              <span
                className="absolute top-2 left-2 text-sm leading-none select-none"
                title="Focus task"
                aria-label="Focus task"
              >
                🎯
              </span>
            )}

            {/* Hover action buttons — check/move-back + delete */}
            {hovered && !snapshot.isDragging && !editing && (
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {/* Mark done / Move back */}
                <button
                  onClick={handleMarkDone}
                  disabled={marking}
                  aria-label={isDone ? 'Move back to To Do' : 'Mark as done'}
                  title={isDone ? 'Move back to To Do' : 'Mark as done'}
                  className="flex items-center justify-center rounded-md transition-all duration-150 disabled:opacity-40"
                  style={{
                    width: isDone ? 'auto' : '20px',
                    height: '20px',
                    padding: isDone ? '0 5px' : '0',
                    fontSize: isDone ? '10px' : undefined,
                    fontWeight: isDone ? 600 : undefined,
                    gap: isDone ? '2px' : undefined,
                    background: isDone ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)',
                    color: isDone ? 'rgba(129,140,248,0.9)' : '#10B981',
                    border: isDone ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(16,185,129,0.3)',
                  }}
                >
                  {marking ? (
                    <span style={{ fontSize: 10 }}>…</span>
                  ) : isDone ? (
                    <span>↩ Undo</span>
                  ) : (
                    /* Checkmark SVG */
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  aria-label="Delete card"
                  className="w-5 h-5 flex items-center justify-center rounded-md transition-colors disabled:opacity-50"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  {deleting ? (
                    <span className="text-xs">…</span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Title row — priority dot + title */}
            <div className="flex items-start gap-2 pr-16">
              {/* Priority dot — gray when done */}
              <span
                className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  isDone ? 'bg-gray-600' : (PRIORITY_DOT[card.priority] ?? PRIORITY_DOT.medium)
                }`}
              />
              {editing ? (
                <input
                  ref={inputRef}
                  value={titleVal}
                  onChange={(e) => setTitleVal(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleKeyDown}
                  disabled={saving}
                  className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-300 dark:border-indigo-500/50 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
                />
              ) : (
                <p
                  onClick={() => !snapshot.isDragging && setModalOpen(true)}
                  title="Click to open details"
                  className="flex-1 text-sm font-semibold leading-snug cursor-pointer transition-colors"
                  style={{
                    color: isDone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.88)',
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}
                  onMouseEnter={(e) => { if (!isDone) e.currentTarget.style.color = '#818cf8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = isDone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.88)'; }}
                >
                  {card.title}
                </p>
              )}
            </div>

            {/* Description */}
            {card.description && !editing && (
              <p className="mt-1.5 ml-4 text-xs leading-relaxed line-clamp-2"
                 style={{ color: 'rgba(255,255,255,0.45)' }}>
                {card.description}
              </p>
            )}

            {/* Labels — display */}
            {!editing && card.labels && card.labels.length > 0 && (
              <div className="mt-2.5 ml-4 flex flex-wrap gap-1">
                {card.labels.map((label) => (
                  <span
                    key={label}
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LABEL_STYLES[label]?.chip ?? ''}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Labels — edit mode chip toggler */}
            {editing && (
              <div className="mt-2.5 ml-4 space-y-1">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Labels</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_LABELS.map((label) => {
                    const isSelected = labelsVal.includes(label);
                    const styles     = LABEL_STYLES[label];
                    return (
                      <button
                        key={label}
                        type="button"
                        onMouseDown={(e) => toggleEditLabel(e, label)}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                          isSelected
                            ? styles.chip + ' border-transparent'
                            : styles.outline + ' bg-transparent'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Due date — display */}
            {dueDateLabel && !editing && (
              <p className={`mt-2.5 ml-4 flex items-center gap-1 text-xs font-medium ${DUE_TEXT_STYLES[dueDateStatus]}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Due: {dueDateLabel}
              </p>
            )}

            {/* Due date — edit mode */}
            {editing && (
              <div className="mt-2 ml-4 space-y-1">
                <label className="block text-xs font-medium text-gray-400 dark:text-gray-500">Due date</label>
                <input
                  type="date"
                  value={dueDateVal}
                  onChange={(e) => setDueDateVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
                    if (e.key === 'Escape') {
                      setEditing(false);
                      setTitleVal(card.title);
                      setDueDateVal(card.dueDate ? card.dueDate.split('T')[0] : '');
                      setLabelsVal(card.labels ?? []);
                    }
                  }}
                  className="w-full text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  style={{ background: '#252540', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '0.5rem', padding: '4px 8px' }}
                />
              </div>
            )}

            {/* ── Subtask preview ── */}
            {!editing && subtasks.length > 0 && (
              <div
                className="mt-3 ml-4 space-y-1.5 cursor-pointer"
                onClick={() => !snapshot.isDragging && setModalOpen(true)}
              >
                {/* Progress bar */}
                <div className="h-1 w-full rounded-full overflow-hidden"
                     style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      background: progress === 100
                        ? '#10B981'
                        : 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                    }}
                  />
                </div>
                {/* Count */}
                <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {completedCount}/{subtasks.length} subtasks
                  {completedCount === subtasks.length && (
                    <span className="ml-1.5 text-emerald-400">All done!</span>
                  )}
                </p>
                {/* First 2 incomplete subtask titles */}
                {subtasks
                  .filter((s) => !s.completed)
                  .slice(0, 2)
                  .map((s) => (
                    <div key={s._id} className="flex items-center gap-1.5">
                      <span
                        className="flex-shrink-0 w-3 h-3 rounded border"
                        style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                      />
                      <span
                        className="text-[11px] leading-tight truncate"
                        style={{ color: 'rgba(255,255,255,0.45)' }}
                      >
                        {s.title}
                      </span>
                    </div>
                  ))
                }
              </div>
            )}


            {/* Saving indicator */}
            {saving && (
              <p className="mt-1.5 ml-4 text-xs text-indigo-400 dark:text-indigo-500 animate-pulse">Saving…</p>
            )}
          </div>
        )}
      </Draggable>

      {/* Card detail modal */}
      {modalOpen && (
        <CardModal
          card={card}
          onClose={() => setModalOpen(false)}
          onUpdate={handleModalUpdate}
        />
      )}
    </>
  );
}
