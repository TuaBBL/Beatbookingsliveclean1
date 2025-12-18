import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../Header';
import Footer from '../Footer';
import EditArtistProfileModal from './EditArtistProfileModal';
import AnimatedArtistHero from '../dashboard/AnimatedArtistHero';
import SubscriptionStatusCard from './SubscriptionStatusCard';
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

  useEffect(() => {
    loadData();
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

        const [bookingsRes, mediaRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('status')
            .eq('artist_id', artistProfileRes.data.id),
          supabase
            .from('artist_media')
            .select('id')
            .eq('artist_id', artistProfileRes.data.id)
        ]);

        const bookings = bookingsRes.data || [];
        const pending = bookings.filter((b) => b.status === 'pending').length;
        const confirmed = bookings.filter((b) => b.status === 'accepted').length;
        const totalMedia = mediaRes.data?.length || 0;

        setStats({
          pendingRequests: pending,
          confirmedBookings: confirmed,
          totalMedia,
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

      <main className="flex-1 px-6 py-12 relative">
        <AnimatedArtistHero className="h-80" />

        <div className="max-w-6xl mx-auto relative z-20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold">Artist Dashboard</h1>
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
              {profile && (
                <>
                  <div className="text-right flex-1 md:flex-initial">
                    <p className="font-semibold text-sm md:text-base">{profile.name}</p>
                    <p className="text-xs md:text-sm text-gray-400">{profile.email}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-neutral-700 flex-shrink-0">
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
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-white font-medium text-sm md:text-base shadow-lg hover:shadow-purple-500/50 flex-shrink-0"
                title="Admin"
              >
                <Shield className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white font-medium text-sm md:text-base shadow-lg hover:shadow-blue-500/50 flex-shrink-0"
                title="Edit Profile"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition text-white font-semibold text-sm md:text-base flex-shrink-0"
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Link
                  to="/artist/bookings"
                  className="bg-neutral-900 p-6 rounded-lg border-2 border-neutral-700 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Pending Requests</h3>
                  </div>
                  <p className="text-5xl font-bold text-blue-500">
                    {stats.pendingRequests}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Booking inquiries</p>
                </Link>

                <Link
                  to="/artist/calendar"
                  className="bg-neutral-900 p-6 rounded-lg border-2 border-neutral-700 hover:border-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Calendar className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Confirmed Bookings</h3>
                  </div>
                  <p className="text-5xl font-bold text-green-500">
                    {stats.confirmedBookings}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Upcoming gigs</p>
                </Link>

                <Link
                  to="/artist/media"
                  className="bg-neutral-900 p-6 rounded-lg border-2 border-neutral-700 hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Image className="w-6 h-6 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Media Files</h3>
                  </div>
                  <p className="text-5xl font-bold text-orange-500">
                    {stats.totalMedia}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Photos & videos</p>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                  to="/artist/inbox"
                  className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-8 rounded-lg shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-white/10 rounded-lg">
                      <Inbox className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Booking Requests</h3>
                      <p className="text-blue-100 text-sm">
                        View incoming requests
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/artist/bookings"
                  className="bg-neutral-900 hover:bg-neutral-800 p-8 rounded-lg border-2 border-neutral-700 hover:border-blue-500 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <MessageSquare className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Booking Inbox</h3>
                      <p className="text-gray-400 text-sm">
                        Manage booking inquiries
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/artist/calendar"
                  className="bg-neutral-900 hover:bg-neutral-800 p-8 rounded-lg border-2 border-neutral-700 hover:border-green-500 shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <Calendar className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">My Calendar</h3>
                      <p className="text-gray-400 text-sm">
                        View confirmed bookings
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/artist/media"
                  className="bg-neutral-900 hover:bg-neutral-800 p-8 rounded-lg border-2 border-neutral-700 hover:border-orange-500 shadow-lg hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <Image className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Media Gallery</h3>
                      <p className="text-gray-400 text-sm">
                        Upload photos & videos
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/planner/artists"
                  className="bg-neutral-900 hover:bg-neutral-800 p-8 rounded-lg border-2 border-neutral-700 hover:border-purple-500 shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <User className="w-8 h-8 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Browse Artists</h3>
                      <p className="text-gray-400 text-sm">
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
                  className="bg-neutral-900 hover:bg-neutral-800 p-8 rounded-lg border-2 border-neutral-700 hover:border-blue-500 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <User className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Public Profile</h3>
                      <p className="text-gray-400 text-sm">
                        View your public page
                      </p>
                    </div>
                  </div>
                </Link>
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
        <div className="fixed bottom-4 right-4 bg-neutral-900 border-2 border-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}
