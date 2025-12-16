import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Header from "../Header";
import Footer from "../Footer";
import { Heart, Music, X } from "lucide-react";

interface Favourite {
  id: string;
  artist_id: string;
  artist_profiles: {
    id: string;
    stage_name: string;
    genre: string;
    location: string;
  };
}

export default function PlannerFavourites() {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavourites();
  }, []);

  async function loadFavourites() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("favourites")
        .select("*, artist_profiles(id, stage_name, genre, location)")
        .eq("planner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavourites(data || []);
    } catch (error) {
      console.error("Error loading favourites:", error);
    } finally {
      setLoading(false);
    }
  }

  async function removeFavourite(favouriteId: string) {
    try {
      const { error } = await supabase
        .from("favourites")
        .delete()
        .eq("id", favouriteId);

      if (error) throw error;
      loadFavourites();
    } catch (error) {
      console.error("Error removing favourite:", error);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Heart className="w-10 h-10 text-pink-500 fill-current" />
              Favourite Artists
            </h1>
            <Link
              to="/planner/dashboard"
              className="text-gray-400 hover:text-white transition"
            >
              Back to Dashboard
            </Link>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : favourites.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No favourite artists yet</p>
              <Link
                to="/planner/artists"
                className="text-orange-500 hover:text-orange-400"
              >
                Browse Artists
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favourites.map((favourite) => (
                <div
                  key={favourite.id}
                  className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden group relative"
                >
                  <button
                    onClick={() => removeFavourite(favourite.id)}
                    className="absolute top-3 right-3 z-10 p-2 bg-black/70 hover:bg-red-600 rounded-full transition"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <Link to={`/planner/artists/${favourite.artist_profiles.id}`}>
                    <div className="h-48 bg-neutral-800 flex items-center justify-center">
                      <Music className="w-16 h-16 text-neutral-700" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-bold mb-1 group-hover:text-orange-500 transition">
                        {favourite.artist_profiles.stage_name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        {favourite.artist_profiles.genre}
                      </p>
                      <p className="text-sm text-gray-500">
                        {favourite.artist_profiles.location}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
