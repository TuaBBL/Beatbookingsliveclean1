import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../Header";
import Footer from "../Footer";
import PlannerProfileMenu from "./PlannerProfileMenu";
import SearchFilters, { FilterState } from "../SearchFilters";
import { Music } from "lucide-react";
import { mockArtists, Artist } from "../../data/mockArtists";
import { supabase } from "../../lib/supabase";

export default function PlannerArtists() {
  const [searchParams] = useSearchParams();
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [initialSearch, setInitialSearch] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const search = searchParams.get("search");
    if (search) {
      setInitialSearch(search);
    }
  }, [searchParams]);

  useEffect(() => {
    loadUserRole();
    loadArtists();
  }, []);

  const loadUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const loadArtists = async () => {
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
          profiles!artist_profiles_user_id_fkey(image_url)
        `);

      const artists: Artist[] = (artistProfiles || []).map((profile: any) => {
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

      setAllArtists(artists);
      setFilteredArtists(artists);
    } catch (error) {
      console.error('Error loading artists:', error);
      setAllArtists([]);
      setFilteredArtists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: FilterState) => {
    let results = [...allArtists];

    if (filters.search) {
      results = results.filter((artist) =>
        artist.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.genre !== 'All Genres') {
      results = results.filter((artist) => artist.genre === filters.genre);
    }

    if (filters.category !== 'All Categories') {
      results = results.filter((artist) => artist.role === filters.category);
    }

    if (filters.state !== 'All States') {
      results = results.filter((artist) => artist.state === filters.state);
    }

    if (filters.city) {
      results = results.filter((artist) =>
        artist.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.socials.youtube) {
      results = results.filter((artist) => artist.socials?.youtube);
    }
    if (filters.socials.instagram) {
      results = results.filter((artist) => artist.socials?.instagram);
    }
    if (filters.socials.facebook) {
      results = results.filter((artist) => artist.socials?.facebook);
    }
    if (filters.socials.soundcloud) {
      results = results.filter((artist) => artist.socials?.soundcloud);
    }
    if (filters.socials.spotify) {
      results = results.filter((artist) => artist.socials?.spotify);
    }

    setFilteredArtists(results);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <div className="flex items-center justify-end px-6 pt-6">
        <div className="flex items-center gap-4">
          <Link
            to={userRole === 'artist' ? '/artist/dashboard' : '/planner/dashboard'}
            className="text-gray-400 hover:text-white transition"
          >
            Back to Dashboard
          </Link>
          <PlannerProfileMenu />
        </div>
      </div>

      <SearchFilters onFilterChange={handleFilterChange} initialSearch={initialSearch} />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Browse Artists</h1>

          {loading ? (
            <p className="text-gray-400">Loading artists...</p>
          ) : filteredArtists.length === 0 ? (
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-12 text-center">
              <Music className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No artists found</p>
              <p className="text-gray-600 text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <p className="text-gray-400 mb-6">{filteredArtists.length} artist{filteredArtists.length !== 1 ? 's' : ''} found</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArtists.map((artist) => (
                  <Link
                    key={artist.id}
                    to={`/planner/artists/${artist.id}`}
                    className="bg-neutral-900 rounded-lg border-2 border-neutral-700 hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-200 overflow-hidden group"
                  >
                    <div className="h-56 bg-neutral-800 flex items-center justify-center overflow-hidden">
                      {artist.imageUrl ? (
                        <img
                          src={artist.imageUrl}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <Music className="w-16 h-16 text-neutral-700" />
                      )}
                    </div>
                    <div className="p-5 bg-neutral-900">
                      <h3 className="text-xl font-bold mb-2 text-white group-hover:text-orange-500 transition">
                        {artist.name}
                      </h3>
                      <p className="text-sm text-orange-400 font-medium mb-2">{artist.genre}</p>
                      <p className="text-sm text-gray-400">{artist.city}, {artist.state}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
