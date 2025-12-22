"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/browser";

type EventRow = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string; // ISO string
};

function EventCard({ event }: { event: EventRow }) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const eventDate = new Date(event.event_date);
    const now = new Date();

    const updateCountdown = () => {
      const now = new Date();
      const diff = eventDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("Event has passed");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [event.event_date]);

  const formattedDate = new Date(event.event_date).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }
  );

  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg">{event.title}</h3>
          {event.description && (
            <p className="text-sm opacity-80 mt-1">{event.description}</p>
          )}
          {event.location && (
            <p className="text-sm opacity-70 mt-1">📍 {event.location}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-mono font-bold text-red-600">
            {countdown}
          </div>
          <div className="text-xs opacity-70 mt-1">{formattedDate}</div>
        </div>
      </div>
    </div>
  );
}

export default function EventsClient() {
  const supabase = supabaseBrowser();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      setError("");
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("events")
          .select("id,title,description,location,event_date")
          .gt("event_date", new Date().toISOString())
          .order("event_date", { ascending: true });

        if (error) throw new Error(error.message);

        setEvents(data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load events");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [supabase]);

  return (
    <section className="card p-4 space-y-4">
      <div className="font-semibold">Upcoming Events</div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <p className="text-sm opacity-70">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-sm opacity-70">No upcoming events.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
