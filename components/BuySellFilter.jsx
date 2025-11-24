"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BuySellFilter({ eventId }) {
  const router = useRouter();
  const [active, setActive] = useState("buy");

  return (
    <div className="flex gap-2 mb-3">
      {/* BUY BUTTON */}
      <button
        onClick={() => {
          setActive("buy");
          router.push(`/events/${eventId}/buy`);
        }}
        className={`px-4 py-1 rounded-full text-sm font-medium ${
          active === "buy"
            ? "bg-green-600 text-white"
            : "bg-gray-200 text-black"
        }`}
      >
        Buy
      </button>

      {/* SELL BUTTON */}
      <button
        onClick={() => {
          setActive("sell");
          router.push(`/events/${eventId}/sell`);
        }}
        className={`px-4 py-1 rounded-full text-sm font-medium ${
          active === "sell"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-black"
        }`}
      >
        Sell
      </button>
    </div>
  );
}
