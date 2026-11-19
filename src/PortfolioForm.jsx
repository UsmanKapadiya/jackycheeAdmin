import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { adminApi } from './api.js';
import { Alert, Field, errorMessage } from './ui.jsx';

const EMPTY = {
  title: '',
  slug: '',
  description: '',
  meta_title: '',
  meta_description: '',
  external_url: '',
  is_published: true,
  category_ids: [],
};

export default function PortfolioForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [current, setCurrent] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi
      .categories()
      .then((r) => setCategories(r.data))
      .catch(setError);
    if (!isNew) {
      adminApi
        .portfolioItem(id)
        .then(({ data }) => {
          setCurrent(data);
          setForm({
            title: data.title ?? '',
            slug: data.slug ?? '',
            description: data.description ?? '',
            meta_title: data.meta_title ?? '',
            meta_description: data.meta_description ?? '',
            external_url: data.external_url ?? '',
            is_published: !!data.is_published,
            category_ids: data.categories?.map((c) => c.id) ?? [],
          });
        })
        .catch(setError);
    }
  }, [id, isNew]);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const toggleCategory = (catId) =>
    setForm((f) => ({
      ...f,
      category_ids: f.category_ids.includes(catId) ? f.category_ids.filter((c) => c !== catId) : [...f.category_ids, catId],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'category_ids') fd.append('category_ids', v.join(','));
      else if (k === 'is_published') fd.append(k, v ? '1' : '0');
      else if (k === 'slug' && !v) return;
      else fd.append(k, v ?? '');
    });
    if (file) fd.append('image', file);

    try {
      if (isNew) await adminApi.createPortfolio(fd);
      else await adminApi.updatePortfolio(id, fd);
      navigate('/portfolio');
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
        <h1>{isNew ? 'Add work' : 'Edit work'}</h1>
      </header>
      <Alert>{errorMessage(error)}</Alert>

      <form className="admin-form two-col" onSubmit={submit}>
        <div>
          <Field label="Title *" error={errs.title}>
            <input value={form.title} onChange={set('title')} required maxLength={255} />
          </Field>
          <Field
            label="URL slug"
            hint="Leave empty to create it from the title. Letters, numbers and dashes only."
            error={errs.slug}
          >
            <input value={form.slug} onChange={set('slug')} pattern="[A-Za-z0-9_\-]*" maxLength={190} />
          </Field>
          <Field label="Image alt text / SEO description" error={errs.meta_description}>
            <textarea rows={3} value={form.meta_description} onChange={set('meta_description')} maxLength={500} />
          </Field>
          <Field label="SEO title" error={errs.meta_title}>
            <input value={form.meta_title} onChange={set('meta_title')} maxLength={255} />
          </Field>
          <Field label="Project link (optional)" error={errs.external_url}>
            <input type="url" value={form.external_url} onChange={set('external_url')} placeholder="https://" />
          </Field>
          <Field label="Description (HTML allowed - scripts are removed automatically)" error={errs.description}>
            <textarea rows={6} value={form.description} onChange={set('description')} />
          </Field>
        </div>

        <div>
          <Field label={isNew ? 'Image *' : 'Replace image'} hint="JPG, PNG, WebP or GIF, max 15 MB." error={errs.image}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          {(preview || current?.thumb_url) && <img className="form-preview" src={preview || current.thumb_url} alt="" />}

          <fieldset className="field">
            <legend className="field-label">Categories</legend>
            {categories.map((c) => (
              <label key={c.id} className="check">
                <input type="checkbox" checked={form.category_ids.includes(c.id)} onChange={() => toggleCategory(c.id)} />{' '}
                {c.name}
              </label>
            ))}
          </fieldset>

          <label className="check">
            <input type="checkbox" checked={form.is_published} onChange={set('is_published')} /> Show on website
          </label>

          <div className="form-actions">
            <button className="btn" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="btn-link" onClick={() => navigate('/portfolio')}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
