import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { X } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    setError(null);
    if (!email) return;

    try {
      setLoading(true);

      await supabase.auth.signOut();

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-request-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send code");
        return;
      }

      setOtpSent(true);
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (otp.length !== 6) {
      setError("Enter a valid 6-digit code");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code");
        return;
      }

      // 🔒 CRITICAL: hydrate session BEFORE routing
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      await supabase.auth.getSession();

      navigate("/auth-gate", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-charcoal rounded-xl p-8 border border-gray-800 relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
        >
          <X />
        </button>

        {!otpSent ? (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">
              Sign in to BeatBookingsLive
            </h1>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white mb-4"
            />

            {error && <p className="text-red-400 mb-3">{error}</p>}

            <button
              onClick={handleRequestOtp}
              disabled={loading}
              className="w-full bg-neon-red py-3 rounded-lg text-white font-semibold"
            >
              {loading ? "Sending…" : "Send code"}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-4">
              Enter verification code
            </h2>

            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white text-center text-2xl mb-4"
            />

            {error && <p className="text-red-400 mb-3">{error}</p>}

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-neon-red py-3 rounded-lg text-white font-semibold"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
