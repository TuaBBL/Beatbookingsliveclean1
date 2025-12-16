import { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchEventsInDateRange } from '../lib/queries/events';

interface Event {
  id: string;
  type: string;
  location: string;
  country: string;
  event_date: string;
  start_time: string;
  end_time: string;
  cover_image: string | null;
  external_link: string | null;
  profiles: {
    name: string;
    role: string;
  };
}

export default function EventsSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWeekEvents();
  }, []);

  async function fetchWeekEvents() {
    try {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const { data, error } = await fetchEventsInDateRange({
        startDate: today.toISOString().split('T')[0],
        endDate: nextWeek.toISOString().split('T')[0],
        limit: 6
      });

      if (error) throw error;

      setEvents(data as Event[]);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatTime(timeString: string) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  if (loading) {
    return (
      <section className="py-20 px-6 bg-black">
        <div className="container mx-auto">
          <div className="text-center text-gray-400">Loading events...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 bg-black">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 glow-text-green">
            This Week's Events
          </h2>
          <p className="text-xl text-gray-400">
            Discover live performances happening near you
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-8">
              No events scheduled for this week yet
            </p>
            <p className="text-gray-500 mb-8">
              Sign in to create your own events and connect with artists
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 rounded-lg bg-neon-green text-black font-bold hover:bg-neon-green/90 transition shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:shadow-[0_0_35px_rgba(57,255,20,0.7)]"
            >
              Sign In to Get Started
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-charcoal rounded-lg overflow-hidden border border-gray-800 hover:border-neon-green/50 transition group"
                >
                  {event.cover_image ? (
                    <div className="h-48 bg-gray-900 overflow-hidden">
                      <img
                        src={event.cover_image}
                        alt={event.type}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-900 to-charcoal flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-gray-700" />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {event.type}
                        </h3>
                        <p className="text-neon-green text-sm font-semibold">
                          {event.profiles.name}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded capitalize">
                        {event.profiles.role}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neon-green" />
                        <span>{formatDate(event.event_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neon-green" />
                        <span>
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-neon-green" />
                        <span>{event.location}, {event.country}</span>
                      </div>
                    </div>

                    {event.external_link && (
                      <a
                        href={event.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block text-sm text-neon-green hover:underline"
                      >
                        Event Details →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => navigate('/login')}
                className="px-10 py-4 rounded-lg bg-neon-green text-black font-bold text-lg hover:bg-neon-green/90 transition shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:shadow-[0_0_35px_rgba(57,255,20,0.7)]"
              >
                Sign In to View All Events
              </button>
              <p className="text-gray-500 mt-4 text-sm">
                Access your dashboard to create and manage events
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
