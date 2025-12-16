import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PublishSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event_id');
  const isPromo = searchParams.get('promo') === 'true';
  const [loading, setLoading] = useState(true);
  const [eventStatus, setEventStatus] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [checkCount, setCheckCount] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setError(true);
      return;
    }

    checkEventStatus();
  }, [eventId]);

  useEffect(() => {
    if (eventStatus === 'draft' && checkCount < 10) {
      const timer = setTimeout(() => {
        setCheckCount(checkCount + 1);
        checkEventStatus();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [eventStatus, checkCount]);

  async function checkEventStatus() {
    try {
      const { data: event, error: queryError } = await supabase
        .from('events')
        .select('id, title, status')
        .eq('id', eventId)
        .maybeSingle();

      if (queryError) throw queryError;
      if (!event) {
        setError(true);
        setLoading(false);
        return;
      }

      setEventTitle(event.title);
      setEventStatus(event.status);
      setLoading(false);
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-neon-green mx-auto mb-4 animate-spin" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !eventId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-charcoal rounded-xl p-8 border border-gray-800 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Your payment has been processed successfully.
          </p>
          <p className="text-gray-400 mb-8">
            Your event will be published shortly. You can view your events from your dashboard.
          </p>
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-neon-green text-black rounded-lg font-bold hover:bg-neon-green/90 transition shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:shadow-[0_0_35px_rgba(57,255,20,0.7)]"
          >
            View Events
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const isPublished = eventStatus === 'published';
  const isProcessing = eventStatus === 'draft' && checkCount < 10;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-charcoal rounded-xl p-8 border border-gray-800 text-center">
        {isPromo ? (
          <>
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Promo Test Successful!
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Payment processed successfully
            </p>
            <p className="text-lg text-orange-400 font-semibold mb-8">
              {eventTitle}
            </p>
            <p className="text-gray-400 mb-8">
              Your test payment of $0.50 was successful. The event remains in draft status and was not published.
            </p>
            <button
              onClick={() => navigate(`/events/${eventId}`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition"
            >
              Back to Event
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        ) : isPublished ? (
          <>
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Your event has been published
            </p>
            <p className="text-lg text-neon-green font-semibold mb-8">
              {eventTitle}
            </p>
            <p className="text-gray-400 mb-8">
              Your event is now live and visible to everyone. You'll receive a confirmation email shortly.
            </p>
            <button
              onClick={() => navigate(`/events/${eventId}`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neon-green text-black rounded-lg font-bold hover:bg-neon-green/90 transition shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:shadow-[0_0_35px_rgba(57,255,20,0.7)]"
            >
              View Your Event
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        ) : isProcessing ? (
          <>
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Processing Payment...
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Your payment was successful
            </p>
            <p className="text-lg text-blue-400 font-semibold mb-8">
              {eventTitle}
            </p>
            <p className="text-gray-400 mb-8">
              We're publishing your event now. This usually takes just a few seconds.
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => checkEventStatus()}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Check Status
              </button>
              <button
                onClick={() => navigate(`/events/${eventId}`)}
                className="px-6 py-3 bg-neon-green text-black rounded-lg font-bold hover:bg-neon-green/90 transition"
              >
                Go to Event
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              Payment Received
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Your event will be published shortly
            </p>
            <p className="text-lg text-yellow-400 font-semibold mb-8">
              {eventTitle}
            </p>
            <p className="text-gray-400 mb-8">
              Your payment has been confirmed. The event is being processed and will be published within a few minutes.
            </p>
            <button
              onClick={() => navigate(`/events/${eventId}`)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neon-green text-black rounded-lg font-bold hover:bg-neon-green/90 transition"
            >
              View Event
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
