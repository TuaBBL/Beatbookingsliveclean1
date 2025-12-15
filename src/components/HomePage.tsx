import { useState } from 'react';

import Header from './Header';
import Hero from './Hero';
import SearchFilters, { FilterState } from './SearchFilters';
import { ArtistGrid } from './ArtistGrid';
import EventsSection from './EventsSection';
import Footer from './Footer';

import { mockArtists, Artist } from '../data/mockArtists';

export default function HomePage() {
  // HARD SAFETY: mockArtists must always be an array
  const allArtists: Artist[] = Array.isArray(mockArtists) ? mockArtists : [];

  const [filteredArtists, setFilteredArtists] = useState<Artist[]>(allArtists);

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
      results = results.filter((artist) => artist.category === filters.category);
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
      results = results.filter((artist) => artist.youtube);
    }
    if (filters.socials.instagram) {
      results = results.filter((artist) => artist.instagram);
    }
    if (filters.socials.facebook) {
      results = results.filter((artist) => artist.facebook);
    }
    if (filters.socials.soundcloud) {
      results = results.filter((artist) => artist.soundcloud);
    }
    if (filters.socials.spotify) {
      results = results.filter((artist) => artist.spotify);
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

        <ArtistGrid
          artists={allArtists.slice(0, 4)}
          showRank
        />
      </section>

      {/* EVENTS SECTION */}
      <EventsSection />

      {/* ALL ARTISTS */}
      <section className="relative z-10 px-6 py-16">
        <h2 className="mb-6 text-2xl font-bold text-white">
          Browse Artists
        </h2>

        <ArtistGrid artists={filteredArtists} />
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
