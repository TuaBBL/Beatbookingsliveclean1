import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Header from "../Header";
import Footer from "../Footer";
import { MessageSquare, Send, X, Calendar, Clock } from "lucide-react";

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
    user_id: string;
  };
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function PlannerBookingInbox() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    loadUserAndBookings();
  }, []);

  useEffect(() => {
    if (selectedBooking) {
      loadMessages(selectedBooking.id);
    }
  }, [selectedBooking]);

  async function loadUserAndBookings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from("bookings")
        .select("*, artist_profiles(stage_name, genre, user_id)")
        .eq("planner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
      if (data && data.length > 0) {
        setSelectedBooking(data[0]);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(bookingId: string) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedBooking) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        recipient_id: selectedBooking.artist_profiles.user_id,
        booking_id: selectedBooking.id,
        content: newMessage,
      });

      if (error) throw error;

      setNewMessage("");
      loadMessages(selectedBooking.id);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  async function cancelBooking(bookingId: string) {
    if (!confirm("Are you sure you want to cancel this booking request?")) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;
      loadUserAndBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  }

  async function deleteBooking(bookingId: string) {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      await supabase.from("messages").delete().eq("booking_id", bookingId);
      await supabase.from("bookings").delete().eq("id", bookingId);
      loadUserAndBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error deleting booking:", error);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-500";
      case "accepted":
        return "text-green-500";
      case "declined":
        return "text-red-500";
      case "cancelled":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Booking Requests</h1>
            <Link
              to="/planner/dashboard"
              className="text-gray-400 hover:text-white transition"
            >
              Back to Dashboard
            </Link>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No booking requests yet</p>
              <Link
                to="/planner/artists"
                className="text-orange-500 hover:text-orange-400"
              >
                Browse Artists
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className={`p-4 rounded-lg border cursor-pointer transition ${
                      selectedBooking?.id === booking.id
                        ? "bg-orange-900/20 border-orange-500"
                        : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold">{booking.artist_profiles.stage_name}</h3>
                      <span
                        className={`text-xs font-semibold uppercase ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">
                      {booking.artist_profiles.genre}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(booking.event_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-2">
                {selectedBooking ? (
                  <div className="bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col h-[600px]">
                    <div className="p-4 border-b border-neutral-800">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-xl font-bold mb-1">
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
                        <span
                          className={`text-sm font-semibold uppercase ${getStatusColor(
                            selectedBooking.status
                          )}`}
                        >
                          {selectedBooking.status}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {selectedBooking.status === "pending" && (
                          <button
                            onClick={() => cancelBooking(selectedBooking.id)}
                            className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition"
                          >
                            Cancel Request
                          </button>
                        )}
                        {selectedBooking.status !== "accepted" && (
                          <button
                            onClick={() => deleteBooking(selectedBooking.id)}
                            className="flex-1 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-500 rounded-lg text-sm transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === userId
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              message.sender_id === userId
                                ? "bg-orange-600 text-white"
                                : "bg-neutral-800 text-gray-100"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t border-neutral-800">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-orange-500"
                        />
                        <button
                          onClick={sendMessage}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-900 rounded-lg border border-neutral-800 h-[600px] flex items-center justify-center">
                    <p className="text-gray-400">Select a booking to view messages</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
