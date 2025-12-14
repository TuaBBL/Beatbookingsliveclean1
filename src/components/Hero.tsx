import { Artist } from "../data/mockArtists";

interface HeroProps {
  artists?: Artist[];
}

export default function Hero({ artists = [] }: HeroProps) {
  const safeArtists = Array.isArray(artists) ? artists : [];
  const loopArtists = safeArtists.length > 0 ? [...safeArtists, ...safeArtists] : [];

  return (
    <section className="relative overflow-hidden bg-black py-28">
      {/* Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-black/40 to-black/90" />

      {/* Soundwave */}
      <div className="absolute inset-0 z-0 flex items-end justify-center gap-1 pb-20 opacity-100">
        {Array.from({ length: 50 }).map((_, i) => {
          const heights = ["h-12", "h-20", "h-32", "h-24", "h-40", "h-16", "h-28", "h-36", "h-14", "h-44"];
          const heightClass = heights[i % heights.length];

          return (
            <div
              key={i}
              className={`w-2 ${heightClass} bg-gradient-to-t from-neon-green via-yellow-400 to-neon-red animate-wave rounded-sm shadow-[0_0_20px_rgba(57,255,20,0.6)]`}
              style={{
                animationDelay: `${i * 0.08}s`,
                animationDuration: `${0.6 + (i % 5) * 0.15}s`
              }}
            />
          );
        })}
      </div>

      {/* Floating artist rows */}
      {Array.isArray(loopArtists) && loopArtists.length > 0 && (
        <div className="relative z-0 space-y-10 opacity-90">
          <div className="overflow-hidden">
            <div className="flex animate-marquee-left gap-6">
              {loopArtists.map((artist, index) => (
                <div
                  key={`hero-row-1-${artist.id}-${index}`}
                  className="flex-shrink-0 w-64 h-40 rounded-xl border-2 border-neon-green/70 bg-charcoal/80 overflow-hidden relative shadow-xl shadow-neon-green/50"
                >
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-white font-semibold text-sm">{artist.name}</div>
                    <div className="mt-1 inline-block px-2 py-0.5 bg-neon-green/20 border border-neon-green/40 rounded text-neon-green text-xs font-bold">
                      DEMO
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden">
            <div className="flex animate-marquee-right gap-6">
              {loopArtists.map((artist, index) => (
                <div
                  key={`hero-row-2-${artist.id}-${index}`}
                  className="flex-shrink-0 w-64 h-40 rounded-xl border-2 border-neon-red/70 bg-charcoal/80 overflow-hidden relative shadow-xl shadow-neon-red/50"
                >
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-white font-semibold text-sm">{artist.name}</div>
                    <div className="mt-1 inline-block px-2 py-0.5 bg-neon-red/20 border border-neon-red/40 rounded text-neon-red text-xs font-bold">
                      DEMO
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Center content */}
      <div className="relative z-20 mt-24 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
          <span className="text-neon-red glow-text-red">Book the Beat</span>
          <span className="text-gray-500"> — </span>
          <span className="text-neon-green glow-text-green">Live the Moment</span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-gray-300 text-lg">
          Discover, book, and manage live music talent across Australia & New Zealand.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <a
            href="/login"
            className="px-8 py-4 rounded-lg bg-neon-green text-black font-semibold hover:opacity-90 transition shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)]"
          >
            Planner
          </a>

          <a
            href="/login"
            className="px-8 py-4 rounded-lg border-2 border-neon-red text-neon-red font-semibold hover:bg-neon-red/10 transition shadow-[0_0_20px_rgba(255,45,45,0.3)] hover:shadow-[0_0_30px_rgba(255,45,45,0.5)]"
          >
            Artist
          </a>
        </div>
      </div>
    </section>
  );
}
