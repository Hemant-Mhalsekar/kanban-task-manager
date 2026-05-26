import { useState, useRef } from 'react';
import { Draggable } from '@hello-pangea/dnd';

const PRIORITY_STYLES = {
  low:    'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-red-100 text-red-700',
};

export default function Card({ card, index, onDelete, onUpdate }) {
  const [hovered, setHovered]     = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [editing, setEditing]     = useState(false);
  const [titleVal, setTitleVal]   = useState(card.title);
  const [saving, setSaving]       = useState(false);
  const inputRef                  = useRef(null);

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
    setEditing(true);
    // autofocus happens via ref below after render
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = async () => {
    const trimmed = titleVal.trim();
    if (!trimmed || trimmed === card.title) {
      setEditing(false);
      setTitleVal(card.title);
      return;
    }
    setSaving(true);
    try {
      await onUpdate(card._id, { title: trimmed });
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { setEditing(false); setTitleVal(card.title); }
  };

  return (
    <Draggable draggableId={card._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`relative bg-white rounded-xl border px-4 py-3 transition-all select-none ${
            snapshot.isDragging
              ? 'border-indigo-400 shadow-lg rotate-1 scale-105'
              : 'border-gray-200 shadow-sm hover:shadow-md'
          }`}
        >
          {/* Delete button — hover only, hidden while dragging or editing */}
          {hovered && !snapshot.isDragging && !editing && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete card"
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
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
              className="w-full text-sm font-semibold text-gray-800 bg-indigo-50 border border-indigo-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-6 disabled:opacity-60"
            />
          ) : (
            <p
              onClick={startEdit}
              title="Click to edit"
              className="text-sm font-semibold text-gray-800 leading-snug pr-6 cursor-text hover:text-indigo-600 transition-colors"
            >
              {card.title}
            </p>
          )}

          {/* Description */}
          {card.description && !editing && (
            <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-3">
              {card.description}
            </p>
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
