import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Artist } from "../../data/mockArtists";
import { ArtistGrid } from "../ArtistGrid";
import Header from "../Header";
import Footer from "../Footer";
import PlannerProfileMenu from "./PlannerProfileMenu";
import { Heart } from "lucide-react";

export default function PlannerFavourites() {
  const [artists, setArtists] = useState<Artist[]>([]);
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
        .select(`
          id,
          artist_id,
          artist_profiles(
            id,
            user_id,
            stage_name,
            genre,
            category,
            location,
            bio,
            type,
            image_url,
            profiles(image_url)
          )
        `)
        .eq("planner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedArtists: Artist[] = (data || [])
        .filter((fav: any) => fav.artist_profiles)
        .map((fav: any) => {
          const profile = fav.artist_profiles;
          const locationParts = (profile.location || '').split(',').map((s: string) => s.trim());
          const city = locationParts[0] || '';
          const state = locationParts[1] || '';
          const country = locationParts[2] || 'Australia';

          const isDemo = profile.type === 'demo';

          return {
            id: profile.user_id || profile.id,
            name: profile.stage_name || 'Unknown Artist',
            role: profile.category || 'DJ',
            genre: profile.genre || 'Electronic',
            city,
            state,
            country,
            imageUrl: profile.image_url || profile.profiles?.image_url || '',
            socials: {},
            isDemo,
            bio: profile.bio,
          };
        });

      setArtists(mappedArtists);
    } catch (error) {
      console.error("Error loading favourites:", error);
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
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Heart className="w-10 h-10 text-pink-500 fill-current" />
              Favourite Artists
            </h1>
            <div className="flex items-center gap-4">
              <Link
                to="/planner/dashboard"
                className="text-gray-400 hover:text-white transition"
              >
                Back to Dashboard
              </Link>
              <PlannerProfileMenu />
            </div>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : artists.length === 0 ? (
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
            <ArtistGrid artists={artists} onFavouriteChange={loadFavourites} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
