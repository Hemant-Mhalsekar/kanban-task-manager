import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import Card from './Card';
import AddCardForm from './AddCardForm';

// Per-column accent colors and metadata
const COLUMN_CONFIG = {
  todo: {
    label:      'To Do',
    accent:     '#6366F1',
    dragOverBg: 'rgba(99,102,241,0.06)',
  },
  inprogress: {
    label:      'In Progress',
    accent:     '#F59E0B',
    dragOverBg: 'rgba(245,158,11,0.06)',
  },
  done: {
    label:      'Done',
    accent:     '#10B981',
    dragOverBg: 'rgba(16,185,129,0.06)',
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
      className="kanban-column flex flex-col w-full min-w-0 rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.85)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        borderTop: `3px solid ${config.accent}`,
      }}
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
            className="flex flex-col gap-3 px-3 pb-1 flex-1 overflow-y-auto max-h-[calc(100vh-220px)] transition-colors column-scroll"
            style={snapshot.isDraggingOver ? { backgroundColor: config.dragOverBg } : {}}
          >
            {/* Empty state */}
            {cards.length === 0 && !showForm && !snapshot.isDraggingOver && (
              isFiltering ? (
                <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-6 mb-2">
                  No cards match your search
                </p>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 mb-2 mx-1 flex flex-col items-center justify-center gap-2 py-6 rounded-xl transition-all duration-150 group"
                  style={{
                    border: `1.5px dashed ${config.accent}55`,
                    background: `${config.accent}06`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${config.accent}aa`;
                    e.currentTarget.style.background = `${config.accent}0f`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${config.accent}55`;
                    e.currentTarget.style.background = `${config.accent}06`;
                  }}
                >
                  <span
                    className="flex items-center justify-center rounded-full w-7 h-7 transition-transform duration-150 group-hover:scale-110"
                    style={{ background: `${config.accent}18`, color: config.accent }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-500 transition-colors">
                    No tasks yet
                  </span>
                </button>
              )
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

      {/* Add card button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center gap-1.5 px-4 py-3 text-sm text-gray-400 dark:text-gray-600 transition-all duration-150 border-t border-gray-100/80 dark:border-white/5 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-black/[0.02] dark:hover:bg-white/5"
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
