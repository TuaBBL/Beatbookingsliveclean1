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
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Planner FAQ</h1>
        <FaqAccordion items={plannerFaq} />
      </main>

      <Footer />
    </div>
  );
}
