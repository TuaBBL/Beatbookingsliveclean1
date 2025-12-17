import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowLeft, ExternalLink, Users, Check, Plus, X, MessageCircle, Trash2, Reply } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchEventById, countPublishedEventsByUser } from '../lib/queries/events';
import { canPublishEvent } from '../lib/logic/publishEligibility';
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

interface Comment {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  user_name: string;
  user_role: string;
  replies?: Comment[];
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [publishedCount, setPublishedCount] = useState(0);
  const [publishLoading, setPublishLoading] = useState(false);

  useEffect(() => {
    loadEventData();
    loadComments();
  }, [id]);

  async function loadComments() {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('event_comments')
        .select(`
          id,
          event_id,
          user_id,
          content,
          parent_id,
          created_at,
          profiles!inner(
            name,
            role
          )
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedComments = data.map((c: any) => ({
        id: c.id,
        event_id: c.event_id,
        user_id: c.user_id,
        content: c.content,
        parent_id: c.parent_id,
        created_at: c.created_at,
        user_name: c.profiles.name,
        user_role: c.profiles.role,
        replies: []
      }));

      const topLevelComments = formattedComments.filter((c: Comment) => !c.parent_id);
      const replies = formattedComments.filter((c: Comment) => c.parent_id);

      replies.forEach((reply: Comment) => {
        const parent = topLevelComments.find((c: Comment) => c.id === reply.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(reply);
        }
      });

      setComments(topLevelComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }

  async function loadEventData() {
    if (!id) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setCurrentUserId(user.id);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setUserRole(profileData.role);

        const { count } = await countPublishedEventsByUser(user.id);
        setPublishedCount(count || 0);
      }

      const [eventResult, attendeesResult, attendanceResult] = await Promise.all([
        fetchEventById(id),
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

  async function postComment() {
    if (!currentUserId || !id || !newComment.trim() || commentLoading) return;

    setCommentLoading(true);
    try {
      const { error } = await supabase
        .from('event_comments')
        .insert({
          event_id: id,
          user_id: currentUserId,
          content: newComment.trim(),
          parent_id: null
        });

      if (error) throw error;

      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setCommentLoading(false);
    }
  }

  async function postReply(parentId: string) {
    if (!currentUserId || !id || !replyContent.trim() || commentLoading) return;
    if (!event || event.creator_id !== currentUserId) return;

    setCommentLoading(true);
    try {
      const { error } = await supabase
        .from('event_comments')
        .insert({
          event_id: id,
          user_id: currentUserId,
          content: replyContent.trim(),
          parent_id: parentId
        });

      if (error) throw error;

      setReplyContent('');
      setReplyingTo(null);
      await loadComments();
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setCommentLoading(false);
    }
  }

  async function deleteComment(commentId: string) {
    if (!currentUserId || !event || event.creator_id !== currentUserId) return;

    try {
      const { error } = await supabase
        .from('event_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  async function handlePublishEvent() {
    if (!currentUserId || !event || publishLoading) return;

    setPublishLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to publish events');
        setPublishLoading(false);
        return;
      }

      const eligibility = await canPublishEvent({
        creatorRole: userRole as "artist" | "planner",
      });

      if (eligibility.requiresPayment) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
          {
            method: 'POST',
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ event_id: event.id }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || 'Failed to create checkout session');
          setPublishLoading(false);
          return;
        }

        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        }
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publish-free-event`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ event_id: event.id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402 && data.requires_payment) {
          alert("You've used your 1 free event publish.\nPublish this event for $30.");
        } else {
          alert(data.error || 'Failed to publish event');
        }
        setPublishLoading(false);
        return;
      }

      const message = userRole === 'planner' && publishedCount < 1
        ? 'Your first event has been published for free!'
        : 'Event published successfully!';

