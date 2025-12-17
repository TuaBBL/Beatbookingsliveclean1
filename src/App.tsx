import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

// pages
import HomePage from "./components/HomePage";
import Login from "./components/Login";
import About from "./components/About";
import Privacy from "./components/Privacy";
import Terms from "./components/Terms";
import AuthGate from "./components/AuthGate";
import CreateProfile from "./components/CreateProfile";
import Dashboard from "./components/Dashboard";
import PlannerDashboard from "./components/planner/PlannerDashboard";
import AdminMessages from "./components/AdminMessages";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
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

        {/* ROOT — never idle when logged in */}
        <Route
          path="/"
          element={
            session ? <Navigate to="/auth-gate" replace /> : <HomePage />
          }
        />

        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Auth brain */}
        <Route path="/auth-gate" element={<AuthGate />} />

        {/* Onboarding */}
        <Route path="/create-profile" element={<CreateProfile />} />

        {/* Dashboards */}
        <Route
          path="/dashboard"
          element={session ? <Dashboard /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/planner/dashboard"
          element={session ? <PlannerDashboard /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/admin/messages"
          element={session ? <AdminMessages /> : <Navigate to="/login" replace />}
        />

        {/* Hard fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
