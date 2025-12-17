// src/components/AuthGate.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthGate() {
  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setRedirect("/login");
        return;
      }

      const userId = session.user.id;

      // 🔐 Check admin table FIRST
      const { data: admin } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (admin) {
        setRedirect("/admin/messages");
        return;
      }

      // 👤 Normal profile check
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) {
        setRedirect("/create-profile");
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
