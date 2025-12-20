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
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Artist FAQ</h1>
        <FaqAccordion items={artistFaq} />
      </main>

      <Footer />
    </div>
  );
}
