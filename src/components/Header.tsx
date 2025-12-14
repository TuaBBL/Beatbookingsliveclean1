import logo from "../assets/logo-beatbookingslive.png";

export default function Header() {
  return (
    <header className="relative z-50 bg-black">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="/" className="flex items-center">
  <img
  src={logo}
  alt="BeatBookingsLive"
  className="h-20 md:h-24 object-contain drop-shadow-[0_0_16px_rgba(57,255,20,0.65)]"
/>
</a>

        {/* Domain */}
        <div className="text-sm md:text-base text-gray-300 tracking-wide">
          BeatBookingsLive.com
        </div>
      </div>

      {/* Red divider */}
      <div className="h-px w-full bg-[#ff2d2d] shadow-[0_0_8px_rgba(255,45,45,0.7)]" />
    </header>
  );
}
