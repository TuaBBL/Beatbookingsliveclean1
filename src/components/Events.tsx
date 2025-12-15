import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Plus, Edit2, Trash2, User } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [searchQuery, allEvents]);

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
      let query = supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('event_date', { ascending: true });

      if (profile.country) {
        query = query.eq('country', profile.country);
      }

      if (profile.state) {
        query = query.eq('state', profile.state);
      }

      const { data, error } = await query;

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
    } catch (error) {
      console.error('Error fetching my events:', error);
    }
  }

  function filterEvents() {
    if (!searchQuery.trim()) {
      setFilteredEvents(allEvents);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allEvents.filter(event =>
      event.type.toLowerCase().includes(query) ||
      event.city.toLowerCase().includes(query) ||
      event.state.toLowerCase().includes(query) ||
      event.title.toLowerCase().includes(query)
    );

    setFilteredEvents(filtered);
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
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search by genre or location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
              />
            </div>
            <p className="text-sm text-gray-500">
              Showing events near: {profile.city || 'your area'}, {profile.state || profile.country || 'your region'}
            </p>
          </div>
        </div>

        <section className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-6">All Events</h3>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-charcoal rounded-xl border border-gray-800">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">
                {searchQuery ? 'No events found matching your search' : 'No events available in your area'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
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
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
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

function EventCard({ event }: { event: Event }) {
  return (
    <div className="bg-charcoal rounded-lg overflow-hidden border border-gray-800 hover:border-neon-green/50 transition group">
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

        {event.external_link && (
          <a
            href={event.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neon-green hover:underline"
          >
            Event Details →
          </a>
        )}
      </div>
    </div>
  );
}

function MyEventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
}) {
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
      {event.cover_image ? (
        <div className="h-48 bg-gray-900 overflow-hidden">
          <img
            src={event.cover_image}
            alt={event.title}
            className="w-full h-full object-cover"
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
            <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3>
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

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(event)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => onDelete(event.id)}
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