      alert(message);
      await loadEventData();
      await loadComments();
    } catch (error) {
      console.error('Error publishing event:', error);
      alert('Failed to publish event');
    } finally {
      setPublishLoading(false);
    }
  }

  async function handlePromo() {
    if (!currentUserId || !event || publishLoading) return;

    setPublishLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in');
        setPublishLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-promo-checkout`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ event_id: event.id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create promo checkout');
        setPublishLoading(false);
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Error in promo test:', error);
      alert('Failed to create promo checkout');
    } finally {
      setPublishLoading(false);
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

  const formatCommentDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
            {event.status === 'draft' && (
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">
                Draft – Not visible to the public
              </span>
            )}
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
            {event.status === 'draft' && event.creator_id === currentUserId ? (
              <div className="w-full">
                <div className="mb-4 p-3 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-400">
                  <p>Debug Info:</p>
                  <p>Event Status: {event.status}</p>
                  <p>Creator ID: {event.creator_id}</p>
                  <p>Current User ID: {currentUserId || 'Not set'}</p>
                  <p>User Role: {userRole || 'Not set'}</p>
                  <p>Match: {event.creator_id === currentUserId ? 'YES' : 'NO'}</p>
                </div>
                {userRole === 'planner' && publishedCount === 0 && (
                  <p className="text-sm text-blue-400 mb-3">
                    1 free publish remaining
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={handlePublishEvent}
                    disabled={publishLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-neon-green hover:bg-neon-green/90 text-black rounded-lg font-bold transition shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:shadow-[0_0_35px_rgba(57,255,20,0.7)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    {publishLoading ? 'Publishing...' : (
                      userRole === 'planner' && publishedCount >= 1
                        ? 'Publish ($30)'
                        : userRole === 'planner'
                        ? 'Publish (Free)'
                        : 'Publish'
                    )}
                  </button>
                  <button
                    onClick={handlePromo}
                    disabled={publishLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Promo Test ($0.50)
                  </button>
                </div>
              </div>
            ) : event.status === 'draft' ? (
              <div className="w-full p-4 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                <p className="text-yellow-400 font-semibold mb-2">This is not your event</p>
                <p className="text-sm text-gray-400">Only the event creator can publish this event.</p>
                <div className="mt-3 text-xs text-gray-500">
                  <p>Event Creator ID: {event.creator_id}</p>
                  <p>Your User ID: {currentUserId || 'Not logged in'}</p>
                </div>
              </div>
            ) : event.status === 'published' && (
              <>
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
              </>
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

        <div className="bg-charcoal rounded-xl border border-gray-800 p-8 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Comments</h2>
          </div>

          <div className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
            />
            <button
              onClick={postComment}
              disabled={commentLoading || !newComment.trim()}
              className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {commentLoading ? 'Posting...' : 'Post Comment'}
            </button>
          </div>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-gray-700 pl-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold">
                        {comment.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{comment.user_name}</span>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs capitalize">
                          {comment.user_role}
                        </span>
                        <span className="text-sm text-gray-500">{formatCommentDate(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-300">{comment.content}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {event && event.creator_id === currentUserId && (
                          <>
                            <button
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <Reply className="w-3 h-3" />
                              Reply
                            </button>
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {replyingTo === comment.id && (
                    <div className="ml-13 mt-3 mb-3">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => postReply(comment.id)}
                          disabled={commentLoading || !replyContent.trim()}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {commentLoading ? 'Posting...' : 'Reply'}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-13 mt-3 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3 border-l-2 border-gray-800 pl-4">
                          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-semibold">
                              {reply.user_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white text-sm">{reply.user_name}</span>
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs capitalize">
                                {reply.user_role}
                              </span>
                              <span className="text-xs text-gray-500">{formatCommentDate(reply.created_at)}</span>
                            </div>
                            <p className="text-gray-300 text-sm">{reply.content}</p>
                            {event && event.creator_id === currentUserId && (
                              <button
                                onClick={() => deleteComment(reply.id)}
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mt-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
