import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, Mail, CheckCircle, MessageSquare, Send, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  sender?: {
    name: string;
    image_url: string | null;
  };
}

interface BookingDetailProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    planner_id?: string;
    event_date: string;
    start_time: string;
    end_time: string;
    status: string;
    planner?: {
      name: string;
      email: string;
      image_url: string | null;
      city: string | null;
      state: string | null;
    };
    artist_profiles?: {
      stage_name: string;
      user_id?: string;
    };
  };
  userRole: 'artist' | 'planner';
  onCancel?: () => void;
}

export default function BookingDetailModal({ isOpen, onClose, booking, userRole, onCancel }: BookingDetailProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      getCurrentUser();
    }
  }, [isOpen, booking.id]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  }

  async function loadMessages() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const recipientId = userRole === 'artist' ? booking.planner_id : booking.artist_profiles?.user_id;
      if (!recipientId) return;

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
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const recipientId = userRole === 'artist' ? booking.planner_id : booking.artist_profiles?.user_id;
      if (!recipientId) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          booking_id: booking.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  }

  async function handleCancelBooking() {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      setCancelling(true);
      const { error } = await supabase.rpc('cancel_confirmed_booking', {
        p_booking_id: booking.id
      });

      if (error) throw error;

      if (onCancel) {
        onCancel();
      }
      onClose();
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      alert(error.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  }

  if (!isOpen) return null;

  const displayName = userRole === 'artist'
    ? booking.planner?.name
    : booking.artist_profiles?.stage_name;

  const displayEmail = userRole === 'artist' ? booking.planner?.email : '';
  const displayLocation = userRole === 'artist' && booking.planner
    ? [booking.planner.city, booking.planner.state].filter(Boolean).join(', ')
    : '';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Booking Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-500">Confirmed Booking</p>
              <p className="text-sm text-gray-400">This booking has been accepted and confirmed</p>
            </div>
          </div>

          {userRole === 'artist' && booking.planner && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-orange-500">Planner Information</h3>
              <div className="flex items-start gap-4 p-4 bg-neutral-800 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {booking.planner.image_url ? (
                    <img
                      src={booking.planner.image_url}
                      alt={booking.planner.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="font-semibold">{booking.planner.name}</p>
                  </div>
                  {displayEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-300 text-sm">{displayEmail}</p>
                    </div>
                  )}
                  {displayLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-300 text-sm">{displayLocation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {userRole === 'planner' && booking.artist_profiles && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-orange-500">Artist</h3>
              <div className="p-4 bg-neutral-800 rounded-lg">
                <p className="font-semibold text-lg">{booking.artist_profiles.stage_name}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-orange-500">Event Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-neutral-800 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Date</p>
                  <p className="font-semibold">
                    {new Date(booking.event_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-neutral-800 rounded-lg">
                <Clock className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-400">Time</p>
                  <p className="font-semibold">
                    {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-orange-500 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Messages
            </h3>
            <div className="bg-neutral-800 rounded-lg p-4 max-h-64 overflow-y-auto">
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
                        <div className={`max-w-[80%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
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
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800 flex gap-3">
            <button
              onClick={handleCancelBooking}
              disabled={cancelling || booking.status === 'cancelled'}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              <XCircle className="w-5 h-5" />
              {cancelling ? 'Cancelling...' : booking.status === 'cancelled' ? 'Already Cancelled' : 'Cancel Booking'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
