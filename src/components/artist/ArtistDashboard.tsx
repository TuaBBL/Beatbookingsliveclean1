import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../Header';
import Footer from '../Footer';
import EditArtistProfileModal from './EditArtistProfileModal';
import AnimatedArtistHero from '../dashboard/AnimatedArtistHero';
import SubscriptionStatusCard from './SubscriptionStatusCard';
import NotificationsBox from '../NotificationsBox';
import { ArtistGrid } from '../ArtistGrid';
import EventsSection from '../EventsSection';
import AdminMessageBox from '../AdminMessageBox';
import SoundBarsBackground from '../SoundBarsBackground';
import { Artist } from '../../data/mockArtists';
import { Calendar, MessageSquare, User, Settings, LogOut, Shield, Image, Video, Inbox } from 'lucide-react';

export default function ArtistDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingRequests: 0,
    confirmedBookings: 0,
    totalMedia: 0,
  });
  const [profile, setProfile] = useState<any>(null);
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);

  useEffect(() => {
    loadData();
    loadArtists();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const [profileRes, artistProfileRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('artist_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      if (artistProfileRes.data) {
        setArtistProfile(artistProfileRes.data);

        const [requestsRes, bookingsRes, mediaRes] = await Promise.all([
          supabase
            .from('booking_requests')
            .select('status')
            .eq('artist_user_id', user.id)
            .eq('status', 'pending'),
          supabase
            .from('bookings')
            .select('status')
            .eq('artist_id', artistProfileRes.data.id)
            .eq('status', 'accepted'),
          supabase
            .from('artist_media')
            .select('id')
            .eq('artist_id', artistProfileRes.data.id)
        ]);

        const pendingRequests = requestsRes.data?.length || 0;
        const confirmedBookings = bookingsRes.data?.length || 0;
        const totalMedia = mediaRes.data?.length || 0;

        setStats({
          pendingRequests,
          confirmedBookings,
          totalMedia,
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadArtists() {
    try {
      const { data: artistProfiles } = await supabase
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
          subscriptions!subscriptions_artist_id_fkey(is_active)
        `)
        .limit(8);

      const { data: socialLinks } = await supabase
        .from('artist_social_links')
        .select('artist_id, platform, url');

      const { data: reviews } = await supabase
        .from('artist_reviews')
        .select('artist_id, rating');

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

      const activeProfiles = (artistProfiles || []).filter((profile: any) => {
        if (profile.type === 'demo') return true;
        const subscriptions = Array.isArray(profile.subscriptions)
          ? profile.subscriptions
          : profile.subscriptions ? [profile.subscriptions] : [];
        return subscriptions.some((sub: any) => sub.is_active === true);
      });

      const artists: Artist[] = activeProfiles.map((profile: any) => {
        const locationParts = (profile.location || '').split(',').map((s: string) => s.trim());
        const city = locationParts[0] || '';
        const state = locationParts[1] || '';
        const country = locationParts[2] || 'Australia';

        const isDemo = profile.type === 'demo';
        const subscriptions = Array.isArray(profile.subscriptions)
          ? profile.subscriptions
          : profile.subscriptions ? [profile.subscriptions] : [];
        const isPremium = !isDemo && subscriptions.some((sub: any) => sub.is_active === true);
        const ratings = ratingsMap.get(profile.id);
        const artistSocials = socialsMap.get(profile.id) || {};

        return {
          id: profile.id,
          userId: profile.user_id,
          name: profile.stage_name || 'Unknown Artist',
          role: profile.category || 'DJ',
          genre: profile.genre || 'Electronic',
          city,
          state,
          country,
          imageUrl: profile.image_url || '',
          socials: artistSocials,
          isDemo,
          isPremium,
          bio: profile.bio,
          averageRating: ratings?.averageRating,
          reviewCount: ratings?.reviewCount,
        };
      });

      setAllArtists(artists);
    } catch (error) {
      console.error('Error loading artists:', error);
    }
  }


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.is_admin === true) {
        navigate('/admin');
      } else {
        setToast('Admin access not approved.');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setToast('Admin access not approved.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <SoundBarsBackground />

      <main className="flex-1 px-6 py-12 relative">
        <AnimatedArtistHero className="h-80" />

        <div className="max-w-6xl mx-auto relative z-20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-[0_0_15px_rgba(0,255,136,0.5)]">Artist Dashboard</h1>
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
              {profile && (
                <>
                  <div className="text-right flex-1 md:flex-initial">
                    <p className="font-semibold text-sm md:text-base">{profile.name}</p>
                    <p className="text-xs md:text-sm text-gray-400">{profile.email}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-neon-green shadow-neon-green flex-shrink-0">
                    {profile.image_url ? (
                      <img
                        src={profile.image_url}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                </>
              )}
              <button
                onClick={handleAdminAccess}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-neon-green/10 border border-neon-green hover:bg-neon-green/20 rounded-lg transition-all duration-300 text-neon-green font-medium text-sm md:text-base shadow-neon-green hover:shadow-neon-green-lg flex-shrink-0"
                title="Admin"
              >
                <Shield className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-neon-green/10 border border-neon-green hover:bg-neon-green/20 rounded-lg transition-all duration-300 text-neon-green font-medium text-sm md:text-base shadow-neon-green hover:shadow-neon-green-lg flex-shrink-0"
                title="Edit Profile"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-neon-red/10 border border-neon-red hover:bg-neon-red/20 rounded-lg transition-all duration-300 text-neon-red font-semibold text-sm md:text-base shadow-neon-red hover:shadow-neon-red-lg flex-shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <>
              {artistProfile && (
                <div className="mb-8">
                  <SubscriptionStatusCard artistId={artistProfile.id} />
                </div>
              )}

              <div className="mb-8">
                <NotificationsBox />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Link
                  to="/artist/inbox"
                  className="bg-black/60 backdrop-blur-md p-6 rounded-lg border border-neon-red hover:border-neon-red shadow-neon-red hover:shadow-neon-red-lg transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-neon-red/20 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-neon-red" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Pending Requests</h3>
                  </div>
                  <p className="text-5xl font-bold text-neon-red">
                    {stats.pendingRequests}
                  </p>
                  <p className="text-sm text-gray-300 mt-2">Booking inquiries</p>
                </Link>

                <Link
                  to="/artist/calendar"
                  state={{ openFirstBooking: true }}
                  className="bg-black/60 backdrop-blur-md p-6 rounded-lg border border-neon-green hover:border-neon-green shadow-neon-green hover:shadow-neon-green-lg transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-neon-green/20 rounded-lg">
                      <Calendar className="w-6 h-6 text-neon-green" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Confirmed Bookings</h3>
                  </div>
                  <p className="text-5xl font-bold text-neon-green">
                    {stats.confirmedBookings}
                  </p>
                  <p className="text-sm text-gray-300 mt-2">Upcoming gigs</p>
                </Link>

                <Link
                  to="/artist/media"
                  className="bg-black/60 backdrop-blur-md p-6 rounded-lg border border-neon-red hover:border-neon-red shadow-neon-red hover:shadow-neon-red-lg transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-neon-red/20 rounded-lg">
                      <Image className="w-6 h-6 text-neon-red" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Media Files</h3>
                  </div>
                  <p className="text-5xl font-bold text-neon-red">
                    {stats.totalMedia}
                  </p>
                  <p className="text-sm text-gray-300 mt-2">Photos & videos</p>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                  to="/artist/calendar"
                  state={{ openFirstBooking: true }}
                  className="bg-gradient-to-br from-neon-green/20 to-neon-green/10 border border-neon-green p-8 rounded-lg shadow-neon-green hover:shadow-neon-green-lg hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-neon-green/20 rounded-lg">
                      <Calendar className="w-8 h-8 text-neon-green" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-white">Confirmed Bookings</h3>
                      <p className="text-gray-300 text-sm">
                        View your calendar
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/events"
                  className="bg-black/60 backdrop-blur-md p-8 rounded-lg border border-neon-red hover:border-neon-red shadow-neon-red hover:shadow-neon-red-lg hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-neon-red/20 rounded-lg">
                      <Calendar className="w-8 h-8 text-neon-red" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-white">Events</h3>
                      <p className="text-gray-300 text-sm">
                        Browse upcoming events
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/artist/calendar"
                  className="bg-black/60 backdrop-blur-md p-8 rounded-lg border border-neon-green hover:border-neon-green shadow-neon-green hover:shadow-neon-green-lg hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-neon-green/20 rounded-lg">
                      <Calendar className="w-8 h-8 text-neon-green" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-white">My Calendar</h3>
                      <p className="text-gray-300 text-sm">
                        View bookings and events I'm attending
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/artist/media"
                  className="bg-black/60 backdrop-blur-md p-8 rounded-lg border border-neon-red hover:border-neon-red shadow-neon-red hover:shadow-neon-red-lg hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-neon-red/20 rounded-lg">
                      <Image className="w-8 h-8 text-neon-red" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-white">Media Gallery</h3>
                      <p className="text-gray-300 text-sm">
                        Upload photos & videos
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/planner/artists"
                  className="bg-black/60 backdrop-blur-md p-8 rounded-lg border border-neon-green hover:border-neon-green shadow-neon-green hover:shadow-neon-green-lg hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-neon-green/20 rounded-lg">
                      <User className="w-8 h-8 text-neon-green" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-white">Browse Artists</h3>
                      <p className="text-gray-300 text-sm">
                        Discover other artists
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to={artistProfile ? `/artists/${profile.id}` : '#'}
                  onClick={(e) => {
                    if (!artistProfile) {
                      e.preventDefault();
                      setToast('Please complete your artist profile first');
                      setTimeout(() => setToast(null), 3000);
                    }
                  }}
                  className="bg-black/60 backdrop-blur-md p-8 rounded-lg border border-neon-red hover:border-neon-red shadow-neon-red hover:shadow-neon-red-lg hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-neon-red/20 rounded-lg">
                      <User className="w-8 h-8 text-neon-red" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 text-white">Public Profile</h3>
                      <p className="text-gray-300 text-sm">
                        View your public page
                      </p>
                    </div>
                  </div>
                </Link>
              </div>

              <section className="mt-16">
                <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]">
                  Browse Artists
                </h2>
                {allArtists.length > 0 ? (
                  <ArtistGrid artists={allArtists} />
                ) : (
                  <p className="text-gray-300">Loading artists...</p>
                )}
              </section>

              <section className="mt-16">
                <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-[0_0_10px_rgba(255,43,43,0.4)]">
                  Featured This Month
                </h2>
                {allArtists.length > 0 ? (
                  <ArtistGrid artists={allArtists.slice(0, 4)} showRank />
                ) : (
                  <p className="text-gray-300">Loading artists...</p>
                )}
              </section>

              <div className="mt-16">
                <EventsSection />
              </div>
            </>
          )}
        </div>
      </main>

      {profile && (
        <EditArtistProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          artistProfile={artistProfile}
          profile={profile}
          onSave={() => {
            loadData();
            setToast('Profile updated successfully!');
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-black/90 backdrop-blur-md border border-neon-green text-white px-6 py-3 rounded-lg shadow-neon-green-lg z-50">
          {toast}
        </div>
      )}

      <AdminMessageBox />

      <Footer />
    </div>
  );
}
