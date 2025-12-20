import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Header from "../Header";
import Footer from "../Footer";
import PlannerProfileMenu from "./PlannerProfileMenu";
import BookingDetailModal from "../BookingDetailModal";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface Booking {
  id: string;
  planner_id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  artist_profiles: {
    stage_name: string;
    user_id: string;
  };
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
}

export default function PlannerCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const [bookingsRes, eventsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*, artist_profiles(stage_name, user_id)")
          .eq("planner_id", user.id)
          .eq("status", "accepted")
          .gte("event_date", startOfMonth.toISOString().split("T")[0])
          .lte("event_date", endOfMonth.toISOString().split("T")[0]),
        supabase
          .from("events")
          .select("id, title, event_date, start_time")
          .eq("creator_id", user.id)
          .eq("status", "published")
          .gte("event_date", startOfMonth.toISOString().split("T")[0])
          .lte("event_date", endOfMonth.toISOString().split("T")[0]),
      ]);

      setBookings(bookingsRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getDaysInMonth() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }

  function getItemsForDate(date: Date) {
    const dateStr = date.toISOString().split("T")[0];
    const dayBookings = bookings.filter((b) => b.event_date === dateStr);
    const dayEvents = events.filter((e) => e.event_date === dateStr);
    return { bookings: dayBookings, events: dayEvents };
  }

  function previousMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  }

  function nextMonth() {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  }

  const days = getDaysInMonth();
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long" });
  const year = currentDate.getFullYear();

  const selectedDateItems = selectedDate ? getItemsForDate(selectedDate) : null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <CalendarIcon className="w-10 h-10 text-orange-500" />
              Calendar
            </h1>
            <div className="flex items-center gap-4">
              <Link
                to="/planner/dashboard"
                className="text-gray-400 hover:text-white transition"
              >
                Back to Dashboard
              </Link>
              <PlannerProfileMenu />
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-neutral-800 rounded-lg transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold">
                {monthName} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-neutral-800 rounded-lg transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {loading ? (
              <p className="text-gray-400 text-center">Loading...</p>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-gray-400 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const { bookings: dayBookings, events: dayEvents } =
                      getItemsForDate(day);
                    const hasItems = dayBookings.length > 0 || dayEvents.length > 0;
                    const isToday =
                      day.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={day.toISOString()}
                        className={`aspect-square p-2 rounded-lg transition flex flex-col ${
                          isToday
                            ? "bg-orange-900/30 border border-orange-500"
                            : "bg-neutral-800 border border-neutral-700"
                        }`}
                      >
                        <span className="text-sm font-semibold mb-1">
                          {day.getDate()}
                        </span>
                        {hasItems && (
                          <div className="flex-1 flex flex-col gap-1">
                            {dayBookings.slice(0, 2).map((booking) => (
                              <button
                                key={booking.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBooking(booking);
                                }}
                                className="text-xs bg-green-900/40 hover:bg-green-700 px-1 py-0.5 rounded truncate transition text-left"
                              >
                                {booking.artist_profiles.stage_name}
                              </button>
                            ))}
                            {dayEvents.slice(0, 2).map((event) => (
                              <button
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/events/${event.id}`);
                                }}
                                className="text-xs bg-blue-900/40 hover:bg-blue-700 px-1 py-0.5 rounded truncate transition text-left"
                              >
                                {event.title}
                              </button>
                            ))}
                            {dayBookings.length + dayEvents.length > 2 && (
                              <button
                                onClick={() => setSelectedDate(day)}
                                className="text-xs text-gray-400 hover:text-white text-left"
                              >
                                +{dayBookings.length + dayEvents.length - 2} more
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">
              {monthName} {year} Schedule
            </h2>

            {bookings.length === 0 && events.length === 0 ? (
              <div className="bg-neutral-900 border-2 border-neutral-700 rounded-lg p-8 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">
                  No bookings or events for this month.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-500 mb-3">
                      Confirmed Bookings ({bookings.length})
                    </h3>
                    <div className="space-y-3">
                      {bookings.map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className="w-full bg-neutral-900 border-2 border-green-700 rounded-lg p-4 hover:border-green-500 hover:bg-neutral-800 transition cursor-pointer text-left"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-semibold text-white mb-1">
                                {booking.artist_profiles.stage_name}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="w-3.5 h-3.5" />
                                  {new Date(booking.event_date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                                </div>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 bg-green-500/10 text-green-500 border border-green-500 rounded-full text-xs font-medium flex-shrink-0">
                              Confirmed
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {events.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-500 mb-3">
                      My Events ({events.length})
                    </h3>
                    <div className="space-y-3">
                      {events.map((event) => (
                        <Link
                          key={event.id}
                          to={`/events/${event.id}`}
                          className="block w-full bg-neutral-900 border-2 border-blue-700 rounded-lg p-4 hover:border-blue-500 hover:bg-neutral-800 transition text-left"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-semibold text-white mb-1">{event.title}</p>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="w-3.5 h-3.5" />
                                  {new Date(event.event_date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {event.start_time.slice(0, 5)}
                                </div>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 border border-blue-500 rounded-full text-xs font-medium flex-shrink-0">
                              Event
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedDate && selectedDateItems && (
            <div className="mt-6 bg-neutral-900 rounded-lg border border-orange-500 p-6">
              <h3 className="text-xl font-bold mb-4">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>

              {selectedDateItems.bookings.length === 0 &&
              selectedDateItems.events.length === 0 ? (
                <p className="text-gray-400">No bookings or events on this date</p>
              ) : (
                <div className="space-y-4">
                  {selectedDateItems.bookings.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-green-500 mb-2">
                        Confirmed Bookings
                      </h4>
                      {selectedDateItems.bookings.map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className="w-full bg-neutral-800 hover:bg-neutral-700 rounded-lg p-4 mb-2 transition cursor-pointer text-left"
                        >
                          <p className="font-semibold">
                            {booking.artist_profiles.stage_name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <Clock className="w-4 h-4" />
                            {booking.start_time} - {booking.end_time}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedDateItems.events.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-blue-500 mb-2">
                        Your Events
                      </h4>
                      {selectedDateItems.events.map((event) => (
                        <Link
                          key={event.id}
                          to={`/events/${event.id}`}
                          className="block bg-neutral-800 rounded-lg p-4 mb-2 hover:bg-neutral-700 transition"
                        >
                          <p className="font-semibold">{event.title}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <Clock className="w-4 h-4" />
                            {event.start_time}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {selectedBooking && (
        <BookingDetailModal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
          userRole="planner"
        />
      )}

      <Footer />
    </div>
  );
}
