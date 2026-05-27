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
  const [isDark, setIsDark] = useState(false);

  // ── Search & filter ─────────────────────────────────────────
  const [search, setSearch]     = useState('');
  const [priority, setPriority] = useState('all');

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

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

  // ── Derived: filtered card set ──────────────────────────────
  const trimmed = search.trim().toLowerCase();
  const isFiltering = trimmed !== '' || priority !== 'all';

  const filteredCards = isFiltering
    ? cards.filter((c) => {
        const matchesSearch =
          !trimmed ||
          c.title.toLowerCase().includes(trimmed) ||
          (c.description && c.description.toLowerCase().includes(trimmed));
        const matchesPriority = priority === 'all' || c.priority === priority;
        return matchesSearch && matchesPriority;
      })
    : cards;

  // ── Split cards into columns (preserving order) ─────────────
  const cardsByColumn = COLUMNS.reduce((acc, col) => {
    acc[col] = filteredCards
      .filter((c) => c.column === col)
      .sort((a, b) => a.order - b.order);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      {/* ── Topbar ── */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800 dark:text-gray-100 text-base tracking-tight">Kanban</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
            {user?.name || user?.email}
          </span>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors"
          >
            {isDark ? (
              /* Sun icon */
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              /* Moon icon */
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 border border-gray-200 dark:border-gray-600 hover:border-red-200 dark:hover:border-red-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Board area ── */}
      <main className="flex-1 px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex-shrink-0">My Board</h1>

          {/* ── Search + filter toolbar ── */}
          <div className="flex flex-1 items-center gap-2 sm:justify-end">

            {/* Search input */}
            <div className="relative flex-1 sm:max-w-xs">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="board-search"
                type="text"
                placeholder="Search cards…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
              />
            </div>

            {/* Priority dropdown */}
            <select
              id="board-priority-filter"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors cursor-pointer"
            >
              <option value="all">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            {/* Clear button — only when a filter is active */}
            {isFiltering && (
              <button
                onClick={() => { setSearch(''); setPriority('all'); }}
                title="Clear filters"
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-600 bg-white dark:bg-gray-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>

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
              <div key={col} className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
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
                  isFiltering={isFiltering}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </main>
    </div>
  );
}
