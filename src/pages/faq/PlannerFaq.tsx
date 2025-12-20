import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import FaqAccordion from "../../components/faq/FaqAccordion";

const plannerFaq = [
  {
    question: "Do planners need a subscription?",
    answer:
      "No. Planners can browse artists and request bookings for free. A one-time payment is required only when publishing an event.",
  },
  {
    question: "Can I edit or cancel a booking request?",
    answer:
      "Yes. You can edit or cancel a booking request while it is still pending. Once accepted, it becomes a confirmed booking.",
  },
  {
    question: "Where do my booking requests appear?",
    answer:
      "All sent requests appear in Manage Events/Bookings with real-time status updates.",
  },
  {
    question: "What shows on my calendar?",
    answer:
      "Your calendar shows confirmed bookings, events you created, and events you’ve marked as attending.",
  },
  {
    question: "Can I message artists?",
    answer:
      "Yes. Messaging is available for both pending and accepted booking requests.",
  },
];

export default function PlannerFaq() {
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

          <h1 className="text-4xl md:text-5xl font-bold mb-4">Planner FAQ</h1>
          <p className="text-gray-400 mb-10 max-w-2xl">
            Answers for planners about booking artists, events, and payments.
          </p>
          <FaqAccordion items={plannerFaq} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
