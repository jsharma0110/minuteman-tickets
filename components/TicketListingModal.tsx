"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface TicketListingModalProps {
  event: {
    id: string;
    title?: string;
    location?: string;
    date?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function TicketListingModal({
  event,
  isOpen,
  onClose,
}: TicketListingModalProps) {
  const router = useRouter();
  const supabase = createClient();

  const [section, setSection] = useState("");
  const [row, setRow] = useState("");
  const [seat, setSeat] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Make sure we only portal on the client (avoids hydration issues)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      setErrorMsg("Please enter a valid ticket price.");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg("You must be logged in to list a ticket.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("tickets").insert({
        event_id: event.id,
        seller_id: user.id,
        price: numericPrice,
        section: section || null,
        row: row || null,
        seat: seat || null,
        status: "available",
      });

      if (error) {
        console.error(error);
        setErrorMsg("Something went wrong while listing your ticket.");
      } else {
        router.refresh();
        onClose();
        setSection("");
        setRow("");
        setSeat("");
        setPrice("");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ------- PORTAL CONTENT (centered modal) -------
  const modalContent = (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
  <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/95 p-8 shadow-2xl">
    
    {/* Header */}
    <div className="mb-6 flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
          List Ticket
        </p>

        <h2 className="mt-1 text-2xl font-semibold text-zinc-50 leading-tight">
          {event.title || "Event"}
        </h2>

        {event.location && (
          <p className="text-sm text-zinc-300">{event.location}</p>
        )}
        {event.date && (
          <p className="text-sm text-zinc-400">{event.date}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-full px-2 py-1 text-base text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      >
        ✕
      </button>
    </div>

    {/* FORM */}
    <form onSubmit={handleSubmit} className="space-y-6 text-base">
      
      {/* Section / Row / Seat */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Section</label>
          <input
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="A"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">Row</label>
          <input
            type="number"
            value={row}
            onChange={(e) => setRow(e.target.value)}
            placeholder="1"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-400">Seat</label>
          <input
            type="number"
            value={seat}
            onChange={(e) => setSeat(e.target.value)}
            placeholder="12"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
          />
        </div>
      </div>

      {/* PRICE */}
      <div>
        <label className="mb-1 block text-sm text-zinc-400">
          Price per ticket ($)
        </label>
        <input
          type="number"
          min="1"
          step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="35"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none"
        />
      </div>

      {/* ERROR */}
      {errorMsg && (
        <p className="text-sm text-red-400">{errorMsg}</p>
      )}

      {/* BUTTONS */}
      <div className="mt-2 flex items-center justify-end gap-4 text-base">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          disabled={loading}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-zinc-100 px-5 py-1.5 text-base font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-200 disabled:opacity-60"
        >
          {loading ? "Listing…" : "List ticket"}
        </button>
      </div>
    </form>
  </div>
</div>
  );

  return createPortal(modalContent, document.body);
}
