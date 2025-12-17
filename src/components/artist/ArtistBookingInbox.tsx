import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../Header';
import Footer from '../Footer';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

interface Booking {
  id: string;
  planner_id: string;
  status: string;
  event_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  planner: {
    name: string;
    email: string;
    image_url: string | null;
    city: string | null;
    state: string | null;
  };
}

export default function ArtistBookingInbox() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!artistProfile) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          planner_id,
          status,
          event_date,
          start_time,
          end_time,
          created_at,
          planner:profiles!bookings_planner_id_fkey(
            name,
            email,
            image_url,
            city,
            state
          )
        `)
        .eq('artist_id', artistProfile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBookingResponse(bookingId: string, newStatus: 'accepted' | 'declined') {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      setToast(newStatus === 'accepted' ? 'Booking accepted!' : 'Booking declined');
      setTimeout(() => setToast(null), 3000);
      loadBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      setToast('Failed to update booking');
      setTimeout(() => setToast(null), 3000);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/artist/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <h1 className="text-4xl font-bold mb-8">Booking Requests</h1>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : bookings.length === 0 ? (
            <div className="bg-neutral-900 border-2 border-neutral-700 rounded-lg p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pending requests</h3>
              <p className="text-gray-400">
                You don't have any booking requests at the moment
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-neutral-900 border-2 border-neutral-700 rounded-lg p-6 hover:border-blue-500 transition"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-neutral-700 flex-shrink-0">
                        {booking.planner.image_url ? (
                          <img
                            src={booking.planner.image_url}
                            alt={booking.planner.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold">
                            {booking.planner.name[0]}
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">
                          {booking.planner.name}
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                          {booking.planner.email}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>
                              {new Date(booking.event_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-green-500" />
                            <span>
                              {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                            </span>
                          </div>
                          {(booking.planner.city || booking.planner.state) && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-orange-500" />
                              <span>
                                {[booking.planner.city, booking.planner.state]
                                  .filter(Boolean)
                                  .join(', ')}
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-3">
                          Requested {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleBookingResponse(booking.id, 'accepted')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition text-white font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleBookingResponse(booking.id, 'declined')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-white font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-neutral-900 border-2 border-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}
