import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../Header';
import Footer from '../Footer';
import { ArrowLeft, Calendar, MapPin, MessageSquare, User, FileText, ShieldAlert } from 'lucide-react';

interface BookingRequest {
  id: string;
  planner_id: string;
  event_name: string;
  event_date: string;
  event_location: string;
  message: string | null;
  status: string;
  created_at: string;
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
          planner:profiles!booking_requests_planner_id_fkey(
            name,
            email,
            image_url
          )
        `)
        .eq('artist_user_id', user.id)
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
              <h3 className="text-xl font-semibold mb-2">No booking requests yet</h3>
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
