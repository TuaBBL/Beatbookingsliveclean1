// src/components/AuthGate.tsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthGate() {
  const [loading, setLoading] = useState(true);
  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 1. Not authenticated
      if (!session?.user) {
        setRedirect('/login');
        setLoading(false);
        return;
      }

      // 2. Check profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile check failed:', error);
        setRedirect('/login');
        setLoading(false);
        return;
      }

      // 3. No profile → force creation
      if (!profile) {
        setRedirect('/create-profile');
        setLoading(false);
        return;
      }

      // 4. Route by role
      switch (profile.role) {
        case 'planner':
          setRedirect('/planner/dashboard');
          break;
        case 'artist':
          setRedirect('/dashboard');
          break;
        case 'admin':
          setRedirect('/admin');
          break;
        default:
          setRedirect('/login');
      }

      setLoading(false);
    };

    run();
  }, []);

  if (loading || !redirect) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Checking account…</p>
      </div>
    );
  }

  return <Navigate to={redirect} replace />;
}
