import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase processes the magic link automatically
    supabase.auth.getSession().then(() => {
      navigate('/auth-gate', { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white">Signing you in…</p>
    </div>
  );
}
