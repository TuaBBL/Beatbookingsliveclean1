import { useState } from 'react';
import { Youtube, Instagram, Facebook, Music, Radio } from 'lucide-react';
import { genres, categories, australianStates } from '../data/mockArtists';

interface SearchFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  genre: string;
  category: string;
  state: string;
  city: string;
  socials: {
    youtube: boolean;
    instagram: boolean;
    facebook: boolean;
    soundcloud: boolean;
    spotify: boolean;
  };
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    genre: 'All Genres',
    category: 'All Categories',
    state: 'All States',
    city: '',
    socials: {
      youtube: false,
      instagram: false,
      facebook: false,
      soundcloud: false,
      spotify: false
    }
  });

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleSocial = (platform: keyof FilterState['socials']) => {
    const newSocials = {
      ...filters.socials,
      [platform]: !filters.socials[platform]
    };
    updateFilters({ socials: newSocials });
  };

  return (
    <section className="relative bg-black py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 h-px w-full bg-[#39ff14]/30 shadow-[0_0_10px_rgba(57,255,20,0.35)]" />

        <div className="transition hover:shadow-[0_0_24px_rgba(57,255,20,0.15)]">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search artist name"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="
                w-full
                rounded-xl
                bg-charcoal/80
                px-5 py-4
                text-white
                placeholder:text-gray-500
                border border-[#39ff14]/30
                focus:border-[#39ff14]
                focus:outline-none
                shadow-[0_0_18px_rgba(57,255,20,0.25)]
                transition
              "
            />
          </div>

          <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">
            Filter by
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <select
              value={filters.genre}
              onChange={(e) => updateFilters({ genre: e.target.value })}
              className="
                w-full
                rounded-lg
                bg-charcoal/80
                px-4 py-3
                text-white
                border border-[#39ff14]/30
                focus:border-[#39ff14]
                focus:outline-none
                shadow-[0_0_12px_rgba(57,255,20,0.2)]
                hover:shadow-[0_0_16px_rgba(57,255,20,0.3)]
                focus:shadow-[0_0_18px_rgba(57,255,20,0.35)]
                transition
                cursor-pointer
              "
            >
              {genres.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="
                w-full
                rounded-lg
                bg-charcoal/80
                px-4 py-3
                text-white
                border border-[#39ff14]/30
                focus:border-[#39ff14]
                focus:outline-none
                shadow-[0_0_12px_rgba(57,255,20,0.2)]
                hover:shadow-[0_0_16px_rgba(57,255,20,0.3)]
                focus:shadow-[0_0_18px_rgba(57,255,20,0.35)]
                transition
                cursor-pointer
              "
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={filters.state}
              onChange={(e) => updateFilters({ state: e.target.value })}
              className="
                w-full
                rounded-lg
                bg-charcoal/80
                px-4 py-3
                text-white
                border border-[#39ff14]/30
                focus:border-[#39ff14]
                focus:outline-none
                shadow-[0_0_12px_rgba(57,255,20,0.2)]
                hover:shadow-[0_0_16px_rgba(57,255,20,0.3)]
                focus:shadow-[0_0_18px_rgba(57,255,20,0.35)]
                transition
                cursor-pointer
              "
            >
              {australianStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="City/Suburb"
              value={filters.city}
              onChange={(e) => updateFilters({ city: e.target.value })}
              className="
                w-full
                rounded-lg
                bg-charcoal/80
                px-4 py-3
                text-white
                placeholder:text-gray-500
                border border-[#39ff14]/30
                focus:border-[#39ff14]
                focus:outline-none
                shadow-[0_0_12px_rgba(57,255,20,0.2)]
                hover:shadow-[0_0_16px_rgba(57,255,20,0.3)]
                focus:shadow-[0_0_18px_rgba(57,255,20,0.35)]
                transition
              "
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => toggleSocial('youtube')}
              className={`
                flex items-center gap-2 rounded-full px-4 py-2 text-sm
                border transition
                ${
                  filters.socials.youtube
                    ? 'border-[#ff2d2d] text-[#ff2d2d] shadow-[0_0_12px_rgba(255,45,45,0.5)]'
                    : 'border-white/15 text-gray-400 hover:border-[#ff2d2d]/60 hover:text-[#ff2d2d]'
                }
              `}
            >
              <Youtube className="w-5 h-5" />
              <span>YouTube</span>
            </button>

            <button
              onClick={() => toggleSocial('instagram')}
              className={`
                flex items-center gap-2 rounded-full px-4 py-2 text-sm
                border transition
                ${
                  filters.socials.instagram
                    ? 'border-[#ff2d2d] text-[#ff2d2d] shadow-[0_0_12px_rgba(255,45,45,0.5)]'
                    : 'border-white/15 text-gray-400 hover:border-[#ff2d2d]/60 hover:text-[#ff2d2d]'
                }
              `}
            >
              <Instagram className="w-5 h-5" />
              <span>Instagram</span>
            </button>

            <button
              onClick={() => toggleSocial('facebook')}
              className={`
                flex items-center gap-2 rounded-full px-4 py-2 text-sm
                border transition
                ${
                  filters.socials.facebook
                    ? 'border-[#ff2d2d] text-[#ff2d2d] shadow-[0_0_12px_rgba(255,45,45,0.5)]'
                    : 'border-white/15 text-gray-400 hover:border-[#ff2d2d]/60 hover:text-[#ff2d2d]'
                }
              `}
            >
              <Facebook className="w-5 h-5" />
              <span>Facebook</span>
            </button>

            <button
              onClick={() => toggleSocial('soundcloud')}
              className={`
                flex items-center gap-2 rounded-full px-4 py-2 text-sm
                border transition
                ${
                  filters.socials.soundcloud
                    ? 'border-[#ff2d2d] text-[#ff2d2d] shadow-[0_0_12px_rgba(255,45,45,0.5)]'
                    : 'border-white/15 text-gray-400 hover:border-[#ff2d2d]/60 hover:text-[#ff2d2d]'
                }
              `}
            >
              <Music className="w-5 h-5" />
              <span>SoundCloud</span>
            </button>

            <button
              onClick={() => toggleSocial('spotify')}
              className={`
                flex items-center gap-2 rounded-full px-4 py-2 text-sm
                border transition
                ${
                  filters.socials.spotify
                    ? 'border-[#ff2d2d] text-[#ff2d2d] shadow-[0_0_12px_rgba(255,45,45,0.5)]'
                    : 'border-white/15 text-gray-400 hover:border-[#ff2d2d]/60 hover:text-[#ff2d2d]'
                }
              `}
            >
              <Radio className="w-5 h-5" />
              <span>Spotify</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
