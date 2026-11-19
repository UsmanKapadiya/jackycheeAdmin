import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { adminApi } from './api.js';
import SafeHtml from './components/SafeHtml.jsx';
import { Alert, Field, errorMessage } from './ui.jsx';

const EMPTY = {
  title: '',
  slug: '',
  content: '',
  social_icons: '',
  contact_info: '',
  extra_content: '',
  show_title: true,
  show_in_menu: true,
  is_published: true,
  sort_order: 0,
};

export default function PageForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isNew) return;
    adminApi
      .page(id)
      .then(({ data }) => setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, data[k] ?? EMPTY[k]]))))
      .catch(setError);
  }, [id, isNew]);

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]:
        e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? Number(e.target.value) : e.target.value,
    }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminApi.savePage({ ...form, id: isNew ? undefined : id, slug: form.slug || null });
      navigate('/pages');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const errs = error?.errors || {};

  return (
    <section>
      <header className="admin-head">
        <h1>{isNew ? 'Add page' : 'Edit page'}</h1>
        <button type="button" className="btn-link" onClick={() => setShowPreview((p) => !p)}>
          {showPreview ? 'Hide preview' : 'Preview'}
        </button>
      </header>
      <Alert>{errorMessage(error)}</Alert>

      <form className="admin-form" onSubmit={submit}>
        <Field label="Title *" error={errs.title}>
          <input value={form.title} onChange={set('title')} required maxLength={255} />
        </Field>
        <Field label="URL slug" hint="e.g. about → yoursite.com/about" error={errs.slug}>
          <input value={form.slug} onChange={set('slug')} pattern="[A-Za-z0-9_\-]*" maxLength={190} />
        </Field>
        <Field label="Content (HTML)" error={errs.content}>
          <textarea rows={12} value={form.content} onChange={set('content')} />
        </Field>
        <Field label="Social icons (HTML)" error={errs.social_icons}>
          <textarea rows={4} value={form.social_icons} onChange={set('social_icons')} />
        </Field>
        <Field label="Contact info (HTML)" error={errs.contact_info}>
          <textarea rows={4} value={form.contact_info} onChange={set('contact_info')} />
        </Field>
        <Field label="Extra content (HTML)" error={errs.extra_content}>
          <textarea rows={4} value={form.extra_content} onChange={set('extra_content')} />
        </Field>
        <div className="checks">
          <label className="check">
            <input type="checkbox" checked={form.show_title} onChange={set('show_title')} /> Show title on page
          </label>
          <label className="check">
            <input type="checkbox" checked={form.show_in_menu} onChange={set('show_in_menu')} /> Show in menu
          </label>
          <label className="check">
            <input type="checkbox" checked={form.is_published} onChange={set('is_published')} /> Published
          </label>
          <label className="check">
            Menu order <input type="number" min={0} value={form.sort_order} onChange={set('sort_order')} />
          </label>
        </div>
        <div className="form-actions">
          <button className="btn" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn-link" onClick={() => navigate('/pages')}>
            Cancel
          </button>
        </div>
      </form>

      {showPreview && (
        <div className="preview entry-content">
          <SafeHtml html={form.content} />
          <SafeHtml html={form.social_icons} />
          <SafeHtml html={form.contact_info} />
          <SafeHtml html={form.extra_content} />
        </div>
      )}
    </section>
  );
}
