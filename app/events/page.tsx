"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import SearchBar from "../../components/SearchBar.jsx";
import ToggleButtons from "../../components/ToggleButtons.jsx";
import EventCard from "../../components/EventCard";
import { getEvents } from "../api/getEvents";
import { useEffect, useState } from "react";

// Strong type for your page data
type EventItem = {
  id: string;
  title: string;
  location: string;
  date: string;
  imageUrl: string;
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 search state
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

        setEvents(mapped);
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

  // 🔍 Filter events based on search term (title, location, or date)
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
    <div className="flex min-h-screen w-full items-start justify-center bg-background py-10 px-4">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Banner */}
        <Image
          src="/images/umass-campus.jpg"
          alt="UMass Amherst Campus"
          width={1600}
          height={500}
          priority
          className="h-60 w-full object-cover"
        />

        {/* Header + Actions */}
        <header className="flex items-center justify-between px-6 pt-4">
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Minuteman Events
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Find games, concerts, and campus happenings
            </p>
          </div>

          <div className="absolute right-6 top-6 flex gap-2">
            <Button
              variant="outline"
              className="border-none bg-secondary text-xs text-foreground shadow-md hover:bg-secondary/80"
              onClick={goToProfile}
            >
              Profile
            </Button>

            <Button
              variant="outline"
              className="border-none bg-secondary text-xs text-foreground shadow-md hover:bg-secondary/80"
              onClick={goToChats}
            >
              Chats
            </Button>

            <Button
              variant="outline"
              className="border-none bg-primary text-xs text-primary-foreground shadow-md hover:bg-primary/90"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </header>

        {/* Search */}
        <div className="mx-auto mt-6 w-full max-w-md px-6">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by event, location, or date..."
          />
        </div>

        {/* Optional toggles */}
        {/* <div className="mt-4 px-6">
          <ToggleButtons />
        </div> */}

        {/* Events */}
        <section className="px-6 pb-10 pt-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border border-border bg-secondary/30 p-3 text-foreground"
              >
                <EventCard {...event} />
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredEvents.length === 0 && (
            <div className="mt-16 text-center text-muted-foreground">
              No events found. Try a different search.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
