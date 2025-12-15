import Header from './Header';
import Footer from './Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-neon-red mb-8 glow-text-red">
          Privacy Policy
        </h1>

        <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
          <p className="text-xl text-white font-semibold">
            This privacy policy is a placeholder and will be updated prior to launch.
          </p>

          <div className="mt-8 p-6 bg-charcoal rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Our Commitment</h2>
            <p className="text-gray-400">
              At BeatBookingsLive, we take your privacy seriously. Our full privacy policy will detail:
            </p>
            <ul className="mt-4 space-y-2 text-gray-400 list-disc list-inside">
              <li>What information we collect and why</li>
              <li>How we use and protect your data</li>
              <li>Your rights regarding your personal information</li>
              <li>Cookie usage and tracking technologies</li>
              <li>Third-party data sharing policies</li>
              <li>Data retention and deletion procedures</li>
            </ul>
          </div>

          <p className="text-gray-400 text-base mt-8">
            We are committed to transparency and protecting your privacy. Full details will be available soon.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
