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

export default function EventsClient({ userId }: { userId: string }) {
  const supabase = supabaseBrowser();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
  });

  async function loadEvents() {
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("events")
        .select("id,title,description,location,event_date")
        .eq("user_id", userId)
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

  async function handleCreateEvent() {
    setError("");
    setSubmitting(true);

    try {
      if (!newEvent.title.trim() || !newEvent.event_date) {
        throw new Error("Title and date are required");
      }

      const { error } = await supabase.from("events").insert({
        user_id: userId,
        title: newEvent.title.trim(),
        description: newEvent.description.trim() || null,
        location: newEvent.location.trim() || null,
        event_date: new Date(newEvent.event_date).toISOString(),
      });

      if (error) throw new Error(error.message);

      setNewEvent({ title: "", description: "", location: "", event_date: "" });
      setShowForm(false);
      await loadEvents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <section className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">My Upcoming Events</div>
        <button
          className="btn-primary px-3 py-1 text-sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add Event"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Create Event Form */}
      {showForm && userId && (
        <div className="border border-[var(--border)] rounded-lg p-4 space-y-3">
          <div className="space-y-2">
            <input
              type="text"
              className="border p-2 w-full"
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
            />

            <textarea
              className="border p-2 w-full min-h-[60px]"
              placeholder="Description (optional)"
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
            />

            <input
              type="text"
              className="border p-2 w-full"
              placeholder="Location (optional)"
              value={newEvent.location}
              onChange={(e) =>
                setNewEvent({ ...newEvent, location: e.target.value })
              }
            />

            <input
              type="datetime-local"
              className="border p-2 w-full"
              value={newEvent.event_date}
              onChange={(e) =>
                setNewEvent({ ...newEvent, event_date: e.target.value })
              }
            />
          </div>

          <div className="flex gap-2">
            <button
              className="btn-primary px-3 py-1 text-sm"
              onClick={handleCreateEvent}
              disabled={
                submitting || !newEvent.title.trim() || !newEvent.event_date
              }
            >
              {submitting ? "Creating..." : "Create Event"}
            </button>
            <button
              className="btn-text text-sm"
              onClick={() => {
                setShowForm(false);
                setNewEvent({
                  title: "",
                  description: "",
                  location: "",
                  event_date: "",
                });
              }}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <p className="text-sm opacity-70">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-sm opacity-70">
          {userId
            ? "No upcoming events. Add your first event!"
            : "Log in to see your events."}
        </p>
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
