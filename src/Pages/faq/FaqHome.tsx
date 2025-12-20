import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function FaqHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-16 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Help & FAQs</h1>
        <p className="text-gray-400 mb-12">
          Choose your role to see relevant answers
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate("/faq/artists")}
            className="bg-neutral-900 border border-green-600 hover:border-green-400 rounded-xl p-8 transition"
          >
            <h3 className="text-2xl font-semibold mb-2">Artists</h3>
            <p className="text-gray-400">
              Subscriptions, bookings, calendars, events
            </p>
          </button>

          <button
            onClick={() => navigate("/faq/planners")}
            className="bg-neutral-900 border border-red-600 hover:border-red-400 rounded-xl p-8 transition"
          >
            <h3 className="text-2xl font-semibold mb-2">Planners</h3>
            <p className="text-gray-400">
              Booking requests, payments, calendars
            </p>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
