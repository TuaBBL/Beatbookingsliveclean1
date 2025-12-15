import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Role = 'planner' | 'artist' | null;

export default function CreateProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [role, setRole] = useState<Role>(null);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error checking profile:', fetchError.message);
          setError(`Error loading profile: ${fetchError.message}`);
          setLoading(false);
          return;
        }

        if (profile) {
          navigate('/dashboard');
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    checkExistingProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!role) {
      setError('Please select a role');
      return;
    }

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!country) {
      setError('Country is required');
      return;
    }

    try {
      setSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        navigate('/login');
        return;
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          role,
          name: name.trim(),
          email: user.email || '',
          country,
          state: state.trim() || null,
          city: city.trim() || null,
          image_url: imageUrl.trim() || null,
          agreed_terms: true,
        });

      if (insertError) {
        console.error('Error creating profile:', insertError.message);
        setError(`Error creating profile: ${insertError.message}`);
        return;
      }

      console.log('Profile created successfully');

      if (role === 'artist') {
        navigate('/subscription');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-charcoal rounded-xl p-8 border border-gray-800">
        <h1 className="text-3xl font-bold text-white mb-6">Create Your Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-semibold mb-3">
              I am a... <span className="text-neon-red">*</span>
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole('planner')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
                  role === 'planner'
                    ? 'bg-neon-green text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Planner
              </button>
              <button
                type="button"
                onClick={() => setRole('artist')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
                  role === 'artist'
                    ? 'bg-neon-green text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Artist
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-white font-semibold mb-2">
              Name <span className="text-neon-red">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
              placeholder="Your name or stage name"
              required
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-white font-semibold mb-2">
              Country <span className="text-neon-red">*</span>
            </label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
              required
            >
              <option value="">Select country</option>
              <option value="Australia">Australia</option>
              <option value="New Zealand">New Zealand</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="state" className="block text-white font-semibold mb-2">
                State
              </label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
                placeholder="e.g., NSW, VIC"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-white font-semibold mb-2">
                City
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
                placeholder="e.g., Sydney, Auckland"
              />
            </div>
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-white font-semibold mb-2">
              Profile Image URL
            </label>
            <input
              type="text"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {error && (
            <div className="bg-neon-red/10 border border-neon-red rounded-lg p-4">
              <p className="text-neon-red text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-neon-green text-black py-3 rounded-lg font-semibold hover:bg-neon-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
