import { useState } from 'react';

const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

export default function AddCardForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit(form);
      setForm({ title: '', description: '', priority: 'medium' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-3 space-y-2 transition-colors"
    >
      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}

      <input
        name="title"
        type="text"
        placeholder="Card title"
        value={form.title}
        onChange={handleChange}
        autoFocus
        className="w-full text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
      />

      <textarea
        name="description"
        placeholder="Description (optional)"
        value={form.description}
        onChange={handleChange}
        rows={2}
        className="w-full text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none placeholder-gray-400 dark:placeholder-gray-500"
      />

      <select
        name="priority"
        value={form.priority}
        onChange={handleChange}
        className="w-full text-sm text-gray-800 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white dark:bg-gray-700"
      >
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p.charAt(0).toUpperCase() + p.slice(1)} priority
          </option>
        ))}
      </select>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-1.5 transition-colors"
        >
          {loading ? 'Adding…' : 'Add card'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg py-1.5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
