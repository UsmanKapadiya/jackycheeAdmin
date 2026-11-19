import { useEffect, useState } from 'react';
import { adminApi } from './api.js';
import { Alert, Field, errorMessage } from './ui.jsx';

export default function Settings() {
  const [form, setForm] = useState({ site_name: '', site_tagline: '', footer_text: '', seo_description: '' });
  const [logoUrl, setLogoUrl] = useState(null);
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const apply = ({ data }) => {
    setForm({
      site_name: data.site_name ?? '',
      site_tagline: data.site_tagline ?? '',
      footer_text: data.footer_text ?? '',
      seo_description: data.seo_description ?? '',
    });
    setLogoUrl(data.logo_url);
  };

  useEffect(() => {
    adminApi.settings().then(apply).catch(setError);
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const run = async (fn, okMsg) => {
    setError(null);
    setMessage(null);
    try {
      await fn();
      setMessage(okMsg);
    } catch (err) {
      setError(err);
    }
  };

  const saveSettings = (e) => {
    e.preventDefault();
    run(async () => apply(await adminApi.saveSettings(form)), 'Settings saved.');
  };

  const uploadLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('logo', file);
    run(async () => apply(await adminApi.uploadLogo(fd)), 'Logo updated.');
  };

  const changePassword = (e) => {
    e.preventDefault();
    run(async () => {
      await adminApi.changePassword(pw);
      setPw({ current_password: '', password: '', password_confirmation: '' });
    }, 'Password changed. Other devices have been signed out.');
  };

  const errs = error?.errors || {};

  return (
    <section>
      <header className="admin-head">
        <h1>Settings</h1>
      </header>
      <Alert>{errorMessage(error)}</Alert>
      <Alert type="success">{message}</Alert>

      <form className="admin-form" onSubmit={saveSettings}>
        <h2>Website</h2>
        <Field label="Site name *" error={errs.site_name}>
          <input value={form.site_name} onChange={set('site_name')} required maxLength={120} />
        </Field>
        <Field label="Tagline" error={errs.site_tagline}>
          <input value={form.site_tagline} onChange={set('site_tagline')} maxLength={255} />
        </Field>
        <Field label="SEO description" error={errs.seo_description}>
          <textarea rows={2} value={form.seo_description} onChange={set('seo_description')} maxLength={500} />
        </Field>
        <Field label="Footer text (HTML allowed)" error={errs.footer_text}>
          <textarea rows={3} value={form.footer_text} onChange={set('footer_text')} />
        </Field>
        <button className="btn">Save settings</button>
      </form>

      <div className="admin-form">
        <h2>Logo</h2>
        {logoUrl && <img className="form-preview logo-preview" src={logoUrl} alt="Current logo" />}
        <Field label="Upload new logo" hint="PNG, JPG or WebP, max 2 MB." error={errs.logo}>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} />
        </Field>
      </div>

      <form className="admin-form" onSubmit={changePassword}>
        <h2>Change password</h2>
        <Field label="Current password" error={errs.current_password}>
          <input
            type="password"
            autoComplete="current-password"
            value={pw.current_password}
            onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
            required
          />
        </Field>
        <Field
          label="New password"
          hint="At least 12 characters with upper & lower case, a number and a symbol."
          error={errs.password}
        >
          <input
            type="password"
            autoComplete="new-password"
            value={pw.password}
            onChange={(e) => setPw({ ...pw, password: e.target.value })}
            required
          />
        </Field>
        <Field label="Repeat new password">
          <input
            type="password"
            autoComplete="new-password"
            value={pw.password_confirmation}
            onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })}
            required
          />
        </Field>
        <button className="btn">Change password</button>
      </form>
    </section>
  );
}
