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
import PublishSuccess from './components/PublishSuccess';
import PublishCancel from './components/PublishCancel';
import PlannerDashboard from './components/planner/PlannerDashboard';
import PlannerArtists from './components/planner/PlannerArtists';
import PlannerArtistProfile from './components/planner/PlannerArtistProfile';
import PlannerBookingInbox from './components/planner/PlannerBookingInbox';
import PlannerConfirmedBookings from './components/planner/PlannerConfirmedBookings';
import PlannerFavourites from './components/planner/PlannerFavourites';
import PlannerCalendar from './components/planner/PlannerCalendar';
import AdminMessages from './components/AdminMessages';
import AdminDashboard from './components/AdminDashboard';
import ArtistProfilePage from './components/artist/ArtistProfilePage';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!mounted) return;
        setSession(session);
      })();
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
    <Route path="/artists/:userId" element={<ArtistProfilePage />} />

    {/* Auth */}
    <Route path="/auth-callback" element={<AuthCallback />} />
    <Route path="/auth-gate" element={<AuthGate />} />

    {/* Onboarding */}
    <Route path="/create-profile" element={<CreateProfile />} />
    <Route path="/terms-agreement" element={<TermsAgreement />} />

    {/* Dashboards (unguarded – AuthGate handles auth) */}
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/events" element={<Events />} />
    <Route path="/events/:id" element={<EventDetail />} />

    {/* Planner */}
    <Route path="/planner/dashboard" element={<PlannerDashboard />} />
    <Route path="/planner/artists" element={<PlannerArtists />} />
    <Route path="/planner/artists/:id" element={<PlannerArtistProfile />} />
    <Route path="/planner/bookings" element={<PlannerBookingInbox />} />
    <Route path="/planner/confirmed" element={<PlannerConfirmedBookings />} />
    <Route path="/planner/favourites" element={<PlannerFavourites />} />
    <Route path="/planner/calendar" element={<PlannerCalendar />} />

    {/* Admin */}
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/messages" element={<AdminMessages />} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
  );
}
