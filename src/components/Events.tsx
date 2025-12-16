import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Search, Plus, CreditCard as Edit2, Trash2, User, ArrowLeft, Check, X, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CreateEventModal from './CreateEventModal';

interface Event {
  id: string;
  creator_id: string;
  creator_role: string;
  title: string;
  type: string;
  country: string;
  state: string;
  city: string;
  event_date: string;
  event_end_date: string | null;
  start_time: string;
  end_time: string;
  cost: number | null;
  ticket_link: string | null;
  cover_image: string | null;
  description: string | null;
  external_link: string | null;
  status: string;
  created_at: string;
}

interface Profile {
  id: string;
  role: string;
  name: string;
  country: string | null;
  state: string | null;
  city: string | null;
}

export default function Events() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchFilters, setSearchFilters] = useState({
    city: '',
    country: '',
    category: '',
    artist: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [publishedCount, setPublishedCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [searchFilters, allEvents]);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, name, country, state, city')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        navigate('/create-profile');
        return;
      }

      setProfile(profileData);

      await Promise.all([
        fetchAllEvents(profileData),
        fetchMyEvents(user.id)
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  }

  async function fetchAllEvents(profile: Profile) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setAllEvents(data || []);
    } catch (error) {
      console.error('Error fetching all events:', error);
    }
  }

  async function fetchMyEvents(userId: string) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', userId)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setMyEvents(data || []);

      const publishedEvents = data?.filter(e => e.status === 'published') || [];
      setPublishedCount(publishedEvents.length);
    } catch (error) {
      console.error('Error fetching my events:', error);
    }
  }

  function filterEvents() {
    const hasFilters = Object.values(searchFilters).some(val => val.trim());

    if (!hasFilters) {
      setFilteredEvents(allEvents);
      return;
    }

    const filtered = allEvents.filter(event => {
      const matchesCity = !searchFilters.city.trim() ||
        event.city.toLowerCase().includes(searchFilters.city.toLowerCase());

      const matchesCountry = !searchFilters.country.trim() ||
        event.country.toLowerCase().includes(searchFilters.country.toLowerCase());

      const matchesCategory = !searchFilters.category.trim() ||
        event.type.toLowerCase().includes(searchFilters.category.toLowerCase());

      const matchesArtist = !searchFilters.artist.trim() ||
        event.title.toLowerCase().includes(searchFilters.artist.toLowerCase());

      return matchesCity && matchesCountry && matchesCategory && matchesArtist;
    });

    setFilteredEvents(filtered);
  }

  function handleSearchClick() {
    filterEvents();
  }

  function handleClearFilters() {
    setSearchFilters({
      city: '',
      country: '',
      category: '',
      artist: ''
    });
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatTime(timeString: string) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setMyEvents(myEvents.filter(e => e.id !== eventId));
      setAllEvents(allEvents.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  }

  function handleEditEvent(event: Event) {
    setEditingEvent(event);
    setShowCreateModal(true);
  }

  async function handlePublishEvent(eventId: string) {
    if (!profile) return;

    if (profile.role === 'planner' && publishedCount >= 5) {
      alert('You have used all 5 free publishes. Please pay $30 to publish this event.');
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'published' })
        .eq('id', eventId);

      if (error) throw error;

      const message = profile.role === 'planner' && publishedCount < 5
        ? `Event published for free! You have ${4 - publishedCount} free publishes remaining.`
        : 'Event published successfully!';

      alert(message);

      fetchMyEvents(profile.id);
      fetchAllEvents(profile);
    } catch (error) {
      console.error('Error publishing event:', error);
      alert('Failed to publish event');
    }
  }

  function handleEventCreated() {
    setShowCreateModal(false);
    setEditingEvent(null);
    if (profile) {
      fetchMyEvents(profile.id);
      fetchAllEvents(profile);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-charcoal border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <h1
                onClick={() => navigate('/dashboard')}
                className="text-2xl font-bold text-neon-green cursor-pointer hover:opacity-80 transition"
              >
                BeatBookingsLive
              </h1>
              <div className="hidden sm:flex items-center gap-2 text-gray-400">
                <User className="w-4 h-4" />
                <span className="text-sm">{profile.name}</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-neon-red text-white px-4 py-2 rounded-lg font-semibold hover:bg-neon-red/90 transition text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-neon-green transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">Events</h2>
            <p className="text-gray-400">Discover events in your area or manage your own</p>
          </div>
          <button
            onClick={() => {
              setEditingEvent(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-neon-green text-black font-bold hover:bg-neon-green/90 transition shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:shadow-[0_0_35px_rgba(57,255,20,0.7)]"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>

        <div className="mb-12 bg-charcoal rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Search Events</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">City</label>
              <input
                type="text"
                placeholder="Enter city..."
                value={searchFilters.city}
                onChange={(e) => setSearchFilters({ ...searchFilters, city: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Country</label>
              <input
                type="text"
                placeholder="Enter country..."
                value={searchFilters.country}
                onChange={(e) => setSearchFilters({ ...searchFilters, country: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Category</label>
              <input
                type="text"
                placeholder="Enter category..."
                value={searchFilters.category}
                onChange={(e) => setSearchFilters({ ...searchFilters, category: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Artist</label>
              <input
                type="text"
                placeholder="Enter artist name..."
                value={searchFilters.artist}
                onChange={(e) => setSearchFilters({ ...searchFilters, artist: e.target.value })}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSearchClick}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-neon-green text-black font-bold hover:bg-neon-green/90 transition shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:shadow-[0_0_35px_rgba(57,255,20,0.7)]"
            >
              <Search className="w-5 h-5" />
              Search Events
            </button>

            <button
              onClick={handleClearFilters}
              className="px-6 py-3 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition"
            >
              Clear Filters
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Showing all published events worldwide
          </p>
        </div>

        <section className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-6">All Events</h3>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-charcoal rounded-xl border border-gray-800">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">
                {Object.values(searchFilters).some(val => val.trim())
                  ? 'No events found matching your search'
                  : 'No events available in your area'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} userId={profile.id} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-2xl font-bold text-white mb-6">My Events</h3>

          {myEvents.length === 0 ? (
            <div className="text-center py-16 bg-charcoal rounded-xl border border-gray-800">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-6">You haven't created any events yet</p>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setShowCreateModal(true);
                }}
                className="px-6 py-3 rounded-lg bg-neon-green text-black font-bold hover:bg-neon-green/90 transition"
              >
                Create Your First Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map((event) => (
                <MyEventCard
                  key={event.id}
                  event={event}
                  userId={profile.id}
                  userRole={profile.role}
                  publishedCount={publishedCount}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                  onPublish={handlePublishEvent}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {showCreateModal && (
        <CreateEventModal
          event={editingEvent}
          profile={profile}
          onClose={() => {
            setShowCreateModal(false);
            setEditingEvent(null);
          }}
          onSuccess={handleEventCreated}
        />
      )}
    </div>
  );
}

function EventCard({ event, userId }: { event: Event; userId: string }) {
  const navigate = useNavigate();
  const [isAttending, setIsAttending] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAttendance();
  }, [event.id, userId]);

  async function checkAttendance() {
    const { data } = await supabase
      .from('event_attendance')
      .select('id, status')
      .eq('event_id', event.id)
      .eq('user_id', userId)
      .maybeSingle();

    setAttendanceStatus(data?.status || null);
    setIsAttending(data?.status === 'going');
  }

  async function toggleAttendance(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      if (!attendanceStatus) {
        await supabase
          .from('event_attendance')
          .insert({
            event_id: event.id,
            user_id: userId,
            status: 'going'
          });
        setAttendanceStatus('going');
        setIsAttending(true);
      } else {
        const newStatus = attendanceStatus === 'going' ? 'not_going' : 'going';
        await supabase
          .from('event_attendance')
          .update({ status: newStatus })
          .eq('event_id', event.id)
          .eq('user_id', userId);
        setAttendanceStatus(newStatus);
        setIsAttending(newStatus === 'going');
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-charcoal rounded-lg overflow-hidden border border-gray-800 hover:border-neon-green/50 transition group">
      <div
        onClick={() => navigate(`/events/${event.id}`)}
        className="cursor-pointer"
      >
        {event.cover_image ? (
          <div className="h-48 bg-gray-900 overflow-hidden">
            <img
              src={event.cover_image}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-gray-900 to-charcoal flex items-center justify-center">
            <Calendar className="w-16 h-16 text-gray-700" />
          </div>
        )}

        <div className="p-6">
          <div className="mb-3">
            <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              {event.type}
            </span>
          </div>

          <div className="space-y-2 text-sm text-gray-400 mb-4">
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
              <span>{event.city}, {event.state}</span>
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 flex flex-col gap-2">
        <button
          onClick={toggleAttendance}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
            isAttending
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          {isAttending ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Attend
            </>
          )}
        </button>
        {event.external_link && (
          <a
            href={event.external_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neon-green hover:bg-neon-green/90 text-black rounded-lg font-semibold transition"
          >
            Tickets
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

function MyEventCard({
  event,
  userId,
  userRole,
  publishedCount,
  onEdit,
  onDelete,
  onPublish,
}: {
  event: Event;
  userId: string;
  userRole: string;
  publishedCount: number;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [isAttending, setIsAttending] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAttendance();
  }, [event.id, userId]);

  async function checkAttendance() {
    const { data } = await supabase
      .from('event_attendance')
      .select('id, status')
      .eq('event_id', event.id)
      .eq('user_id', userId)
      .maybeSingle();

    setAttendanceStatus(data?.status || null);
    setIsAttending(data?.status === 'going');
  }

  async function toggleAttendance(e: React.MouseEvent) {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      if (!attendanceStatus) {
        await supabase
          .from('event_attendance')
          .insert({
            event_id: event.id,
            user_id: userId,
            status: 'going'
          });
        setAttendanceStatus('going');
        setIsAttending(true);
      } else {
        const newStatus = attendanceStatus === 'going' ? 'not_going' : 'going';
        await supabase
          .from('event_attendance')
          .update({ status: newStatus })
          .eq('event_id', event.id)
          .eq('user_id', userId);
        setAttendanceStatus(newStatus);
        setIsAttending(newStatus === 'going');
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-600';
      case 'draft':
        return 'bg-yellow-600';
      case 'completed':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="bg-charcoal rounded-lg overflow-hidden border border-gray-800">
      <div
        onClick={() => navigate(`/events/${event.id}`)}
        className="cursor-pointer"
      >
        {event.cover_image ? (
          <div className="h-48 bg-gray-900 overflow-hidden">
            <img
              src={event.cover_image}
              alt={event.title}
              className="w-full h-full object-cover hover:scale-105 transition duration-300"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-gray-900 to-charcoal flex items-center justify-center">
            <Calendar className="w-16 h-16 text-gray-700" />
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3
              onClick={() => navigate(`/events/${event.id}`)}
              className="text-xl font-bold text-white mb-1 cursor-pointer hover:text-neon-green transition"
            >
              {event.title}
            </h3>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              {event.type}
            </span>
          </div>
          <span className={`text-xs text-white px-2 py-1 rounded ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-400 mb-4">
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
            <span>{event.city}, {event.state}</span>
          </div>
        </div>

        <button
          onClick={toggleAttendance}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition mb-3 disabled:opacity-50 disabled:cursor-not-allowed ${
            isAttending
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          {isAttending ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Attend
            </>
          )}
        </button>

        {event.external_link && event.status === 'published' && (
          <a
            href={event.external_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neon-green hover:bg-neon-green/90 text-black rounded-lg font-semibold transition mb-3"
          >
            Tickets
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {event.status === 'draft' && (
          <div className="mb-3">
            {userRole === 'planner' && publishedCount < 5 && (
              <p className="text-sm text-blue-400 mb-2 text-center">
                {5 - publishedCount} free publish{5 - publishedCount === 1 ? '' : 'es'} remaining
              </p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPublish(event.id);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neon-green hover:bg-neon-green/90 text-black rounded-lg font-semibold transition shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:shadow-[0_0_35px_rgba(57,255,20,0.7)]"
            >
              <Check className="w-4 h-4" />
              {userRole === 'planner' && publishedCount >= 5
                ? 'Publish ($30)'
                : userRole === 'planner'
                ? 'Publish (Free)'
                : 'Publish'}
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(event.id);
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-neon-red text-white rounded-lg hover:bg-neon-red/90 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(timeString: string) {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}
