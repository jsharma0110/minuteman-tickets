import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

type Ticket = {
  id: string;
  price: number;
  section: string | null;
  row: string | null;
  seat: string | null;
  status: string;
};

export default async function BuyTicketsPage({ params }: PageProps) {
  // ✅ params is a Promise now
  const { eventId } = await params;

  const supabase = await createClient();

  // 1) Load event
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  // 2) Load tickets for this event
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, price, section, row, seat, status")
    .eq("event_id", eventId)
    .eq("status", "available")
    .order("price", { ascending: true });

  const eventTitle =
    (event as any)?.title || (event as any)?.name || "Event";

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          Buy tickets – {eventTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          All tickets currently listed for this event.
        </p>
      </header>

      {!tickets || tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tickets are currently listed for this event.
        </p>
      ) : (
        <div className="space-y-4">
          {(tickets as Ticket[]).map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between rounded-xl border bg-secondary/30 p-4"
            >
              <div>
                <p className="font-medium">${ticket.price}</p>
                <p className="text-xs text-muted-foreground">
                  {ticket.section && `Section ${ticket.section} `}
                  {ticket.row && `Row ${ticket.row} `}
                  {ticket.seat && `Seat ${ticket.seat}`}
                </p>
              </div>

              {/* Buy action will be wired later */}
              <button
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
                disabled
              >
                Buy (coming soon)
              </button>
            </div>
          ))}
        </div>
      )}

      <Link href="/events" className="text-sm underline">
        ← Back to events
      </Link>
    </div>
  );
}
