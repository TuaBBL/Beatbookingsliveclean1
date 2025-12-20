import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function FaqHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 bg-black">
        <section className="max-w-6xl mx-auto px-6 py-16">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-neon-green transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Help & FAQs</h1>
            <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
              Choose your role to see relevant answers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <button
              onClick={() => navigate("/faq/artists")}
              className="bg-neutral-900 border border-neutral-700 hover:border-neon-green rounded-xl p-8 transition"
            >
              <h3 className="text-2xl font-semibold mb-2 text-white">Artists</h3>
              <p className="text-gray-400">
                Subscriptions, bookings, calendars, events
              </p>
            </button>

            <button
              onClick={() => navigate("/faq/planners")}
              className="bg-neutral-900 border border-neutral-700 hover:border-neon-green rounded-xl p-8 transition"
            >
              <h3 className="text-2xl font-semibold mb-2 text-white">Planners</h3>
              <p className="text-gray-400">
                Booking requests, payments, calendars
              </p>
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
