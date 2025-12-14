import { Artist } from "../data/mockArtists";

interface HeroProps {
  artists?: Artist[];
}

export default function Hero({ artists = [] }: HeroProps) {
  const safeArtists = Array.isArray(artists) ? artists : [];
  const loopArtists = [...safeArtists, ...safeArtists];

  return (
    <section className="relative overflow-hidden bg-black py-40">
      {/* BACKGROUND GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black z-0" />

      {/* SOUND BARS (FORCED VISIBILITY) */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-center gap-2 h-64 pointer-events-none">
        {Array.from({ length: 48 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-neon-green animate-wave shadow-[0_0_12px_rgba(57,255,20,0.9)]"
            style={{
              height: `${30 + (i % 6) * 25}px`,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      {/* FLOATING ARTIST CARDS */}
      <div className="relative z-10 space-y-14 opacity-100">
        {/* Row 1 */}
        <div className="overflow-hidden">
          <div className="flex animate-marquee-left gap-6">
            {loopArtists.map((artist, index) => (
              <div
                key={`hero-1-${artist.id}-${index}`}
                className="
                  w-64 h-40 rounded-xl
                  bg-charcoal/90
                  border border-neon-green/40
                  shadow-[0_0_30px_rgba(57,255,20,0.35)]
                  flex items-center justify-center
                  text-white text-sm
                  backdrop-blur-sm
                "
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
                key={`hero-2-${artist.id}-${index}`}
                className="
                  w-64 h-40 rounded-xl
                  bg-charcoal/90
                  border border-neon-red/40
                  shadow-[0_0_30px_rgba(255,45,45,0.35)]
                  flex items-center justify-center
                  text-white text-sm
                  backdrop-blur-sm
                "
              >
                {artist.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HERO COPY */}
      <div className="relative z-20 mt-32 text-center px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
          <span
            className="
              text-neon-red
              drop-shadow-[0_0_30px_rgba(255,45,45,1)]
              animate-pulse
            "
          >
            Book the Beat
          </span>
          <br />
          <span
            className="
              text-neon-green
              drop-shadow-[0_0_35px_rgba(57,255,20,1)]
            "
          >
            Live the Moment
          </span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-gray-300">
          Discover, book, and manage live music talent across Australia & New Zealand.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <a
            href="/login"
            className="
              px-7 py-3 rounded-lg
              bg-neon-green text-black font-semibold
              shadow-[0_0_20px_rgba(57,255,20,0.9)]
              hover:opacity-90 transition
            "
          >
            Planner
          </a>

          <a
            href="/login"
            className="
              px-7 py-3 rounded-lg
              border border-neon-red text-white
              shadow-[0_0_20px_rgba(255,45,45,0.8)]
              hover:bg-neon-red/10 transition
            "
          >
            Artist
          </a>
        </div>
      </div>
    </section>
  );
}
