/** Small form helpers shared by the admin screens. */

export function Field({ label, error, hint, children }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
      {error && <small className="field-error">{Array.isArray(error) ? error[0] : error}</small>}
    </label>
  );
}

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function errorMessage(err) {
  if (!err) return null;
  if (err.status === 422) return 'Please fix the highlighted fields.';
  if (err.status === 429) return 'Too many attempts. Please wait a minute and try again.';
  return err.message || 'Something went wrong.';
}
