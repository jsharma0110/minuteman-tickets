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
  // Next 16 async params
  const { conversationId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1) Load conversation and ensure user is buyer or seller
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

  // 2) Load ticket
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

  // 3) Load event (for name)
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

  // 4) Load other user's profile
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

  // 5) Load initial messages (including attachment fields)
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
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      {/* Header: other user's avatar + name + ticket details */}
      <header className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
            {otherAvatarUrl ? (
              <Image
                src={otherAvatarUrl}
                alt={otherDisplayName}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{otherDisplayName.charAt(0)}</span>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Chat with {isBuyer ? "Seller" : "Buyer"}
            </p>
            <p className="text-sm font-semibold">{otherDisplayName}</p>
            <p className="text-xs text-muted-foreground">
              {eventName ?? "Event"} — Ticket #{shortTicketId}
            </p>
            <p className="text-xs text-muted-foreground">{ticketSeatLabel}</p>
            <p className="text-xs">
              Price: {ticket ? `$${ticket.price.toFixed(2)}` : "Unknown"}
            </p>
            {ticketStatus === "sold" && (
              <p className="text-xs font-semibold text-yellow-600">
                Seller has marked this ticket as sold.
              </p>
            )}
          </div>
        </div>

        <a href="/conversations" className="text-xs underline">
          ← All chats
        </a>
      </header>

      {/* Conversation client: messages + input + uploads */}
      <ConversationClient
        conversationId={conversation.id}
        userId={user.id}
        initialMessages={initialMessages}
      />
    </div>
  );
}
