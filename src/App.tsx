import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

/* ======================
   FAQ Pages
====================== */
import FaqHome from "./pages/faq/FaqHome";
import ArtistFaq from "./pages/faq/ArtistFaq";
import PlannerFaq from "./pages/faq/PlannerFaq";

/* ======================
   Public Pages
====================== */
import HomePage from "./components/HomePage";
import Login from "./components/Login";
import About from "./components/About";
import Terms from "./components/Terms";
import Privacy from "./components/Privacy";
import Events from "./components/Events";
import EventDetail from "./components/EventDetail";
import ArtistProfilePage from "./components/artist/ArtistProfilePage";

/* ======================
   Auth / Onboarding
====================== */
import AuthGate from "./components/AuthGate";
import AuthCallback from "./components/AuthCallback";
import CreateProfile from "./components/CreateProfile";
import TermsAgreement from "./components/TermsAgreement";

/* ======================
   Dashboards
====================== */
import Dashboard from "./components/Dashboard";

/* Planner */
import PlannerDashboard from "./components/planner/PlannerDashboard";
import PlannerArtists from "./components/planner/PlannerArtists";
import PlannerArtistProfile from "./components/planner/PlannerArtistProfile";
import PlannerBookingInbox from "./components/planner/PlannerBookingInbox";
import PlannerConfirmedBookings from "./components/planner/PlannerConfirmedBookings";
import PlannerFavourites from "./components/planner/PlannerFavourites";
import PlannerCalendar from "./components/planner/PlannerCalendar";
import PlannerRequestsPage from "./components/planner/PlannerRequestsPage";

/* Artist */
import ArtistDashboard from "./components/artist/ArtistDashboard";
import ArtistBookingInbox from "./components/artist/ArtistBookingInbox";
import ArtistCalendar from "./components/artist/ArtistCalendar";
import ArtistMedia from "./components/artist/ArtistMedia";
import ArtistInboxPage from "./components/artist/ArtistInboxPage";

/* ======================
   Admin
====================== */
import AdminDashboard from "./components/AdminDashboard";
import AdminMessages from "./components/AdminMessages";

/* ======================
   Payments / Subscribe
====================== */
import Subscribe from "./components/Subscribe";

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {});

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
        {/* ======================
            Public
        ====================== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* FAQ */}
        <Route path="/faq" element={<FaqHome />} />
        <Route path="/faq/artists" element={<ArtistFaq />} />
        <Route path="/faq/planners" element={<PlannerFaq />} />

        <Route path="/login" element={<Login />} />
        <Route path="/artists/:userId" element={<ArtistProfilePage />} />

        {/* ======================
            Auth / Onboarding
        ====================== */}
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/auth-gate" element={<AuthGate />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/terms-agreement" element={<TermsAgreement />} />

        {/* ======================
            Shared
        ====================== */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />

        {/* ======================
            Planner
        ====================== */}
        <Route path="/planner/dashboard" element={<PlannerDashboard />} />
        <Route path="/planner/artists" element={<PlannerArtists />} />
        <Route path="/planner/artists/:id" element={<PlannerArtistProfile />} />
        <Route path="/planner/bookings" element={<PlannerBookingInbox />} />
        <Route path="/planner/confirmed" element={<PlannerConfirmedBookings />} />
        <Route path="/planner/favourites" element={<PlannerFavourites />} />
        <Route path="/planner/calendar" element={<PlannerCalendar />} />
        <Route path="/planner/requests" element={<PlannerRequestsPage />} />

        {/* ======================
            Artist
        ====================== */}
        <Route path="/artist/dashboard" element={<ArtistDashboard />} />
        <Route path="/artist/bookings" element={<ArtistBookingInbox />} />
        <Route path="/artist/calendar" element={<ArtistCalendar />} />
        <Route path="/artist/media" element={<ArtistMedia />} />
        <Route path="/artist/inbox" element={<ArtistInboxPage />} />

        {/* ======================
            Admin
        ====================== */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/messages" element={<AdminMessages />} />

        {/* ======================
            Payments
        ====================== */}
        <Route path="/subscribe" element={<Subscribe />} />

        {/* ======================
            Fallback
        ====================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
