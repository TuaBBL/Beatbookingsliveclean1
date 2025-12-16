import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Header from "../Header";
import Footer from "../Footer";
import PlannerProfileMenu from "./PlannerProfileMenu";
import { Music, Search } from "lucide-react";

interface ArtistProfile {
  id: string;
  stage_name: string;
  genre: string;
  location: string;
  category: string;
  user_id: string;
}

export default function PlannerArtists() {
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("");

  useEffect(() => {
    loadArtists();
  }, []);

  async function loadArtists() {
    try {
      const { data, error } = await supabase
        .from("artist_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error("Error loading artists:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredArtists = artists.filter((artist) => {
    const matchesSearch = artist.stage_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesGenre = !genreFilter || artist.genre === genreFilter;
    return matchesSearch && matchesGenre;
  });

  const genres = Array.from(new Set(artists.map((a) => a.genre)));

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Browse Artists</h1>
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

          <div className="mb-8 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>

            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:outline-none focus:border-orange-500"
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading artists...</p>
          ) : filteredArtists.length === 0 ? (
            <p className="text-gray-400">No artists found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArtists.map((artist) => (
                <Link
                  key={artist.id}
                  to={`/planner/artists/${artist.id}`}
                  className="bg-neutral-900 rounded-lg border border-neutral-800 hover:border-orange-500 transition overflow-hidden group"
                >
                  <div className="h-48 bg-neutral-800 flex items-center justify-center">
                    <Music className="w-16 h-16 text-neutral-700" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-1 group-hover:text-orange-500 transition">
                      {artist.stage_name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">{artist.genre}</p>
                    <p className="text-sm text-gray-500">{artist.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
