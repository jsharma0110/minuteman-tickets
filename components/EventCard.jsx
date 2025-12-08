"use client";

import Image from "next/image";
import BuySellFilter from "./BuySellFilter";
import { useState } from "react";

export default function EventCard({ title, date, location, imageUrl, id }) {
  const event = { title, date, location, imageUrl, id };
  const [imgError, setImgError] = useState(false);
  const [imgSrc, setImgSrc] = useState(imageUrl);

  const handleImageError = () => {
    // Fallback to local image if Supabase image fails
    if (!imgError) {
      setImgError(true);
      setImgSrc("/images/Mullins_Center_2014.jpeg");
    }
  };

  return (
    <div className="mb-8">
      <BuySellFilter umassEvent={event} />
      <div className="rounded-lg overflow-hidden shadow-md border border-gray-200">
        {/* Fixed aspect ratio container for consistent image sizes */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
          <Image
            src={imgSrc}
            alt={title}
            fill
            className="object-cover"
            onError={handleImageError}
            unoptimized={imgSrc.startsWith("https://")} // Disable optimization for external URLs to avoid 400 errors
          />
        </div>
        <div className="p-3 text-sm">
          <p className="font-semibold">
            {title} @ {location}
          </p>
          <p className="text-gray-500">{date}</p>
        </div>
      </div>
    </div>
  );
}
