import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Zap, LayoutDashboard, BarChart2, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAnalytics } from '../api/analytics';

// ── Colour palettes ──────────────────────────────────────────────
const COMPLETION_COLORS = ['#6366F1', '#E5E7EB'];       // completed / pending (light)
const COMPLETION_COLORS_DARK = ['#818CF8', '#374151'];  // completed / pending (dark)

const PRIORITY_COLORS = {
  low:    '#22C55E',
  medium: '#F59E0B',
  high:   '#EF4444',
};

const COLUMN_COLORS = {
  todo:       '#6366F1',
  inprogress: '#F59E0B',
  done:       '#10B981',
};

// ── Stat card ────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div
      className="bg-white dark:bg-[#13151F] rounded-xl border border-gray-200/70 dark:border-white/5 shadow-sm px-5 py-4 flex flex-col gap-1"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-600">{sub}</p>}
    </div>
  );
}

// ── Skeleton block ───────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-xl bg-gray-200 dark:bg-white/5 ${className}`} />
  );
}

// ── Custom tooltip ───────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1A1D2E] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color }} className="font-medium">
          {p.name}: <span className="text-gray-900 dark:text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleDark = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setError('Failed to load analytics. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived chart data ───────────────────────────────────────
  const pieData = data
    ? [
        { name: 'Completed', value: data.completedTasks },
        { name: 'Pending',   value: data.pendingTasks   },
      ]
    : [];

  const priorityData = data
    ? [
        { name: 'Low',    value: data.tasksByPriority.low,    fill: PRIORITY_COLORS.low    },
        { name: 'Medium', value: data.tasksByPriority.medium, fill: PRIORITY_COLORS.medium },
        { name: 'High',   value: data.tasksByPriority.high,   fill: PRIORITY_COLORS.high   },
      ]
    : [];

  const columnData = data
    ? [
        { name: 'To Do',       value: data.tasksByColumn.todo,       fill: COLUMN_COLORS.todo       },
        { name: 'In Progress', value: data.tasksByColumn.inprogress,  fill: COLUMN_COLORS.inprogress },
        { name: 'Done',        value: data.tasksByColumn.done,        fill: COLUMN_COLORS.done       },
      ]
    : [];

  const pieColors = isDark ? COMPLETION_COLORS_DARK : COMPLETION_COLORS;

  const axisStyle  = { fill: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11 };
  const gridColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const isEmpty = data?.totalTasks === 0;

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{ backgroundColor: isDark ? '#0F1117' : '#F4F5F7' }}
    >
      {/* ── Header ── */}
      <header className="bg-white dark:bg-[#13151F] border-b border-gray-200/80 dark:border-white/5 px-6 h-14 flex items-center justify-between flex-shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-5">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-[15px] tracking-tight">TaskPilot</span>
          </div>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Board
            </Link>
            <Link
              to="/analytics"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-gray-900 dark:text-white bg-gray-100 dark:bg-white/8 font-medium transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Analytics
            </Link>
          </nav>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block mr-1">
            {user?.name || user?.email}
          </span>
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight mb-5">
          Productivity Analytics
        </h1>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
            <Skeleton className="h-64" />
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
              <BarChart2 className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">No data yet</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
              Create some tasks on your board to see analytics here.
            </p>
            <Link
              to="/dashboard"
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go to Board
            </Link>
          </div>
        )}

        {/* ── Analytics content ── */}
        {!loading && !error && !isEmpty && data && (
          <div className="space-y-4">

            {/* Row 1 — 4 stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Tasks"
                value={data.totalTasks}
                sub="all time"
                accent="#6366F1"
              />
              <StatCard
                label="Completed"
                value={data.completedTasks}
                sub={`${data.completionRate}% completion rate`}
                accent="#10B981"
              />
              <StatCard
                label="Pending"
                value={data.pendingTasks}
                sub="in progress or to do"
                accent="#F59E0B"
              />
              <StatCard
                label="Overdue"
                value={data.overdueTasks}
                sub={`${data.tasksCompletedThisWeek} done this week`}
                accent="#EF4444"
              />
            </div>

            {/* Row 2 — Pie + Priority bar chart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Completion pie chart */}
              <div className="bg-white dark:bg-[#13151F] rounded-xl border border-gray-200/70 dark:border-white/5 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Completion Rate
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={pieData[0].value > 0 && pieData[1].value > 0 ? 3 : 0}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={pieColors[i]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      formatter={(val) => (
                        <span className="text-xs text-gray-600 dark:text-gray-400">{val}</span>
                      )}
                    />
                    {/* Centre label */}
                    <text
                      x="50%" y="44%" textAnchor="middle" dominantBaseline="middle"
                      className="fill-gray-900 dark:fill-white"
                      style={{ fontSize: 26, fontWeight: 700, fill: isDark ? '#fff' : '#111827' }}
                    >
                      {data.completionRate}%
                    </text>
                    <text
                      x="50%" y="55%" textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: 11, fill: isDark ? '#6B7280' : '#9CA3AF' }}
                    >
                      complete
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Priority bar chart */}
              <div className="bg-white dark:bg-[#13151F] rounded-xl border border-gray-200/70 dark:border-white/5 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Tasks by Priority
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={priorityData} barSize={40} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={gridColor} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                    <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
                      {priorityData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 3 — Tasks by column (wide) */}
            <div className="bg-white dark:bg-[#13151F] rounded-xl border border-gray-200/70 dark:border-white/5 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Tasks by Column
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={columnData} barSize={56} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
                    {columnData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
