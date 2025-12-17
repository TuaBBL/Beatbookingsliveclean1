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

      // Not authenticated
      if (!session?.user) {
        setRedirect("/login");
        return;
      }

      const userId = session.user.id;
      const email = session.user.email;

      // Fetch profile
      let { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      // Auto-repair missing profile
      if (!profile) {
        await supabase.from("profiles").insert({
          id: userId,
          email,
          role: "planner",
          name: "",
          agreed_terms: false,
        });

        setRedirect("/create-profile");
        return;
      }

      // Route by role
      if (profile.role === "admin") {
        setRedirect("/admin");
        return;
      }

      if (profile.role === "artist") {
        setRedirect("/dashboard");
        return;
      }

      // default planner
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
