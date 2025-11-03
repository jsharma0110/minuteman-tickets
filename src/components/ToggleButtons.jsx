"use client";
import { useState } from "react";

export default function ToggleButtons() {
  const [active, setActive] = useState("Concert");

  return (
    <div className="flex gap-3 mb-4">
      {["Concert", "Sports"].map((label) => (
        <button
          key={label}
          onClick={() => setActive(label)}
          className={`px-4 py-2 rounded-full border ${
            active === label
              ? "bg-black text-white border-black"
              : "bg-white text-black border-gray-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
