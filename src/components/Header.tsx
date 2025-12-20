import { Link } from "react-router-dom";
import logo from "../assets/logo-beatbookingslive.png";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-sm border-b border-neon-green shadow-neon-green">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <Link to="/about" className="flex items-center hover:scale-105 transition-transform duration-300">
          <img
            src={logo}
            alt="BeatBookingsLive"
            className="h-28 object-contain cursor-pointer drop-shadow-[0_0_15px_rgba(0,255,136,0.3)]"
          />
        </Link>

        <div className="text-white text-lg md:text-xl font-bold tracking-wider drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]">
          BeatBookingsLive.com
        </div>

      </div>
    </header>
  );
}
