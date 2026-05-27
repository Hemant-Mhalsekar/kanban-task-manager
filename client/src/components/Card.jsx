import { useState, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { ALL_LABELS, LABEL_STYLES } from '../constants/labels';

const PRIORITY_STYLES = {
  low:    'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-red-100 text-red-700',
};

// ── Due date helpers ─────────────────────────────────────────────
function formatDueDate(isoString) {
  if (!isoString) return null;
  // Parse as local date using the date portion only to avoid TZ shifts
  const [year, month, day] = isoString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getDueDateStatus(isoString) {
  if (!isoString) return null;
  const [year, month, day] = isoString.split('T')[0].split('-').map(Number);
  const due   = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due < today)  return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  return 'future';
}

const DUE_TEXT_STYLES = {
  overdue: 'text-red-500 dark:text-red-400',
  today:   'text-orange-500 dark:text-orange-400',
  future:  'text-gray-400 dark:text-gray-500',
};

export default function Card({ card, index, onDelete, onUpdate }) {
  const [hovered, setHovered]       = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [editing, setEditing]       = useState(false);
  const [titleVal, setTitleVal]     = useState(card.title);
  // Store dueDate as YYYY-MM-DD string (what <input type="date"> uses)
  const [dueDateVal, setDueDateVal] = useState(
    card.dueDate ? card.dueDate.split('T')[0] : ''
  );
  const [labelsVal, setLabelsVal]   = useState(card.labels ?? []);
  const [saving, setSaving]         = useState(false);
  const inputRef                    = useRef(null);

  // ── Delete ──────────────────────────────────────────────────
  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try { await onDelete(card._id); }
    finally { setDeleting(false); }
  };

  // ── Inline edit ─────────────────────────────────────────────
  const startEdit = (e) => {
    e.stopPropagation();          // don't trigger drag
    setTitleVal(card.title);
    setDueDateVal(card.dueDate ? card.dueDate.split('T')[0] : '');
    setLabelsVal(card.labels ?? []);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const toggleEditLabel = (e, label) => {
    e.preventDefault();           // don't submit or blur
    e.stopPropagation();
    setLabelsVal((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const commitEdit = async () => {
    const trimmed = titleVal.trim();
    if (!trimmed) {
      // Revert if title cleared
      setEditing(false);
      setTitleVal(card.title);
      setDueDateVal(card.dueDate ? card.dueDate.split('T')[0] : '');
      setLabelsVal(card.labels ?? []);
      return;
    }

    const rawCardDue    = card.dueDate ? card.dueDate.split('T')[0] : '';
    const titleChanged  = trimmed !== card.title;
    const dueChanged    = dueDateVal !== rawCardDue;
    // Compare sorted arrays to detect label changes
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

  // ── Computed due date info ───────────────────────────────────
  const dueDateStatus = getDueDateStatus(card.dueDate);
  const dueDateLabel  = formatDueDate(card.dueDate);

  return (
    <Draggable draggableId={card._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`relative bg-white dark:bg-gray-700 rounded-xl border px-4 py-3 transition-all select-none ${
            snapshot.isDragging
              ? 'border-indigo-400 shadow-lg rotate-1 scale-105'
              : dueDateStatus === 'overdue'
                ? 'border-red-300 dark:border-red-600 shadow-sm hover:shadow-md'
                : 'border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md'
          }`}
        >
          {/* Delete button — hover only, hidden while dragging or editing */}
          {hovered && !snapshot.isDragging && !editing && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete card"
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <span className="text-xs">…</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}

          {/* Priority badge */}
          <span className={`inline-block text-xs font-semibold rounded-full px-2 py-0.5 mb-2 ${PRIORITY_STYLES[card.priority] || PRIORITY_STYLES.medium}`}>
            {card.priority}
          </span>

          {/* Title — click to edit inline */}
          {editing ? (
            <input
              ref={inputRef}
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="w-full text-sm font-semibold text-gray-800 dark:text-gray-100 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-600 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-6 disabled:opacity-60"
            />
          ) : (
            <p
              onClick={startEdit}
              title="Click to edit"
              className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug pr-6 cursor-text hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {card.title}
            </p>
          )}

          {/* Description */}
          {card.description && !editing && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
              {card.description}
            </p>
          )}

          {/* Labels — display (when not editing) */}
          {!editing && card.labels && card.labels.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
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

          {/* Labels — inline chip toggler (when editing) */}
          {editing && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Labels</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_LABELS.map((label) => {
                  const isSelected = labelsVal.includes(label);
                  const styles = LABEL_STYLES[label];
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

          {/* Due date — display (when not editing) */}
          {dueDateLabel && !editing && (
            <p className={`mt-2 flex items-center gap-1 text-xs font-medium ${DUE_TEXT_STYLES[dueDateStatus]}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Due: {dueDateLabel}
            </p>
          )}

          {/* Due date — inline editor (shown while editing) */}
          {editing && (
            <div className="mt-2 space-y-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Due date</label>
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
                className="w-full text-xs text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          )}

          {/* Saving indicator */}
          {saving && (
            <p className="mt-1 text-xs text-indigo-400 animate-pulse">Saving…</p>
          )}
        </div>
      )}
    </Draggable>
  );
}
