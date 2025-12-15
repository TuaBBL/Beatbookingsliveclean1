import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Plan = 'free' | 'standard' | 'premium';

export default function SubscriptionModal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('free');
  const [artistId, setArtistId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkArtistProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) {
          navigate('/create-profile');
          return;
        }

        if (profile.role !== 'artist') {
          navigate('/dashboard');
          return;
        }

        const { data: artistProfile } = await supabase
          .from('artist_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!artistProfile) {
          const { data: newArtist, error: createError } = await supabase
            .from('artist_profiles')
            .insert({
              user_id: user.id,
              stage_name: profile.id,
              genre: 'Other',
              category: 'Music',
              location: 'TBD',
              type: 'real',
            })
            .select('id')
            .single();

          if (createError) {
            setError('Failed to create artist profile');
            return;
          }

          setArtistId(newArtist.id);
        } else {
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('artist_id', artistProfile.id)
            .maybeSingle();

          if (subscription) {
            navigate('/dashboard');
            return;
          }

          setArtistId(artistProfile.id);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    checkArtistProfile();
  }, [navigate]);

  const handleContinue = async () => {
    if (!artistId) {
      setError('Artist profile not found');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          artist_id: artistId,
          plan: selectedPlan,
          status: 'active',
        });

      if (insertError) {
        setError(`Error creating subscription: ${insertError.message}`);
        return;
      }

      navigate('/dashboard');
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

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Basic profile listing',
        'Up to 5 photos',
        'Contact via platform',
        'Event calendar',
      ],
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '$29',
      period: '/month',
      popular: true,
      features: [
        'Everything in Free',
        'Featured in search results',
        'Unlimited photos & videos',
        'Direct booking requests',
        'Analytics dashboard',
        'Priority support',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$79',
      period: '/month',
      features: [
        'Everything in Standard',
        'Homepage featured spot',
        'Verified badge',
        'Advanced analytics',
        'Custom branding',
        'Dedicated account manager',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-gray-400 text-lg">
            Select the plan that works best for you. You can change it anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id as Plan)}
              className={`relative cursor-pointer rounded-xl p-8 border-2 transition-all ${
                selectedPlan === plan.id
                  ? 'border-neon-green bg-neon-green/5'
                  : 'border-gray-800 bg-charcoal hover:border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-neon-red text-white text-sm font-bold px-4 py-1 rounded-full">
                    POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-center">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === plan.id
                      ? 'border-neon-green bg-neon-green'
                      : 'border-gray-600'
                  }`}
                >
                  {selectedPlan === plan.id && (
                    <Check className="w-4 h-4 text-black" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-neon-red/10 border border-neon-red rounded-lg p-4 mb-6 max-w-2xl mx-auto">
            <p className="text-neon-red text-sm text-center">{error}</p>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <button
            onClick={handleContinue}
            disabled={submitting}
            className="bg-neon-green text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-neon-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Setting up...' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
