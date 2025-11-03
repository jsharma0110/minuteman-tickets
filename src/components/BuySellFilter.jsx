"use client";
import { useState } from "react";

export default function BuySellFilter() {
  const [active, setActive] = useState("Buy");

  return (
    <div className="flex gap-3 mb-3">
      {["Buy", "Sell"].map((label) => (
        <button
          key={label}
          onClick={() => setActive(label)}
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
  );
}
