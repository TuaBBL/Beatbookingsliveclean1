import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Header from "../Header";
import Footer from "../Footer";
import PlannerProfileMenu from "./PlannerProfileMenu";
import { Calendar, Clock, CheckCircle, MessageSquare } from "lucide-react";

interface Booking {
  id: string;
  artist_id: string;
  status: string;
  event_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  artist_profiles: {
    stage_name: string;
    genre: string;
    location: string;
  };
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles: {
    name: string;
  };
}

export default function PlannerConfirmedBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMessages, setShowMessages] = useState(false);

  useEffect(() => {
    loadConfirmedBookings();
  }, []);

  async function loadConfirmedBookings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("bookings")
        .select("*, artist_profiles(stage_name, genre, location)")
        .eq("planner_id", user.id)
        .eq("status", "accepted")
        .order("event_date", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error loading confirmed bookings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(bookingId: string) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles(name)")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }

  function viewMessages(booking: Booking) {
    setSelectedBooking(booking);
    loadMessages(booking.id);
    setShowMessages(true);
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Confirmed Bookings</h1>
            <div className="flex items-center gap-4">
              <Link
                to="/planner/dashboard"
                className="text-gray-400 hover:text-white transition"
              >
                Back to Dashboard
              </Link>
              <PlannerProfileMenu />
            </div>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No confirmed bookings yet</p>
              <Link
                to="/planner/bookings"
                className="text-orange-500 hover:text-orange-400"
              >
                View Pending Requests
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-neutral-900 rounded-lg border border-neutral-800 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <h3 className="text-2xl font-bold">
                          {booking.artist_profiles.stage_name}
                        </h3>
                      </div>

                      <p className="text-gray-400 mb-4">
                        {booking.artist_profiles.genre} • {booking.artist_profiles.location}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(booking.event_date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span>
                            {booking.start_time} - {booking.end_time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => viewMessages(booking)}
                      className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      View Messages
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showMessages && selectedBooking && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col border border-neutral-800">
            <div className="p-6 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    {selectedBooking.artist_profiles.stage_name}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedBooking.event_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedBooking.start_time} - {selectedBooking.end_time}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowMessages(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center">No messages yet</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="bg-neutral-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{message.profiles.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{message.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-neutral-800">
              <button
                onClick={() => setShowMessages(false)}
                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
