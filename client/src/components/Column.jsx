import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import Card from './Card';
import AddCardForm from './AddCardForm';

const COLUMN_STYLES = {
  todo:       { header: 'bg-slate-100 dark:bg-slate-700',  dot: 'bg-slate-400',   label: 'To Do'       },
  inprogress: { header: 'bg-blue-50 dark:bg-blue-900/40',  dot: 'bg-blue-500',    label: 'In Progress'  },
  done:       { header: 'bg-green-50 dark:bg-green-900/40', dot: 'bg-green-500',   label: 'Done'         },
};

export default function Column({ columnId, cards, onAddCard, onDeleteCard, onUpdateCard }) {
  const [showForm, setShowForm] = useState(false);
  const style = COLUMN_STYLES[columnId] || COLUMN_STYLES.todo;

  const handleSubmit = async (formData) => {
    await onAddCard({ ...formData, column: columnId });
    setShowForm(false);
  };

  return (
    <div className="flex flex-col w-full min-w-0 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
      {/* Column header */}
      <div className={`flex items-center gap-2 px-4 py-3 ${style.header}`}>
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} />
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide flex-1">
          {style.label}
        </h2>
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-400 bg-white dark:bg-gray-700 rounded-full px-2 py-0.5 border border-gray-200 dark:border-gray-600">
          {cards.length}
        </span>
      </div>

      {/* Droppable cards area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-2 px-3 py-3 flex-1 overflow-y-auto max-h-[calc(100vh-220px)] transition-colors ${
              snapshot.isDraggingOver ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
            }`}
          >
            {cards.length === 0 && !showForm && !snapshot.isDraggingOver && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">No cards yet</p>
            )}

            {cards.map((card, index) => (
              <Card key={card._id} card={card} index={index} onDelete={onDeleteCard} onUpdate={onUpdateCard} />
            ))}

            {/* Required placeholder — keeps column height stable while dragging */}
            {provided.placeholder}

            {showForm && (
              <AddCardForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
            )}
          </div>
        )}
      </Droppable>

      {/* Add card button */}
      {!showForm && (
        <div className="px-3 pb-3">
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-1.5 justify-center text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 rounded-xl py-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add card
          </button>
        </div>
      )}
    </div>
  );
}
