import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Terms() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        navigate('/login');
        return;
      }

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError.message);
        alert(`Error: ${fetchError.message}`);
        return;
      }

      if (!profile) {
        console.log('No profile exists, redirecting to /create-profile');
        navigate('/create-profile');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ agreed_terms: true })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError.message);
        alert(`Error: ${updateError.message}`);
        return;
      }

      navigate('/auth-gate');
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-charcoal rounded-xl p-8 border border-gray-800">
        <h1 className="text-3xl font-bold text-white mb-6">Terms & Conditions</h1>

        <div className="mb-6 text-gray-300 space-y-4">
          <p>
            Welcome to BeatBookings! These terms and conditions are currently in preview.
          </p>
          <p>
            By using this platform, you agree to respect intellectual property rights,
            maintain professional conduct, and comply with all applicable laws.
          </p>
          <p>
            Full terms will be provided upon official launch. For questions, please
            contact our support team.
          </p>
        </div>

        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-600 bg-black text-neon-green focus:ring-neon-green focus:ring-offset-0"
              disabled={loading}
            />
            <span className="text-gray-300 text-sm">
              I agree to the Terms & Conditions
            </span>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!agreed || loading}
          className="w-full bg-neon-green text-black py-3 rounded-lg font-semibold hover:bg-neon-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Processing...' : 'Agree & Continue'}
        </button>
      </div>
    </div>
  );
}
