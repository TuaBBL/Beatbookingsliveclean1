import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../Header';
import Footer from '../Footer';
import BookingDetailModal from '../BookingDetailModal';
import { Calendar, Clock, MapPin, ArrowLeft, User, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface AttendedEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
}

export default function ArtistCalendar() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<AttendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

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

      const [bookingsRes, eventsRes] = await Promise.all([
        supabase
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
          .order('event_date', { ascending: true }),
        supabase
          .from('event_attendance')
          .select(`
            event_id,
            events!inner(
              id,
              title,
              event_date,
              start_time
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'going')
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      setBookings(bookingsRes.data || []);

      if (!eventsRes.error && eventsRes.data) {
        const events = eventsRes.data.map((item: any) => item.events).filter(Boolean);
        setAttendedEvents(events);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  }

  function getItemsForDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0];
    const dayBookings = bookings.filter(b => b.event_date === dateStr);
    const dayEvents = attendedEvents.filter(e => e.event_date === dateStr);
    return { bookings: dayBookings, events: dayEvents };
  }

  function getBookingsForDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.event_date === dateStr);
  }

  function navigateMonth(direction: 'prev' | 'next') {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  }

  function renderCalendar() {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const { bookings: dateBookings, events: dateEvents } = getItemsForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;

      days.push(
        <div
          key={day}
          className={`aspect-square border border-neutral-700 p-2 relative ${
            isPast ? 'bg-neutral-900/50' : 'bg-neutral-900'
          } ${isToday ? 'ring-2 ring-blue-500' : ''} hover:bg-neutral-800 transition`}
        >
          <div className={`text-sm font-medium mb-1 ${isPast ? 'text-gray-600' : 'text-gray-300'}`}>
            {day}
          </div>
          {(dateBookings.length > 0 || dateEvents.length > 0) && (
            <div className="space-y-1">
              {dateBookings.slice(0, 1).map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className="w-full text-left text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded truncate"
                  title={booking.planner.name}
                >
                  {booking.start_time.slice(0, 5)} {booking.planner.name}
                </button>
              ))}
              {dateEvents.slice(0, 1).map((event) => (
                <button
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="w-full text-left text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded truncate"
                  title={event.title}
                >
                  {event.start_time.slice(0, 5)} {event.title}
                </button>
              ))}
              {(dateBookings.length + dateEvents.length) > 2 && (
                <div className="text-xs text-gray-400 px-2">
                  +{(dateBookings.length + dateEvents.length) - 2} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
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

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Confirmed Bookings</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-gray-400 hover:text-white'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-gray-400 hover:text-white'
                }`}
              >
                List
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : viewMode === 'calendar' ? (
            <div>
              <div className="bg-neutral-900 border-2 border-neutral-700 rounded-lg p-6 mb-4">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-neutral-800 rounded-lg transition"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <h2 className="text-2xl font-bold">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-neutral-800 rounded-lg transition"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {renderCalendar()}
                </div>
              </div>

              {bookings.length === 0 && (
                <div className="bg-neutral-900 border-2 border-neutral-700 rounded-lg p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    No confirmed bookings yet. Accepted bookings will appear on the calendar.
                  </p>
                </div>
              )}
            </div>
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
          onCancel={() => {
            setSelectedBooking(null);
            loadBookings();
          }}
        />
      )}

      <Footer />
    </div>
  );
}
