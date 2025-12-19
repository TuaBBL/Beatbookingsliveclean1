import { X, Calendar, Clock, MapPin, User, Mail, CheckCircle } from 'lucide-react';

interface BookingDetailProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
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
    };
  };
  userRole: 'artist' | 'planner';
}

export default function BookingDetailModal({ isOpen, onClose, booking, userRole }: BookingDetailProps) {
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

          <div className="pt-4 border-t border-neutral-800">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
