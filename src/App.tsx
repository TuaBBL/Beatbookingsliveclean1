import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

// pages / components
import HomePage from './components/HomePage';
import Login from './components/Login';
import About from './components/About';
import Terms from './components/Terms';
import TermsAgreement from './components/TermsAgreement';
import Privacy from './components/Privacy';
import Dashboard from './components/Dashboard';
import Events from './components/Events';
import EventDetail from './components/EventDetail';
import CreateProfile from './components/CreateProfile';
import AuthGate from './components/AuthGate';
import AuthCallback from './components/AuthCallback';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading…</p>
      </div>
    );
  }

  return (
   <BrowserRouter>
  <Routes>
    {/* Public */}
    <Route path="/" element={<HomePage />} />
    <Route path="/about" element={<About />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/login" element={<Login />} />

    {/* Auth plumbing */}
    <Route path="/auth-callback" element={<AuthCallback />} />
    <Route path="/auth-gate" element={<AuthGate />} />

    {/* Mandatory onboarding */}
    <Route path="/create-profile" element={<CreateProfile />} />
    <Route path="/terms-agreement" element={<TermsAgreement />} />

    {/* Protected */}
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/events" element={<Events />} />
    <Route path="/events/:id" element={<EventDetail />} />
    {/* later */}
    {/* <Route path="/admin" element={<AdminDashboard />} /> */}

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
  );
}
