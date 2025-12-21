import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../Header';
import Footer from '../Footer';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, ArrowLeft, MessageSquare, FileText } from 'lucide-react';

interface BookingRequest {
  id: string;
  planner_id: string;
  artist_user_id: string;
  status: string;
  event_name: string;
  event_date: string;
  event_location: string;
  message: string | null;
  start_time: string | null;
  end_time: string | null;
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
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');

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

      const { data, error } = await supabase
        .from('booking_requests')
        .select(`
          id,
          planner_id,
          artist_user_id,
          status,
          event_name,
          event_date,
          event_location,
          message,
          start_time,
          end_time,
          created_at,
          planner:profiles!booking_requests_planner_id_fkey(
            name,
            email,
            image_url,
            city,
            state
          )
        `)
        .eq('artist_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading booking requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(requestId: string) {
    try {
      setProcessing(requestId);
      const { error } = await supabase.rpc('accept_booking_request', {
        p_request_id: requestId,
        p_start_time: startTime,
        p_end_time: endTime
      });

      if (error) throw error;

      setToast('Booking accepted! It now appears in your calendar.');
      setSelectedRequest(null);
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

  async function handleDecline(requestId: string) {
    try {
      setProcessing(requestId);
      const { error } = await supabase.rpc('decline_booking_request', {
        p_request_id: requestId
      });

      if (error) throw error;

      setToast('Booking declined');
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
          ) : requests.length === 0 ? (
            <div className="bg-neutral-900 border-2 border-neutral-700 rounded-lg p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pending requests</h3>
              <p className="text-gray-400">
                You don't have any booking requests at the moment
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
                          <span className="text-lg font-bold">
                            {request.planner.name[0]}
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">
                          {request.planner.name}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">
                          {request.planner.email}
                        </p>

                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="font-semibold">{request.event_name}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span>
                              {new Date(request.event_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          {(request.start_time || request.end_time) && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-purple-500" />
                              <span>
                                {request.start_time && request.end_time
                                  ? `${request.start_time} - ${request.end_time}`
                                  : request.start_time || request.end_time}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            <span>{request.event_location}</span>
                          </div>
                        </div>

                        {request.message && (
                          <div className="flex items-start gap-2 text-sm bg-neutral-800 p-3 rounded-lg mb-3">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-300">{request.message}</p>
                          </div>
                        )}

                        <p className="text-xs text-gray-500">
                          Requested {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        disabled={processing === request.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition text-white font-medium disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(request.id)}
                        disabled={processing === request.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-white font-medium disabled:opacity-50"
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

      {selectedRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Confirm Booking Times</h2>
            <p className="text-gray-400 mb-6">
              Set the performance times for {selectedRequest.event_name}
            </p>

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

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAccept(selectedRequest.id)}
                disabled={processing === selectedRequest.id}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {processing === selectedRequest.id ? 'Accepting...' : 'Confirm & Accept'}
              </button>
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
