"use client";

import Image from "next/image";
import { useState } from "react";
import BuySellFilter from "./BuySellFilter";

export default function EventCard({ title, date, location, imageUrl, id }) {
  const event = { title, date, location, imageUrl, id };
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState(imageUrl);

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
      setImgSrc("/images/Mullins_Center_2014.jpeg");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header row: label + Buy/Sell pill */}
      <div className="mb-3 flex items-center justify-between text-[14px]">
        <BuySellFilter umassEvent={event} />
      </div>

      {/* Image */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-900 aspect-[4/3]">
        <Image
          src={imgSrc}
          alt={title}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          onError={handleImageError}
          unoptimized={imgSrc.startsWith("https://")}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Text content */}
      <div className="mt-3 text-sm">
        <p className="text-[16px] font-semibold text-zinc-100 leading-snug line-clamp-2">
          {title}
        </p>
        <p className="mt-1 text-[14px] text-zinc-400">{location}</p>
        <p className="mt-1 text-[14px] text-zinc-500">{date}</p>
      </div>
    </div>
  );
}
