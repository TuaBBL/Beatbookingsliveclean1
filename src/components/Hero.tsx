import { Artist } from '../data/mockArtists';

interface HeroProps {
  artists?: Artist[];
}

export default function Hero({ artists = [] }: HeroProps) {
  const safeArtists = Array.isArray(artists) ? artists : [];

  return (
    <section className="relative overflow-hidden bg-black py-32">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-black z-10" />

      {/* Floating artist cards (background) */}
      <div className="absolute inset-0 z-0 space-y-10 opacity-40">
        {/* Row 1 */}
        <div className="flex overflow-hidden whitespace-nowrap">
          <div className="flex animate-marquee-left gap-6">
            {[...safeArtists, ...safeArtists].map((artist, index) => (
              <div
                key={`hero-card-1-${artist.id}-${index}`}
                className="w-[calc(16rem+50px)] h-40 rounded-xl
                           border border-neon-green/30 bg-charcoal/80
                           flex items-center justify-center
                           text-sm text-white"
              >
                {artist.name}
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex overflow-hidden whitespace-nowrap">
          <div className="flex animate-marquee-right gap-6">
            {[...safeArtists, ...safeArtists].map((artist, index) => (
              <div
                key={`hero-card-2-${artist.id}-${index}`}
                className="w-[calc(16rem+50px)] h-40 rounded-xl
                           border border-neon-red/30 bg-charcoal/80
                           flex items-center justify-center
                           text-sm text-white"
              >
                {artist.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Foreground content */}
      <div className="relative z-20 flex flex-col items-center text-center">
        {/* Sound bars */}
        <div className="mb-10 flex items-end gap-2 opacity-80">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="w-[10px] h-[50px] origin-bottom animate-wave"
              style={{
                animationDelay: `${i * 0.08}s`,
                backgr
