import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { normalizeArtistFromDB } from "../../lib/normalizeArtist";
import Header from "../Header";
import Footer from "../Footer";
import SoundBarsBackground from "../SoundBarsBackground";
import PlannerProfileMenu from "./PlannerProfileMenu";
import SearchFilters, { FilterState } from "../SearchFilters";
import { ArtistCard } from "../ArtistCard";
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
          profiles!artist_profiles_user_id_fkey(image_url),
          subscriptions!subscriptions_artist_id_fkey(is_active)
        `);

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
        const normalized = normalizeArtistFromDB(profile);

        const locationParts = (profile.location || '').split(',').map((s: string) => s.trim());
        const city = locationParts[0] || '';
        const state = locationParts[1] || '';
        const country = locationParts[2] || 'Australia';

        const subscriptions = Array.isArray(profile.subscriptions)
          ? profile.subscriptions
          : profile.subscriptions ? [profile.subscriptions] : [];
        const isPremium = !normalized.isDemo && subscriptions.some((sub: any) => sub.is_active === true);
        const ratings = ratingsMap.get(profile.id);
        const artistSocials = socialsMap.get(profile.id) || {};

        return {
          ...normalized,
          city,
          state,
          country,
          isPremium,
          socials: artistSocials,
          averageRating: ratings?.averageRating,
          reviewCount: ratings?.reviewCount,
        };
      });

      const sortedArtists = sortArtistsByPremium(artists);
      setAllArtists(sortedArtists);
      setFilteredArtists(sortedArtists);
    } catch (error) {
      console.error('Error loading artists:', error);
      setAllArtists([]);
      setFilteredArtists([]);
    } finally {
      setLoading(false);
    }
  };

  const sortArtistsByPremium = (artists: Artist[]) => {
    return [...artists].sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return 0;
    });
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

    results = sortArtistsByPremium(results);
    setFilteredArtists(results);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <SoundBarsBackground />

      <div className="flex items-center justify-end px-6 pt-6 relative z-10">
        <div className="flex items-center gap-4">
          <Link
            to={userRole === 'artist' ? '/artist/dashboard' : '/planner/dashboard'}
            className="text-gray-300 hover:text-neon-green hover:drop-shadow-[0_0_10px_rgba(0,255,136,0.8)] transition-all duration-300"
          >
            Back to Dashboard
          </Link>
          <PlannerProfileMenu />
        </div>
      </div>

      <SearchFilters onFilterChange={handleFilterChange} initialSearch={initialSearch} />

      <main className="flex-1 px-6 py-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-white drop-shadow-[0_0_15px_rgba(0,255,136,0.5)]">Browse Artists</h1>

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
                  <ArtistCard key={artist.id} artist={artist} />
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
