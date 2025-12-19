import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Header from "../Header";
import Footer from "../Footer";
import EditProfileModal from "./EditProfileModal";
import AnimatedArtistHero from "../dashboard/AnimatedArtistHero";
import { Calendar, Users, MessageSquare, Heart, User, Settings, CalendarDays, LogOut, Shield, Send } from "lucide-react";

export default function PlannerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingRequests: 0,
    confirmedBookings: 0,
    favouriteArtists: 0,
  });
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    image_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, requestsRes, bookingsRes, favouritesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("name, email, image_url")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("booking_requests")
          .select("status")
          .eq("planner_id", user.id)
          .eq("status", "pending"),
        supabase
          .from("bookings")
          .select("status")
          .eq("planner_id", user.id)
          .eq("status", "accepted"),
        supabase
          .from("favourites")
          .select("id")
          .eq("planner_id", user.id),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      const pendingRequests = requestsRes.data?.length || 0;
      const confirmedBookings = bookingsRes.data?.length || 0;
      const favourites = favouritesRes.data?.length || 0;

      setStats({
        pendingRequests,
        confirmedBookings,
        favouriteArtists: favourites,
      });
    } catch (error) {
      console.error("Error loading data:", error);
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
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_admin === true) {
        navigate('/admin');
      } else {
        setToast("Admin access not approved.");
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      setToast("Admin access not approved.");
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
            <h1 className="text-3xl md:text-4xl font-bold">Planner Dashboard</h1>
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
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition text-white font-medium text-sm md:text-base shadow-lg hover:shadow-orange-500/50 flex-shrink-0"
                title="Edit Profile"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-neon-red hover:bg-neon-red/90 rounded-lg transition text-white font-semibold text-sm md:text-base flex-shrink-0"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Link
                  to="/planner/bookings"
                  className="bg-neutral-900 p-6 rounded-lg border-2 border-neutral-700 hover:border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Pending Requests</h3>
                  </div>
                  <p className="text-5xl font-bold text-orange-500">
                    {stats.pendingRequests}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Awaiting response</p>
                </Link>

                <Link
                  to="/planner/confirmed"
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
                  <p className="text-sm text-gray-400 mt-2">Upcoming events</p>
                </Link>

                <Link
                  to="/planner/favourites"
                  className="bg-neutral-900 p-6 rounded-lg border-2 border-neutral-700 hover:border-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-pink-500/10 rounded-lg">
                      <Heart className="w-6 h-6 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Favourite Artists</h3>
                  </div>
                  <p className="text-5xl font-bold text-pink-500">
                    {stats.favouriteArtists}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">Saved for later</p>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                  to="/planner/artists"
                  className="bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 p-8 rounded-lg shadow-lg hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-lg">
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Browse Artists</h3>
                      <p className="text-orange-100">
                        Discover and connect with talented artists
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/planner/requests"
                  className="bg-neutral-900 hover:bg-neutral-800 p-8 rounded-lg border-2 border-neutral-700 hover:border-blue-500 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Send className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">My Requests</h3>
                      <p className="text-gray-400">
                        View your sent booking requests
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/events"
                  className="bg-neutral-900 hover:bg-neutral-800 p-8 rounded-lg border-2 border-neutral-700 hover:border-green-500 shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <CalendarDays className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Events</h3>
                      <p className="text-gray-400">
                        Browse and discover upcoming events
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/planner/calendar"
                  className="bg-neutral-900 hover:bg-neutral-800 p-8 rounded-lg border-2 border-neutral-700 hover:border-orange-500 shadow-lg hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <Calendar className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Manage events/bookings</h3>
                      <p className="text-gray-400">
                        View your calendar and manage events
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={() => {
          loadData();
        }}
      />

      {toast && (
        <div className="fixed bottom-4 right-4 bg-neutral-900 border-2 border-orange-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      <Footer />
    </div>
  );
}
