import Header from './Header';
import Footer from './Footer';

export default function About() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-neon-green mb-8 glow-text-green">
          About BeatBookingsLive
        </h1>

        <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
          <p>
            BeatBookingsLive is a revolutionary platform designed to connect talented artists
            with event planners across Australia and New Zealand.
          </p>

          <p>
            Our mission is to simplify the booking process, making it easier for venues and
            event organizers to discover and book live music talent, while providing artists
            with more opportunities to showcase their skills and grow their careers.
          </p>

          <p>
            Whether you're an artist looking for your next gig or an event planner searching
            for the perfect act, BeatBookingsLive brings the music industry together in one
            seamless platform.
          </p>

          <div className="mt-12 p-6 bg-charcoal rounded-lg border border-neon-red/30">
            <p className="text-neon-red font-semibold mb-2">Coming Soon</p>
            <p className="text-gray-400">
              More details about our platform, team, and vision will be available here soon.
            </p>
          </div>

          <div className="mt-12 flex justify-center">
            <a
              href="/"
              className="px-10 py-4 rounded-lg bg-neon-green text-black font-bold text-lg hover:bg-neon-green/90 transition shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:shadow-[0_0_35px_rgba(57,255,20,0.7)]"
            >
              Explore Artists
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
