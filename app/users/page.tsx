"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Ticket = {
  id: string;
  event_id: string;
  section: string | null;
  row: string | null;
  seat: string | null;
  price: number;
  status: string | null;
  created_at: string;
};

type EventInfo = {
  id: string;
  name?: string | null;
};

function deriveDisplayName(email: string | null | undefined): string {
  if (!email) return "Student";
  const beforeAt = email.split("@")[0] ?? "";
  const cleaned = beforeAt.replace(/[._-]+/g, " ");
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(" ");
}

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // user & profile
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("Student");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // event name lookup map: event_id -> EventInfo
  const [eventsMap, setEventsMap] = useState<Record<string, EventInfo>>({});

  // ---- Load user + avatar + tickets ----
  useEffect(() => {
    const load = async () => {
      setProfileLoading(true);
      setTicketsLoading(true);
      setProfileError(null);
      setTicketsError(null);

      // 1) Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setProfileError("You must be logged in to view your profile.");
        setProfileLoading(false);
        setTicketsLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? null);
      setDisplayName(deriveDisplayName(user.email));

      const metaAvatar =
        (user.user_metadata as any)?.avatar_url ?? null;
      setAvatarUrl(metaAvatar);

      // 2) Load tickets where current user is the seller
      const { data: ticketData, error: ticketsErr } = await supabase
        .from("tickets")
        .select(
          "id, event_id, section, row, seat, price, status, created_at"
        )
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (ticketsErr) {
        console.error(ticketsErr);
        setTicketsError("Failed to load your tickets.");
        setTickets([]);
      } else if (ticketData) {
        const ticketsTyped = ticketData as Ticket[];
        setTickets(ticketsTyped);

        // 3) For those tickets, fetch the matching events to get event names
        const uniqueEventIds = Array.from(
          new Set(
            ticketsTyped
              .map((t) => t.event_id)
              .filter((id) => !!id)
          )
        );

        if (uniqueEventIds.length > 0) {
          const { data: eventsData, error: eventsErr } = await supabase
            .from("events")
            .select("id, name")
            .in("id", uniqueEventIds);

          if (!eventsErr && eventsData) {
            const map: Record<string, EventInfo> = {};
            (eventsData as EventInfo[]).forEach((e) => {
              map[e.id] = e;
            });
            setEventsMap(map);
          }
        }
      }

      setProfileLoading(false);
      setTicketsLoading(false);
    };

    load();
  }, [supabase]);

  // ---- Avatar actions ----
  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !userId) return;
      setUploadingAvatar(true);
      setProfileError(null);

      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars") // bucket name
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        setProfileError("Failed to upload profile picture.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (updateError) {
        console.error(updateError);
        setProfileError("Failed to save profile picture.");
      } else {
        setAvatarUrl(publicUrl);

        const { error: profileErr } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", userId);

        if (profileErr) {
          console.error("Failed to update profiles.avatar_url", profileErr);
        }
      }
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAvatarDelete = async () => {
    if (!userId) return;
    try {
      setDeletingAvatar(true);
      setProfileError(null);

      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null },
      });

      if (error) {
        console.error(error);
        setProfileError("Failed to delete profile picture.");
      } else {
        setAvatarUrl(null);

        const { error: profileErr } = await supabase
          .from("profiles")
          .update({ avatar_url: null })
          .eq("id", userId);

        if (profileErr) {
          console.error("Failed to clear profiles.avatar_url", profileErr);
        }
      }
    } finally {
      setDeletingAvatar(false);
    }
  };

  // ---- Ticket helpers ----
  const updateField = (
    ticketId: string,
    field: keyof Ticket,
    value: string
  ) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              [field]:
                field === "price" ? Number(value) || 0 : (value as any),
            }
          : t
      )
    );
  };

  const handleSave = async (ticket: Ticket) => {
    if (!userId) return;
    setSavingId(ticket.id);
    setTicketsError(null);

    const { data, error } = await supabase
      .from("tickets")
      .update({
        section: ticket.section,
        row: ticket.row,
        seat: ticket.seat,
        price: ticket.price,
        status: ticket.status ?? "available",
      })
      .eq("id", ticket.id)
      .eq("seller_id", userId)
      .select()
      .single();

    if (error) {
      console.error(error);
      setTicketsError("Could not save changes.");
    } else if (data) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? (data as Ticket) : t))
      );
    }

    setSavingId(null);
  };

  const handleToggleStatus = async (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    const currentStatus = ticket.status ?? "available";
       const newStatus = currentStatus === "available" ? "sold" : "available";

    await handleSave({ ...ticket, status: newStatus });
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!userId) return;
    const confirmed = window.confirm("Delete this ticket listing?");
    if (!confirmed) return;

    setDeletingId(ticketId);
    setTicketsError(null);

    const { data: convs, error: convErr } = await supabase
      .from("conversations")
      .select("id")
      .eq("ticket_id", ticketId);

    if (convErr) {
      console.error(convErr);
      setTicketsError("Could not delete conversations for this ticket.");
      setDeletingId(null);
      return;
    }

    const convIds = (convs ?? []).map((c: any) => c.id as string);

    if (convIds.length > 0) {
      const { error: msgErr } = await supabase
        .from("messages")
        .delete()
        .in("conversation_id", convIds);

      if (msgErr) {
        console.error(msgErr);
        setTicketsError("Could not delete messages for this ticket.");
        setDeletingId(null);
        return;
      }

      const { error: convDelErr } = await supabase
        .from("conversations")
        .delete()
        .in("id", convIds);

      if (convDelErr) {
        console.error(convDelErr);
        setTicketsError("Could not delete conversations for this ticket.");
        setDeletingId(null);
        return;
      }
    }

    const { error: ticketErr } = await supabase
      .from("tickets")
      .delete()
      .eq("id", ticketId)
      .eq("seller_id", userId);

    if (ticketErr) {
      console.error(ticketErr);
      setTicketsError("Could not delete ticket.");
    } else {
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    }

    setDeletingId(null);
  };

  const handleBackToEvents = () => {
    router.push("/events");
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-black">
        <p className="text-sm text-zinc-400">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-12 pt-8">
        {/* HEADER */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-[0.18em] text-zinc-500">
              Account
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              My Profile
            </h1>
          </div>

          <Button
            variant="outline"
            onClick={handleBackToEvents}
            className="border-zinc-700 bg-zinc-900/80 text-[14px] text-zinc-100 hover:bg-zinc-800 hover:text-white"
          >
            ← Back to Events
          </Button>
        </header>

        {profileError && (
          <p className="text-[14px] text-red-400">{profileError}</p>
        )}

        {/* PROFILE CARD */}
        <section className="flex flex-wrap items-center gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-lg">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-zinc-800">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile picture"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-100">
                {displayName.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex min-w-[180px] flex-1 flex-col gap-1 text-base">
            <p className="text-lg font-semibold text-zinc-50">
              {displayName}
            </p>
            {email && (
              <p className="text-[14px] text-zinc-400">{email}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 text-xs">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAvatarButtonClick}
              disabled={uploadingAvatar}
              className="border-zinc-700 bg-zinc-900/80 text-xs text-zinc-100 hover:bg-zinc-800"
            >
              {uploadingAvatar ? "Uploading…" : "Change Picture"}
            </Button>
            {avatarUrl && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleAvatarDelete}
                disabled={deletingAvatar}
                className="text-14"
              >
                {deletingAvatar ? "Deleting…" : "Remove Picture"}
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </section>

        {/* MY TICKET LISTINGS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
              My Ticket Listings
            </h2>
            {tickets.length > 0 && (
              <span className="text-xs text-zinc-500">
                {tickets.length} listing{tickets.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {ticketsError && (
            <p className="text-sm text-red-400">{ticketsError}</p>
          )}

          {ticketsLoading ? (
            <p className="text-sm text-zinc-400">
              Loading your tickets…
            </p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-zinc-400">
              You haven&apos;t listed any tickets yet.
            </p>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const eventInfo = eventsMap[ticket.event_id];
                const eventLabel =
                  eventInfo?.name ?? "Unknown Event";

                const effectiveStatus = ticket.status ?? "available";
                const isAvailable = effectiveStatus === "available";

                return (
                  <div
                    key={ticket.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-base shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {/* Left: event + meta */}
                      <div className="space-y-1">
                        <p className="text-lg font-medium text-zinc-50">
                          {eventLabel}
                        </p>
                        <p className="text-sm text-zinc-500">
                          Created:{" "}
                          {new Date(
                            ticket.created_at
                          ).toLocaleString()}
                        </p>
                        <p className="text-sm text-zinc-400">
                          Status:{" "}
                          <span className="font-medium text-zinc-100">
                            {effectiveStatus}
                          </span>
                        </p>
                      </div>

                      {/* Right: editable fields */}
                      <div className="flex flex-wrap gap-3 text-sm">
                        <label className="flex flex-col text-zinc-400">
                          <span>Section</span>
                          <input
                            className="mt-1 w-24 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-[16px] text-zinc-100 focus:border-zinc-400 focus:outline-none"
                            value={ticket.section ?? ""}
                            onChange={(e) =>
                              updateField(
                                ticket.id,
                                "section",
                                e.target.value
                              )
                            }
                          />
                        </label>

                        <label className="flex flex-col text-zinc-400">
                          <span>Row</span>
                          <input
                            className="mt-1 w-20 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-[16px] text-zinc-100 focus:border-zinc-400 focus:outline-none"
                            value={ticket.row ?? ""}
                            onChange={(e) =>
                              updateField(
                                ticket.id,
                                "row",
                                e.target.value
                              )
                            }
                          />
                        </label>

                        <label className="flex flex-col text-zinc-400">
                          <span>Seat</span>
                          <input
                            className="mt-1 w-20 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-[16px] text-zinc-100 focus:border-zinc-400 focus:outline-none"
                            value={ticket.seat ?? ""}
                            onChange={(e) =>
                              updateField(
                                ticket.id,
                                "seat",
                                e.target.value
                              )
                            }
                          />
                        </label>

                        <label className="flex flex-col text-zinc-400">
                          <span>Price ($)</span>
                          <input
                            type="number"
                            min="0"
                            className="mt-1 w-28 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-[16px] text-zinc-100 focus:border-zinc-400 focus:outline-none"
                            value={ticket.price ?? 0}
                            onChange={(e) =>
                              updateField(
                                ticket.id,
                                "price",
                                e.target.value
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <Button
                        size="sm"
                        onClick={() => handleSave(ticket)}
                        disabled={savingId === ticket.id}
                        className="bg-zinc-100 px-4 py-1.5 text-sm text-zinc-900 hover:bg-zinc-200"
                      >
                        {savingId === ticket.id
                          ? "Saving…"
                          : "Save Changes"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(ticket.id)}
                        disabled={savingId === ticket.id}
                        className="border-zinc-700 bg-zinc-900/80 px-4 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800"
                      >
                        {isAvailable
                          ? "Mark as Sold"
                          : "Mark as Available"}
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTicket(ticket.id)}
                        disabled={deletingId === ticket.id}
                        className="px-4 py-1.5 text-sm"
                      >
                        {deletingId === ticket.id
                          ? "Deleting…"
                          : "Delete"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
