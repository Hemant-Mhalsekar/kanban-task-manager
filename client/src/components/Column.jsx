import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import Card from './Card';
import AddCardForm from './AddCardForm';

// Per-column accent colors and metadata
const COLUMN_CONFIG = {
  todo: {
    label:      'To Do',
    accent:     '#6366F1',            // indigo
    hoverBg:    'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
    hoverText:  'hover:text-indigo-600 dark:hover:text-indigo-400',
    dragOverBg: 'bg-indigo-50/60 dark:bg-indigo-500/10',
  },
  inprogress: {
    label:      'In Progress',
    accent:     '#F59E0B',            // amber
    hoverBg:    'hover:bg-amber-50 dark:hover:bg-amber-500/10',
    hoverText:  'hover:text-amber-600 dark:hover:text-amber-400',
    dragOverBg: 'bg-amber-50/60 dark:bg-amber-500/10',
  },
  done: {
    label:      'Done',
    accent:     '#10B981',            // emerald
    hoverBg:    'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
    hoverText:  'hover:text-emerald-600 dark:hover:text-emerald-400',
    dragOverBg: 'bg-emerald-50/60 dark:bg-emerald-500/10',
  },
};

export default function Column({ columnId, cards, onAddCard, onDeleteCard, onUpdateCard, isFiltering, focusIds }) {
  const [showForm, setShowForm] = useState(false);
  const config = COLUMN_CONFIG[columnId] || COLUMN_CONFIG.todo;

  const handleSubmit = async (formData) => {
    await onAddCard({ ...formData, column: columnId });
    setShowForm(false);
  };

  return (
    <div
      className="flex flex-col w-full min-w-0 rounded-xl bg-white dark:bg-[#13151F] border border-gray-200/70 dark:border-white/5 shadow-sm overflow-hidden transition-colors duration-200"
      style={{ borderTop: `3px solid ${config.accent}` }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5">
        <h2 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest flex-1">
          {config.label}
        </h2>
        <span
          className="text-xs font-semibold rounded-full px-2 py-0.5 tabular-nums"
          style={{
            backgroundColor: `${config.accent}18`,
            color: config.accent,
          }}
        >
          {cards.length}
        </span>
      </div>

      {/* Droppable cards area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-3 px-3 pb-1 flex-1 overflow-y-auto max-h-[calc(100vh-220px)] transition-colors column-scroll ${
              snapshot.isDraggingOver ? config.dragOverBg : ''
            }`}
          >
            {cards.length === 0 && !showForm && !snapshot.isDraggingOver && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-6 mb-2">
                {isFiltering ? 'No cards match your search' : 'No cards yet'}
              </p>
            )}

            {cards.map((card, index) => (
              <Card key={card._id} card={card} index={index} onDelete={onDeleteCard} onUpdate={onUpdateCard} isFocused={focusIds?.has(card._id)} />
            ))}

            {provided.placeholder}

            {showForm && (
              <AddCardForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
            )}
          </div>
        )}
      </Droppable>

      {/* Add card button — full width, flat, muted */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className={`w-full flex items-center gap-1.5 px-4 py-3 text-sm text-gray-400 dark:text-gray-600 transition-colors ${config.hoverBg} ${config.hoverText} border-t border-gray-100 dark:border-white/5`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add card
        </button>
      )}
    </div>
  );
}
