import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../Header";
import Footer from "../Footer";
import PlannerProfileMenu from "./PlannerProfileMenu";
import SearchFilters, { FilterState } from "../SearchFilters";
import { Music } from "lucide-react";
import { mockArtists, Artist } from "../../data/mockArtists";

export default function PlannerArtists() {
  const allArtists: Artist[] = Array.isArray(mockArtists) ? mockArtists : [];
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>(allArtists);

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
      results = results.filter((artist) => artist.socials.youtube);
    }
    if (filters.socials.instagram) {
      results = results.filter((artist) => artist.socials.instagram);
    }
    if (filters.socials.facebook) {
      results = results.filter((artist) => artist.socials.facebook);
    }
    if (filters.socials.soundcloud) {
      results = results.filter((artist) => artist.socials.soundcloud);
    }
    if (filters.socials.spotify) {
      results = results.filter((artist) => artist.socials.spotify);
    }

    setFilteredArtists(results);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <div className="flex items-center justify-end px-6 pt-6">
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

      <SearchFilters onFilterChange={handleFilterChange} />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Browse Artists</h1>

          {filteredArtists.length === 0 ? (
            <p className="text-gray-400">No artists found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArtists.map((artist) => (
                <Link
                  key={artist.id}
                  to={`/planner/artists/${artist.id}`}
                  className="bg-neutral-900 rounded-lg border border-neutral-800 hover:border-orange-500 transition overflow-hidden group"
                >
                  <div className="h-48 bg-neutral-800 flex items-center justify-center overflow-hidden">
                    {artist.imageUrl ? (
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-16 h-16 text-neutral-700" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-1 group-hover:text-orange-500 transition">
                      {artist.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">{artist.genre}</p>
                    <p className="text-sm text-gray-500">{artist.city}, {artist.state}</p>
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
