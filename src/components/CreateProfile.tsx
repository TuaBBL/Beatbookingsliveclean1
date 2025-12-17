import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Role = "planner" | "artist" | "admin";
type Step = "role" | "details";

export default function CreateProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const isStateRequired = country === "AU";

  // Guard: must be logged in
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session?.user) {
        navigate("/login", { replace: true });
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
      setError("Please select a role");
      return;
    }

    if (!name.trim() || !country || !city.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (isStateRequired && !state.trim()) {
      setError("State is required for Australia");
      return;
    }

    try {
      setSubmitting(true);

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      /**
       * IMPORTANT:
       * - Admin is REQUESTED, not granted
       * - Actual admin access controlled by `is_admin`
       */
      const profilePayload = {
        id: user.id,
        email: user.email,
        name: name.trim(),
        country,
        state: isStateRequired ? state.trim() : null,
        city: city.trim(),
        role: role === "admin" ? "planner" : role, // never self-assign admin
        admin_requested: role === "admin",
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (error) {
        console.error(error);
        setError(error.message);
        return;
      }

      navigate("/auth-gate", { replace: true });

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
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

        {step === "role" && (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">
              Choose your role
            </h1>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => { setRole("planner"); setStep("details"); }}
                className="w-full py-4 rounded-lg bg-gray-900 border border-gray-700 text-white hover:border-neon-green"
              >
                Planner
              </button>

              <button
                onClick={() => { setRole("artist"); setStep("details"); }}
                className="w-full py-4 rounded-lg bg-gray-900 border border-gray-700 text-white hover:border-neon-red"
              >
                Artist
              </button>

              <button
                onClick={() => { setRole("admin"); setStep("details"); }}
                className="w-full py-4 rounded-lg bg-gray-900 border border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
              >
                Admin (approval required)
              </button>
            </div>
          </>
        )}

        {step === "details" && (
          <>
            <h1 className="text-3xl font-bold text-white mb-6">
              Complete your profile
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white"
              />

              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  if (e.target.value !== "AU") setState("");
                }}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white"
              >
                <option value="">Select country</option>
                <option value="AU">Australia</option>
                <option value="NZ">New Zealand</option>
              </select>

              <input
                type="text"
                placeholder={isStateRequired ? "State *" : "State (N/A for NZ)"}
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={!isStateRequired}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white disabled:opacity-50"
              />

              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white"
              />

              {error && (
                <div className="text-red-400 text-sm bg-red-950/30 border border-red-800 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-neon-red text-white py-3 rounded-lg font-semibold hover:bg-neon-red/90 disabled:opacity-50"
              >
                {submitting ? "Saving profile…" : "Complete profile"}
              </button>

              <button
                type="button"
                onClick={() => setStep("role")}
                disabled={submitting}
                className="w-full border border-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800"
              >
                Back
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
