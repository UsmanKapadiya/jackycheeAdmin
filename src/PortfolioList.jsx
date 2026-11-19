import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { adminApi } from './api.js';
import { Alert, errorMessage } from './ui.jsx';

/** Portfolio manager: search, filter, drag & drop ordering (replaces the "Post Types Order" plugin). */
export default function PortfolioList() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const dragIndex = useRef(null);

  const canReorder = !search && !categoryId;

  const load = () => {
    setLoading(true);
    const params = { per_page: 500 };
    if (search) params.search = search;
    if (categoryId) params.category_id = categoryId;
    adminApi
      .portfolio(params)
      .then((r) => {
        setItems(r.data);
        setDirty(false);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    adminApi
      .categories()
      .then((r) => setCategories(r.data))
      .catch(setError);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId]);

  const onDrop = (to) => {
    const from = dragIndex.current;
    if (from === null || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setDirty(true);
    dragIndex.current = null;
  };

  const saveOrder = async () => {
    try {
      await adminApi.reorderPortfolio(items.map((i) => i.id));
      setDirty(false);
      setMessage('Order saved.');
    } catch (err) {
      setError(err);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await adminApi.deletePortfolio(item.id);
      setItems((list) => list.filter((i) => i.id !== item.id));
    } catch (err) {
      setError(err);
    }
  };

  return (
    <section>
      <header className="admin-head">
        <h1>Portfolio ({items.length})</h1>
        <Link className="btn" to="/portfolio/new">
          + Add work
        </Link>
      </header>

      <div className="toolbar">
        <input type="search" placeholder="Search titles…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {dirty && (
          <button type="button" className="btn" onClick={saveOrder}>
            Save order
          </button>
        )}
      </div>
      <p className="hint">
        {canReorder
          ? 'Drag the images to change the order on the website, then click “Save order”.'
          : 'Clear the search and filter to reorder.'}
      </p>

      <Alert>{errorMessage(error)}</Alert>
      <Alert type="success">{message}</Alert>
      {loading && <div className="loading">Loading…</div>}

      <ul className="admin-grid">
        {items.map((item, i) => (
          <li
            key={item.id}
            className={`admin-tile ${item.is_published ? '' : 'is-draft'}`}
            draggable={canReorder}
            onDragStart={() => (dragIndex.current = i)}
            onDragOver={(e) => canReorder && e.preventDefault()}
            onDrop={() => onDrop(i)}
          >
            <img src={item.thumb_url} alt="" loading="lazy" />
            <div className="tile-body">
              <strong title={item.title}>{item.title}</strong>
              <small>{item.categories?.map((c) => c.name).join(', ') || 'No category'}</small>
              {!item.is_published && <small className="badge">Hidden</small>}
              <div className="tile-actions">
                <Link to={`/portfolio/${item.id}`}>Edit</Link>
                <button type="button" className="btn-link danger" onClick={() => remove(item)}>
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
