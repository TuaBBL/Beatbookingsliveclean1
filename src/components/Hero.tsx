import { Artist } from "../data/mockArtists";

interface HeroProps {
  artists?: Artist[];
}

export default function Hero({ artists = [] }: HeroProps) {
  const safeArtists = Array.isArray(artists) ? artists : [];
  const loopArtists = [...safeArtists, ...safeArtists];

  return (
    <section className="relative overflow-hidden bg-black py-32">

      {/* SOUND BARS — BACKGROUND */}
      <div className="absolute inset-0 z-0 flex items-end justify-center gap-2 opacity-40">
        {Array.from({ length: 36 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-neon-green animate-wave"
            style={{
              height: `${20 + (i % 6) * 18}px`,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      {/* FLOATING ARTIST CARDS */}
      <div className="relative z-10 space-y-10 opacity-50">
        {/* Row 1 */}
        <div className="overflow-hidden">
          <div className="flex animate-marquee-left gap-6">
            {loopArtists.map((artist, index) => (
              <div
                key={`hero-row-1-${artist.id}-${index}`}
                className="w-64 h-40 rounded-xl border border-neon-green/30 bg-charcoal/90 flex items-center justify-center text-sm text-white"
              >
                {artist.name}
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 */}
        <div className="overflow-hidden">
          <div className="flex animate-marquee-right gap-6">
            {loopArtists.map((artist, index) => (
              <div
                key={`hero-row-2-${artist.id}-${index}`}
                className="w-64 h-40 rounded-xl border border-neon-red/30 bg-charcoal/90 flex items-center justify-center text-sm text-white"
              >
                {artist.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/70 z-20" />

      {/* HERO CONTENT */}
      <div className="relative z-30 mt-28 text-center px-6">
        <h1 clas
