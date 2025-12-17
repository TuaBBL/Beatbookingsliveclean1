import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Header from "../Header";
import Footer from "../Footer";
import PlannerProfileMenu from "./PlannerProfileMenu";
import BookingRequestModal from "../artist/BookingRequestModal";
import { Music, Heart, MessageSquare, ArrowLeft } from "lucide-react";
import { mockArtists, Artist } from "../../data/mockArtists";

export default function PlannerArtistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    loadArtist();
    checkFavourite();
  }, [id]);

  async function loadArtist() {
    try {
      const { data: artistProfile } = await supabase
        .from('artist_profiles')
        .select(`
          id,
          user_id,
          stage_name,
          genre,
          category,
          location,
          bio,
          profiles!artist_profiles_user_id_fkey(image_url)
        `)
        .eq('user_id', id)
        .maybeSingle();

      if (artistProfile) {
        const locationParts = (artistProfile.location || '').split(',').map((s: string) => s.trim());
        const city = locationParts[0] || '';
        const state = locationParts[1] || '';
        const country = locationParts[2] || 'Australia';

        setArtist({
          id: artistProfile.user_id,
          name: artistProfile.stage_name || 'Unknown Artist',
          role: artistProfile.category || 'DJ',
          genre: artistProfile.genre || 'Electronic',
          city,
          state,
          country,
          imageUrl: artistProfile.profiles?.image_url || '',
          socials: {},
        });
      } else {
        const foundArtist = mockArtists.find((a) => a.id === id);
        setArtist(foundArtist || null);
      }
    } catch (error) {
      console.error("Error loading artist:", error);
      const foundArtist = mockArtists.find((a) => a.id === id);
      setArtist(foundArtist || null);
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

  function handleBookingSuccess() {
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/planner/dashboard')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </button>
              <span className="text-gray-600">|</span>
              <Link
                to="/planner/artists"
                className="text-gray-400 hover:text-white transition text-sm"
              >
                Back to Artists
              </Link>
            </div>
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

      <BookingRequestModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        artistId={id || ''}
        artistName={artist?.name || ''}
        onSuccess={handleBookingSuccess}
      />

      <Footer />
    </div>
  );
}
