import { Artist } from '../data/mockArtists';
import { ArtistCard } from './ArtistCard';

interface HeroProps {
  artists?: Artist[];
}

export default function Hero({ artists = [] }: HeroProps) {
  if (!Array.isArray(artists) || artists.length === 0) {
    return (
      <section className="bg-black py-32 text-center">
        <h1 className="text-4xl font-bold text-white">
          BeatBookingsLive
        </h1>
      </section>
    );
  }

  const loopArtists = [...artists, ...artists];

  return (
    <section className="relative overflow-hidden bg-black pt-28 pb-40">
      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black z-10" />

      {/* SOUND WAVE BARS */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30">
        <div className="flex gap-2">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="w-2 rounded bg-neon-green animate-wave"
              style={{
                height: `${20 + (i % 5) * 14}px`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ANIMATED ARTIST ROWS */}
      <div className="relative z-0 space-y-10 opacity-35">
        {/* Row 1 */}
        <div className="overflow-hidden whitespace-nowrap">
          <div className="flex gap-6 animate-marquee-left">
            {loopArtists.map((artist, i) => (
              <div key={`hero-row1-${artist.id}-${i}`} className="w-64">
                <ArtistCard artist={artist} />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 */}
        <div className="overflow-hidden whitespace-nowrap">
          <div className="flex gap-6 animate-marquee-right">
            {loopArtists.map((artist, i) => (
              <div key={`hero-row2-${artist.id}-${i}`} className="w-64">
                <ArtistCard artist={artist} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HERO CONTENT */}
      <div className="relative z-20 mt-28 text-center px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold">
          <span className="text-neon-red block">
            Book the Beat
          </span>
          <span className="text-neon-green glow-text-green block mt-2">
            Live the Moment
          </span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-gray-300">
          Discover, book, and manage DJs & live artists across Australia & New Zealand.
        </p>

        <div className="mt-10 flex justify-center gap-4 flex-wrap">
          {/* Planner dropdown placeholder */}
          <div className="relative group">
            <button className="px-6 py-3 rounded-lg bg-neon-green text-black font-semibold">
              Planner
            </button>

            <div className="absolute left-0 mt-2 hidden group-hover:block bg-charcoal border border-white/10 rounded-lg overflow-hidden">
              <button className="block px-6 py-3 text-white hover:bg-white/5 w-full text-left">
                Planner
              </button>
              <button className="block px-6 py-3 text-white hover:bg-white/5 w-full text-left">
                Admin
              </button>
            </div>
          </div>

          <a
            href="/login"
            className="px-6 py-3 rounded-lg border border-neon-red text-white hover:bg-neon-red/10 transition"
          >
            I’m an Artist
          </a>
        </div>
      </div>
    </section>
  );
}
