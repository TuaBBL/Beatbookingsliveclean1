import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

type Plan = "free_forever" | "standard" | "premium" | "test";

export default function Subscribe() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [artistId, setArtistId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      setIsAdmin(profile?.is_admin === true);

      const { data: artistProfile } = await supabase
        .from("artist_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!artistProfile) {
        setError("Artist profile not found.");
        return;
      }

      setArtistId(artistProfile.id);
      setLoading(false);
    };

    load();
  }, [navigate]);

  async function activatePlan(plan: Plan) {
    if (!artistId) return;

    try {
      setSubmitting(true);
      setError(null);

      // Free Forever cap
      if (plan === "free_forever") {
        const { count } = await supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("subscription_tier", "free_forever");

        if ((count ?? 0) >= 50) {
          setError("Free Forever spots are no longer available.");
          return;
        }
      }

      const now = new Date();
      const endsAt =
        plan === "test"
          ? new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
          : null;

      const status =
        plan === "free_forever" || plan === "test"
          ? "active"
          : "pending";

      const entitlement =
        plan === "free_forever" || plan === "premium"
          ? "premium"
          : "standard";

      const { error } = await supabase
        .from("subscriptions")
        .upsert(
          {
            artist_id: artistId,
            subscription_tier: plan,
            entitlement_tier: entitlement,
            status,
            started_at: now.toISOString(),
            ends_at: endsAt,
          },
          { onConflict: "artist_id" }
        );

      if (error) throw error;

      // For now, return to dashboard.
      // Stripe will be layered in later for pending plans.
      navigate("/artist/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to activate subscription.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading subscription options…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        <h1 className="text-4xl font-bold mb-2">
          Activate Your Artist Profile
        </h1>
        <p className="text-gray-400 mb-8">
          Choose a plan to make your profile visible and start receiving bookings.
        </p>

        {error && (
          <div className="mb-6 bg-red-950/40 border border-red-700 text-red-300 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* FREE FOREVER */}
          <PlanCard
            title="FOUNDING ARTIST"
            price="$0"
            accent="green"
            badge="LIMITED"
            features={[
              "All Standard features",
              "Priority display in directories",
              "Priority search placement",
              "Featured on carousel",
              "Analytics",
              "Unlimited published events",
            ]}
            selected={selectedPlan === "free_forever"}
            onSelect={() => setSelectedPlan("free_forever")}
            onConfirm={() => activatePlan("free_forever")}
            disabled={submitting}
            cta="Claim Free Spot"
          />

          {/* STANDARD */}
          <PlanCard
            title="STANDARD"
            price="$25 / month"
            accent="red"
            badge="MOST POPULAR"
            features={[
              "Artist directory listing",
              "Booking availability",
              "Access to all planners",
              "Unlimited published events",
            ]}
            selected={selectedPlan === "standard"}
            onSelect={() => setSelectedPlan("standard")}
            onConfirm={() => activatePlan("standard")}
            disabled={submitting}
            cta="Go Live"
            highlight
          />

          {/* PREMIUM */}
          <PlanCard
            title="PREMIUM"
            price="$35 / month"
            accent="red"
            features={[
              "All Standard features",
              "Priority display in directories",
              "Priority search placement",
              "Featured on carousel",
              "Analytics",
              "Unlimited published events",
            ]}
            selected={selectedPlan === "premium"}
            onSelect={() => setSelectedPlan("premium")}
            onConfirm={() => activatePlan("premium")}
            disabled={submitting}
            cta="Upgrade to Premium"
            outline
          />

          {/* TEST PLAN */}
          {(isAdmin || import.meta.env.DEV) && (
            <PlanCard
              title="TEST PLAN"
              price="$0.50"
              accent="gray"
              badge="DEV ONLY"
              features={[
                "Stripe test checkout",
                "24 hour access",
              ]}
              selected={selectedPlan === "test"}
              onSelect={() => setSelectedPlan("test")}
              onConfirm={() => activatePlan("test")}
              disabled={submitting}
              cta="Test Checkout"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- COMPONENT ---------------- */

function PlanCard({
  title,
  price,
  features,
  cta,
  accent,
  badge,
  selected,
  onSelect,
  onConfirm,
  disabled,
  highlight,
  outline,
}: any) {
  const accentMap: any = {
    green: "border-green-500 bg-green-500/10",
    red: outline
      ? "border-red-500/40"
      : "border-red-600 bg-red-500/10",
    gray: "border-gray-600 bg-gray-800/30",
  };

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-xl p-6 border ${
        accentMap[accent]
      } ${highlight ? "scale-105" : ""} ${
        selected ? "ring-2 ring-white" : ""
      }`}
    >
      {badge && (
        <div className="text-xs mb-2 inline-block px-2 py-1 rounded bg-black/40">
          {badge}
        </div>
      )}

      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-4">{price}</p>

      <ul className="text-sm text-gray-300 space-y-2 mb-6">
        {features.map((f: string) => (
          <li key={f}>✔ {f}</li>
        ))}
      </ul>

      {selected && (
        <button
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          className={`w-full py-3 rounded-lg font-semibold ${
            accent === "green"
              ? "bg-green-600 hover:bg-green-700"
              : accent === "red"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {cta}
        </button>
      )}
    </div>
  );
}
