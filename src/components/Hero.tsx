import { Artist } from "../data/mockArtists";

interface HeroProps {
  artists?: Artist[];
}

export default function Hero({ artists = [] }: HeroProps) {
  const safeArtists = Array.isArray(artists) ? artists : [];
  const loopArtists = [...safeArtists, ...safeArtists];

  return (
    <section className="relative overflow-hidden bg-black py-32">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black z-10" />

      {/* Animated sound bars */}
      <div className="absolute inset-0 z-0 flex items-end justify-center gap-2 opacity-30">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-neon-green animate-wave"
            style={{
              height: `${20 + (i % 5) * 20}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      {/* Floating artist cards */}
      <div className="relative z-0 space-y-10 opacity-40">
        {/* Row 1 */}
        <div className="overflow-hidden">
          <div className="flex animate-marquee-left gap-6">
            {loopArtists.map((artist, index) => (
              <div
                key={`hero-row-1-${artist.id}-${index}`}
                className="w-64 h-40 rounded-xl border border-neon-green/30 bg-charcoal/80 flex items-center justify-center text-sm text-white"
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
                className="w-64 h-40 rounded-xl border border-neon-red/30 bg-charcoal/80 flex items-center justify-center text-sm text-white"
              >
                {artist.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-20 mt-28 text-center px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold">
          <span className="text-neon-red">Book the Beat</span>{" "}
          <span className="text-neon-green glow-text-green">
            Live the Moment
          </span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-gray-300">
          Discover, book, and manage live music talent across Australia & New
          Zealand.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <a
            href="/login"
            className="px-6 py-3 rounded-lg bg-neon-green text-black font-semibold hover:opacity-90 transition"
          >
            Planner
          </a>
          <a
            href="/login"
            className="px-6 py-3 rounded-lg border border-neon-red text-white hover:bg-neon-red/10 transition"
          >
            Artist
          </a>
        </div>
      </div>
    </section>
  );
}
