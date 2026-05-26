import Sidebar from '../components/Sidebar';

/**
 * BoardPage — Placeholder page for the main Kanban board view.
 * Will render columns (To Do, In Progress, Done) with draggable task cards.
 */
const BoardPage = () => {
  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-100 overflow-x-auto">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">Select or create a board to get started.</h2>
        <p className="text-gray-500 text-sm">Columns and tasks will appear here.</p>
      </main>
    </div>
  );
};

export default BoardPage;
