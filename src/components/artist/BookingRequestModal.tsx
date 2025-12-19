import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Calendar, MapPin, FileText, MessageSquare } from 'lucide-react';

interface BookingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string;
  artistName: string;
  onSuccess?: () => void;
}

export default function BookingRequestModal({
  isOpen,
  onClose,
  artistId,
  artistName,
  onSuccess,
}: BookingRequestModalProps) {
  const [formData, setFormData] = useState({
    event_name: '',
    event_date: '',
    event_location: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setToast('You must be logged in to send a booking request');
        setTimeout(() => setToast(null), 3000);
        setSending(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role !== 'planner') {
        setToast('Only planners can send booking requests');
        setTimeout(() => setToast(null), 3000);
        setSending(false);
        return;
      }

      const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select('id, subscriptions!subscriptions_artist_id_fkey(is_active)')
        .or(`user_id.eq.${artistId},id.eq.${artistId}`)
        .maybeSingle();

      const hasActiveSubscription = artistProfile &&
        Array.isArray(artistProfile.subscriptions) &&
        artistProfile.subscriptions.some((sub: any) => sub.is_active === true);

      if (!artistProfile || !hasActiveSubscription) {
        setToast('This artist is not currently accepting bookings');
        setTimeout(() => setToast(null), 3000);
        setSending(false);
        return;
      }

      const { error } = await supabase.rpc('create_booking_request', {
        p_artist_user_id: artistId,
        p_event_name: formData.event_name,
        p_event_date: formData.event_date,
        p_event_location: formData.event_location,
        p_message: formData.message || null,
      });

      if (error) throw error;

      setToast('Booking request sent');
      setTimeout(() => {
        setToast(null);
        onClose();
        if (onSuccess) onSuccess();
        setFormData({
          event_name: '',
          event_date: '',
          event_location: '',
          message: '',
        });
      }, 1500);
    } catch (error: any) {
      console.error('Error sending booking request:', error);
      const errorMessage = error?.message || 'Failed to send booking request';
      setToast(errorMessage);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg border border-neutral-800 max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">Request Booking</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-gray-400 mb-4">
              Send a booking request to <span className="text-white font-semibold">{artistName}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Event Name
            </label>
            <input
              type="text"
              value={formData.event_name}
              onChange={(e) =>
                setFormData({ ...formData, event_name: e.target.value })
              }
              placeholder="e.g., Birthday Party, Corporate Event"
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Event Date
            </label>
            <input
              type="date"
              value={formData.event_date}
              onChange={(e) =>
                setFormData({ ...formData, event_date: e.target.value })
              }
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Event Location
            </label>
            <input
              type="text"
              value={formData.event_location}
              onChange={(e) =>
                setFormData({ ...formData, event_location: e.target.value })
              }
              placeholder="e.g., Downtown Venue, 123 Main St"
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Message (Optional)
            </label>
            <textarea
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Tell the artist more about your event..."
              rows={3}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>

        {toast && (
          <div className="absolute bottom-4 right-4 bg-neutral-900 border-2 border-blue-500 text-white px-6 py-3 rounded-lg shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
