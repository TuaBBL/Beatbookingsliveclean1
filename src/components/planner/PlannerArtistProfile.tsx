import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Header from "../Header";
import Footer from "../Footer";
import PlannerProfileMenu from "./PlannerProfileMenu";
import { Music, Heart, MessageSquare, X } from "lucide-react";
import { mockArtists, Artist } from "../../data/mockArtists";

export default function PlannerArtistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadArtist();
    checkFavourite();
  }, [id]);

  async function loadArtist() {
    try {
      const foundArtist = mockArtists.find((a) => a.id === id);
      setArtist(foundArtist || null);
    } catch (error) {
      console.error("Error loading artist:", error);
    } finally {
      setLoading(false);
    }
  }

  async function checkFavourite() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("favourites")
        .select("id")
        .eq("planner_id", user.id)
        .eq("artist_id", id)
        .maybeSingle();

      setIsFavourite(!!data);
    } catch (error) {
      console.error("Error checking favourite:", error);
    }
  }

  async function toggleFavourite() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFavourite) {
        await supabase
          .from("favourites")
          .delete()
          .eq("planner_id", user.id)
          .eq("artist_id", id);
        setIsFavourite(false);
      } else {
        await supabase
          .from("favourites")
          .insert({ planner_id: user.id, artist_id: id });
        setIsFavourite(true);
      }
    } catch (error) {
      console.error("Error toggling favourite:", error);
    }
  }

  async function handleBookingRequest() {
    if (!bookingMessage.trim() || !eventDate || !startTime || !endTime) {
      alert("Please fill in all fields");
      return;
    }

    alert("Booking functionality is available for real artist profiles. These are demo artists for browsing.");
    setShowBookingModal(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Artist not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/planner/artists"
              className="text-gray-400 hover:text-white transition"
            >
              ← Back to Artists
            </Link>
            <PlannerProfileMenu />
          </div>

          <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
            <div className="h-64 bg-neutral-800 flex items-center justify-center overflow-hidden">
              {artist.imageUrl ? (
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-24 h-24 text-neutral-700" />
              )}
            </div>

            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{artist.name}</h1>
                  <p className="text-xl text-gray-400 mb-2">{artist.genre}</p>
                  <p className="text-gray-500">{artist.city}, {artist.state}, {artist.country}</p>
                </div>
                <button
                  onClick={toggleFavourite}
                  className={`p-3 rounded-full transition ${
                    isFavourite
                      ? "bg-pink-600 text-white"
                      : "bg-neutral-800 text-gray-400 hover:text-pink-500"
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isFavourite ? "fill-current" : ""}`} />
                </button>
              </div>

              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition"
              >
                <MessageSquare className="w-5 h-5" />
                Request Booking
              </button>
            </div>
          </div>
        </div>
      </main>

      {showBookingModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 rounded-lg max-w-lg w-full p-6 border border-neutral-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Request Booking</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={bookingMessage}
                  onChange={(e) => setBookingMessage(e.target.value)}
                  placeholder="Introduce yourself and describe your event..."
                  rows={6}
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <button
                onClick={handleBookingRequest}
                disabled={submitting}
                className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending..." : "Send Booking Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
