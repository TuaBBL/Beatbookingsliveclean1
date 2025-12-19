import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../Header';
import Footer from '../Footer';
import { ArrowLeft, Calendar, MapPin, MessageSquare, User, FileText, ShieldAlert, CheckCircle, XCircle, Clock, Send, X } from 'lucide-react';

interface BookingRequest {
  id: string;
  planner_id: string;
  event_name: string;
  event_date: string;
  event_location: string;
  message: string | null;
  status: string;
  created_at: string;
  start_time: string | null;
  end_time: string | null;
  booking_id: string | null;
  planner: {
    name: string;
    email: string;
    image_url: string | null;
  };
}

export default function ArtistInboxPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'decline' | 'view' | null>(null);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [responseMessage, setResponseMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
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

      if (profile?.role !== 'artist') {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('booking_requests')
        .select(`
          id,
          planner_id,
          event_name,
          event_date,
          event_location,
          message,
          status,
          created_at,
          start_time,
          end_time,
          booking_id,
          planner:profiles!booking_requests_planner_id_fkey(
            name,
            email,
            image_url
          )
        `)
        .eq('artist_user_id', user.id)
        .in('status', ['pending', 'declined'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
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

  async function handleAccept() {
    if (!selectedRequest) return;

    try {
      setProcessing(selectedRequest.id);
      const { error } = await supabase.rpc('accept_booking_request', {
        p_request_id: selectedRequest.id,
        p_start_time: startTime,
        p_end_time: endTime,
        p_response_message: responseMessage || null
      });

      if (error) throw error;

      setToast('Booking accepted! It now appears in your calendar.');
      setSelectedRequest(null);
      setActionType(null);
      setResponseMessage('');
      setTimeout(() => setToast(null), 3000);
      loadRequests();
    } catch (error: any) {
      console.error('Error accepting booking:', error);
      setToast(error.message || 'Failed to accept booking');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setProcessing(null);
    }
  }

  async function handleDecline() {
    if (!selectedRequest) return;

    try {
      setProcessing(selectedRequest.id);
      const { error } = await supabase.rpc('decline_booking_request', {
        p_request_id: selectedRequest.id,
        p_response_message: responseMessage || null
      });

      if (error) throw error;

      setToast('Booking declined');
      setSelectedRequest(null);
      setActionType(null);
      setResponseMessage('');
      setTimeout(() => setToast(null), 3000);
      loadRequests();
    } catch (error: any) {
      console.error('Error declining booking:', error);
      setToast(error.message || 'Failed to decline booking');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setProcessing(null);
    }
  }

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  }

  async function loadMessages(requestId: string, plannerId: string) {
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
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${plannerId}),and(sender_id.eq.${plannerId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function sendMessageInModal() {
    if (!selectedRequest || !responseMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedRequest.planner_id,
          booking_id: selectedRequest.booking_id,
          content: responseMessage.trim()
        });

      if (error) throw error;

      setResponseMessage('');
      loadMessages(selectedRequest.id, selectedRequest.planner_id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleDeleteRequest(requestId: string) {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      setProcessing(requestId);
      const { error } = await supabase
        .from('booking_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setToast('Request deleted successfully');
      setTimeout(() => setToast(null), 3000);
      loadRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      setToast('Failed to delete request');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setProcessing(null);
    }
  }

  function openActionModal(request: BookingRequest, action: 'accept' | 'decline' | 'view') {
    setSelectedRequest(request);
    setActionType(action);
    setResponseMessage('');
    setStartTime(request.start_time || '18:00');
    setEndTime(request.end_time || '23:00');

    if (action === 'view') {
      loadCurrentUser();
      loadMessages(request.id, request.planner_id);
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
          ) : accessDenied ? (
            <div className="bg-neutral-900 border-2 border-red-700 rounded-lg p-12 text-center">
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
              <p className="text-gray-400">
                Only artists can view this page
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-neutral-900 border-2 border-neutral-700 rounded-lg p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pending requests</h3>
              <p className="text-gray-400">
                When planners send you booking requests, they'll appear here
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
                        {request.planner.image_url ? (
                          <img
                            src={request.planner.image_url}
                            alt={request.planner.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-600" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {request.planner.name}
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
                          {request.planner.email}
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
                                    Message:
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
                          Received {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openActionModal(request, 'accept')}
                            disabled={processing === request.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition text-white font-medium disabled:opacity-50 whitespace-nowrap"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => openActionModal(request, 'decline')}
                            disabled={processing === request.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-white font-medium disabled:opacity-50 whitespace-nowrap"
                          >
                            <XCircle className="w-4 h-4" />
                            Decline
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openActionModal(request, 'view')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-white font-medium whitespace-nowrap"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </button>
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          disabled={processing === request.id}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-white font-medium disabled:opacity-50 whitespace-nowrap"
                        >
                          <XCircle className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedRequest && actionType && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-lg border-2 border-neutral-700 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {actionType === 'view' ? 'Messages' : actionType === 'accept' ? 'Accept Booking' : 'Decline Booking'}
                </h2>
                <p className="text-gray-400">
                  {selectedRequest.event_name} on {formatDate(selectedRequest.event_date)}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                  setResponseMessage('');
                }}
                className="p-2 hover:bg-neutral-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionType === 'view' ? (
              <div className="space-y-4">
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
                                  ? 'bg-blue-600 text-white'
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
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessageInModal()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={sendMessageInModal}
                    disabled={!responseMessage.trim() || sendingMessage}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <>

              {actionType === 'accept' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  />
                </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Message to Planner (Optional)
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder={actionType === 'accept'
                    ? "E.g., 'Looking forward to performing at your event!'"
                    : "E.g., 'Unfortunately I'm not available on this date.'"}
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setActionType(null);
                    setResponseMessage('');
                  }}
                  className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={actionType === 'accept' ? handleAccept : handleDecline}
                  disabled={processing === selectedRequest.id}
                  className={`flex-1 px-4 py-3 rounded-lg transition font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2 ${
                    actionType === 'accept'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processing === selectedRequest.id ? (
                    'Processing...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {actionType === 'accept' ? 'Confirm & Accept' : 'Confirm & Decline'}
                    </>
                  )}
                </button>
              </div>
              </>
            )}
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
