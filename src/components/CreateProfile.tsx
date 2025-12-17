import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Role = 'planner' | 'artist' | 'admin';

export default function CreateProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  const isStateRequired = country === 'AU';

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        navigate('/auth-gate', { replace: true });
        return;
      }

      setLoading(false);
    };

    run();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!role) {
      setError('Please select a role');
      return;
    }

    if (!name.trim() || !country || !city.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (isStateRequired && !state.trim()) {
      setError('State is required for Australia');
      return;
    }

    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login', { replace: true });
        return;
      }

      const isAdminRequest = role === 'admin';

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          name: name.trim(),
          country,
          state: isStateRequired ? state.trim() : null,
          city: city.trim(),
          role: isAdminRequest ? 'planner' : role,
          admin_requested: isAdminRequest,
        }, { onConflict: 'id' });

      if (error) {
        console.error(error);
        setError(error.message);
        return;
      }

      navigate('/auth-gate', { replace: true });

    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Preparing profile setup…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-charcoal border border-gray-800 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-6">
          Create your profile
        </h1>

        {/* Role selection */}
        <div className="grid gap-4 mb-6">
          <button
            onClick={() => setRole('planner')}
            className={`py-4 rounded-lg border ${
              role === 'planner' ? 'border-neon-green' : 'border-gray-700'
            } text-white`}
          >
            Planner
          </button>

          <button
            onClick={() => setRole('artist')}
            className={`py-4 rounded-lg border ${
              role === 'artist' ? 'border-neon-red' : 'border-gray-700'
            } text-white`}
          >
            Artist
          </button>

          <button
            onClick={() => setRole('admin')}
            className={`py-4 rounded-lg border border-yellow-500 text-yellow-400`}
          >
            Admin (approval required)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white"
          />

          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              if (e.target.value === 'NZ') setState('');
            }}
            className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white"
          >
            <option value="">Select country</option>
            <option value="AU">Australia</option>
            <option value="NZ">New Zealand</option>
          </select>

          <input
            placeholder="State"
            value={state}
            disabled={!isStateRequired}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white disabled:opacity-50"
          />

          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white"
          />

          {error && (
            <div className="text-red-400 bg-red-950/30 border border-red-800 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-neon-red py-3 rounded-lg text-white font-semibold"
          >
            {submitting ? 'Saving…' : 'Complete profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
