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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isArtistActive, setIsArtistActive] = useState(false);

  useEffect(() => {
    checkAuth();
    loadArtist();
    checkFavourite();
  }, [id]);

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsLoggedIn(false);
    }
  }

  async function loadArtist() {
    try {
      let artistProfile = null;

      const { data: byUserId } = await supabase
        .from('artist_profiles')
        .select(`
          id,
          user_id,
          stage_name,
          genre,
          category,
          location,
          bio,
          type,
          image_url,
          profiles!artist_profiles_user_id_fkey(image_url),
          subscriptions!subscriptions_artist_id_fkey(is_active)
        `)
        .eq('user_id', id)
        .maybeSingle();

      if (byUserId) {
        artistProfile = byUserId;
      } else {
        const { data: byId } = await supabase
          .from('artist_profiles')
          .select(`
            id,
            user_id,
            stage_name,
            genre,
            category,
            location,
            bio,
            type,
            image_url,
            profiles!artist_profiles_user_id_fkey(image_url),
            subscriptions!subscriptions_artist_id_fkey(is_active)
          `)
          .eq('id', id)
          .maybeSingle();

        if (byId) {
          artistProfile = byId;
        }
      }

      if (artistProfile) {
        setIsArtistActive(artistProfile.subscriptions?.is_active === true);

        const { data: socialLinks } = await supabase
          .from('artist_social_links')
          .select('artist_id, platform, url')
          .eq('artist_id', artistProfile.id);

        const { data: reviews } = await supabase
          .from('artist_reviews')
          .select('artist_id, rating')
          .eq('artist_id', artistProfile.id);

        const socialsMap = new Map<string, Record<string, string>>();
        (socialLinks || []).forEach((link: any) => {
          if (!socialsMap.has(link.artist_id)) {
            socialsMap.set(link.artist_id, {});
          }
          socialsMap.get(link.artist_id)![link.platform] = link.url;
        });

        const ratingsMap = new Map<string, { averageRating: number; reviewCount: number }>();
        (reviews || []).forEach((review: any) => {
          if (!ratingsMap.has(review.artist_id)) {
            ratingsMap.set(review.artist_id, { averageRating: 0, reviewCount: 0 });
          }
          const current = ratingsMap.get(review.artist_id)!;
          current.averageRating += review.rating;
          current.reviewCount += 1;
        });

        ratingsMap.forEach((value, key) => {
          value.averageRating = Math.round((value.averageRating / value.reviewCount) * 10) / 10;
        });

        const locationParts = (artistProfile.location || '').split(',').map((s: string) => s.trim());
        const city = locationParts[0] || '';
        const state = locationParts[1] || '';
        const country = locationParts[2] || 'Australia';

        const isDemo = artistProfile.type === 'demo';
        const artistSocials = socialsMap.get(artistProfile.id) || {};
        const ratings = ratingsMap.get(artistProfile.id);

        setArtist({
          id: artistProfile.user_id || artistProfile.id,
          name: artistProfile.stage_name || 'Unknown Artist',
          role: artistProfile.category || 'DJ',
          genre: artistProfile.genre || 'Electronic',
          city,
          state,
          country,
          imageUrl: artistProfile.image_url || artistProfile.profiles?.image_url || '',
          socials: artistSocials,
          isDemo,
          bio: artistProfile.bio,
          averageRating: ratings?.averageRating,
          reviewCount: ratings?.reviewCount,
        });
      } else {
        setArtist(null);
      }
    } catch (error) {
      console.error("Error loading artist:", error);
      setArtist(null);
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
      if (!user) {
        navigate('/login');
        return;
      }

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

  function handleBookingClick() {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!isArtistActive) {
      return;
    }
    setShowBookingModal(true);
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
                {isLoggedIn && (
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
                )}
              </div>

              {!isArtistActive && (
                <div className="mb-6 p-4 bg-neutral-800 border border-red-700/50 rounded-lg">
                  <p className="text-red-400 text-center font-semibold">
                    This artist is currently unavailable
                  </p>
                </div>
              )}

              {artist.isDemo && isArtistActive && (
                <div className="mb-6 p-4 bg-neutral-800 border border-yellow-700/50 rounded-lg">
                  <p className="text-yellow-500 text-center font-semibold">
                    This is a demo artist profile. Booking is not available.
                  </p>
                </div>
              )}

              {!isLoggedIn && !artist.isDemo && isArtistActive && (
                <div className="mb-6 p-4 bg-neutral-800 border border-neutral-700 rounded-lg">
                  <p className="text-gray-300 text-center">
                    <Link to="/login" className="text-orange-500 hover:text-orange-400 font-semibold">
                      Sign in
                    </Link>
                    {' '}to request bookings and add to favourites
                  </p>
                </div>
              )}

              <button
                onClick={handleBookingClick}
                disabled={!isArtistActive || artist.isDemo}
                title={
                  !isArtistActive
                    ? "Artist subscription inactive"
                    : artist.isDemo
                    ? "Demo artist – booking disabled"
                    : undefined
                }
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
                  !isArtistActive || artist.isDemo
                    ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                    : "bg-orange-600 hover:bg-orange-700 text-white"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                {!isArtistActive
                  ? 'Artist Unavailable'
                  : artist.isDemo
                  ? 'Booking Not Available'
                  : isLoggedIn
                  ? 'Request Booking'
                  : 'Sign in to Request Booking'}
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
