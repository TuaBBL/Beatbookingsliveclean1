import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative bg-black border-t border-neon-red shadow-neon-red py-8">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-red to-transparent shadow-[0_0_20px_rgba(255,43,43,0.6)]"></div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-6 text-sm">
            <Link to="/about" className="text-gray-300 hover:text-neon-green hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.8)] transition-all duration-300">
              About
            </Link>
            <Link to="/terms" className="text-gray-300 hover:text-neon-green hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.8)] transition-all duration-300">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="text-gray-300 hover:text-neon-green hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.8)] transition-all duration-300">
              Privacy Policy
            </Link>
            <Link to="/faq" className="text-gray-300 hover:text-neon-green hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.8)] transition-all duration-300">
              FAQ
            </Link>
          </div>

          <p className="text-gray-400 text-sm">
            © 2025 Beat Bookings Live. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
