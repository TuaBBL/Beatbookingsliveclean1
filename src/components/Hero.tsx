import { Artist } from '../data/mockArtists';

interface HeroProps {
  artists?: Artist[];
}

export default function Hero({ artists = [] }: HeroProps) {
  const safeArtists = Array.isArray(artists) ? artists : [];

  return (
    <section className="relative overflow-hidden bg-black pt-32 pb-40">
      
      {/* ===== BACKGROUND SOUND BARS ===== */}
      <div className="absolute inset-0 flex items-end justify-center gap-2 opacity-30 z-0">
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-neon-green animate-wave"
            style={{
              height: `${20 + Math.random() * 80}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* ===== FLOATING ARTIST ROWS ===== */}
      {safeArtists.length > 0 && (
        <div className="absolute inset-0 z-0 space-y-10 opacity-40">
          
          {/* Row 1 — Left → Right */}
          <div className="flex overflow-hidden">
            <div className="flex animate-marquee-left gap-6">
              {[...safeArtists, ...safeArtists].map((artist, i) => (
                <div
                  key={`hero-row-1-${artist.id}-${i}`}
                  className="w-64 h-40 rounded-xl bg-charcoal/80 border border-neon-green/30 flex items-center justify-center text-sm text-white"
                >
                  {artist.name}
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 — Right → Left */}
          <div className="flex overflow-hidden">
            <div className="flex animate-marquee-right gap-6">
              {[...safeArtists, ...safeArtis]()
