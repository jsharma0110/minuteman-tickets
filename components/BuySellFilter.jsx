"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TicketListingModal from "./TicketListingModal";

export default function BuySellFilter({ umassEvent }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (label) => {
    if (label === "Sell") {
      setIsModalOpen(true);
    } else if (label === "Buy") {
      router.push(`/events/${umassEvent.id}/buy`);
    }
  };

  return (
    // give TicketListingModal a local positioning context
    <div className="relative">
      <div className="mb-3 flex justify-end">
        <div className="inline-flex items-center rounded-full border border-zinc-700/80 bg-zinc-900/80 p-1 shadow-sm">
          {/* BUY */}
          <button
            type="button"
            onClick={() => handleClick("Buy")}
            className="
              rounded-full px-4 py-1.5 
              text-[14px] font-medium
              bg-zinc-100/10 text-zinc-50
              hover:bg-zinc-100/20 transition
            "
          >
            Buy
          </button>

          {/* SELL */}
          <button
            type="button"
            onClick={() => handleClick("Sell")}
            className="
              rounded-full px-4 py-1.5 
              text-[14px] font-medium text-zinc-400
              hover:text-white hover:bg-zinc-800 transition
            "
          >
            Sell
          </button>
        </div>
      </div>

      <TicketListingModal
        event={umassEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
