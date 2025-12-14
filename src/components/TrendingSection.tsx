import { Artist } from '../data/mockArtists';
import { ArtistCard } from './ArtistCard';

interface TrendingSectionProps {
  title: string;
  artists: Artist[];
  emptyMessage?: string;
  variant?: 'featured' | 'scroll';
  subtitle?: string;
}

export default function TrendingSection({
  title,
  artists,
  emptyMessage,
  variant = 'scroll',
  subtitle
}: TrendingSectionProps) {
  const hasArtists = artists.length > 0;

  return (
    <section className="relative bg-black py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6 h-px w-full bg-[#ff2d2d]/30 shadow-[0_0_10px_rgba(255,45,45,0.35)]" />

        <h2 className="mb-6 text-2xl md:text-3xl font-bold text-white tracking-tight">
          {title}
        </h2>

        {subtitle && (
          <p className="mb-6 text-sm text-gray-400">
            {subtitle}
          </p>
        )}

        {hasArtists ? (
          variant === 'featured' ? (
            <div className="grid gap-6 md:grid-cols-3">
              {artists.map((artist, index) => (
                <div key={artist.id} className="relative">
                  <div className="absolute top-3 left-3 z-10 rounded-full bg-[#ff2d2d] px-3 py-1 text-xs font-bold text-black shadow-[0_0_10px_rgba(255,45,45,0.6)]">
                    #{index + 1}
                  </div>
                  <div className="hover:shadow-[0_0_24px_rgba(255,45,45,0.25)] hover:-translate-y-1 transition">
                    <ArtistCard artist={artist} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-2">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  className="flex-shrink-0 w-[280px] hover:shadow-[0_0_24px_rgba(255,45,45,0.25)] hover:-translate-y-1 transition"
                >
                  <ArtistCard artist={artist} />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 text-4xl text-gray-600">🎧</div>
            <p className="text-gray-400 text-sm">
              {emptyMessage || 'No trending artists yet in New Zealand'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
