// app/conversations/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const ticketId = url.searchParams.get("ticketId");
  const sellerId = url.searchParams.get("sellerId");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const buyerId = user.id;

  // No ticket or seller? Go back to events.
  if (!ticketId || !sellerId) {
    return NextResponse.redirect(new URL("/events", req.url));
  }

  // Prevent chatting with yourself
  if (buyerId === sellerId) {
    return NextResponse.redirect(new URL("/conversations", req.url));
  }

  // 1) Try to find an existing conversation for this (ticket, buyer, seller)
  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("ticket_id", ticketId)
    .eq("buyer_id", buyerId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (existingError) {
    console.error("Find conversation error:", existingError);
  }

  if (existing) {
    // Conversation already exists → go there
    return NextResponse.redirect(
      new URL(`/conversations/${existing.id}`, req.url)
    );
  }

  // 2) Create a new conversation
  const { data: inserted, error: insertError } = await supabase
    .from("conversations")
    .insert({
      ticket_id: ticketId,
      buyer_id: buyerId,
      seller_id: sellerId,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("Create conversation error:", insertError);
    return NextResponse.redirect(new URL("/events", req.url));
  }

  return NextResponse.redirect(
    new URL(`/conversations/${inserted.id}`, req.url)
  );
}
