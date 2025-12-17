import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo-beatbookingslive.png";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="BeatBookingsLive"
            className="h-14 object-contain"
          />
        </Link>

        {/* CTA */}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="bg-neon-red text-white px-5 py-2 rounded-lg font-semibold hover:bg-neon-red/90 transition"
        >
          Check it out now
        </button>
      </div>
    </header>
  );
}
