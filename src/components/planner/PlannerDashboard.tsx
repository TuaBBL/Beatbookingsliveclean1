import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Header from "../Header";
import Footer from "../Footer";
import EditProfileModal from "./EditProfileModal";
import { Calendar, Users, MessageSquare, Heart, User, Settings } from "lucide-react";

export default function PlannerDashboard() {
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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, bookingsRes, favouritesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("name, email, image_url")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("bookings")
          .select("status")
          .eq("planner_id", user.id),
        supabase
          .from("favourites")
          .select("id")
          .eq("planner_id", user.id),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      const bookings = bookingsRes.data || [];
      const pending = bookings.filter((b) => b.status === "pending").length;
      const confirmed = bookings.filter((b) => b.status === "accepted").length;
      const favourites = favouritesRes.data?.length || 0;

      setStats({
        pendingRequests: pending,
        confirmedBookings: confirmed,
        favouriteArtists: favourites,
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Planner Dashboard</h1>
            {profile && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">{profile.name}</p>
                  <p className="text-sm text-gray-400">{profile.email}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-neutral-700">
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
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
                  title="Edit Profile"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageSquare className="w-6 h-6 text-orange-500" />
                    <h3 className="text-lg font-semibold">Pending Requests</h3>
                  </div>
                  <p className="text-4xl font-bold text-orange-500">
                    {stats.pendingRequests}
                  </p>
                </div>

                <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-6 h-6 text-green-500" />
                    <h3 className="text-lg font-semibold">Confirmed Bookings</h3>
                  </div>
                  <p className="text-4xl font-bold text-green-500">
                    {stats.confirmedBookings}
                  </p>
                </div>

                <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Heart className="w-6 h-6 text-pink-500" />
                    <h3 className="text-lg font-semibold">Favourite Artists</h3>
                  </div>
                  <p className="text-4xl font-bold text-pink-500">
                    {stats.favouriteArtists}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  to="/planner/artists"
                  className="bg-orange-600 hover:bg-orange-700 p-8 rounded-lg transition group"
                >
                  <div className="flex items-center gap-4">
                    <Users className="w-8 h-8" />
                    <div>
                      <h3 className="text-xl font-bold mb-1">Browse Artists</h3>
                      <p className="text-orange-100">
                        Discover and connect with talented artists
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/planner/bookings"
                  className="bg-neutral-900 hover:bg-neutral-800 p-8 rounded-lg border border-neutral-700 transition group"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="w-8 h-8" />
                    <div>
                      <h3 className="text-xl font-bold mb-1">View Bookings</h3>
                      <p className="text-gray-400">
                        Manage your booking requests and calendar
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

      <Footer />
    </div>
  );
}
