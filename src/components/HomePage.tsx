import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from './Header';
import Hero from './Hero';
import SearchFilters, { FilterState } from './SearchFilters';
import { ArtistGrid } from './ArtistGrid';
import EventsSection from './EventsSection';
import Footer from './Footer';

import { mockArtists, Artist } from '../data/mockArtists';

export default function HomePage() {
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArtists();
  }, []);

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
        const hasActiveSubscription = Array.isArray(profile.subscriptions) &&
          profile.subscriptions.some((sub: any) => sub.is_active === true);
        return profile.type === 'demo' || hasActiveSubscription;
      });

      const artists: Artist[] = activeProfiles.map((profile: any) => {
        const locationParts = (profile.location || '').split(',').map((s: string) => s.trim());
        const city = locationParts[0] || '';
        const state = locationParts[1] || '';
        const country = locationParts[2] || 'Australia';

        const isDemo = profile.type === 'demo';
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
          imageUrl: profile.image_url || profile.profiles?.image_url || '',
          socials: artistSocials,
          isDemo,
          bio: profile.bio,
          averageRating: ratings?.averageRating,
          reviewCount: ratings?.reviewCount,
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
  }

  const handleFilterChange = (filters: FilterState) => {
    let results = [...allArtists];

    // Text search
    if (filters.search) {
      results = results.filter((artist) =>
        artist.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Genre
    if (filters.genre !== 'All Genres') {
      results = results.filter((artist) => artist.genre === filters.genre);
    }

    // Category
    if (filters.category !== 'All Categories') {
      results = results.filter((artist) => artist.role === filters.category);
    }

    // State
    if (filters.state !== 'All States') {
      results = results.filter((artist) => artist.state === filters.state);
    }

    // City
    if (filters.city) {
      results = results.filter((artist) =>
        artist.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    // Social filters (purely visual now)
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
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <Header />

      {/* HERO — animated background rows */}
      <Hero artists={allArtists} />

      {/* SEARCH / FILTER BAR */}
      <SearchFilters onFilterChange={handleFilterChange} />

      {/* FEATURED SECTION (visual only) */}
      <section className="relative z-10 px-6 pt-12">
        <h2 className="mb-6 text-2xl font-bold text-white">
          Featured This Month
        </h2>

        {loading ? (
          <p className="text-gray-400">Loading artists...</p>
        ) : (
          <ArtistGrid
            artists={allArtists.slice(0, 4)}
            showRank
          />
        )}
      </section>

      {/* EVENTS SECTION */}
      <EventsSection />

      {/* ALL ARTISTS */}
      <section className="relative z-10 px-6 py-16">
        <h2 className="mb-6 text-2xl font-bold text-white">
          Browse Artists
        </h2>

        {loading ? (
          <p className="text-gray-400">Loading artists...</p>
        ) : (
          <ArtistGrid artists={filteredArtists} />
        )}
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
