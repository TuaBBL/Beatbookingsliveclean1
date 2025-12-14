import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

// route wrappers
import PublicRoutes from './components/PublicRoutes';
import AuthenticatedRoutes from './components/AuthenticatedRoutes';

// pages (from components)
import HomePage from './components/HomePage';
import Login from './components/Login';
import Terms from './components/Terms';
import Dashboard from './components/Dashboard';
import CreateProfile from './components/CreateProfile';
import AuthGate from './components/AuthGate';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<PublicRoutes isAuthenticated={!!session} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/terms" element={<Terms />} />
        </Route>

        {/* Authenticated */}
        <Route element={<AuthenticatedRoutes isAuthenticated={!!session} />}>
          <Route path="/auth-gate" element={<AuthGate />} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
