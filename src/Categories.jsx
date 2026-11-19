import { useEffect, useState } from 'react';
import { adminApi } from './api.js';
import { Alert, errorMessage } from './ui.jsx';

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({ name: '', slug: '' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const load = () =>
    adminApi
      .categories()
      .then((r) => setRows(r.data))
      .catch(setError);
  useEffect(() => {
    load();
  }, []);

  const save = async (cat) => {
    setError(null);
    setMessage(null);
    try {
      await adminApi.saveCategory({ id: cat.id, name: cat.name, slug: cat.slug || null, sort_order: cat.sort_order ?? null });
      if (!cat.id) setDraft({ name: '', slug: '' });
      setMessage('Saved.');
      load();
    } catch (err) {
      setError(err);
    }
  };

  const remove = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? The portfolio items stay, they just lose this category.`)) return;
    try {
      await adminApi.deleteCategory(cat.id);
      load();
    } catch (err) {
      setError(err);
    }
  };

  const edit = (id, key, value) => setRows((list) => list.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  return (
    <section>
      <header className="admin-head">
        <h1>Categories</h1>
      </header>
      <p className="hint">These are the filter links in the website menu. Lower “order” numbers appear first.</p>
      <Alert>{error && (Object.values(error.errors || {})[0]?.[0] || errorMessage(error))}</Alert>
      <Alert type="success">{message}</Alert>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>URL slug</th>
            <th>Order</th>
            <th>Items</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>
                <input value={c.name} onChange={(e) => edit(c.id, 'name', e.target.value)} maxLength={120} />
              </td>
              <td>
                <input value={c.slug} onChange={(e) => edit(c.id, 'slug', e.target.value)} maxLength={140} />
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  value={c.sort_order}
                  onChange={(e) => edit(c.id, 'sort_order', Number(e.target.value))}
                />
              </td>
              <td>{c.portfolio_items_count}</td>
              <td className="row-actions">
                <button type="button" className="btn small" onClick={() => save(c)}>
                  Save
                </button>
                <button type="button" className="btn-link danger" onClick={() => remove(c)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <input
                placeholder="New category"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </td>
            <td>
              <input placeholder="(auto)" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            </td>
            <td colSpan={2} />
            <td>
              <button type="button" className="btn small" disabled={!draft.name.trim()} onClick={() => save(draft)}>
                Add
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
