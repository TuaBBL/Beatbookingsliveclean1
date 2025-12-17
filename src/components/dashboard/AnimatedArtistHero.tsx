import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Artist } from '../../data/mockArtists';
import { Music } from 'lucide-react';

interface AnimatedArtistHeroProps {
  className?: string;
}

export default function AnimatedArtistHero({ className = '' }: AnimatedArtistHeroProps) {
  const [artists, setArtists] = useState<Artist[]>([]);

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
          image_url,
          type,
          is_featured
        `)
        .order('is_featured', { ascending: false })
        .limit(12);

      const mappedArtists: Artist[] = (artistProfiles || []).map((profile: any) => {
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
          imageUrl: profile.image_url || '',
          socials: {},
          isDemo,
        };
      });

      setArtists(mappedArtists);
    } catch (error) {
      console.error('Error loading artists for hero:', error);
    }
  }

  const duplicatedArtists = artists.length > 0 ? [...artists, ...artists, ...artists] : [];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black z-10" />

      <div className="relative w-full h-full opacity-30 blur-[2px]">
        <div className="hidden md:block">
          <div className="absolute top-8 left-0 w-full overflow-hidden">
            <div className="flex gap-4 animate-scroll-right">
              {duplicatedArtists.map((artist, index) => (
                <DecorativeArtistCard key={`row1-${index}`} artist={artist} />
              ))}
            </div>
          </div>

          <div className="absolute top-40 left-0 w-full overflow-hidden">
            <div className="flex gap-4 animate-scroll-left">
              {duplicatedArtists.map((artist, index) => (
                <DecorativeArtistCard key={`row2-${index}`} artist={artist} />
              ))}
            </div>
          </div>
        </div>

        <div className="md:hidden">
          <div className="absolute top-8 left-0 w-full overflow-hidden">
            <div className="flex gap-4 animate-scroll-right-slow">
              {duplicatedArtists.map((artist, index) => (
                <DecorativeArtistCard key={`mobile-${index}`} artist={artist} compact />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-right {
          0% {
            transform: translateX(-33.33%);
          }
          100% {
            transform: translateX(0%);
          }
        }

        @keyframes scroll-left {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }

        .animate-scroll-right {
          animation: scroll-right 40s linear infinite;
        }

        .animate-scroll-left {
          animation: scroll-left 50s linear infinite;
        }

        .animate-scroll-right-slow {
          animation: scroll-right 60s linear infinite;
        }
      `}</style>
    </div>
  );
}

interface DecorativeArtistCardProps {
  artist: Artist;
  compact?: boolean;
}

function DecorativeArtistCard({ artist, compact = false }: DecorativeArtistCardProps) {
  const cardWidth = compact ? 'w-40' : 'w-56';
  const imageHeight = compact ? 'h-24' : 'h-32';

  return (
    <div
      className={`${cardWidth} flex-shrink-0 bg-neutral-900/80 rounded-lg overflow-hidden border border-neutral-800/50 shadow-lg`}
    >
      {artist.imageUrl ? (
        <img
          src={artist.imageUrl}
          alt={artist.name}
          className={`w-full ${imageHeight} object-cover`}
        />
      ) : (
        <div className={`w-full ${imageHeight} bg-neutral-800 flex items-center justify-center`}>
          <Music className="w-8 h-8 text-neutral-700" />
        </div>
      )}

      <div className="p-3">
        <h3 className="text-white font-semibold text-sm truncate mb-1">
          {artist.name}
        </h3>
        <p className="text-xs text-gray-400 truncate">
          {artist.role} · {artist.genre}
        </p>
        {!compact && (
          <p className="text-xs text-gray-500 truncate mt-1">
            {artist.state}, {artist.country}
          </p>
        )}
      </div>
    </div>
  );
}
