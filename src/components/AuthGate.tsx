import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthGate() {
  const [loading, setLoading] = useState(true);
  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setRedirect('/login');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('agreed_terms')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || !profile.agreed_terms) {
        setRedirect('/terms');
      } else {
        setRedirect('/dashboard');
      }

      setLoading(false);
    };

    checkProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return <Navigate to={redirect!} replace />;
}
