"use client";

import React, { useState } from "react";
import { MessageCircle, ChevronLeft, X } from "lucide-react";
import Image from "next/image";
import { postTickets } from "../app/api/postTickets";

type EventItem = {
  id: string;
  title: string;
  location: string;
  date: string;
  imageUrl: string;
};

type TicketListingModalProps = {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
};

export default function TicketListingModal({
  event,
  isOpen,
  onClose,
}: TicketListingModalProps) {
  const [section, setSection] = useState("");
  const [row, setRow] = useState("");
  const [seat, setSeat] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validate required fields (row is optional based on schema)
    if (!section || !seat || !price || !event.id) {
      alert("Please fill in all required fields: Section, Seat, and Price");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ticketData = {
        event_id: event.id,
        section,
        row: row || null,
        seat,
        price: parseFloat(price),
        quantity: parseInt(quantity) || 1,
      };

      const result = await postTickets(ticketData);

      // Success - show confirmation and close modal
      alert(`Successfully listed ${result.length} ticket(s)!`);

      // Reset form
      setSection("");
      setRow("");
      setSeat("");
      setPrice("");
      setQuantity("1");
      setNotes("");

      // Close modal
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to list ticket. Please try again.");
      alert(err.message || "Failed to list ticket. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gray-50 rounded-lg shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                List Your Ticket
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-gray-600 hover:text-gray-900">
                <MessageCircle size={24} />
              </button>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-6">
          {/* Event Info Card */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <Image
              src={event.imageUrl}
              alt={event.title}
              width={800}
              height={200}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {event.title} @ {event.location}
              </h2>
              <p className="text-gray-500">{event.date}</p>
            </div>
          </div>

          {/* Listing Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ticket Details
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g., 101"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Row
                  </label>
                  <input
                    type="text"
                    value={row}
                    onChange={(e) => setRow(e.target.value)}
                    placeholder="e.g., A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seat
                  </label>
                  <input
                    type="text"
                    value={seat}
                    onChange={(e) => setSeat(e.target.value)}
                    placeholder="e.g., 12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Ticket ($)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special conditions or details about the tickets..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-gray-900 placeholder:text-gray-500"
                />
              </div>

              {/* Pricing Summary */}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? "Listing Ticket..." : "List Ticket for Sale"}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              Listing Guidelines
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Tickets are immediately visible to buyers</li>
              <li>• Youll be notified when someone purchases your ticket</li>
              <li>• Transfer tickets electronically through the platform</li>
              <li>• Payment is released after successful transfer</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
