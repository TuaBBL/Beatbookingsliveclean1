import { useState, useEffect } from 'react';
import { Check, Sparkles, Crown, TestTube } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Header from './Header';
import Footer from './Footer';

type Plan = 'free' | 'standard' | 'premium' | 'test';

export default function Subscribe() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();

        setIsAdmin(profile?.is_admin || false);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    console.log('Selected plan:', plan);
  };

  const isDev = import.meta.env.DEV;
  const showTestPlan = isAdmin || isDev;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Activate Your Artist Profile
            </h1>
            <p className="text-lg text-gray-400 mb-4">
              Choose a plan to make your profile visible and start receiving bookings.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-950/50 border border-red-900/50 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-red-400 text-sm font-medium">
                Your profile is currently inactive
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <PlanCard
              plan="free"
              label="FOUNDING ARTIST"
              badge="LIMITED"
              badgeColor="green"
              price="$0"
              priceSubtext="Free forever (limited spots)"
              features={[
                'Standard features',
                'Priority display on all directories',
                'Priority in searches for your location',
                'Featured on carousel',
                'Analytical data',
                'Unlimited published events',
              ]}
              buttonText="Claim Free Spot"
              buttonColor="green"
              accentColor="green"
              isSelected={selectedPlan === 'free'}
              onSelect={() => handleSelectPlan('free')}
            />

            <PlanCard
              plan="standard"
              label="STANDARD"
              badge="MOST POPULAR"
              badgeColor="red"
              price="$25"
              priceSubtext="per month"
              features={[
                'Listing on Artist directory',
                'Booking availability',
                'Access to all planners',
                'Unlimited published events',
              ]}
              buttonText="Go Live"
              buttonColor="red"
              accentColor="red"
              isPopular={true}
              isSelected={selectedPlan === 'standard'}
              onSelect={() => handleSelectPlan('standard')}
            />

            <PlanCard
              plan="premium"
              label="PREMIUM"
              badge={null}
              badgeColor="red"
              price="$35"
              priceSubtext="per month"
              features={[
                'All Standard features',
                'Priority display on all directories',
                'Analytical data',
                'Priority in searches for your location',
                'Featured on carousel',
                'Unlimited published events',
              ]}
              buttonText="Upgrade to Premium"
              buttonColor="red-outline"
              accentColor="red"
              isSelected={selectedPlan === 'premium'}
              onSelect={() => handleSelectPlan('premium')}
            />

            {showTestPlan && (
              <PlanCard
                plan="test"
                label="TEST PLAN"
                badge="DEV ONLY"
                badgeColor="gray"
                price="$0.50"
                priceSubtext="one-time (for testing)"
                features={[
                  'For Stripe testing only',
                  'Temporary access',
                ]}
                buttonText="Test Checkout"
                buttonColor="gray"
                accentColor="gray"
                isSelected={selectedPlan === 'test'}
                onSelect={() => handleSelectPlan('test')}
              />
            )}
          </div>

          {selectedPlan && (
            <div className="mt-8 max-w-2xl mx-auto bg-neutral-900 border border-neutral-700 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Plan Selected</h3>
              <p className="text-gray-400">
                You selected: <span className="text-white font-medium">{selectedPlan.toUpperCase()}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Stripe checkout will be integrated in the next phase.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  label: string;
  badge: string | null;
  badgeColor: 'green' | 'red' | 'gray';
  price: string;
  priceSubtext: string;
  features: string[];
  buttonText: string;
  buttonColor: 'green' | 'red' | 'red-outline' | 'gray';
  accentColor: 'green' | 'red' | 'gray';
  isPopular?: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function PlanCard({
  label,
  badge,
  badgeColor,
  price,
  priceSubtext,
  features,
  buttonText,
  buttonColor,
  accentColor,
  isPopular = false,
  isSelected,
  onSelect,
}: PlanCardProps) {
  const getBorderClass = () => {
    if (isSelected) {
      if (accentColor === 'green') return 'border-green-500 ring-2 ring-green-500/50';
      if (accentColor === 'red') return 'border-red-500 ring-2 ring-red-500/50';
      return 'border-gray-500 ring-2 ring-gray-500/50';
    }
    if (accentColor === 'green') return 'border-green-900/50 hover:border-green-700';
    if (accentColor === 'red') return 'border-red-900/50 hover:border-red-700';
    return 'border-neutral-700 hover:border-neutral-600';
  };

  const getBadgeClass = () => {
    if (badgeColor === 'green') return 'bg-green-950/50 text-green-400 border-green-900/50';
    if (badgeColor === 'red') return 'bg-red-950/50 text-red-400 border-red-900/50';
    return 'bg-neutral-800 text-gray-400 border-neutral-700';
  };

  const getButtonClass = () => {
    if (buttonColor === 'green') {
      return 'bg-green-600 hover:bg-green-700 text-white';
    }
    if (buttonColor === 'red') {
      return 'bg-red-600 hover:bg-red-700 text-white';
    }
    if (buttonColor === 'red-outline') {
      return 'bg-transparent border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white';
    }
    return 'bg-neutral-700 hover:bg-neutral-600 text-gray-300';
  };

  const getIconClass = () => {
    if (accentColor === 'green') return 'text-green-500';
    if (accentColor === 'red') return 'text-red-500';
    return 'text-gray-500';
  };

  const Icon = accentColor === 'green' ? Sparkles : accentColor === 'red' ? Crown : TestTube;

  return (
    <div
      className={`
        relative bg-neutral-900 rounded-lg border-2 p-6 transition-all duration-300
        ${getBorderClass()}
        ${isPopular ? 'transform scale-105 shadow-2xl' : ''}
        ${accentColor === 'green' ? 'shadow-green-900/20' : accentColor === 'red' ? 'shadow-red-900/20' : ''}
      `}
    >
      {badge && (
        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border mb-4 ${getBadgeClass()}`}>
          {badge}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-6 h-6 ${getIconClass()}`} />
        <h3 className="text-xl font-bold">{label}</h3>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-4xl font-bold">{price}</span>
        </div>
        <p className="text-sm text-gray-400">{priceSubtext}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getIconClass()}`} />
            <span className="text-sm text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`
          w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200
          ${getButtonClass()}
          ${isSelected ? 'ring-2 ring-offset-2 ring-offset-neutral-900' : ''}
        `}
      >
        {isSelected ? 'Selected' : buttonText}
      </button>
    </div>
  );
}
