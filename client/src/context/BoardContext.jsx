import { createContext, useContext, useState } from 'react';

/**
 * BoardContext
 * Placeholder context for Kanban board state.
 * Boards, columns, and tasks will be managed here.
 */
const BoardContext = createContext(null);

export const BoardProvider = ({ children }) => {
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);

  const value = {
    boards,
    setBoards,
    activeBoard,
    setActiveBoard,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};

export default BoardContext;
