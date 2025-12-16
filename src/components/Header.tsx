import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import logo from "../assets/logo-beatbookingslive.png";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/planner/artists?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header
      className={`
        sticky top-0 z-30
        transition-all duration-300
        ${scrolled
          ? 'bg-black/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.8)]'
          : 'bg-black'
        }
      `}
    >
      <div className="flex items-center justify-between gap-6 px-6 py-6">
        {/* Logo */}
        <a href="/about" className="flex items-center flex-shrink-0">
          <img
            src={logo}
            alt="BeatBookingsLive"
            className="h-20 md:h-28 object-contain cursor-pointer drop-shadow-[0_0_22px_rgba(57,255,20,0.75)] transition-transform hover:scale-105"
          />
        </a>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green transition"
            />
          </div>
        </form>

        {/* Domain */}
        <div className="text-sm md:text-base text-gray-300 tracking-wide flex-shrink-0">
          BeatBookingsLive.com
        </div>
      </div>

      {/* Red divider */}
      <div
        className={`
          h-px w-full bg-neon-red
          transition-all duration-300
          ${scrolled
            ? 'shadow-[0_0_15px_rgba(255,45,45,0.9)]'
            : 'shadow-[0_0_10px_rgba(255,45,45,0.7)]'
          }
        `}
      />
    </header>
  );
}
