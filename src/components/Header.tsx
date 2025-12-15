import { useEffect, useState } from "react";
import logo from "../assets/logo-beatbookingslive.png";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <div className="flex items-center justify-between px-6 py-6">
        {/* Logo (About Button) */}
        <a href="/about" className="flex items-center">
          <img
            src={logo}
            alt="BeatBookingsLive"
            className="h-28 md:h-32 object-contain cursor-pointer drop-shadow-[0_0_22px_rgba(57,255,20,0.75)] transition-transform hover:scale-105"
          />
        </a>

        {/* Domain */}
        <div className="text-sm md:text-base text-gray-300 tracking-wide">
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
