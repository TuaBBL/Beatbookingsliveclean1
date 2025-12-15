import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendLink = async () => {
    setError(null);

    if (!email) return;

    try {
      setLoading(true);

      // Clear any existing session before sending new magic link
      await supabase.auth.signOut();

      const redirectUrl = `${window.location.origin}/auth-callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        // Only show redirect URL message if error specifically mentions redirect/whitelist
        if (error.message.toLowerCase().includes('redirect') ||
            error.message.toLowerCase().includes('whitelist')) {
          setError(
            `Unable to send magic link. The redirect URL needs to be whitelisted in your Supabase project settings.\n\n` +
            `Current redirect URL: ${redirectUrl}\n\n` +
            `To fix this:\n` +
            `1. Go to your Supabase Dashboard (https://supabase.com/dashboard)\n` +
            `2. Navigate to Authentication → URL Configuration\n` +
            `3. Add "${redirectUrl}" to the "Redirect URLs" list\n` +
            `4. Save and try again`
          );
        } else {
          // Show the actual error message for other errors
          setError(error.message);
        }
        return;
      }

      setLinkSent(true);
    } catch (err) {
      console.error('Magic link error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-charcoal rounded-xl p-8 border border-gray-800">
        {!linkSent ? (
          <>
            <h1 className="text-3xl font-bold text-white mb-4">
              Sign in to BeatBookingsLive
            </h1>

            <p className="text-gray-400 mb-6">
              We’ll email you a secure sign-in link. No password required.
            </p>

            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green mb-4"
              disabled={loading}
            />

            {error && (
              <div className="text-sm text-red-400 mb-4 whitespace-pre-wrap bg-red-950/30 border border-red-800 rounded-lg p-4">
                {error}
              </div>
            )}

            <button
              onClick={handleSendLink}
              disabled={loading || !email}
              className="w-full bg-neon-red text-white py-3 rounded-lg font-semibold hover:bg-neon-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Sending link…' : 'Send sign-in link'}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-3">
              Check your email
            </h1>

            <p className="text-gray-400 mb-6">
              We’ve sent a secure sign-in link to:
              <br />
              <span className="text-white font-medium">{email}</span>
            </p>

            <p className="text-gray-500 text-sm mb-6">
              Click the link in the email to finish signing in.
              If you don’t see it, check spam or promotions.
            </p>

            <button
              onClick={() => setLinkSent(false)}
              className="w-full border border-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Use a different email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
