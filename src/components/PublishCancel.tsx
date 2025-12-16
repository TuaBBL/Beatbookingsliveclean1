import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PublishCancel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event_id');
  const isPromo = searchParams.get('promo') === 'true';
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!eventId) {
      navigate('/events');
      return;
    }

    loadEventDetails();
  }, [eventId]);

  async function loadEventDetails() {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('id, title, status')
        .eq('id', eventId)
        .maybeSingle();

      if (error) throw error;
      if (!event) {
        navigate('/events');
        return;
      }

      setEventTitle(event.title);
      setLoading(false);
    } catch (error) {
      console.error('Error loading event:', error);
      setLoading(false);
    }
  }

  async function handleRetryPayment() {
    if (!eventId) return;

    setRetrying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const endpoint = isPromo
        ? 'create-promo-checkout'
        : 'create-checkout-session';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ event_id: eventId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create checkout session');
        setRetrying(false);
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      alert('Failed to retry payment. Please try again.');
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-charcoal rounded-xl p-8 border border-gray-800 text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          {isPromo ? 'Promo Test Cancelled' : 'Payment Cancelled'}
        </h1>

        <p className="text-xl text-gray-300 mb-2">
          {isPromo ? 'You cancelled the test payment' : 'You cancelled the payment process'}
        </p>

        <p className="text-lg text-gray-400 font-semibold mb-8">
          {eventTitle}
        </p>

        <p className="text-gray-400 mb-8">
          {isPromo
            ? 'No charges were made. You can test the payment flow again anytime.'
            : 'No charges were made. Your event remains in draft status and has not been published. You can try again when you\'re ready.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetryPayment}
            disabled={retrying}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neon-green text-black rounded-lg font-bold hover:bg-neon-green/90 transition shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:shadow-[0_0_35px_rgba(57,255,20,0.7)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Processing...' : 'Try Again'}
          </button>

          <button
            onClick={() => navigate(`/events/${eventId}`)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Event
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <button
            onClick={() => navigate('/events')}
            className="text-gray-400 hover:text-white transition"
          >
            View All Events
          </button>
        </div>
      </div>
    </div>
  );
}
