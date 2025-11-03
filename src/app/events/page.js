import SearchBar from "../../components/SearchBar.jsx";
import ToggleButtons from "../../components/ToggleButtons.jsx";
import EventCard from "../../components/EventCard.jsx";
import { getEvents } from "../../api/getEvents";

export default async function EventsPage() {
  const fetched = await getEvents();
  console.log(fetched);
  // Map fetched data to EventCard props with safe fallbacks
  const events = (fetched && Array.isArray(fetched) ? fetched : []).map((e) => ({
    title: e?.title ?? e?.name ?? "Untitled Event",
    location: e?.location ?? "",
    date: e?.date ?? "",
    imageUrl: e?.imageUrl ?? "/images/Mullins_Center_2014.JPG",
  }));
  // If no data returned, show sample items
  const items = events.length
    ? events
    : [
        {
          title: "UMass vs UConn Basketball Game",
          location: "Mullins Center",
          date: "Feb 15, 2026",
          imageUrl: "/images/Mullins_Center_2014.JPG",
        },
        {
          title: "A Boogie Wit Da Hoodie",
          location: "Mullins Center",
          date: "Nov 15, 2025",
          imageUrl: "/images/aboogie.png",
        },
      ];

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-10 px-4">
      
      {/* Header */}
      <header className="flex flex-col items-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight">MinuteMan Events</h1>
        <div className="text-3xl mt-1">💬</div>
      </header>

      {/* Search */}
      <div className="w-full max-w-md mb-6">
        <SearchBar />
      </div>

      {/* Toggle Buttons (optional) */}
      {/* <div className="mb-6">
        <ToggleButtons />
      </div> */}

      {/* Events List */}
      <section className="w-full flex flex-col items-center gap-10">
        {items.map((event) => (
          <EventCard key={event.title} {...event} />
        ))}
      </section>
    </div>
  );
}
