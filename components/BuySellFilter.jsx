"use client";
import { useState } from "react";
import TicketListingModal from "./TicketListingModal";


export default function BuySellFilter({ umassEvent }) {
  const [active, setActive] = useState("Buy");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (label) => {
    setActive(label);
    if (label === "Sell") {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex gap-3 mb-3">
        {["Buy", "Sell"].map((label) => (
          <button
            key={label}
            onClick={() => handleClick(label)}
            className={`px-4 py-1.5 rounded-full font-medium ${
              active === label
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <TicketListingModal
        event={umassEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}