import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import { Zap, Sun, Moon, Search, Tag, X, ChevronDown, LayoutDashboard, BarChart2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCards, createCard, deleteCard, updateCard } from '../api/cards';
import Column from '../components/Column';
import { ALL_LABELS, LABEL_STYLES } from '../constants/labels';
import socket from '../socket';
import AIPriorityPanel from '../components/AIPriorityPanel';

const COLUMNS = ['todo', 'inprogress', 'done'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // ── Search & filter ─────────────────────────────────────────
  const [search, setSearch]               = useState('');
  const [priority, setPriority]           = useState('all');
  const [activeLabelFilters, setActiveLabelFilters] = useState(new Set());
  const [labelDropOpen, setLabelDropOpen] = useState(false);
  const labelDropRef                      = useRef(null);

  // Close label dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (labelDropRef.current && !labelDropRef.current.contains(e.target)) {
        setLabelDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        [...data].sort((a, b) => a.order - b.order)
      )
      .then(setCards)
      .catch(() => setError('Failed to load cards. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Real-time sync via Socket.io ─────────────────────────────
  useEffect(() => {
    socket.connect();

    const onCardCreated = (card) => {
      setCards((prev) =>
        prev.some((c) => c._id === card._id) ? prev : [...prev, card]
      );
    };
    const onCardUpdated = (card) => {
      setCards((prev) =>
        prev.map((c) => (c._id === card._id ? { ...c, ...card } : c))
      );
    };
    const onCardDeleted = ({ id }) => {
      setCards((prev) => prev.filter((c) => String(c._id) !== String(id)));
    };

    socket.on('card:created', onCardCreated);
    socket.on('card:updated', onCardUpdated);
    socket.on('card:deleted', onCardDeleted);

    return () => {
      socket.off('card:created', onCardCreated);
      socket.off('card:updated', onCardUpdated);
      socket.off('card:deleted', onCardDeleted);
      socket.disconnect();
    };
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

  // ── Update card ─────────────────────────────────────────────
  // `fullCard` is passed by CardModal after subtask mutations (the API already
  // returned the saved doc) so we skip the PUT call and merge directly.
  const handleUpdateCard = useCallback(async (id, data, fullCard) => {
    if (fullCard) {
      setCards((prev) => prev.map((c) => (c._id === id ? { ...c, ...fullCard } : c)));
      return fullCard;
    }
    const updated = await updateCard(id, data);
    setCards((prev) => prev.map((c) => (c._id === id ? { ...c, ...updated } : c)));
    return updated;
  }, []);

  // ── Logout ──────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Drag end handler ────────────────────────────────────────
  const handleDragEnd = useCallback(async (result) => {
    const { draggableId, source, destination } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const snapshot = [...cards];
    const srcCol = source.droppableId;
    const dstCol = destination.droppableId;

    const columnMap = {};
    COLUMNS.forEach((col) => {
      columnMap[col] = cards
        .filter((c) => c.column === col)
        .sort((a, b) => a.order - b.order);
    });

    const movedCard = { ...cards.find((c) => c._id === draggableId), column: dstCol };
    columnMap[srcCol] = columnMap[srcCol].filter((c) => c._id !== draggableId);

    if (srcCol === dstCol) {
      columnMap[dstCol].splice(destination.index, 0, movedCard);
    } else {
      columnMap[dstCol] = columnMap[dstCol].filter((c) => c._id !== draggableId);
      columnMap[dstCol].splice(destination.index, 0, movedCard);
    }

    const reindexed = COLUMNS.flatMap((col) =>
      columnMap[col].map((c, i) => ({ ...c, order: i }))
    );
    setCards(reindexed);

    try {
      await updateCard(draggableId, { column: dstCol, order: destination.index });
    } catch {
      setCards(snapshot);
      setError('Failed to save card position. Please try again.');
    }
  }, [cards]);

  // ── Derived: filtered card set ──────────────────────────────
  const trimmed = search.trim().toLowerCase();
  const isFiltering = trimmed !== '' || priority !== 'all' || activeLabelFilters.size > 0;

  const filteredCards = isFiltering
    ? cards.filter((c) => {
        const matchesSearch =
          !trimmed ||
          c.title.toLowerCase().includes(trimmed) ||
          (c.description && c.description.toLowerCase().includes(trimmed));
        const matchesPriority = priority === 'all' || c.priority === priority;
        const matchesLabels =
          activeLabelFilters.size === 0 ||
          [...activeLabelFilters].every((l) => (c.labels ?? []).includes(l));
        return matchesSearch && matchesPriority && matchesLabels;
      })
    : cards;

  // ── Split cards into columns ────────────────────────────────
  const cardsByColumn = COLUMNS.reduce((acc, col) => {
    acc[col] = filteredCards
      .filter((c) => c.column === col)
      .sort((a, b) => a.order - b.order);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200"
         style={{ backgroundColor: isDark ? '#0F1117' : '#F4F5F7' }}>

      {/* ── Header ── */}
      <header className="bg-white dark:bg-[#13151F] border-b border-gray-200/80 dark:border-white/5 px-6 h-14 flex items-center justify-between flex-shrink-0 transition-colors duration-200">
        {/* Logo */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-[15px] tracking-tight">
              TaskPilot
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-gray-900 dark:text-white bg-gray-100 dark:bg-white/8 font-medium transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Board
            </Link>
            <Link
              to="/analytics"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Analytics
            </Link>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block mr-1">
            {user?.name || user?.email}
          </span>

          {/* AI Suggestions button */}
          <button
            id="ai-suggestions-btn"
            onClick={() => setAiPanelOpen(true)}
            aria-label="Open AI priority suggestions"
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg
                       bg-indigo-600 hover:bg-indigo-700
                       text-white
                       shadow-sm hover:shadow-indigo-500/30 hover:shadow-md
                       transition-all duration-150"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Suggestions</span>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
          >
            {isDark
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Board area ── */}
      <main className="flex-1 px-6 py-5 flex flex-col min-h-0">

        {/* ── Toolbar row ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-shrink-0 tracking-tight">
            My Board
          </h1>

          {/* Filter group */}
          <div className="flex flex-1 items-center gap-2 sm:justify-end flex-wrap">

            {/* Grouped search + priority + labels container */}
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-white/8 bg-white dark:bg-[#13151F] overflow-hidden shadow-sm divide-x divide-gray-200 dark:divide-white/8 h-8">

              {/* Search */}
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  id="board-search"
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-40 pl-8 pr-3 text-sm bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:w-52 transition-all duration-200"
                />
              </div>

              {/* Priority */}
              <select
                id="board-priority-filter"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-8 text-sm bg-transparent text-gray-700 dark:text-gray-300 px-3 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="all">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              {/* Labels multi-select */}
              <div className="relative h-8" ref={labelDropRef}>
                <button
                  type="button"
                  onClick={() => setLabelDropOpen((o) => !o)}
                  className={`h-8 flex items-center gap-1.5 px-3 text-sm transition-colors ${
                    activeLabelFilters.size > 0
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Labels
                  {activeLabelFilters.size > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {activeLabelFilters.size}
                    </span>
                  )}
                  <ChevronDown className={`w-3 h-3 transition-transform ${labelDropOpen ? 'rotate-180' : ''}`} />
                </button>

                {labelDropOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-20 w-44 bg-white dark:bg-[#1A1D2E] border border-gray-200 dark:border-white/8 rounded-xl shadow-xl py-1.5">
                    {ALL_LABELS.map((label) => {
                      const isActive = activeLabelFilters.has(label);
                      const styles   = LABEL_STYLES[label];
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            setActiveLabelFilters((prev) => {
                              const next = new Set(prev);
                              isActive ? next.delete(label) : next.add(label);
                              return next;
                            });
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <span className={`flex-shrink-0 w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${
                            isActive ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isActive && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-2 h-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${styles.chip}`}>
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Clear filters button */}
            {isFiltering && (
              <button
                onClick={() => { setSearch(''); setPriority('all'); setActiveLabelFilters(new Set()); }}
                title="Clear filters"
                className="h-8 flex items-center gap-1.5 text-xs font-medium px-3 rounded-lg border border-gray-200 dark:border-white/8 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 bg-white dark:bg-[#13151F] transition-colors shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4 text-lg leading-none">×</button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COLUMNS.map((col) => (
              <div key={col} className="h-48 rounded-xl bg-white/60 dark:bg-white/5 animate-pulse" />
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

      {/* ── AI Priority Panel ── */}
      {aiPanelOpen && (
        <AIPriorityPanel onClose={() => setAiPanelOpen(false)} />
      )}
    </div>
  );
}
