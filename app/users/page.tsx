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
  title?: string | null;
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
  const [eventsMap, setEventsMap] = useState<Record<string, EventInfo>>({});

  // ---- Load user + avatar + tickets ----
  useEffect(() => {
    const load = async () => {
      setProfileLoading(true);
      setTicketsLoading(true);
      setProfileError(null);
      setTicketsError(null);

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

      // ---- load tickets where seller_id = user.id ----
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
      } else if (ticketData) {
        const ticketsTyped = ticketData as Ticket[];
        setTickets(ticketsTyped);

        // fetch event titles for those event_ids
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
            .select("id, title, name")
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
        .from("avatars") // bucket name – adjust if different
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

  // Toggle status: available <-> sold
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

    const { error } = await supabase
      .from("tickets")
      .delete()
      .eq("id", ticketId)
      .eq("seller_id", userId);

    if (error) {
      console.error(error);
      setTicketsError("Could not delete ticket.");
    } else {
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    }

    setDeletingId(null);
  };

  const handleBackToEvents = () => {
    router.push("/events");
  };

  // ---- Render ----
  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading profile…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-8">
      {/* HEADER: back button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <Button variant="outline" onClick={handleBackToEvents}>
          ← Back to Events
        </Button>
      </div>

      {profileError && (
        <p className="text-sm text-red-500">{profileError}</p>
      )}

      {/* PROFILE CARD */}
      <section className="flex flex-wrap items-center gap-6 rounded-xl border bg-secondary/20 p-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Profile picture"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold">
              {displayName.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 text-sm">
          <p className="text-lg font-semibold">{displayName}</p>
          {email && (
            <p className="text-muted-foreground">{email}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAvatarButtonClick}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? "Uploading…" : "Change Picture"}
          </Button>
          {avatarUrl && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleAvatarDelete}
              disabled={deletingAvatar}
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
      <section>
        <h2 className="mb-3 text-xl font-semibold">
          My Ticket Listings
        </h2>

        {ticketsError && (
          <p className="mb-3 text-sm text-red-500">{ticketsError}</p>
        )}

        {ticketsLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading your tickets…
          </p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven’t listed any tickets yet.
          </p>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const eventInfo = eventsMap[ticket.event_id];
              const eventLabel =
                eventInfo?.title ||
                eventInfo?.name ||
                `Event ${ticket.event_id.slice(0, 8)}…`;

              const effectiveStatus =
                ticket.status ?? "available";
              const isAvailable = effectiveStatus === "available";

              return (
                <div
                  key={ticket.id}
                  className="rounded-xl border bg-secondary/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{eventLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        Created:{" "}
                        {new Date(
                          ticket.created_at
                        ).toLocaleString()}
                      </p>
                      <p className="text-xs">
                        Status:{" "}
                        <span className="font-medium">
                          {effectiveStatus}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <label className="flex flex-col">
                        Section
                        <input
                          className="mt-1 rounded border bg-background px-2 py-1"
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

                      <label className="flex flex-col">
                        Row
                        <input
                          className="mt-1 rounded border bg-background px-2 py-1"
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

                      <label className="flex flex-col">
                        Seat
                        <input
                          className="mt-1 rounded border bg-background px-2 py-1"
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

                      <label className="flex flex-col">
                        Price ($)
                        <input
                          type="number"
                          min="0"
                          className="mt-1 w-24 rounded border bg-background px-2 py-1"
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

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(ticket)}
                      disabled={savingId === ticket.id}
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
  );
}
