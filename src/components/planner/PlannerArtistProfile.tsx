import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Header from "../Header";
import Footer from "../Footer";
import PlannerProfileMenu from "./PlannerProfileMenu";
import BookingRequestModal from "../artist/BookingRequestModal";
import { Music, Heart, MessageSquare, ArrowLeft, Instagram, Youtube, Facebook, Radio, Play } from "lucide-react";
import { mockArtists, Artist } from "../../data/mockArtists";

interface MediaItem {
  id: string;
  media_type: 'image' | 'video';
  url: string;
}

export default function PlannerArtistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artistProfileId, setArtistProfileId] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isArtistActive, setIsArtistActive] = useState(false);

  useEffect(() => {
    checkAuth();
    loadArtist();
  }, [id]);

  useEffect(() => {
    if (artistProfileId) {
      checkFavourite();
    }
  }, [artistProfileId]);

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        setUserRole(profile?.role || null);
      }
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
        const subscriptions = Array.isArray(artistProfile.subscriptions)
          ? artistProfile.subscriptions
          : artistProfile.subscriptions ? [artistProfile.subscriptions] : [];

        const hasActiveSubscription = subscriptions.some((sub: any) => sub.is_active === true);
        setIsArtistActive(artistProfile.type === 'demo' || hasActiveSubscription);

        const { data: socialLinks } = await supabase
          .from('artist_social_links')
          .select('artist_id, platform, url')
          .eq('artist_id', artistProfile.id);

        const { data: reviews } = await supabase
          .from('artist_reviews')
          .select('artist_id, rating')
          .eq('artist_id', artistProfile.id);

        const { data: mediaData } = await supabase
          .from('artist_media')
          .select('id, media_type, url')
          .eq('artist_id', artistProfile.id)
          .order('created_at', { ascending: false });

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

        setArtistProfileId(artistProfile.id);
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
        setMedia(mediaData || []);
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
      if (!user || !artistProfileId) return;

      const { data } = await supabase
        .from("favourites")
        .select("id")
        .eq("planner_id", user.id)
        .eq("artist_id", artistProfileId)
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

      if (!artistProfileId) return;

      if (isFavourite) {
        await supabase
          .from("favourites")
          .delete()
          .eq("planner_id", user.id)
          .eq("artist_id", artistProfileId);
        setIsFavourite(false);
      } else {
        await supabase
          .from("favourites")
          .insert({ planner_id: user.id, artist_id: artistProfileId });
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
                disabled={!isArtistActive || artist.isDemo || (!isLoggedIn && isArtistActive && !artist.isDemo)}
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
                    : !isLoggedIn
                    ? "bg-neutral-700 text-gray-300 hover:bg-neutral-600"
                    : "bg-orange-600 hover:bg-orange-700 text-white"
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                {!isArtistActive
                  ? 'Artist Unavailable'
                  : artist.isDemo
                  ? 'Booking Not Available'
                  : !isLoggedIn
                  ? 'Check me out'
                  : userRole === 'planner'
                  ? 'Request Booking'
                  : 'View Profile'}
              </button>
            </div>
          </div>

          {isLoggedIn && artist.socials && Object.keys(artist.socials).length > 0 && (
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Connect</h2>
              <div className="flex flex-wrap gap-4">
                {artist.socials.instagram && (
                  <a
                    href={artist.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition text-white"
                  >
                    <Instagram className="w-5 h-5" />
                    <span className="font-medium">Instagram</span>
                  </a>
                )}
                {artist.socials.youtube && (
                  <a
                    href={artist.socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-white"
                  >
                    <Youtube className="w-5 h-5" />
                    <span className="font-medium">YouTube</span>
                  </a>
                )}
                {artist.socials.facebook && (
                  <a
                    href={artist.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white"
                  >
                    <Facebook className="w-5 h-5" />
                    <span className="font-medium">Facebook</span>
                  </a>
                )}
                {artist.socials.spotify && (
                  <a
                    href={artist.socials.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition text-white"
                  >
                    <Music className="w-5 h-5" />
                    <span className="font-medium">Spotify</span>
                  </a>
                )}
                {artist.socials.soundcloud && (
                  <a
                    href={artist.socials.soundcloud}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition text-white"
                  >
                    <Radio className="w-5 h-5" />
                    <span className="font-medium">SoundCloud</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {isLoggedIn && artist.bio && (
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">About</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{artist.bio}</p>
            </div>
          )}

          {isLoggedIn && media.length > 0 && (
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Media Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {media.map((item) => (
                  <div key={item.id} className="relative group rounded-lg overflow-hidden bg-neutral-800 aspect-square">
                    {item.media_type === 'image' ? (
                      <img
                        src={item.url}
                        alt="Artist media"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          controls
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition pointer-events-none">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoggedIn && (
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-8 text-center">
              <div className="max-w-md mx-auto">
                <Music className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Want to see more?</h3>
                <p className="text-gray-400 mb-4">
                  Sign in to view social links, about information, and media gallery
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition text-white font-semibold"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
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
