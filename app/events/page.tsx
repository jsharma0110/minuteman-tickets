"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import SearchBar from "../../components/SearchBar.jsx";
import EventCard from "../../components/EventCard";
import { getEvents } from "../api/getEvents";
import { useEffect, useState } from "react";

type EventItem = {
  id: string;
  title: string;
  location: string;
  date: string;      // display date string
  imageUrl: string;
};

// helper: earlier dates come first, invalid dates go to the bottom
function dateTimeOrInfinity(dateStr: string): number {
  const t = Date.parse(dateStr);
  return Number.isNaN(t) ? Infinity : t;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const fetched: any[] | null = await getEvents().catch(() => null);

        const mapped: EventItem[] =
          Array.isArray(fetched) && fetched.length
            ? fetched.map((e: any): EventItem => ({
                id: e.id,
                title: e?.title ?? e?.name ?? "Untitled Event",
                location: e?.location ?? "",
                // assume this is a parsable date string like "2026-11-11"
                date: e?.date ?? "",
                imageUrl: e?.imageUrl ?? "/images/Mullins_Center_2014.jpeg",
              }))
            : [
                {
                  id: "1",
                  title: "UMass vs UConn Basketball Game",
                  location: "Mullins Center",
                  date: "Feb 15, 2026",
                  imageUrl: "/images/Mullins_Center_2014.jpeg",
                },
                {
                  id: "2",
                  title: "A Boogie Wit Da Hoodie",
                  location: "Mullins Center",
                  date: "Nov 15, 2025",
                  imageUrl: "/images/aboogie.png",
                },
              ];

        // sort by soonest event date first
        const sorted = [...mapped].sort(
          (a, b) => dateTimeOrInfinity(a.date) - dateTimeOrInfinity(b.date)
        );

        setEvents(sorted);
      } catch (error) {
        console.error("Failed to fetch events:", error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const goToProfile = () => {
    router.push("/users");
  };

  const goToChats = () => {
    router.push("/conversations");
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredEvents =
    normalizedSearch.length === 0
      ? events
      : events.filter((event) => {
          const title = event.title.toLowerCase();
          const location = event.location.toLowerCase();
          const date = event.date.toLowerCase();
          return (
            title.includes(normalizedSearch) ||
            location.includes(normalizedSearch) ||
            date.includes(normalizedSearch)
          );
        });

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-12 pt-6">
        {/* Top nav */}
        <nav className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              Minuteman Tickets
            </span>
            <span className="text-[14px] text-zinc-500">
              UMass Amherst • Student ticket marketplace
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-4 text-sm"
              onClick={goToProfile}
            >
              Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-4 text-sm"
              onClick={goToChats}
            >
              Chats
            </Button>
            <Button
              size="sm"
              className="h-9 px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-[0_28px_80px_rgba(0,0,0,0.7)]">
          <div className="pointer-events-none absolute -inset-32 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
          <div className="relative h-64 w-full">
            <Image
              src="/images/umass-campus.jpg"
              alt="UMass Amherst Campus"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent" />
          </div>

          <div className="absolute inset-0 flex flex-col justify-center px-8 py-6 sm:px-10">
            <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
              Minuteman Tickets
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-300">
              Buy and sell tickets for UMass games, concerts, and campus
              events, directly with other students.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[14px] text-zinc-400">
              <span>
                {filteredEvents.length} active event
                {filteredEvents.length === 1 ? "" : "s"}
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span>@umass.edu email required to trade</span>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg">
          <div className="w-full">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by event, location, or date..."
            />
          </div>

          <div className="mt-2 text-[14px] text-zinc-500">
            Showing{" "}
            <span className="font-medium text-zinc-300">
              {filteredEvents.length}
            </span>{" "}
            result{filteredEvents.length === 1 ? "" : "s"}
          </div>
        </section>

        {/* Events */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-[12px] uppercase tracking-[0.18em] text-zinc-500">
                Upcoming events
              </span>
              <div className="h-px w-12 bg-zinc-700" />
            </div>
            <span className="hidden text-[12px] sm:inline">
              All times in Eastern (ET)
            </span>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-foreground shadow-md transition duration-200 hover:-translate-y-1.5 hover:border-zinc-500 hover:shadow-xl"
                >
                  <EventCard {...event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/60 text-sm text-muted-foreground">
              <span>No events found for that search.</span>
              <span className="text-[11px] text-zinc-500">
                Try a different keyword or clear your search.
              </span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
