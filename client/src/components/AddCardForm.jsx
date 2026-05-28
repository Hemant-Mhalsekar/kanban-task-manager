import { useState } from 'react';
import { ALL_LABELS, LABEL_STYLES } from '../constants/labels';

const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

// Shared inline style for all text inputs / textarea / select in this form
const fieldStyle = {
  background: '#1E1E35',
  border: '1px solid rgba(99,102,241,0.2)',
  color: 'rgba(255,255,255,0.85)',
  borderRadius: '0.5rem',
  width: '100%',
  fontSize: '0.875rem',
  padding: '6px 10px',
  outline: 'none',
};

export default function AddCardForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const toggleLabel = (label) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit({ ...form, labels: selectedLabels });
      setForm({ title: '', description: '', priority: 'medium', dueDate: '' });
      setSelectedLabels([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 rounded-xl p-3 space-y-2"
      style={{
        background: '#1b1b2e',
        border: '1px solid rgba(99,102,241,0.2)',
      }}
    >
      {error && (
        <p className="text-xs font-medium" style={{ color: '#f87171' }}>{error}</p>
      )}

      {/* Title */}
      <input
        name="title"
        type="text"
        placeholder="Card title"
        value={form.title}
        onChange={handleChange}
        autoFocus
        style={{
          ...fieldStyle,
          background: '#252540',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.15)'; }}
        onBlur={(e)  => { e.target.style.borderColor = 'rgba(99,102,241,0.2)'; e.target.style.boxShadow = 'none'; }}
      />

      {/* Description */}
      <textarea
        name="description"
        placeholder="Description (optional)"
        value={form.description}
        onChange={handleChange}
        rows={2}
        style={{
          ...fieldStyle,
          background: '#252540',
          resize: 'none',
        }}
        onFocus={(e) => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.15)'; }}
        onBlur={(e)  => { e.target.style.borderColor = 'rgba(99,102,241,0.2)'; e.target.style.boxShadow = 'none'; }}
      />

      {/* Priority — global select rule in index.css already handles bg/color/border */}
      <select
        name="priority"
        value={form.priority}
        onChange={handleChange}
        style={{ ...fieldStyle, background: '#252540', cursor: 'pointer' }}
      >
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p.charAt(0).toUpperCase() + p.slice(1)} priority
          </option>
        ))}
      </select>

      {/* Due date */}
      <div className="space-y-1">
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
          Due Date <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span>
        </label>
        <input
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={handleChange}
          style={{ ...fieldStyle, background: '#252540' }}
          onFocus={(e) => { e.target.style.borderColor = 'rgba(99,102,241,0.6)'; e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.15)'; }}
          onBlur={(e)  => { e.target.style.borderColor = 'rgba(99,102,241,0.2)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Label chip picker */}
      <div className="space-y-1">
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
          Labels <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_LABELS.map((label) => {
            const isSelected = selectedLabels.includes(label);
            const styles = LABEL_STYLES[label];
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleLabel(label)}
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                  isSelected
                    ? styles.chip + ' border-transparent'
                    : styles.outline + ' bg-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 text-sm font-medium rounded-lg py-1.5 transition-colors text-white"
          style={{ background: loading ? 'rgba(99,102,241,0.5)' : '#4F46E5' }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#4338CA'; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#4F46E5'; }}
        >
          {loading ? 'Adding…' : 'Add card'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 text-sm font-medium rounded-lg py-1.5 transition-colors"
          style={{
            background: 'transparent',
            border: '1px solid rgba(99,102,241,0.25)',
            color: 'rgba(255,255,255,0.6)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
