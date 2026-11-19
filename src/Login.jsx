import { useState } from 'react';
import { useNavigate } from 'react-router';
import { adminApi, tokenStore } from './api.js';
import { useAuth } from './AdminApp.jsx';
import { Alert, Field, errorMessage } from './ui.jsx';

export default function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await adminApi.login(login.trim(), password);
      tokenStore.set(res.token);
      setUser(res.user);
      navigate('/portfolio', { replace: true });
    } catch (err) {
      setError(err);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <form onSubmit={submit} className="card" noValidate>
        <h1>Admin sign in</h1>
        <Alert>{error && (error.errors?.login?.[0] || errorMessage(error))}</Alert>
        <Field label="Email or username">
          <input
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <button className="btn" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
