// app/conversations/[conversationId]/page.tsx
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConversationClient from "./ConversationClient";

type PageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

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
  section: string | null;
  row: string | null;
  seat: string | null;
  price: number;
  status: string | null;
  created_at: string;
};

type EventRow = {
  id: string;
  name: string | null;
};

type Profile = {
  id: string;
  avatar_url: string | null;
  display_name: string | null;
  email: string | null;
};

export type MessageRow = {
  id: string;
  content: string | null;
  created_at: string;
  sender_id: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
};

function formatSeat(ticket: TicketRow | null): string {
  if (!ticket) return "Unknown ticket";
  const parts = [
    ticket.section && `Section ${ticket.section}`,
    ticket.row && `Row ${ticket.row}`,
    ticket.seat && `Seat ${ticket.seat}`,
  ].filter(Boolean);
  return parts.join(" • ") || "General Admission";
}

function deriveDisplayName(email: string | null | undefined): string {
  if (!email) return "UMass Student";
  const beforeAt = email.split("@")[0] ?? "";
  const cleaned = beforeAt.replace(/[._-]+/g, " ");
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(" ");
}

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1) Conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, ticket_id, buyer_id, seller_id, created_at")
    .eq("id", conversationId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .maybeSingle<ConversationRow>();

  if (convError) {
    console.error("Conversation fetch error:", convError);
  }

  if (!conversation) {
    notFound();
  }

  const isBuyer = conversation.buyer_id === user.id;
  const otherUserId = isBuyer ? conversation.seller_id : conversation.buyer_id;

  // 2) Ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select(
      "id, event_id, section, row, seat, price, status, created_at"
    )
    .eq("id", conversation.ticket_id)
    .maybeSingle<TicketRow>();

  if (ticketError) {
    console.error("Ticket fetch error:", ticketError);
  }

  // 3) Event
  let eventName: string | null = null;

  if (ticket?.event_id) {
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, name")
      .eq("id", ticket.event_id)
      .maybeSingle<EventRow>();

    if (eventError) {
      console.error("Event fetch error:", eventError);
    }
    eventName = event?.name ?? null;
  }

  // 4) Other user's profile
  const { data: otherProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, avatar_url, display_name, email")
    .eq("id", otherUserId)
    .maybeSingle<Profile>();

  if (profileError) {
    console.error("Profile fetch error:", profileError);
  }

  const otherDisplayName =
    otherProfile?.display_name ||
    deriveDisplayName(otherProfile?.email ?? null) ||
    "UMass Student";

  const otherAvatarUrl = otherProfile?.avatar_url ?? null;

  // 5) Messages
  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select(
      `
      id,
      content,
      created_at,
      sender_id,
      attachment_url,
      attachment_name,
      attachment_type,
      attachment_size
    `
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgError) {
    console.error("Messages fetch error:", msgError);
  }

  const initialMessages = (messages ?? []) as MessageRow[];

  const ticketSeatLabel = formatSeat(ticket ?? null);
  const ticketStatus = ticket?.status ?? "available";

  const shortTicketId =
    ticket?.id && ticket.id.length > 8
      ? `${ticket.id.slice(0, 8)}…`
      : ticket?.id ?? "";

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-10 pt-6">
        {/* Top row: page title + back */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="text-[14px] font-semibold tracking-tight">
              Conversation
            </span>
            <span className="text-[14px] text-zinc-500">
              Chat with other UMass students about tickets
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <a
              href="/conversations"
              className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[14px] text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800"
            >
              ← All chats
            </a>
            <a
              href="/events"
              className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[14px] text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800"
            >
              Back to events
            </a>
          </div>
        </div>

        {/* Ticket + other user info */}
        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.6)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-semibold text-zinc-50">
              {otherAvatarUrl ? (
                <Image
                  src={otherAvatarUrl}
                  alt={otherDisplayName}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{otherDisplayName.charAt(0)}</span>
              )}
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-[12px] uppercase tracking-[0.16em] text-zinc-500">
                {isBuyer ? "Chatting with seller" : "Chatting with buyer"}
              </p>
              <p className="text-base font-semibold text-zinc-50">
                {otherDisplayName}
              </p>
              <p className="text-[14px] text-zinc-400">
                {eventName ?? "Event"} • Ticket {shortTicketId && `#${shortTicketId}`}
              </p>
              <p className="text-[14px] text-zinc-400">{ticketSeatLabel}</p>
              <p className="text-[14px] text-zinc-300">
                Price:{" "}
                {ticket ? `$${ticket.price.toFixed(2)}` : "Unknown"}
              </p>
              {ticketStatus === "sold" && (
                <p className="text-[14px] font-semibold text-amber-400">
                  Seller has marked this ticket as sold.
                </p>
              )}
            </div>
          </div>

          <div className="mt-2 text-[14px] text-zinc-500 sm:mt-0 sm:text-right">
            <p>
              Conversation started{" "}
              {new Date(conversation.created_at).toLocaleString()}
            </p>
          </div>
        </section>

        {/* Chat card */}
        <ConversationClient
          conversationId={conversation.id}
          userId={user.id}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}
