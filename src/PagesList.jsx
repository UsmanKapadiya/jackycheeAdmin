import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { adminApi } from './api.js';
import { Alert, errorMessage } from './ui.jsx';
import { SITE_URL } from './config.js';

export default function PagesList() {
  const [pages, setPages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi
      .pages()
      .then((r) => setPages(r.data))
      .catch(setError);
  }, []);

  const remove = async (page) => {
    if (!window.confirm(`Delete page "${page.title}"?`)) return;
    try {
      await adminApi.deletePage(page.id);
      setPages((list) => list.filter((p) => p.id !== page.id));
    } catch (err) {
      setError(err);
    }
  };

  return (
    <section>
      <header className="admin-head">
        <h1>Pages</h1>
        <Link className="btn" to="/pages/new">
          + Add page
        </Link>
      </header>
      <Alert>{errorMessage(error)}</Alert>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Address</th>
            <th>In menu</th>
            <th>Visible</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>
                <a href={`${SITE_URL}/${p.slug}`} target="_blank" rel="noopener noreferrer">
                  /{p.slug}
                </a>
              </td>
              <td>{p.show_in_menu ? 'Yes' : 'No'}</td>
              <td>{p.is_published ? 'Yes' : 'No'}</td>
              <td className="row-actions">
                <Link to={`/pages/${p.id}`}>Edit</Link>
                <button type="button" className="btn-link danger" onClick={() => remove(p)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
