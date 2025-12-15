import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      // Supabase finalises the session from the magic link automatically
      await supabase.auth.getSession();

      // Hand off to the auth gate to decide where to go next
      navigate('/auth-gate', { replace: true });
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white">Signing you in…</p>
    </div>
  );
}
