export default function Footer() {
  return (
    <footer className="bg-black border-t border-neon-red/30 py-8">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neon-red to-transparent glow-line-red"></div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-neon-green transition-colors">
              Terms & Conditions
            </a>
            <a href="#" className="text-gray-400 hover:text-neon-green transition-colors">
              Privacy Policy
            </a>
          </div>

          <p className="text-gray-500 text-sm">
            © 2025 Beat Bookings Live. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
