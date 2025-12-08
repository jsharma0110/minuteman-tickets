"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type ConversationRow = {
  id: string;
  ticket_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
};

type TicketRow = {
  id: string;
  event_id: string;
  price: number;
  section: string | null;
  row: string | null;
  seat: string | null;
  status: string | null;
};

type EventRow = {
  id: string;
  name: string | null;
};

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

function deriveDisplayName(email: string | null | undefined): string {
  if (!email) return "UMass Student";
  const beforeAt = email.split("@")[0] ?? "";
  const cleaned = beforeAt.replace(/[._-]+/g, " ");
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map(
      (p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
    )
    .join(" ");
}

export default function ConversationsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [ticketsMap, setTicketsMap] = useState<Record<string, TicketRow>>({});
  const [eventsMap, setEventsMap] = useState<Record<string, EventRow>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      // 1) current user
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setError("You must be logged in to view conversations.");
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // 2) conversations where user is buyer or seller
      const { data: convData, error: convErr } = await supabase
        .from("conversations")
        .select("id, ticket_id, buyer_id, seller_id, created_at")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (convErr) {
        console.error(convErr);
        setError("Failed to load conversations.");
        setLoading(false);
        return;
      }

      const convs = (convData ?? []) as ConversationRow[];
      setConversations(convs);

      if (convs.length === 0) {
        setLoading(false);
        return;
      }

      // 3) tickets + events for those conversations
      const ticketIds = Array.from(
        new Set(convs.map((c) => c.ticket_id).filter(Boolean))
      );

      if (ticketIds.length > 0) {
        const { data: tickets, error: tErr } = await supabase
          .from("tickets")
          .select("id, event_id, price, section, row, seat, status")
          .in("id", ticketIds);

        if (!tErr && tickets) {
          const map: Record<string, TicketRow> = {};
          (tickets as TicketRow[]).forEach((t) => {
            map[t.id] = t;
          });
          setTicketsMap(map);

          const eventIds = Array.from(
            new Set(
              (tickets as TicketRow[])
                .map((t) => t.event_id)
                .filter(Boolean)
            )
          );

          if (eventIds.length > 0) {
            const { data: events, error: eErr } = await supabase
              .from("events")
              .select("id, name")
              .in("id", eventIds);

            if (!eErr && events) {
              const emap: Record<string, EventRow> = {};
              (events as EventRow[]).forEach((e) => {
                emap[e.id] = e;
              });
              setEventsMap(emap);
            }
          }
        }
      }

      // 4) profiles for the "other" participant in each conversation
      const otherIds = Array.from(
        new Set(
          convs
            .map((c) =>
              c.buyer_id === user.id ? c.seller_id : c.buyer_id
            )
            .filter(Boolean)
        )
      );

      if (otherIds.length > 0) {
        const { data: profs, error: pErr } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", otherIds);

        if (!pErr && profs) {
          const pmap: Record<string, Profile> = {};
          (profs as Profile[]).forEach((p) => {
            pmap[p.id] = p;
          });
          setProfilesMap(pmap);
        }
      }

      setLoading(false);
    };

    load();
  }, [supabase]);

  const handleOpenConversation = (id: string) => {
    router.push(`/conversations/${id}`);
  };

  const handleBackToEvents = () => {
    router.push("/events");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading conversations…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Conversations</h1>
          <Button variant="outline" onClick={handleBackToEvents}>
            ← Back to Events
          </Button>
        </div>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Conversations</h1>
        <Button variant="outline" onClick={handleBackToEvents}>
          ← Back to Events
        </Button>
      </div>

      {conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You don’t have any conversations yet.
        </p>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            if (!currentUserId) return null;

            const isBuyer = conv.buyer_id === currentUserId;
            const otherId = isBuyer ? conv.seller_id : conv.buyer_id;
            const profile = profilesMap[otherId];
            const displayName =
              profile?.display_name ?? "UMass Student";
            const avatarUrl = profile?.avatar_url ?? null;

            const ticket = ticketsMap[conv.ticket_id];
            const event = ticket ? eventsMap[ticket.event_id] : null;

            const seatLabel =
              ticket &&
              ([
                ticket.section && `Section ${ticket.section}`,
                ticket.row && `Row ${ticket.row}`,
                ticket.seat && `Seat ${ticket.seat}`,
              ]
                .filter(Boolean)
                .join(" • ") || "General Admission");

            return (
              <button
                key={conv.id}
                onClick={() => handleOpenConversation(conv.id)}
                className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left hover:bg-accent"
              >
                {/* 🔥 avatar just like profile page */}
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                      {displayName.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-0.5 text-xs">
                  <p className="text-sm font-medium">
                    {displayName}
                  </p>
                  {event && (
                    <p className="text-xs text-muted-foreground">
                      {event.name}
                    </p>
                  )}
                  {ticket && (
                    <p className="text-[11px] text-muted-foreground">
                      {seatLabel} • ${ticket.price.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="text-[10px] text-muted-foreground">
                  {new Date(conv.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
