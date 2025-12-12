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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  // Event
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  const eventTitle =
    (event as any)?.title || (event as any)?.name || "Event";

  // Tickets from other users (available)
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

  // Your tickets
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
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-12 pt-8">
        {/* Header */}
        <header className="space-y-3">
          <p className="text-[12px] uppercase tracking-[0.18em] text-zinc-500">
            Buy tickets
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {eventTitle}
          </h1>
          <p className="text-[13px] text-zinc-400">
            Tickets listed by other UMass students are shown below. Start a
            chat to coordinate payment and transfer.
          </p>
        </header>

        {/* Tickets from other students */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium text-[14px] text-zinc-200">
              Available tickets
            </span>
            <span>
              {otherTickets.length} listing
              {otherTickets.length === 1 ? "" : "s"}
            </span>
          </div>

          {otherTickets.length === 0 ? (
            <p className="text-[12px] text-zinc-500">
              No tickets from other students are currently available for this
              event.
            </p>
          ) : (
            <div className="space-y-3">
              {otherTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm shadow-sm"
                >
                  <div>
                    <p className="text-[15px] font-semibold text-zinc-50">
                      ${ticket.price}
                    </p>
                    <p className="mt-0.5 text-[14px] text-zinc-400">
                      {ticket.section && `Section ${ticket.section} `}
                      {ticket.row && `· Row ${ticket.row} `}
                      {ticket.seat && `· Seat ${ticket.seat}`}
                    </p>
                  </div>

                  <Link
                    href={`/conversations/start?ticketId=${ticket.id}&sellerId=${ticket.seller_id}`}
                    className="rounded-full bg-zinc-100 px-4 py-2 text-[14px] font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-200"
                  >
                    Chat with seller
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Your listings */}
        {currentUserId && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-medium text-[14px] text-zinc-200">
                Your listings for this event
              </span>
              {myTickets.length > 0 && (
                <span>{myTickets.length} ticket(s) listed</span>
              )}
            </div>

            {myTickets.length === 0 ? (
              <p className="text-[14px] text-zinc-500">
                You haven&apos;t listed any tickets for this event yet.
              </p>
            ) : (
              <div className="space-y-2">
                {myTickets.map((ticket) => {
                  const effectiveStatus = ticket.status ?? "available";

                  return (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-xs"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-100">
                          ${ticket.price} ·{" "}
                          <span className="capitalize">
                            {effectiveStatus}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[14px] text-zinc-400">
                          {ticket.section && `Section ${ticket.section} `}
                          {ticket.row && `· Row ${ticket.row} `}
                          {ticket.seat && `· Seat ${ticket.seat}`}
                        </p>
                      </div>
                      <Link
                        href="/users"
                        className="text-[12px] font-medium text-zinc-400 hover:text-zinc-100"
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

        {/* Back link */}
        <Link
          href="/events"
          className="text-sm text-zinc-400 underline underline-offset-4 hover:text-zinc-100"
        >
          ← Back to events
        </Link>
      </div>
    </div>
  );
}
