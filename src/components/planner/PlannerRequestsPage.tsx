import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../Header';
import Footer from '../Footer';
import PlannerProfileMenu from './PlannerProfileMenu';
import { ArrowLeft, Calendar, MapPin, MessageSquare, User, FileText, ShieldAlert, Edit, XCircle, Send } from 'lucide-react';

interface BookingRequest {
  id: string;
  artist_user_id: string;
  event_name: string;
  event_date: string;
  event_location: string;
  message: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string;
  created_at: string;
  booking_id: string | null;
  artist: {
    name: string;
    email: string;
    image_url: string | null;
  };
}

export default function PlannerRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [editingRequest, setEditingRequest] = useState<BookingRequest | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [messagingRequest, setMessagingRequest] = useState<BookingRequest | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role !== 'planner') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const { data: requestsData, error } = await supabase
        .from('booking_requests')
        .select('id, artist_user_id, event_name, event_date, event_location, message, start_time, end_time, status, created_at, booking_id')
        .eq('planner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const artistIds = [...new Set(requestsData.map(r => r.artist_user_id))];

      const { data: artistsData } = await supabase
        .from('profiles')
        .select('id, name, email, image_url')
        .in('id', artistIds);

      const artistsMap = new Map(
        (artistsData || []).map(artist => [artist.id, artist])
      );

      const requestsWithArtists = requestsData.map(request => ({
        ...request,
        artist: artistsMap.get(request.artist_user_id) || {
          name: 'Unknown Artist',
          email: '',
          image_url: null,
        },
      }));

      setRequests(requestsWithArtists);
    } catch (error) {
      console.error('Error loading booking requests:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'accepted':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'declined':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  async function handleCancelRequest(requestId: string) {
    try {
      const { error } = await supabase
        .from('booking_requests')
        .update({ status: 'cancelled', responded_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      setToast('Request cancelled successfully');
      setTimeout(() => setToast(null), 3000);
      loadRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      setToast('Failed to cancel request');
      setTimeout(() => setToast(null), 3000);
    }
  }

  async function handleUpdateRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRequest) return;

    try {
      const { error } = await supabase
        .from('booking_requests')
        .update({
          event_name: editingRequest.event_name,
          event_date: editingRequest.event_date,
          event_location: editingRequest.event_location,
          message: editingRequest.message,
          start_time: editingRequest.start_time,
          end_time: editingRequest.end_time,
        })
        .eq('id', editingRequest.id);

      if (error) throw error;

      setToast('Request updated successfully');
      setEditingRequest(null);
      setTimeout(() => setToast(null), 3000);
      loadRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      setToast('Failed to update request');
      setTimeout(() => setToast(null), 3000);
    }
  }

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  }

  async function loadMessages(requestId: string, artistUserId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          recipient_id,
          content,
          created_at,
          sender:profiles!messages_sender_id_fkey(name, image_url)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${artistUserId}),and(sender_id.eq.${artistUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function sendMessageToArtist() {
    if (!messagingRequest || !newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: messagingRequest.artist_user_id,
          booking_id: messagingRequest.booking_id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages(messagingRequest.id, messagingRequest.artist_user_id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  }

  function openMessaging(request: BookingRequest) {
    setMessagingRequest(request);
    loadCurrentUser();
    loadMessages(request.id, request.artist_user_id);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/planner/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <PlannerProfileMenu />
          </div>

          <h1 className="text-4xl font-bold mb-8">My Booking Requests</h1>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : accessDenied ? (
            <div className="bg-neutral-900 border-2 border-red-700 rounded-lg p-12 text-center">
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
              <p className="text-gray-400">
                Only planners can view this page
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-neutral-900 border-2 border-neutral-700 rounded-lg p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No booking requests yet</h3>
              <p className="text-gray-400">
                When you send booking requests to artists, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-neutral-900 border-2 border-neutral-700 rounded-lg p-6 hover:border-blue-500 transition"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-neutral-700 flex-shrink-0">
                        {request.artist.image_url ? (
                          <img
                            src={request.artist.image_url}
                            alt={request.artist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-600" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {request.artist.name}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                          {request.artist.email}
                        </p>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-300">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="font-medium">Event:</span>
                            <span>{request.event_name}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4 text-green-400" />
                            <span className="font-medium">Date:</span>
                            <span>{formatDate(request.event_date)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="w-4 h-4 text-orange-400" />
                            <span className="font-medium">Location:</span>
                            <span>{request.event_location}</span>
                          </div>

                          {request.message && (
                            <div className="mt-3 p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                              <div className="flex items-start gap-2 text-gray-300">
                                <MessageSquare className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                                <div>
                                  <span className="font-medium block mb-1">
                                    Your Message:
                                  </span>
                                  <p className="text-sm text-gray-400">
                                    {request.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-4">
                          Sent {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => openMessaging(request)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => setEditingRequest(request)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {editingRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Booking Request</h2>
            <form onSubmit={handleUpdateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  value={editingRequest.event_name}
                  onChange={(e) => setEditingRequest({ ...editingRequest, event_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Date
                </label>
                <input
                  type="date"
                  value={editingRequest.event_date}
                  onChange={(e) => setEditingRequest({ ...editingRequest, event_date: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={editingRequest.start_time || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, start_time: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={editingRequest.end_time || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, end_time: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Location
                </label>
                <input
                  type="text"
                  value={editingRequest.event_location}
                  onChange={(e) => setEditingRequest({ ...editingRequest, event_location: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={editingRequest.message || ''}
                  onChange={(e) => setEditingRequest({ ...editingRequest, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {messagingRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Messages</h2>
                <p className="text-gray-400 text-sm">{messagingRequest.artist.name}</p>
              </div>
              <button
                onClick={() => setMessagingRequest(null)}
                className="p-2 hover:bg-neutral-800 rounded-lg transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-neutral-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No messages yet</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const isOwnMessage = message.sender_id === currentUserId;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%]`}>
                            <div className={`rounded-lg p-3 ${
                              isOwnMessage
                                ? 'bg-orange-600 text-white'
                                : 'bg-neutral-700 text-white'
                            }`}>
                              <p className="text-sm font-medium mb-1">
                                {message.sender?.name || 'Unknown'}
                              </p>
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {new Date(message.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessageToArtist()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={sendMessageToArtist}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-neutral-900 border-2 border-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}
