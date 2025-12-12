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
  email: string | null;
};

type LastMessageRow = {
  conversation_id: string;
  content: string | null;
  created_at: string;
  sender_id: string;
};

function deriveDisplayName(email: string | null | undefined): string {
  if (!email) return "UMass Student";
  const beforeAt = email.split("@")[0] ?? "";
  const cleaned = beforeAt.replace(/[._-]+/g, " ");
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
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
  const [lastMessagesMap, setLastMessagesMap] = useState<
    Record<string, LastMessageRow>
  >({});

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
            .map((c) => (c.buyer_id === user.id ? c.seller_id : c.buyer_id))
            .filter(Boolean)
        )
      );

      if (otherIds.length > 0) {
        const { data: profs, error: pErr } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, email")
          .in("id", otherIds);

        if (!pErr && profs) {
          const pmap: Record<string, Profile> = {};
          (profs as Profile[]).forEach((p) => {
            pmap[p.id] = p;
          });
          setProfilesMap(pmap);
        }
      }

      // 5) last message per conversation (for preview line)
      const convIds = convs.map((c) => c.id);
      if (convIds.length > 0) {
        const { data: msgs, error: mErr } = await supabase
          .from("messages")
          .select("conversation_id, content, created_at, sender_id")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: false });

        if (!mErr && msgs) {
          const map: Record<string, LastMessageRow> = {};
          (msgs as LastMessageRow[]).forEach((m) => {
            if (!map[m.conversation_id]) {
              // first one we see is newest because of descending order
              map[m.conversation_id] = m;
            }
          });
          setLastMessagesMap(map);
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

  // ---------- RENDER ----------

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-foreground">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-zinc-400">Loading conversations…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-foreground">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">
                Conversations
              </span>
              <span className="text-[11px] text-zinc-500">
                Chats with other UMass students
              </span>
            </div>
            <Button
              variant="outline"
              className="h-8 rounded-full border-zinc-700 bg-zinc-900 text-[14px] hover:border-zinc-500 hover:bg-zinc-800"
              onClick={handleBackToEvents}
            >
              ← Back to Events
            </Button>
          </div>
          <p className="text-[14px] text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-10 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="text-[16px] font-semibold tracking-tight">
              Conversations
            </span>
            <span className="text-[14px] text-zinc-500">
              View and continue your ticket chats
            </span>
          </div>
          <Button
            variant="outline"
            className="h-8 rounded-full border-zinc-700 bg-zinc-900 text-xs hover:border-zinc-500 hover:bg-zinc-800"
            onClick={handleBackToEvents}
          >
            ← Back to Events
          </Button>
        </div>

        {conversations.length === 0 ? (
          <p className="text-[14px] text-zinc-500">
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
                profile?.display_name ||
                deriveDisplayName(profile?.email ?? null);
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

              const lastMsg = lastMessagesMap[conv.id];
              const lastMsgText =
                lastMsg && (lastMsg.content?.trim() || "[Attachment]");

              return (
                <button
                  key={conv.id}
                  onClick={() => handleOpenConversation(conv.id)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-left shadow-[0_14px_40px_rgba(0,0,0,0.6)] transition duration-150 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-900"
                >
                  {/* avatar */}
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-zinc-800 text-sm font-semibold text-zinc-50">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        {displayName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* main text */}
                  <div className="flex-1 space-y-0.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-50">
                        {displayName}
                      </p>
                      <span className="text-[14px] text-zinc-500">
                        {new Date(conv.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {event && (
                      <p className="text-[14px] text-zinc-400">
                        {event.name}
                      </p>
                    )}

                    {ticket && (
                      <p className="text-[14px] text-zinc-500">
                        {seatLabel} • ${ticket.price.toFixed(2)}
                      </p>
                    )}

                    <p className="line-clamp-1 text-[14px] text-zinc-400">
                      {lastMsgText ||
                        "No messages yet. Tap to start the chat."}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
