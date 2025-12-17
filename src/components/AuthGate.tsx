// src/components/AuthGate.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthGate() {
  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 1️⃣ Not authenticated
      if (!session?.user) {
        setRedirect("/login");
        return;
      }

      const userId = session.user.id;

      // 2️⃣ Check profile existence + role
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("AuthGate profile error:", error);
        setRedirect("/login");
        return;
      }

      // 3️⃣ No profile → onboarding
      if (!profile) {
        setRedirect("/create-profile");
        return;
      }

      // 4️⃣ Route by role (NO ADMIN HERE)
      if (profile.role === "artist") {
        setRedirect("/dashboard");
        return;
      }

      // default: planner
      setRedirect("/planner/dashboard");
    };

    run();
  }, []);

  if (!redirect) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Checking account…</p>
      </div>
    );
  }

  return <Navigate to={redirect} replace />;
}
