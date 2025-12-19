import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../Header';
import Footer from '../Footer';
import BookingDetailModal from '../BookingDetailModal';
import { Calendar, Clock, MapPin, ArrowLeft, User } from 'lucide-react';

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

export default function ArtistCalendar() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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
        .eq('status', 'accepted')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
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

          <h1 className="text-4xl font-bold mb-8">Confirmed Bookings</h1>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : bookings.length === 0 ? (
            <div className="bg-neutral-900 border-2 border-neutral-700 rounded-lg p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No confirmed bookings</h3>
              <p className="text-gray-400">
                Your confirmed bookings will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className="w-full bg-neutral-900 border-2 border-green-700 rounded-lg p-6 hover:border-green-500 hover:bg-neutral-800 transition cursor-pointer text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-green-700 flex-shrink-0">
                      {booking.planner.image_url ? (
                        <img
                          src={booking.planner.image_url}
                          alt={booking.planner.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">
                            {booking.planner.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {booking.planner.email}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500 rounded-full text-sm font-medium">
                          Confirmed
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>
                            {new Date(booking.event_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
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
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedBooking && (
        <BookingDetailModal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
          userRole="artist"
        />
      )}

      <Footer />
    </div>
  );
}
