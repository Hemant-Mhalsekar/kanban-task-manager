/**
 * Placeholder — Sidebar component will be implemented here.
 * It will list boards and allow switching between them.
 */
const Sidebar = () => {
  return (
    <aside className="w-64 min-h-screen bg-gray-800 text-white p-4 flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Boards</h2>
      <p className="text-gray-500 text-sm italic">No boards yet.</p>
    </aside>
  );
};

export default Sidebar;
