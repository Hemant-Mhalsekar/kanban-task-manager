import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, BarChart2, Target, Sparkles } from 'lucide-react';

/* ─── Shared left-panel branding (same as Login) ─────────────── */
function BrandPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-3/5 relative flex-col justify-between p-12 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
    >
      {/* Decorative orb */}
      <div
        className="absolute"
        style={{
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        className="absolute"
        style={{
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,181,253,0.25) 0%, transparent 70%)',
          top: '-60px',
          right: '-60px',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-xl shadow-lg"
          style={{
            width: '40px',
            height: '40px',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <Zap className="text-white fill-white" style={{ width: '20px', height: '20px' }} />
        </div>
        <span className="font-bold text-white text-xl tracking-tight">TaskPilot</span>
      </div>

      {/* Hero text */}
      <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
        <h1
          className="font-extrabold text-white leading-none mb-5"
          style={{ fontSize: 'clamp(2.5rem, 4vw, 3.75rem)', letterSpacing: '-0.03em' }}
        >
          Get things<br />done.
        </h1>
        <p className="text-indigo-200 leading-relaxed mb-12" style={{ fontSize: '1.05rem', maxWidth: '380px' }}>
          AI-powered task management that keeps you focused and productive every single day.
        </p>

        {/* Feature highlights */}
        <div className="space-y-6">
          {[
            {
              icon: <Sparkles style={{ width: '20px', height: '20px' }} />,
              title: 'AI Priority Suggestions',
              desc: 'Smart ranking so you always know what to tackle first.',
            },
            {
              icon: <Target style={{ width: '20px', height: '20px' }} />,
              title: 'Daily Focus Mode',
              desc: 'Block distractions and stay locked-in on what matters.',
            },
            {
              icon: <BarChart2 style={{ width: '20px', height: '20px' }} />,
              title: 'Productivity Analytics',
              desc: 'Visual insights to spot patterns and improve over time.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-lg text-indigo-200"
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                {icon}
              </div>
              <div>
                <p className="font-semibold text-white text-sm mb-0.5">{title}</p>
                <p className="text-indigo-300 text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(79,70,229,0.4), transparent)' }}
      />
    </div>
  );
}

/* ─── Register page ───────────────────────────────────────────── */
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex dark:bg-[#0F1117]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
      />

      {/* ── Left branding panel ── */}
      <BrandPanel />

      {/* ── Mobile top banner ── */}
      <div
        className="lg:hidden w-full fixed top-0 left-0 right-0 z-20 flex items-center gap-3 px-5 py-4"
        style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
      >
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)' }}
        >
          <Zap className="text-white fill-white" style={{ width: '16px', height: '16px' }} />
        </div>
        <span className="font-bold text-white text-base tracking-tight">TaskPilot</span>
      </div>

      {/* ── Right form panel ── */}
      <div className="w-full lg:w-2/5 flex flex-col items-center justify-center px-6 pt-24 pb-10 lg:pt-0 lg:pb-0 bg-white dark:bg-[#0F1117]">
        <div className="w-full" style={{ maxWidth: '380px' }}>

          {/* Heading */}
          <h2
            className="font-bold text-gray-900 dark:text-white mb-1"
            style={{ fontSize: '1.75rem', letterSpacing: '-0.02em' }}
          >
            Create account
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Already have one?{' '}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Sign in
            </Link>
          </p>

          {/* Error banner */}
          {error && (
            <div
              className="mb-5 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-start gap-2"
              style={{
                background: 'rgba(254,226,226,0.7)',
                border: '1px solid rgba(252,165,165,0.5)',
              }}
            >
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5"
              >
                Full name
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm transition-all outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5"
              >
                Email address
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 text-sm transition-all outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-4 py-3 pr-12 text-sm transition-all outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <EyeOff style={{ width: '17px', height: '17px' }} />
                    : <Eye style={{ width: '17px', height: '17px' }} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full rounded-xl font-semibold text-white text-sm py-3.5 mt-1 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? '#6366f1'
                  : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(79,70,229,0.4)',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(79,70,229,0.55)';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = '0 4px 15px rgba(79,70,229,0.4)';
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          {/* AI badge */}
          <div className="mt-10 flex justify-center">
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-600 px-3 py-1.5 rounded-full"
              style={{ border: '1px solid rgba(156,163,175,0.25)' }}
            >
              <Sparkles style={{ width: '12px', height: '12px' }} />
              Powered by AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
