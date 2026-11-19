import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router';
import { adminApi, setUnauthorizedHandler, tokenStore } from './api.js';
import Login from './Login.jsx';
import PortfolioList from './PortfolioList.jsx';
import PortfolioForm from './PortfolioForm.jsx';
import Categories from './Categories.jsx';
import PagesList from './PagesList.jsx';
import PageForm from './PageForm.jsx';
import Settings from './Settings.jsx';
import { setFavicon } from './favicon.js';
import { SITE_URL } from './config.js';
import './admin.css';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AdminApp() {
  const [user, setUser] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    document.title = 'Jacky Chee · Admin';
    if (!tokenStore.get()) {
      setChecking(false);
      return;
    }
    adminApi
      .me()
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.clear())
      .finally(() => setChecking(false));
  }, [signOut]);

  useEffect(() => {
    if (!user) return;
    adminApi
      .settings()
      .then(({ data }) => {
        setLogoUrl(data.logo_url);
        setFavicon(data.logo_url);
      })
      .catch((err) => console.error('Unable to load site logo for favicon.', err));
  }, [user]);

  if (checking) return <div className="loading">Loading…</div>;

  return (
    <AuthContext.Provider value={{ user, setUser, logoUrl, setLogoUrl, signOut }}>
      <Routes>
        <Route path="login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route element={user ? <AdminLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="portfolio" replace />} />
          <Route path="portfolio" element={<PortfolioList />} />
          <Route path="portfolio/new" element={<PortfolioForm />} />
          <Route path="portfolio/:id" element={<PortfolioForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="pages" element={<PagesList />} />
          <Route path="pages/new" element={<PageForm />} />
          <Route path="pages/:id" element={<PageForm />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="portfolio" replace />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
}

function AdminLayout() {
  const { user, logoUrl, signOut } = useAuth();

  const logout = async () => {
    try {
      await adminApi.logout();
    } finally {
      signOut();
    }
  };

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-brand">
          {logoUrl && <img src={logoUrl} alt="Site logo" />}
          <span>Jacky Chee · Admin</span>
        </div>
        <nav>
          <NavLink to="/portfolio">Portfolio</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/pages">Pages</NavLink>
          <NavLink to="/settings">Settings</NavLink>
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
            View site ↗
          </a>
        </nav>
        <div className="admin-user">
          <span>{user?.name}</span>
          <button type="button" className="btn-link" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
