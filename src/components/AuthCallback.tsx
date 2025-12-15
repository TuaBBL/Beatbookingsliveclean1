import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Auth callback error:', sessionError);
          setError('Failed to complete sign-in. Please try again.');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

        if (!data.session) {
          setError('No active session found. Redirecting to login...');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }

        navigate('/auth-gate', { replace: true });
      } catch (err) {
        console.error('Auth callback exception:', err);
        setError('An unexpected error occurred. Redirecting to login...');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-gray-500 text-sm">Redirecting...</p>
          </>
        ) : (
          <p className="text-white">Signing you in…</p>
        )}
      </div>
    </div>
  );
}
