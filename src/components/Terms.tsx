import Header from './Header';
import Footer from './Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-neon-red mb-8 glow-text-red">
          Terms & Conditions
        </h1>

        <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
          <p className="text-xl text-white font-semibold">
            These terms and conditions are a placeholder and will be updated prior to launch.
          </p>

          <div className="mt-8 p-6 bg-charcoal rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">What to Expect</h2>
            <p className="text-gray-400">
              Our comprehensive terms and conditions will cover:
            </p>
            <ul className="mt-4 space-y-2 text-gray-400 list-disc list-inside">
              <li>User rights and responsibilities</li>
              <li>Platform usage guidelines</li>
              <li>Booking and payment terms</li>
              <li>Content ownership and licensing</li>
              <li>Privacy and data protection</li>
              <li>Dispute resolution procedures</li>
            </ul>
          </div>

          <p className="text-gray-400 text-base mt-8">
            For questions or concerns, please contact our support team.
          </p>

          <div className="mt-12 flex justify-center">
            <a
              href="/"
              className="px-10 py-4 rounded-lg bg-neon-green text-black font-bold text-lg hover:bg-neon-green/90 transition shadow-[0_0_25px_rgba(57,255,20,0.5)] hover:shadow-[0_0_35px_rgba(57,255,20,0.7)]"
            >
              Explore Artists
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
