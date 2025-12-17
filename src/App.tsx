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

    {/* Auth plumbing */}
    <Route path="/auth-callback" element={<AuthCallback />} />
    <Route path="/auth-gate" element={<AuthGate />} />

    {/* Mandatory onboarding */}
    <Route path="/create-profile" element={<CreateProfile />} />
    <Route path="/terms-agreement" element={<TermsAgreement />} />

    {/* Protected */}
    <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" replace />} />
    <Route path="/events" element={session ? <Events /> : <Navigate to="/login" replace />} />
    <Route path="/events/:id" element={session ? <EventDetail /> : <Navigate to="/login" replace />} />
    <Route path="/publish/success" element={<PublishSuccess />} />
    <Route path="/publish/cancel" element={<PublishCancel />} />

    {/* Planner Dashboard */}
    <Route path="/planner/dashboard" element={session ? <PlannerDashboard /> : <Navigate to="/login" replace />} />
    <Route path="/planner/artists" element={session ? <PlannerArtists /> : <Navigate to="/login" replace />} />
    <Route path="/planner/artists/:id" element={session ? <PlannerArtistProfile /> : <Navigate to="/login" replace />} />
    <Route path="/planner/bookings" element={session ? <PlannerBookingInbox /> : <Navigate to="/login" replace />} />
    <Route path="/planner/confirmed" element={session ? <PlannerConfirmedBookings /> : <Navigate to="/login" replace />} />
    <Route path="/planner/favourites" element={session ? <PlannerFavourites /> : <Navigate to="/login" replace />} />
    <Route path="/planner/calendar" element={session ? <PlannerCalendar /> : <Navigate to="/login" replace />} />

    {/* Admin */}
    <Route path="/admin/messages" element={session ? <AdminMessages /> : <Navigate to="/login" replace />} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
  );
}
