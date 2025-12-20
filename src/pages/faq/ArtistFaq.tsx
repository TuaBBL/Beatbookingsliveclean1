import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import FaqAccordion from "../../components/faq/FaqAccordion";

const artistFaq = [
  {
    question: "Do artists have to pay to create events?",
    answer:
      "No. Creating and publishing events is included in your subscription. Artists are never charged per event.",
  },
  {
    question: "When does my artist profile become active?",
    answer:
      "Your profile becomes active once it is completed and you have an active subscription. Inactive profiles are hidden from booking requests.",
  },
  {
    question: "Can I accept or decline booking requests?",
    answer:
      "Yes. You can review all incoming booking requests, message planners, accept with set performance times, or decline with one click.",
  },
  {
    question: "Where do confirmed bookings appear?",
    answer:
      "Accepted bookings appear automatically in your Artist Calendar. Pending requests remain in your booking inbox.",
  },
  {
    question: "Can I message planners before accepting a booking?",
    answer:
      "Yes. Messaging is available for both pending and accepted booking requests.",
  },
];

export default function ArtistFaq() {
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

          <h1 className="text-4xl md:text-5xl font-bold mb-4">Artist FAQ</h1>
          <p className="text-gray-400 mb-10 max-w-2xl">
            Everything artists need to know about bookings, subscriptions, and events.
          </p>
          <FaqAccordion items={artistFaq} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
