import logo from "../assets/logo-beatbookingslive.png";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-black">
      <div className="flex items-center justify-between px-6 py-6">
        {/* Logo (Home Button) */}
        <a href="/" className="flex items-center">
          <img
            src={logo}
            alt="BeatBookingsLive"
            className="h-56 md:h-64 object-contain cursor-pointer drop-shadow-[0_0_22px_rgba(57,255,20,0.75)]"
          />
        </a>

        {/* Domain */}
        <div className="text-sm md:text-base text-gray-300 tracking-wide">
          BeatBookingsLive.com
        </div>
      </div>

      {/* Red divider */}
      <div className="h-px w-full bg-neon-red shadow-[0_0_10px_rgba(255,45,45,0.7)]" />
    </header>
  );
}
