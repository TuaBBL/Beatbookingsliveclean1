import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('auth-request-otp', {
        body: { email },
      });

      if (error) {
        console.error('Error sending OTP:', error.message);
        alert(`Error: ${error.message}`);
      } else if (data?.error) {
        console.error('Error sending OTP:', data.error);
        alert(`Error: ${data.error}`);
      } else {
        console.log('OTP sent successfully to:', email);
        setOtpSent(true);
        alert('Check your email for the OTP code');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('auth-verify-otp', {
        body: { email, otp: otpCode },
      });

      if (error) {
        console.error('Error verifying OTP:', error.message);
        alert(`Error: ${error.message}`);
        return;
      }

      if (data?.error) {
        console.error('Error verifying OTP:', data.error);
        alert(`Error: ${data.error}`);
        return;
      }

      if (!data?.session) {
        console.error('No session returned');
        alert('Login failed. Please try again.');
        return;
      }

      const { session } = data;
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile) {
        navigate('/create-profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-charcoal rounded-xl p-8 border border-gray-800">
        <h1 className="text-3xl font-bold text-white mb-6">Login</h1>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSendOtp}
            disabled={loading || !email}
            className="w-full bg-neon-red text-white py-3 rounded-lg font-semibold hover:bg-neon-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Sending...' : 'Send code'}
          </button>

          {otpSent && (
            <>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-400 mb-2">
                  OTP Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || !otpCode}
                className="w-full bg-neon-green text-black py-3 rounded-lg font-semibold hover:bg-neon-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Verifying...' : 'Verify code'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
