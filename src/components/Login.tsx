import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    setError(null);

    if (!email) return;

    try {
      setLoading(true);

      await supabase.auth.signOut();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-request-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send verification code');
        return;
      }

      setOtpSent(true);
    } catch (err) {
      console.error('OTP request error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
        return;
      }

      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      navigate('/auth-gate', { replace: true });
    } catch (err) {
      console.error('OTP verify error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-charcoal rounded-xl p-8 border border-gray-800 relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!otpSent ? (
          <>
            <h1 className="text-3xl font-bold text-white mb-4">
              Sign in to BeatBookingsLive
            </h1>

            <p className="text-gray-400 mb-6">
              Enter your email to receive a 6-digit verification code.
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
              onKeyDown={(e) => e.key === 'Enter' && handleRequestOtp()}
              placeholder="you@email.com"
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green mb-4"
              disabled={loading}
            />

            {error && (
              <div className="text-sm text-red-400 mb-4 bg-red-950/30 border border-red-800 rounded-lg p-4">
                {error}
              </div>
            )}

            <button
              onClick={handleRequestOtp}
              disabled={loading || !email}
              className="w-full bg-neon-red text-white py-3 rounded-lg font-semibold hover:bg-neon-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Sending code…' : 'Send verification code'}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-3">
              Enter verification code
            </h1>

            <p className="text-gray-400 mb-6">
              We sent a 6-digit code to:
              <br />
              <span className="text-white font-medium">{email}</span>
            </p>

            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              Verification code
            </label>

            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
              placeholder="000000"
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-neon-green mb-4"
              disabled={loading}
              autoFocus
            />

            {error && (
              <div className="text-sm text-red-400 mb-4 bg-red-950/30 border border-red-800 rounded-lg p-4">
                {error}
              </div>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full bg-neon-red text-white py-3 rounded-lg font-semibold hover:bg-neon-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition mb-3"
            >
              {loading ? 'Verifying…' : 'Verify code'}
            </button>

            <button
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setError(null);
              }}
              disabled={loading}
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
