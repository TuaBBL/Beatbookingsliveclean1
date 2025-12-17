import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Role = "planner" | "artist" | "admin";

export default function CreateProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const isStateRequired = country === "AU";

  // Guard: must be authenticated, must NOT already have profile
  useEffect(() => {
    const run = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      // Admins never onboard
      if (profile?.role === "admin") {
        navigate("/admin/messages", { replace: true });
        return;
      }

      // Existing profile → let AuthGate decide
      if (profile) {
        navigate("/auth-gate", { replace: true });
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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const isAdminRequest = role === "admin";

      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        name: name.trim(),
        role: isAdminRequest ? "planner" : role, // 🔒 safe default
        country,
        state: isStateRequired ? state.trim() : null,
        city: city.trim(),
        agreed_terms: true,
        admin_requested: isAdminRequest,
      });

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
        <h1 className="text-3xl font-bold text-white mb-6">
          Complete your profile
        </h1>

        {/* Role selection */}
        <div className="flex flex-col gap-4 mb-6">
          <button
            type="button"
            onClick={() => setRole("planner")}
            className={`w-full py-4 rounded-lg border ${
              role === "planner"
                ? "border-neon-green text-white"
                : "border-gray-700 text-gray-400"
            }`}
          >
            Planner
          </button>

          <button
            type="button"
            onClick={() => setRole("artist")}
            className={`w-full py-4 rounded-lg border ${
              role === "artist"
                ? "border-neon-red text-white"
                : "border-gray-700 text-gray-400"
            }`}
          >
            Artist
          </button>

          <button
            type="button"
            onClick={() => setRole("admin")}
            className={`w-full py-4 rounded-lg border ${
              role === "admin"
                ? "border-yellow-400 text-white"
                : "border-gray-700 text-gray-400"
            }`}
          >
            Admin{" "}
            <span className="text-xs text-gray-400">
              (approval required)
            </span>
          </button>
        </div>

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
              if (e.target.value === "NZ") setState("");
            }}
            className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white"
          >
            <option value="">Select country</option>
            <option value="AU">Australia</option>
            <option value="NZ">New Zealand</option>
          </select>

          <input
            type="text"
            placeholder={isStateRequired ? "State *" : "State (NZ not required)"}
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
            className="w-full bg-neon-red text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {submitting ? "Creating profile…" : "Complete profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
