import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SubscriptionStatusCardProps {
  artistId: string;
}

export default function SubscriptionStatusCard({ artistId }: SubscriptionStatusCardProps) {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, [artistId]);

  async function loadSubscription() {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('artist_id', artistId)
        .maybeSingle();

      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  const isActive = () => {
    if (!subscription) return false;
    return subscription.is_active === true;
  };

  const getStatusConfig = () => {
    if (!subscription) {
      return {
        icon: AlertCircle,
        iconColor: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        title: 'Profile Inactive',
        message: 'Your profile is inactive and hidden from planners',
        buttonText: 'Activate Subscription',
        buttonColor: 'bg-orange-600 hover:bg-orange-700',
      };
    }

    if (isActive()) {
      return {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        title: 'Profile Active',
        message: `Your profile is live on ${subscription.plan} plan`,
        buttonText: null,
        buttonColor: '',
      };
    }

    return {
      icon: XCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      title: 'Subscription Inactive',
      message: 'Your profile is inactive and hidden from planners',
      buttonText: 'Activate Subscription',
      buttonColor: 'bg-red-600 hover:bg-red-700',
    };
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-neutral-800 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-neutral-800 rounded w-2/3"></div>
      </div>
    );
  }

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0 mt-1`} />
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{config.title}</h3>
            <p className="text-gray-300 text-sm">{config.message}</p>
          </div>
        </div>

        {config.buttonText && (
          <button
            onClick={() => navigate('/subscribe')}
            className={`${config.buttonColor} text-white px-6 py-2 rounded-lg transition-colors whitespace-nowrap font-medium`}
          >
            {config.buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
