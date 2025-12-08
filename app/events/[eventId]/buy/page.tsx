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
  status: string | null;
  seller_id: string;
};

export default async function BuyTicketsPage({ params }: PageProps) {
  const { eventId } = await params;

  const supabase = await createClient();

  // Get current user (may be null if somehow not logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  // 1) Load event
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  const eventTitle =
    (event as any)?.title || (event as any)?.name || "Event";

  // 2) Tickets from OTHER users, status = 'available'
  let availableQuery = supabase
    .from("tickets")
    .select("id, price, section, row, seat, status, seller_id")
    .eq("event_id", eventId)
    .eq("status", "available");

  if (currentUserId) {
    availableQuery = availableQuery.neq("seller_id", currentUserId);
  }

  const { data: availableTickets } = await availableQuery.order("price", {
    ascending: true,
  });

  // 3) Tickets listed by the current user for this event (any status)
  let myTickets: Ticket[] = [];
  if (currentUserId) {
    const { data: myTicketsData } = await supabase
      .from("tickets")
      .select("id, price, section, row, seat, status, seller_id")
      .eq("event_id", eventId)
      .eq("seller_id", currentUserId)
      .order("created_at", { ascending: false });

    myTickets = (myTicketsData as Ticket[]) || [];
  }

  const otherTickets = (availableTickets as Ticket[]) || [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          Buy tickets – {eventTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tickets listed by other students are shown below.
        </p>
      </header>

      {/* Tickets from other users */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold"></h2>

        {otherTickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tickets from other students are currently available for
            this event.
          </p>
        ) : (
          <div className="space-y-4">
            {otherTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between rounded-xl border bg-secondary/30 p-4"
              >
                <div>
                  <p className="font-medium">${ticket.price}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.section && `Section ${ticket.section} `}
                    {ticket.row && `· Row ${ticket.row} `}
                    {ticket.seat && `· Seat ${ticket.seat}`}
                  </p>
                </div>

                <Link
                  href={`/conversations/start?ticketId=${ticket.id}&sellerId=${ticket.seller_id}`}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  Chat with seller
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Your own listings for this event */}
      {currentUserId && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            Your listings for this event
          </h2>
          <p className="text-xs text-muted-foreground"></p>

          {myTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t listed any tickets for this event yet.
            </p>
          ) : (
            <div className="space-y-2">
              {myTickets.map((ticket) => {
                const effectiveStatus = ticket.status ?? "available";

                return (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between rounded-xl border bg-muted/30 p-3 text-xs"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        ${ticket.price} ·{" "}
                        <span className="capitalize">
                          {effectiveStatus}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        {ticket.section && `Section ${ticket.section} `}
                        {ticket.row && `· Row ${ticket.row} `}
                        {ticket.seat && `· Seat ${ticket.seat}`}
                      </p>
                    </div>
                    <Link
                      href="/users"
                      className="text-[11px] text-muted-foreground"
                    >
                      Edit in Profile →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <Link href="/events" className="text-sm underline">
        ← Back to events
      </Link>
    </div>
  );
}
