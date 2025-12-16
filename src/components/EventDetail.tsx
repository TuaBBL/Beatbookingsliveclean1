import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowLeft, ExternalLink, Users, Check, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Header from './Header';
import Footer from './Footer';

interface Event {
  id: string;
  creator_id: string;
  creator_role: string;
  title: string;
  type: string;
  country: string;
  state: string;
  city: string;
  venue: string | null;
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

interface Attendee {
  id: string;
  user_id: string;
  name: string;
  role: string;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAttending, setIsAttending] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [id]);

  async function loadEventData() {
    if (!id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setCurrentUserId(user.id);

      const [eventResult, attendeesResult, attendanceResult] = await Promise.all([
        supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('event_attendance')
          .select(`
            id,
            user_id,
            profiles!inner(
              name,
              role
            )
          `)
          .eq('event_id', id)
          .eq('status', 'going'),
        supabase
          .from('event_attendance')
          .select('id, status')
          .eq('event_id', id)
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (eventResult.error) throw eventResult.error;
      if (!eventResult.data) {
        navigate('/events');
        return;
      }

      setEvent(eventResult.data);
      setAttendanceStatus(attendanceResult.data?.status || null);
      setIsAttending(attendanceResult.data?.status === 'going');

      if (attendeesResult.data) {
        const formattedAttendees = attendeesResult.data.map((a: any) => ({
          id: a.id,
          user_id: a.user_id,
          name: a.profiles.name,
          role: a.profiles.role
        }));
        setAttendees(formattedAttendees);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading event data:', error);
      setLoading(false);
    }
  }

  async function toggleAttendance() {
    if (!currentUserId || !id || attendanceLoading) return;

    setAttendanceLoading(true);
    try {
      if (!attendanceStatus) {
        await supabase
          .from('event_attendance')
          .insert({
            event_id: id,
            user_id: currentUserId,
            status: 'going'
          });
        setAttendanceStatus('going');
        setIsAttending(true);
      } else {
        const newStatus = attendanceStatus === 'going' ? 'not_going' : 'going';
        await supabase
          .from('event_attendance')
          .update({ status: newStatus })
          .eq('event_id', id)
          .eq('user_id', currentUserId);
        setAttendanceStatus(newStatus);
        setIsAttending(newStatus === 'going');
      }
      await loadEventData();
    } catch (error) {
      console.error('Error toggling attendance:', error);
    } finally {
      setAttendanceLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Event not found</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-8 mt-20">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Events
        </button>

        {event.cover_image && (
          <div className="w-full h-96 mb-8 rounded-xl overflow-hidden">
            <img
              src={event.cover_image}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="bg-charcoal rounded-xl border border-gray-800 p-8 mb-8">
          <h1 className="text-4xl font-bold mb-4">{event.title}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              {event.type}
            </span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm capitalize">
              {event.creator_role}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-400 mt-1" />
              <div>
                <p className="text-gray-400 text-sm">Date</p>
                <p className="text-white">
                  {formatDate(event.event_date)}
                  {event.event_end_date && event.event_end_date !== event.event_date && (
                    <> - {formatDate(event.event_end_date)}</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-400 mt-1" />
              <div>
                <p className="text-gray-400 text-sm">Time</p>
                <p className="text-white">
                  {formatTime(event.start_time)} - {formatTime(event.end_time)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-400 mt-1" />
              <div>
                <p className="text-gray-400 text-sm">Location</p>
                <p className="text-white">
                  {event.venue && <>{event.venue}, </>}
                  {event.city}, {event.state}, {event.country}
                </p>
              </div>
            </div>

            {event.cost !== null && (
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-xl mt-1">$</span>
                <div>
                  <p className="text-gray-400 text-sm">Cost</p>
                  <p className="text-white">
                    {event.cost === 0 ? 'Free' : `$${event.cost}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {event.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              onClick={toggleAttendance}
              disabled={attendanceLoading}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isAttending
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isAttending ? (
                <>
                  <X className="w-4 h-4" />
                  Cancel Attendance
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Attend Event
                </>
              )}
            </button>
            {event.ticket_link && (
              <a
                href={event.ticket_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Get Tickets
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {event.external_link && (
              <a
                href={event.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Buy Tickets
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        <div className="bg-charcoal rounded-xl border border-gray-800 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Attendees</h2>
          </div>

          {attendees.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No attendees yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center gap-3 p-4 bg-black/30 rounded-lg border border-gray-800"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {attendee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{attendee.name}</p>
                    <p className="text-sm text-gray-400 capitalize">{attendee.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
