import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import { useAuth } from '../context/AuthContext';
import { getCards, createCard, deleteCard, updateCard } from '../api/cards';
import Column from '../components/Column';

const COLUMNS = ['todo', 'inprogress', 'done'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Fetch cards on mount — sorted by column+order so positions persist ──
  useEffect(() => {
    getCards()
      .then((data) =>
        // Belt-and-suspenders sort: backend already sorts, but keep it here too
        [...data].sort((a, b) => a.order - b.order)
      )
      .then(setCards)
      .catch(() => setError('Failed to load cards. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Add card ────────────────────────────────────────────────
  const handleAddCard = useCallback(async (data) => {
    const newCard = await createCard(data);
    setCards((prev) => [...prev, newCard]);
  }, []);

  // ── Delete card ─────────────────────────────────────────────
  const handleDeleteCard = useCallback(async (id) => {
    await deleteCard(id);
    setCards((prev) => prev.filter((c) => c._id !== id));
  }, []);

  // ── Update card (title edit) ────────────────────────────────
  const handleUpdateCard = useCallback(async (id, data) => {
    const updated = await updateCard(id, data);
    setCards((prev) => prev.map((c) => (c._id === id ? { ...c, ...updated } : c)));
  }, []);

  // ── Logout ──────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Drag end handler ────────────────────────────────────────
  const handleDragEnd = useCallback(async (result) => {
    const { draggableId, source, destination } = result;

    // Dropped outside any droppable, or same spot → do nothing
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // ── Optimistic update ──────────────────────────────────────
    // Snapshot current state so we can roll back on failure
    setCards((prev) => {
      const updated = prev.map((c) =>
        c._id === draggableId
          ? { ...c, column: destination.droppableId, order: destination.index }
          : c
      );

      // Re-index `order` for all cards in the affected columns
      const srcCol = source.droppableId;
      const dstCol = destination.droppableId;

      // Build column arrays post-move
      const columnMap = {};
      COLUMNS.forEach((col) => {
        columnMap[col] = updated
          .filter((c) => c.column === col)
          .sort((a, b) => a.order - b.order);
      });

      // Remove card from source column list and insert into dest
      const movedCard = prev.find((c) => c._id === draggableId);
      const srcCards = columnMap[srcCol].filter((c) => c._id !== draggableId);
      const dstCards =
        srcCol === dstCol
          ? srcCards
          : columnMap[dstCol].filter((c) => c._id !== draggableId);

      dstCards.splice(destination.index, 0, {
        ...movedCard,
        column: dstCol,
      });

      // Flatten back with correct order values
      const reindexed = [
        ...srcCards.map((c, i) => ({ ...c, order: i })),
        ...(srcCol === dstCol
          ? dstCards.map((c, i) => ({ ...c, order: i }))
          : dstCards.map((c, i) => ({ ...c, order: i }))),
        ...COLUMNS.filter((col) => col !== srcCol && col !== dstCol).flatMap(
          (col) => columnMap[col]
        ),
      ];

      return reindexed;
    });

    // ── Persist to backend ─────────────────────────────────────
    // Snapshot before optimistic update for rollback
    const snapshot = cards;
    try {
      await updateCard(draggableId, {
        column: destination.droppableId,
        order: destination.index,
      });
    } catch {
      // Revert on failure
      setCards(snapshot);
      setError('Failed to save card position. Please try again.');
    }
  }, [cards]);

  // ── Split cards into columns (preserving order) ─────────────
  const cardsByColumn = COLUMNS.reduce((acc, col) => {
    acc[col] = cards
      .filter((c) => c.column === col)
      .sort((a, b) => a.order - b.order);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ── Topbar ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800 text-base tracking-tight">Kanban</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">
            {user?.name || user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Board area ── */}
      <main className="flex-1 px-6 py-6">
        <h1 className="text-xl font-bold text-gray-800 mb-5">My Board</h1>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4 text-lg leading-none">×</button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COLUMNS.map((col) => (
              <div key={col} className="h-48 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {COLUMNS.map((col) => (
                <Column
                  key={col}
                  columnId={col}
                  cards={cardsByColumn[col]}
                  onAddCard={handleAddCard}
                  onDeleteCard={handleDeleteCard}
                  onUpdateCard={handleUpdateCard}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </main>
    </div>
  );
}
