import { Link } from "react-router-dom";
import logo from "../assets/logo-beatbookingslive.png";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Logo (click → About) */}
        <Link to="/about" className="flex items-center">
          <img
            src={logo}
            alt="BeatBookingsLive"
            className="h-28 object-contain cursor-pointer"
          />
        </Link>

        {/* Top-right brand text */}
        <div className="text-white text-lg md:text-xl font-semibold tracking-wide">
          BeatBookingsLive
        </div>

      </div>
    </header>
  );
}
