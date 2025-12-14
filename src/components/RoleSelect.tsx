import { Calendar, Mic2 } from 'lucide-react';

export default function RoleSelect() {
  return (
    <section className="py-16 bg-charcoal">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center max-w-4xl mx-auto">
          <button className="group w-full md:w-80 px-8 py-6 rounded-xl bg-black border-2 border-neon-green hover:bg-neon-green/10 transition-all duration-300 glow-border-green">
            <div className="flex flex-col items-center gap-3">
              <Calendar className="w-12 h-12 text-neon-green group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-neon-green glow-text-green">Planner</span>
              <span className="text-gray-400 text-sm">Book artists for your event</span>
            </div>
          </button>

          <button className="group w-full md:w-80 px-8 py-6 rounded-xl bg-black border-2 border-neon-red hover:bg-neon-red/10 transition-all duration-300 glow-border-red">
            <div className="flex flex-col items-center gap-3">
              <Mic2 className="w-12 h-12 text-neon-red group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-neon-red glow-text-red">Artist</span>
              <span className="text-gray-400 text-sm">Get booked for live shows</span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
