import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Zap, LayoutDashboard, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAnalytics } from '../api/analytics';

// ── Colour palettes ──────────────────────────────────────────────
const COMPLETION_COLORS = ['#818CF8', '#1e1e40'];  // completed / pending (always dark)

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

// ── Stat card — always dark ──────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div
      className="rounded-xl px-5 py-4 flex flex-col gap-1"
      style={{
        background: '#252540',
        borderLeft: `3px solid ${accent}`,
        border: '1px solid rgba(99,102,241,0.15)',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider"
         style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-xl ${className}`}
         style={{ background: 'rgba(255,255,255,0.05)' }} />
  );
}

// ── Custom tooltip ───────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 shadow-lg text-xs"
         style={{ background: '#1A1A2E', border: '1px solid rgba(99,102,241,0.25)' }}>
      {label && <p className="font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color }} className="font-medium">
          {p.name}: <span style={{ color: 'white' }}>{p.value}</span>
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

  // Always-dark: ensure dark class is set
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

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
        { name: 'To Do',       value: data.tasksByColumn.todo,      fill: COLUMN_COLORS.todo       },
        { name: 'In Progress', value: data.tasksByColumn.inprogress, fill: COLUMN_COLORS.inprogress },
        { name: 'Done',        value: data.tasksByColumn.done,       fill: COLUMN_COLORS.done       },
      ]
    : [];

  const axisStyle = { fill: 'rgba(255,255,255,0.4)', fontSize: 11 };
  const gridColor = 'rgba(255,255,255,0.08)';
  const isEmpty   = data?.totalTasks === 0;

  // Chart card style
  const chartCard = {
    background: '#16162A',
    border: '1px solid rgba(99,102,241,0.15)',
    borderRadius: '0.75rem',
    padding: '1.25rem',
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#0D0D1F' }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 px-6 h-14 flex items-center justify-between flex-shrink-0"
        style={{
          background: '#13132A',
          borderBottom: '1px solid rgba(99,102,241,0.3)',
          boxShadow: '0 1px 20px rgba(99,102,241,0.1)',
        }}
      >
        <div className="flex items-center gap-5">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-white text-[15px] tracking-tight">TaskPilot</span>
          </div>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Board
            </Link>
            <Link
              to="/analytics"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{ color: 'white', background: 'rgba(99,102,241,0.2)' }}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Analytics
            </Link>
          </nav>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm hidden sm:block mr-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {user?.name || user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
        <h1 className="text-lg font-bold text-white tracking-tight mb-5">
          Productivity Analytics
        </h1>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl px-4 py-3 text-sm"
               style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                 style={{ background: 'rgba(99,102,241,0.15)' }}>
              <BarChart2 className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">No data yet</h2>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
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

            {/* Row 1 — 5 stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
                sub="past deadline"
                accent="#EF4444"
              />
              <StatCard
                label="Done This Week"
                value={data.tasksCompletedThisWeek}
                sub="last 7 days"
                accent="#6366F1"
              />
            </div>

            {/* Row 2 — Pie + Priority bar chart */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Completion pie chart */}
              <div style={chartCard}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
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
                        <Cell key={i} fill={COMPLETION_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      formatter={(val) => (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{val}</span>
                      )}
                    />
                    {/* Centre label */}
                    <text
                      x="50%" y="44%" textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: 26, fontWeight: 700, fill: '#fff' }}
                    >
                      {data.completionRate}%
                    </text>
                    <text
                      x="50%" y="55%" textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }}
                    >
                      complete
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Priority bar chart */}
              <div style={chartCard}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Tasks by Priority
                </h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={priorityData} barSize={40} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={gridColor} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
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
            <div style={chartCard}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Tasks by Column
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={columnData} barSize={56} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
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
